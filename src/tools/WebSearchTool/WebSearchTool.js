import { getAPIProvider } from 'src/utils/model/providers.js';
import { z } from 'zod/v4';
import { buildTool } from '../../Tool.js';
import { lazySchema } from '../../utils/lazySchema.js';
import { logError } from '../../utils/log.js';
import { getMainLoopModel } from '../../utils/model/model.js';
import { jsonStringify } from '../../utils/slowOperations.js';
import { getWebSearchPrompt, WEB_SEARCH_TOOL_NAME } from './prompt.js';
import { getToolUseSummary, renderToolResultMessage, renderToolUseMessage, renderToolUseProgressMessage, } from './UI.js';

const inputSchema = lazySchema(() => z.strictObject({
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
}));

const outputSchema = lazySchema(() => z.object({
    query: z.string().describe('The search query that was executed'),
    results: z.array(z.object({
        title: z.string(),
        url: z.string(),
        snippet: z.string(),
        score: z.number(),
    })).describe('Search results'),
    durationSeconds: z.number().describe('Time taken to complete the search operation'),
}));

export const WebSearchTool = buildTool({
    name: WEB_SEARCH_TOOL_NAME,
    searchHint: 'search the web for current information',
    maxResultSizeChars: 100_000,
    shouldDefer: true,
    async description(input) {
        return `Claude wants to search the web for: ${input.query}`;
    },
    userFacingName() {
        return 'Web Search';
    },
    getToolUseSummary,
    getActivityDescription(input) {
        const summary = getToolUseSummary(input);
        return summary ? `Searching for ${summary}` : 'Searching the web';
    },
    isEnabled() {
        const provider = getAPIProvider();
        const model = getMainLoopModel();
        if (provider === 'firstParty') {
            return true;
        }
        if (provider === 'vertex') {
            const supportsWebSearch = model.includes('claude-opus-4') ||
                model.includes('claude-sonnet-4') ||
                model.includes('claude-haiku-4');
            return supportsWebSearch;
        }
        if (provider === 'foundry') {
            return true;
        }
        return false;
    },
    get inputSchema() {
        return inputSchema();
    },
    get outputSchema() {
        return outputSchema();
    },
    isConcurrencySafe() {
        return true;
    },
    isReadOnly() {
        return true;
    },
    toAutoClassifierInput(input) {
        return input.query;
    },
    async checkPermissions(_input) {
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
        };
    },
    async prompt() {
        return getWebSearchPrompt();
    },
    renderToolUseMessage,
    renderToolUseProgressMessage,
    renderToolResultMessage,
    extractSearchText() {
        return '';
    },
    async validateInput(input) {
        const { query, allowed_domains, blocked_domains } = input;
        if (!query.length) {
            return {
                result: false,
                message: 'Error: Missing query',
                errorCode: 1,
            };
        }
        if (allowed_domains?.length && blocked_domains?.length) {
            return {
                result: false,
                message: 'Error: Cannot specify both allowed_domains and blocked_domains in the same request',
                errorCode: 2,
            };
        }
        return { result: true };
    },
    async call(input, context, _canUseTool, _parentMessage, onProgress) {
        const startTime = performance.now();
        const { query } = input;

        onProgress?.({
            type: 'web_search',
            query,
            status: 'searching',
            message: `Searching for "${query}"...`,
        });

        console.error('[WEBSEARCH] Query:', query);

        // Call SearXNG via HTTP API
        const searxngUrl = `http://localhost:8888/search?q=${encodeURIComponent(query)}&format=json`;
        let results = [];

        try {
            const resp = await fetch(searxngUrl, {
                signal: context.abortController.signal,
                headers: { 'Accept': 'application/json' }
            });

            if (resp.ok) {
                const data = await resp.json();
                results = (data.results || []).map((r) => ({
                    title: r.title || '',
                    url: r.url || r.link || '',
                    snippet: r.content || r.snippet || '',
                    score: r.score || 0
                }));
            } else {
                console.error('[WEBSEARCH] SearXNG returned:', resp.status);
            }
        } catch (e) {
            console.error('[WEBSEARCH] SearXNG search failed:', e);
        }

        console.error('[WEBSEARCH] Found', results.length, 'results');

        onProgress?.({
            type: 'web_search',
            query,
            status: 'complete',
            message: `Found ${results.length} results`,
        });

        const endTime = performance.now();

        return {
            data: {
                query,
                results,
                durationSeconds: (endTime - startTime) / 1000,
            }
        };
    },
    mapToolResultToToolResultBlockParam(output, toolUseID) {
        const { query, results } = output;
        const formattedResults = results.map(r => `- [${r.title}](${r.url})\n  ${r.snippet.substring(0, 200)}...`).join('\n\n');
        return {
            tool_use_id: toolUseID,
            type: 'tool_result',
            content: `Search results for "${query}":\n\n${formattedResults}`,
        };
    },
});
