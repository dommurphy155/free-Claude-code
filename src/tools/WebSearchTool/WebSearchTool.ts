import type {
  BetaContentBlock,
  BetaWebSearchTool20250305,
} from '@anthropic-ai/sdk/resources/beta/messages/messages.mjs'
import { getAPIProvider } from '../../utils/model/providers.js'
import type { PermissionResult } from '../../utils/permissions/PermissionResult.js'
import { z } from 'zod/v4'
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../../services/analytics/growthbook.js'
import { queryModelWithStreaming } from '../../services/api/claude.js'
import { buildTool, type ToolDef } from '../../Tool.js'
import { lazySchema } from '../../utils/lazySchema.js'
import { logError } from '../../utils/log.js'
import { createUserMessage } from '../../utils/messages.js'
import { getMainLoopModel, getSmallFastModel } from '../../utils/model/model.js'
import { jsonParse, jsonStringify } from '../../utils/slowOperations.js'
import { asSystemPrompt } from '../../utils/systemPromptType.js'
import { getWebSearchPrompt, WEB_SEARCH_TOOL_NAME } from './prompt.js'
import {
  getToolUseSummary,
  renderToolResultMessage,
  renderToolUseMessage,
  renderToolUseProgressMessage,
} from './UI.js'

const inputSchema = lazySchema(() =>
  z.strictObject({
    query: z.string().min(2).describe('The search query to use'),
    depth: z
      .enum(['fast', 'standard', 'deep'])
      .optional()
      .describe("Search depth: 'fast' (quick results), 'standard' (balanced), 'deep' (thorough research with query expansion). Use 'deep' for product research, comparisons, or when user wants comprehensive results."),
    allowed_domains: z
      .array(z.string())
      .optional()
      .describe('Only include search results from these domains'),
    blocked_domains: z
      .array(z.string())
      .optional()
      .describe('Never include search results from these domains'),
  }),
)
type InputSchema = ReturnType<typeof inputSchema>

type Input = z.infer<InputSchema>

const searchResultSchema = lazySchema(() => {
  const searchHitSchema = z.object({
    title: z.string().describe('The title of the search result'),
    url: z.string().describe('The URL of the search result'),
  })

  return z.object({
    tool_use_id: z.string().describe('ID of the tool use'),
    content: z.array(searchHitSchema).describe('Array of search hits'),
  })
})

export type SearchResult = z.infer<ReturnType<typeof searchResultSchema>>

const outputSchema = lazySchema(() =>
  z.object({
    query: z.string().describe('The search query that was executed'),
    results: z
      .array(z.union([searchResultSchema(), z.string()]))
      .describe('Search results and/or text commentary from the model'),
    durationSeconds: z
      .number()
      .describe('Time taken to complete the search operation'),
  }),
)
type OutputSchema = ReturnType<typeof outputSchema>

export type Output = z.infer<OutputSchema>

// Re-export WebSearchProgress from centralized types to break import cycles
export type { WebSearchProgress } from '../../types/tools.js'

import type { WebSearchProgress } from '../../types/tools.js'

function makeToolSchema(input: Input): BetaWebSearchTool20250305 {
  return {
    type: 'web_search_20250305',
    name: 'web_search',
    allowed_domains: input.allowed_domains,
    blocked_domains: input.blocked_domains,
    max_uses: 8, // Hardcoded to 8 searches maximum
  }
}

function makeOutputFromSearchResponse(
  result: BetaContentBlock[],
  query: string,
  durationSeconds: number,
): Output {
  // The result is a sequence of these blocks:
  // - text to start -- always?
  // [
  //    - server_tool_use
  //    - web_search_tool_result
  //    - text and citation blocks intermingled
  //  ]+  (this block repeated for each search)

  const results: (SearchResult | string)[] = []
  let textAcc = ''
  let inText = true

  for (const block of result) {
    // Skip null or undefined blocks
    if (!block) {
      continue
    }

    if (block.type === 'server_tool_use') {
      if (inText) {
        inText = false
        if (textAcc.trim().length > 0) {
          results.push(textAcc.trim())
        }
        textAcc = ''
      }
      continue
    }

    if (block.type === 'web_search_tool_result') {
      // Handle error case - content is a WebSearchToolResultError
      if (!Array.isArray(block.content)) {
        const errorMessage = `Web search error: ${block.content.error_code}`
        logError(new Error(errorMessage))
        results.push(errorMessage)
        continue
      }
      // Success case - add results to our collection
      const hits = block.content.map(r => ({ title: r.title, url: r.url }))
      results.push({
        tool_use_id: block.tool_use_id,
        content: hits,
      })
    }

    if (block.type === 'text') {
      if (inText) {
        textAcc += block.text
      } else {
        inText = true
        textAcc = block.text
      }
    }
  }

  if (textAcc.length) {
    results.push(textAcc.trim())
  }

  return {
    query,
    results,
    durationSeconds,
  }
}

