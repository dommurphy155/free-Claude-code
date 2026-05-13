/**
 * Distributed Computing Platform client for Claude Code.
 *
 * Integrates the custom distributed job platform for parallelizing:
 * - Agent spawns (distribute across workers)
 * - File reads (parallel I/O)
 * - Code search (distributed grep/AST)
 * - Test runs (parallel execution)
 */
import { randomUUID } from 'crypto'
import * as net from 'net'
import * as path from 'path'

interface JobPayload {
  type: 'agent' | 'file_read' | 'code_search' | 'test_run'
  data: unknown
}

interface JobRequest {
  type: 'submit_job'
  job: {
    id?: string
    name: string
    payload: JobPayload
    priority: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW' | 'BACKGROUND'
    dependencies?: string[]
  }
}

interface JobStatusRequest {
  type: 'query_job'
  job_id: string
}

interface DistributedJob {
  id: string
  name: string
  status: 'pending' | 'waiting' | 'running' | 'completed' | 'failed' | 'cancelled'
  result?: unknown
  error?: string
  worker_id?: string
}

export interface DistributedClientConfig {
  host: string
  port: number
  enabled: boolean
  autoDistributeThreshold: {
    agents: number
    files: number
    tests: number
  }
}

const DEFAULT_CONFIG: DistributedClientConfig = {
  host: process.env.DCP_HOST || 'localhost',
  port: parseInt(process.env.DCP_PORT || '8000', 10),
  enabled: process.env.DCP_ENABLED === '1' || process.env.DCP_ENABLED === 'true',
  autoDistributeThreshold: {
    agents: 2,    // Distribute if spawning >2 agents
    files: 5,     // Distribute if reading >5 files
    tests: 3,     // Distribute if running >3 test files
  },
}

export class DistributedClient {
  private config: DistributedClientConfig

  constructor(config: Partial<DistributedClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  isEnabled(): boolean {
    return this.config.enabled
  }

  shouldDistributeAgents(count: number): boolean {
    return this.config.enabled && count >= this.config.autoDistributeThreshold.agents
  }

  shouldDistributeFiles(count: number): boolean {
    return this.config.enabled && count >= this.config.autoDistributeThreshold.files
  }

  shouldDistributeTests(count: number): boolean {
    return this.config.enabled && count >= this.config.autoDistributeThreshold.tests
  }

  /**
   * Submit an agent task to the distributed platform.
   */
  async submitAgent(
    prompt: string,
    files: string[],
    context: Record<string, unknown>,
    priority: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW' | 'BACKGROUND' = 'NORMAL'
  ): Promise<string> {
    const jobId = randomUUID()

    const request: JobRequest = {
      type: 'submit_job',
      job: {
        id: jobId,
        name: 'claude_agent_task',
        payload: {
          type: 'agent',
          data: {
            prompt,
            files,
            context,
            trace_id: jobId,
          },
        },
        priority,
      },
    }

    await this.sendRequest(request)
    return jobId
  }

  /**
   * Submit file read jobs in parallel.
   */
  async submitFileReads(
    filePaths: string[],
    priority: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW' | 'BACKGROUND' = 'NORMAL'
  ): Promise<string[]> {
    const jobIds: string[] = []

    for (const filePath of filePaths) {
      const jobId = randomUUID()
      jobIds.push(jobId)

      const request: JobRequest = {
        type: 'submit_job',
        job: {
          id: jobId,
          name: 'claude_file_read',
          payload: {
            type: 'file_read',
            data: {
              path: filePath,
              cwd: process.cwd(),
            },
          },
          priority,
        },
      }

      await this.sendRequest(request)
    }

    return jobIds
  }

  /**
   * Submit code search job.
   */
  async submitCodeSearch(
    pattern: string,
    paths: string[],
    searchType: 'grep' | 'ast' | 'semantic' = 'grep',
    priority: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW' | 'BACKGROUND' = 'NORMAL'
  ): Promise<string> {
    const jobId = randomUUID()

    const request: JobRequest = {
      type: 'submit_job',
      job: {
        id: jobId,
        name: 'claude_code_search',
        payload: {
          type: 'code_search',
          data: {
            pattern,
            paths,
            search_type: searchType,
            cwd: process.cwd(),
          },
        },
        priority,
      },
    }

    await this.sendRequest(request)
    return jobId
  }

  /**
   * Get job status and result.
   */
  async getJobStatus(jobId: string): Promise<DistributedJob | null> {
    const request: JobStatusRequest = {
      type: 'query_job',
      job_id: jobId,
    }

    const response = await this.sendRequest(request)
    return response?.job || null
  }

  /**
   * Wait for job completion with timeout.
   */
  async waitForJob(
    jobId: string,
    timeoutMs: number = 300000
  ): Promise<DistributedJob> {
    const startTime = Date.now()

    while (Date.now() - startTime < timeoutMs) {
      const job = await this.getJobStatus(jobId)

      if (!job) {
        throw new Error(`Job ${jobId} not found`)
      }

      if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
        return job
      }

      // Poll every 100ms
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    throw new Error(`Timeout waiting for job ${jobId}`)
  }

  /**
   * Wait for multiple jobs and return results.
   */
  async waitForJobs(jobIds: string[]): Promise<DistributedJob[]> {
    return Promise.all(jobIds.map(id => this.waitForJob(id)))
  }

  /**
   * Send TCP request to broker.
   */
  private sendRequest(request: unknown): Promise<any> {
    return new Promise((resolve, reject) => {
      const client = new net.Socket()
      const timeout = setTimeout(() => {
        client.destroy()
        reject(new Error('Connection timeout'))
      }, 10000)

      client.connect(this.config.port, this.config.host, () => {
        clearTimeout(timeout)

        const data = Buffer.from(JSON.stringify(request), 'utf-8')
        const lengthBuffer = Buffer.alloc(4)
        lengthBuffer.writeUInt32BE(data.length, 0)

        client.write(lengthBuffer)
        client.write(data)
      })

      let buffer = Buffer.alloc(0)

      client.on('data', (data) => {
        buffer = Buffer.concat([buffer, data])

        // Check if we have a complete message
        if (buffer.length >= 4) {
          const msgLength = buffer.readUInt32BE(0)

          if (buffer.length >= 4 + msgLength) {
            const msgData = buffer.slice(4, 4 + msgLength)
            const response = JSON.parse(msgData.toString('utf-8'))
            client.end()
            resolve(response)
          }
        }
      })

      client.on('error', (err) => {
        clearTimeout(timeout)
        reject(err)
      })

      client.on('close', () => {
        clearTimeout(timeout)
      })
    })
  }
}

// Singleton instance
let globalClient: DistributedClient | null = null

export function getDistributedClient(): DistributedClient {
  if (!globalClient) {
    globalClient = new DistributedClient()
  }
  return globalClient
}

export function initDistributedClient(config: Partial<DistributedClientConfig>): void {
  globalClient = new DistributedClient(config)
}
