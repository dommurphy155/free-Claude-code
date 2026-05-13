/**
 * Integration hooks for Claude Code tools.
 *
 * These functions wrap the standard tool behavior with distributed
 * execution when beneficial.
 */
import { getDistributedClient, DistributedClient } from './client.js'
import type { Message } from '../types/message.js'

interface AgentTask {
  prompt: string
  files: string[]
  context: Record<string, unknown>
  maxTurns?: number
}

interface FileReadResult {
  path: string
  content: string
  error?: string
}

interface CodeSearchResult {
  file: string
  line: number
  match: string
  context?: string
}

/**
 * Distribute multiple agent tasks across workers.
 *
 * Called by AgentTool when spawning multiple agents.
 */
export async function distributeAgentTasks(
  tasks: AgentTask[],
  onProgress?: (completed: number, total: number) => void
): Promise<Array<{ task: AgentTask; result: string; toolCalls: unknown[] }>> {
  const client = getDistributedClient()

  if (!client.shouldDistributeAgents(tasks.length)) {
    // Fall back to local execution
    return runAgentsLocally(tasks)
  }

  // Submit all jobs
  const jobPromises = tasks.map(async (task) => {
    const jobId = await client.submitAgent(
      task.prompt,
      task.files,
      task.context,
      'NORMAL'
    )
    return { jobId, task }
  })

  const jobMappings = await Promise.all(jobPromises)
  const results: Array<{ task: AgentTask; result: string; toolCalls: unknown[] }> = []

  // Wait for all jobs
  const total = jobMappings.length
  let completed = 0

  for (const { jobId, task } of jobMappings) {
    const job = await client.waitForJob(jobId)

    if (job.status === 'completed' && job.result) {
      const result = job.result as { response: string; tool_calls: unknown[] }
      results.push({
        task,
        result: result.response,
        toolCalls: result.tool_calls || [],
      })
    } else {
      results.push({
        task,
        result: `Error: ${job.error || 'Job failed'}`,
        toolCalls: [],
      })
    }

    completed++
    onProgress?.(completed, total)
  }

  return results
}

/**
 * Distribute file reads across workers.
 *
 * Called by FileReadTool when reading multiple files.
 */
export async function distributeFileReads(
  filePaths: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<FileReadResult[]> {
  const client = getDistributedClient()

  if (!client.shouldDistributeFiles(filePaths.length)) {
    // Fall back to local execution
    return readFilesLocally(filePaths)
  }

  // Submit all file read jobs
  const jobIds = await client.submitFileReads(filePaths, 'NORMAL')
  const results: FileReadResult[] = []

  // Wait for all jobs
  const jobs = await client.waitForJobs(jobIds)
  const total = jobs.length
  let completed = 0

  for (const [index, job] of jobs.entries()) {
    const path = filePaths[index]

    if (job.status === 'completed' && job.result) {
      const result = job.result as { content: string }
      results.push({
        path,
        content: result.content,
      })
    } else {
      // Fallback to local read
      try {
        const content = await readFileLocal(path)
        results.push({ path, content })
      } catch (err) {
        results.push({
          path,
          content: '',
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }

    completed++
    onProgress?.(completed, total)
  }

  return results
}

/**
 * Distribute code search across workers.
 */
export async function distributeCodeSearch(
  pattern: string,
  paths: string[],
  searchType: 'grep' | 'ast' | 'semantic' = 'grep'
): Promise<CodeSearchResult[]> {
  const client = getDistributedClient()

  if (!client.shouldDistributeFiles(paths.length)) {
    return searchCodeLocally(pattern, paths, searchType)
  }

  const jobId = await client.submitCodeSearch(pattern, paths, searchType, 'NORMAL')
  const job = await client.waitForJob(jobId)

  if (job.status === 'completed' && job.result) {
    return (job.result as { matches: CodeSearchResult[] }).matches || []
  }

  // Fallback to local search
  return searchCodeLocally(pattern, paths, searchType)
}

// Local fallback implementations

async function runAgentsLocally(
  tasks: AgentTask[]
): Promise<Array<{ task: AgentTask; result: string; toolCalls: unknown[] }>> {
  // This would call the actual agent execution
  // For now, placeholder that runs sequentially
  const results: Array<{ task: AgentTask; result: string; toolCalls: unknown[] }> = []

  for (const task of tasks) {
    // In real implementation, this would call runAgent.ts
    results.push({
      task,
      result: 'Local execution result',
      toolCalls: [],
    })
  }

  return results
}

async function readFilesLocally(filePaths: string[]): Promise<FileReadResult[]> {
  const results: FileReadResult[] = []

  for (const filePath of filePaths) {
    try {
      const content = await readFileLocal(filePath)
      results.push({ path: filePath, content })
    } catch (err) {
      results.push({
        path: filePath,
        content: '',
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return results
}

async function readFileLocal(filePath: string): Promise<string> {
  const fs = await import('fs/promises')
  return fs.readFile(filePath, 'utf-8')
}

async function searchCodeLocally(
  pattern: string,
  paths: string[],
  searchType: 'grep' | 'ast' | 'semantic'
): Promise<CodeSearchResult[]> {
  // Local implementation using grep or other tools
  const { exec } = await import('child_process')
  const { promisify } = await import('util')
  const execAsync = promisify(exec)

  const results: CodeSearchResult[] = []

  for (const searchPath of paths) {
    try {
      const { stdout } = await execAsync(
        `grep -rn -H "${pattern.replace(/"/g, '\\"')}" "${searchPath}" 2>/dev/null || true`
      )

      const lines = stdout.split('\n').filter(Boolean)
      for (const line of lines) {
        const match = line.match(/^([^:]+):(\d+):(.*)$/)
        if (match) {
          results.push({
            file: match[1],
            line: parseInt(match[2], 10),
            match: match[3].trim(),
          })
        }
      }
    } catch {
      // Ignore errors for individual paths
    }
  }

  return results
}