export const WebSearchTool = buildTool({
  name: WEB_SEARCH_TOOL_NAME,
  searchHint: 'search the web for current information',
  maxResultSizeChars: 100_000,
  shouldDefer: true,
  async description(input) {
    return `Claude wants to search the web for: ${input.query}`
  },
  userFacingName() {
    return 'Web Search'
  },
  getToolUseSummary,
  getActivityDescription(input) {
    const summary = getToolUseSummary(input)
    return summary ? `Searching for ${summary}` : 'Searching the web'
  },
  isEnabled() {
    // Always enable - we use SearXNG directly
    return true
    const provider = getAPIProvider()
    const model = getMainLoopModel()

    // Enable for firstParty
    if (provider === 'firstParty') {
      return true
    }

    // Enable for Vertex AI with supported models (Claude 4.0+)
    if (provider === 'vertex') {
      const supportsWebSearch =
        model.includes('claude-opus-4') ||
        model.includes('claude-sonnet-4') ||
        model.includes('claude-haiku-4')

      return supportsWebSearch
    }

    // Foundry only ships models that already support Web Search
    if (provider === 'foundry') {
      return true
    }

    return false
  },
  get inputSchema(): InputSchema {
    return inputSchema()
  },
  get outputSchema(): OutputSchema {
    return outputSchema()
  },
  isConcurrencySafe() {
    return true
  },
  isReadOnly() {
    return true
  },
  toAutoClassifierInput(input) {
    return input.query
  },
  async checkPermissions(_input): Promise<PermissionResult> {
    return { behavior: 'allow' }
  },
  async prompt() {
    return getWebSearchPrompt()
  },
  renderToolUseMessage,
  renderToolUseProgressMessage,
  renderToolResultMessage,
  extractSearchText() {
    // renderToolResultMessage shows only "Did N searches in Xs" chrome —
    // the results[] content never appears on screen. Heuristic would index
    // string entries in results[] (phantom match). Nothing to search.
    return ''
  },
  async validateInput(input) {
    // Handle null, undefined, or non-object input
    if (!input || typeof input !== 'object') {
      return { result: false, message: 'Error: Missing or invalid input', errorCode: 1 }
    }
    if (!input.query || typeof input.query !== 'string') {
      return { result: false, message: 'Error: Missing or invalid query', errorCode: 1 }
    }
    // Safely destructure query for validation
    const queryValue = input.query
    const allowed_domains = input.allowed_domains
    const blocked_domains = input.blocked_domains
    if (!queryValue.length) {
      return {
        result: false,
        message: 'Error: Missing query',
        errorCode: 1,
      }
    }
    if (allowed_domains?.length && blocked_domains?.length) {
      return {
        result: false,
        message:
          'Error: Cannot specify both allowed_domains and blocked_domains in the same request',
        errorCode: 2,
      }
    }
    return { result: true }
  },
  async call(input, context, _canUseTool, _parentMessage, onProgress) {
    // Handle null, undefined, or non-object input
    if (!input || typeof input !== 'object') {
      return { query: '', results: ['Error: Invalid input provided to web search tool'], durationSeconds: 0 }
    }

    console.error('[WEBSEARCH] === CALL STARTED ===')
    console.error('[WEBSEARCH] Input:', JSON.stringify(input))
    console.error('[WEBSEARCH] Context keys:', Object.keys(context || {}).join(', '))

    const startTime = performance.now()
    if (!input || typeof input.query !== 'string') {
      return { query: '', results: ['Error: no query provided'], durationSeconds: 0 }
    }
    const { query, depth = 'standard' } = input

    console.error('[WEBSEARCH] Query:', query, 'Depth:', depth)

    // Phase 1: Search using SearXNG HTTP API
    console.error('[WEBSEARCH] Calling onProgress...')
    onProgress?.({
      toolUseID: `web-search-progress-start`,
      data: {
        type: 'web_search',
        query,
        status: 'searching',
        message: `Searching for "${query}"...`,
      }
    })

    console.error('[WEBSEARCH] Starting SearXNG search...')

    // Build query list — expand for deep mode
    const queries: string[] = [query]
    if (depth === 'deep') {
      // Add variant queries for broader coverage
      queries.push(`${query} review specs`)
      queries.push(`${query} price buy`)
    }

    // Call SearXNG for each query and merge results (dedup by URL)
    const seenUrls = new Set<string>()
    const allResults: any[] = []

    for (const q of queries) {
      const searxngUrl = `http://localhost:8888/search?q=${encodeURIComponent(q)}&format=json`
      console.error('[WEBSEARCH] SearXNG URL:', searxngUrl)
      try {
        const resp = await fetch(searxngUrl, {
          signal: context.abortController.signal,
          headers: { 'Accept': 'application/json' }
        })
        console.error('[WEBSEARCH] Response status:', resp.status)
        if (resp.ok) {
          const data = await resp.json()
          console.error('[WEBSEARCH] Got data, results count:', data.results?.length || 0)
          for (const r of (data.results || [])) {
            const url = r.url || r.link || ''
            if (url && !seenUrls.has(url)) {
              seenUrls.add(url)
              allResults.push({
                title: r.title || '',
                url,
                snippet: r.content || r.snippet || '',
                score: r.score || 0,
              })
            }
          }
        } else {
          console.error('[WEBSEARCH] SearXNG returned error:', resp.status)
        }
      } catch (e) {
        console.error('[WEBSEARCH] SearXNG search failed for query', q, e)
      }
    }

    // Sort by score descending
    allResults.sort((a, b) => (b.score || 0) - (a.score || 0))

    const searchData = { results: allResults, num_results: allResults.length }
    const results = searchData.results || []
    const resultCount = searchData.num_results || results.length

    console.error('[WEBSEARCH] Found', resultCount, 'results')

    // SKIP FETCH PHASE - just return search results to avoid hang
    console.error('[WEBSEARCH] Calling onProgress complete...')
    onProgress?.({
      toolUseID: `web-search-progress-complete`,
      data: {
        type: 'web_search',
        query,
        status: 'complete',
        message: `Found ${resultCount} results.`,
      }
    })

    const endTime = performance.now()

    // Return just search results - let skill call web_fetch separately
    console.error('[WEBSEARCH] Building result...')
    const searchText = JSON.stringify(searchData, null, 2)

    console.error('[WEBSEARCH] === CALL COMPLETE ===')
    return {
      query,
      results: [searchText],
      durationSeconds: (endTime - startTime) / 1000,
    }
  },
  mapToolResultToToolResultBlockParam(output, toolUseID) {
    const { query, results } = output

    // Extract all URLs and snippets from search results into a clean list
    const urlLines: string[] = []
    const snippetLines: string[] = []

    ;(results ?? []).forEach(result => {
      if (result == null) return
      if (typeof result === 'string') {
        // Parse JSON blob from SearXNG
        try {
          const parsed = JSON.parse(result)
          const hits = parsed.results || []
          hits.forEach((hit: any, i: number) => {
            if (hit.url) {
              urlLines.push(`${i + 1}. [${hit.title || hit.url}](${hit.url})`)
              if (hit.snippet) {
                snippetLines.push(`${i + 1}. ${hit.snippet.slice(0, 200)}`)
              }
            }
          })
        } catch {
          snippetLines.push(result.slice(0, 500))
        }
      } else if (result.content?.length > 0) {
        result.content.forEach((hit: any, i: number) => {
          if (hit.url) urlLines.push(`${i + 1}. [${hit.title || hit.url}](${hit.url})`)
        })
      }
    })

    let formattedOutput = `Search complete for: "${query}"\n\n`

    if (urlLines.length > 0) {
      formattedOutput += `## URLs Found (MUST fetch top 3-5 with web_fetch next)\n\n`
      formattedOutput += urlLines.slice(0, 10).join('\n') + '\n\n'
      formattedOutput += `## Snippets (preview only — NOT enough to answer)\n\n`
      formattedOutput += snippetLines.slice(0, 10).join('\n') + '\n\n'
      formattedOutput += `⚠️ REQUIRED NEXT STEP: Call web_fetch with the top 3-5 URLs above.\n`
      formattedOutput += `Do NOT answer from snippets alone — they are incomplete.\n`
      formattedOutput += `Extract the actual URLs from the numbered list and pass them to web_fetch now.`
    } else {
      formattedOutput += `No results found. Try a different query.`
    }

    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content: formattedOutput.trim(),
    }
  },
} satisfies ToolDef<InputSchema, Output, WebSearchProgress>)
