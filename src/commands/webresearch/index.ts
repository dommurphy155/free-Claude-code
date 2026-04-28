import type { Command, LocalJSXCommandContext, LocalCommandResult } from '../../commands.js'
import { getPermissionManager } from '../../utils/permissions/PermissionManager.js'
import { WEB_SEARCH_TOOL_NAME } from '../../tools/WebSearchTool/prompt.js'
import { WEB_FETCH_TOOL_NAME } from '../../tools/WebFetchTool/prompt.js'
import { WebSearchTool } from '../../tools/WebSearchTool/WebSearchTool.js'
import { WebFetchTool } from '../../tools/WebFetchTool/WebFetchTool.js'

interface SearchResultItem {
  title: string
  url: string
  snippet: string
  score: number
}

interface WebSearchOutput {
  query: string
  results: (string | { tool_use_id: string; content: Array<{ title: string; url: string }> })
  durationSeconds: number
}

interface WebFetchOutput {
  url: string
  content: string
  success: boolean
  method?: string
  size?: number
  error?: string
}

const command: Command = {
  name: 'webresearch',
  description: 'Perform comprehensive web research with search, fetch, and synthesis',
  type: 'local',
  async execute(args: string, context: LocalJSXCommandContext): Promise<LocalCommandResult> {
    if (!args.trim()) {
      return {
        output: 'Usage: /webresearch <query>\n\nExample: /webresearch "best laptops under $1000"',
        render: 'text',
      }
    }

    const permissionManager = getPermissionManager()

    // Phase 1: Search
    let searchOutput: WebSearchOutput
    try {
      // Check permissions
      const permission = await WebSearchTool.checkPermissions({ query: args, depth: 'deep' })
      if (permission.behavior !== 'passthrough' && permission.behavior !== 'allow') {
        return {
          output: `Web search requires permission. Use "Allow for this session" to proceed.`,
          render: 'text',
        }
      }

      searchOutput = await WebSearchTool.execute(
        { query: args, depth: 'deep' },
        context.toolUseContext
      ) as WebSearchOutput
    } catch (error) {
      return {
        output: `Web search failed: ${error instanceof Error ? error.message : String(error)}`,
        render: 'text',
      }
    }

    if (!searchOutput.results || searchOutput.results.length === 0) {
      return {
        output: 'No results found for your query.',
        render: 'text',
      }
    }

    // Extract URLs from search results
    const searchHits: SearchResultItem[] = []
    for (const result of searchOutput.results) {
      if (typeof result === 'object' && 'content' in result && Array.isArray(result.content)) {
        for (const hit of result.content) {
          if (hit.url && hit.title) {
            searchHits.push({
              title: hit.title,
              url: hit.url,
              snippet: '',
              score: 1.0
            })
          }
        }
      }
    }

    if (searchHits.length === 0) {
      return {
        output: `Found results but could not extract URLs. Query: ${args}`,
        render: 'text',
      }
    }

    // Phase 2: Select top URLs
    const topUrls = searchHits.slice(0, 5).map(r => r.url)

    // Phase 3: Fetch content
    let fetchResults: WebFetchOutput[]
    try {
      const permission = await WebFetchTool.checkPermissions({
        urls: topUrls,
        prompt: `Extract key information about: ${args}`
      })
      if (permission.behavior !== 'passthrough' && permission.behavior !== 'allow') {
        return {
          output: `Web fetch requires permission. Search completed but cannot fetch content.`,
          render: 'text',
        }
      }

      fetchResults = await WebFetchTool.execute(
        {
          urls: topUrls,
          prompt: `Extract key information about: ${args}\n\nInclude main points, specific details, and actionable information.`,
          max_concurrent: 3
        },
        context.toolUseContext
      ) as WebFetchOutput[]
    } catch (error) {
      return {
        output: `Web fetch failed: ${error instanceof Error ? error.message : String(error)}`,
        render: 'text',
      }
    }

    // Phase 4: Synthesize
    const successfulFetches = fetchResults.filter(r => r.success)

    if (successfulFetches.length === 0) {
      return {
        output: `Search completed but failed to fetch content from any sources.\n\nQuery: ${args}\nFound ${searchHits.length} results but could not fetch content.`,
        render: 'text',
      }
    }

    // Build synthesis
    let output = `## Research Results: ${args}\n\n`

    // Add findings from each source
    for (const fetch of successfulFetches) {
      const sourceResult = searchHits.find(r => r.url === fetch.url)
      output += `### ${sourceResult?.title || 'Source'}\n\n`
      output += `${fetch.content}\n\n`
      output += `[${fetch.url}](${fetch.url})\n\n`
    }

    // Add sources section
    output += `## Sources\n\n`
    for (const result of searchHits.slice(0, 5)) {
      output += `- [${result.title}](${result.url})\n`
    }

    return {
      output,
      render: 'markdown',
    }
  },
}

export default command
