import type {
  BetaContentBlock,
  BetaWebSearchTool20250305,
} from '@anthropic-ai/sdk/resources/beta/messages/messages.mjs'
import { getAPIProvider } from 'src/utils/model/providers.js'
import type { PermissionResult } from 'src/utils/permissions/PermissionResult.js'
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
    return {
      behavior: 'passthrough',
      message: 'WebSearchTool requires permission.',
      suggestions: [
        {
          type: 'addRules',
          rules: [{ toolName: WEB_SEARCH_TOOL_NAME }],
          behavior: 'allow',
          destination: 'localSettings',
        },
      ],
    }
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
    const { query, allowed_domains, blocked_domains } = input
    if (!query.length) {
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
    const startTime = performance.now()
    const { query, depth = 'standard' } = input

    // Initialize research task state
    try {
      await fetch('http://127.0.0.1:8789/research/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: crypto.randomUUID(), topic: query }),
      })
    } catch (e) {
      // Non-blocking - state tracking is best-effort
    }

    // Phase 1: Search
    onProgress?.({
      type: 'web_search',
      query,
      status: 'searching',
      message: `Searching for "${query}"...`,
    })

    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
    console.error('[WEBSEARCH] Query:', query)

    const bridgeUrl = 'http://127.0.0.1:8789/cdp/search'
    const resp = await fetch(bridgeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, search_url: searchUrl, depth, max_results: 15 }),
      signal: context.abortController.signal,
    })
    const searchText = await resp.text()
    console.error('[WEBSEARCH] Search response:', searchText.length)

    // Parse search results
    let searchData: any = {}
    try {
      searchData = JSON.parse(searchText)
    } catch (e) {
      console.error('[WEBSEARCH] Failed to parse search results:', e)
    }

    const results = searchData.results || []
    const resultCount = searchData.num_results || results.length

    // Mark search phase complete
    try {
      await fetch('http://127.0.0.1:8789/research/track-phase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: 'search', results: results.slice(0, 5) }),
      })
    } catch (e) {
      // Non-blocking
    }

    onProgress?.({
      type: 'web_search',
      query,
      status: 'complete',
      message: `Found ${resultCount} results. Fetching top sources...`,
    })

    // Phase 2: Auto-select top 3 URLs by score
    const topUrls = results
      .sort((a: any, b: any) => (b.score || 0) - (a.score || 0))
      .slice(0, 3)
      .map((r: any) => r.url)
      .filter((url: string) => url && url.startsWith('http'))

    console.error('[WEBSEARCH] Selected URLs:', topUrls)

    // Phase 3: Auto-fetch content from selected URLs
    let fetchResults = ''
    if (topUrls.length > 0) {
      onProgress?.({
        type: 'web_search',
        query,
        status: 'fetching',
        message: `Fetching details from ${topUrls.length} sources...`,
      })

      try {
        const fetchResp = await fetch('http://127.0.0.1:8789/cdp/fetch/parallel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            urls: topUrls,
            max_chars: 15000,
            max_concurrent: 3,
          }),
          signal: context.abortController.signal,
        })
        const fetchData = await fetchResp.json()

        // Build fetch results summary
        const fetchResults_list: string[] = []
        if (fetchData.results) {
          for (const r of fetchData.results) {
            if (r.success && r.content) {
              fetchResults_list.push(`## ${r.url}\n\n${r.content.substring(0, 5000)}\n\n---`)
            }
          }
        }
        fetchResults = fetchResults_list.join('\n\n')
      } catch (e) {
        console.error('[WEBSEARCH] Fetch failed:', e)
        fetchResults = 'Note: Could not fetch details from sources.'
      }
    }

    onProgress?.({
      type: 'web_search',
      query,
      status: 'complete',
      message: `Found ${resultCount} results, fetched ${topUrls.length} sources. Ready to synthesize.`,
    })

    const endTime = performance.now()

    // Combine everything
    const combinedResults = `SEARCH RESULTS:\n\n${searchText}\n\n---\n\nFETCHED CONTENT:\n\n${fetchResults}`

    return {
      data: {
        query,
        results: [combinedResults],
        durationSeconds: (endTime - startTime) / 1000,
      }
    }
  },
  mapToolResultToToolResultBlockParam(output, toolUseID) {
    const { query, results } = output

    // Search + fetch already completed inline - just return the combined results
    let formattedOutput = `Research complete for: "${query}"\n\n`
    formattedOutput += `Search and content fetching done. Synthesize the findings below into a clear answer.\n\n`

    ;(results ?? []).forEach(result => {
      if (result == null) return
      if (typeof result === 'string') {
        formattedOutput += result + '\n\n'
      } else {
        if (result.content?.length > 0) {
          formattedOutput += `Links: ${jsonStringify(result.content)}\n\n`
        }
      }
    })

    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content: formattedOutput.trim(),
    }
  },
} satisfies ToolDef<InputSchema, Output, WebSearchProgress>)
