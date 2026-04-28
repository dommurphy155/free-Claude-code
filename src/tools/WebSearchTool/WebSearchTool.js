import { getAPIProvider } from 'src/utils/model/providers.js';
import { z } from 'zod/v4';
import { buildTool } from '../../Tool.js';
import { lazySchema } from '../../utils/lazySchema.js';
import { logError } from '../../utils/log.js';
import { getMainLoopModel } from '../../utils/model/model.js';
import { jsonStringify } from '../../utils/slowOperations.js';
import { getWebSearchPrompt, WEB_SEARCH_TOOL_NAME } from './prompt.js';
import { getToolUseSummary, renderToolResultMessage, renderToolUseMessage, renderToolUseProgressMessage, } from './UI.js';
import { execa } from 'execa';

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
const searchResultSchema = lazySchema(() => {
    const searchHitSchema = z.object({
        title: z.string().describe('The title of the search result'),
        url: z.string().describe('The URL of the search result'),
    });
    return z.object({
        tool_use_id: z.string().describe('ID of the tool use'),
        content: z.array(searchHitSchema).describe('Array of search hits'),
    });
});
const outputSchema = lazySchema(() => z.object({
    query: z.string().describe('The search query that was executed'),
    results: z
        .array(z.union([searchResultSchema(), z.string()]))
        .describe('Search results and/or text commentary from the model'),
    durationSeconds: z
        .number()
        .describe('Time taken to complete the search operation'),
}));
function makeToolSchema(input) {
    return {
        type: 'web_search_20250305',
        name: 'web_search',
        allowed_domains: input.allowed_domains,
        blocked_domains: input.blocked_domains,
        max_uses: 8, // Hardcoded to 8 searches maximum
    };
}
function makeOutputFromSearchResponse(result, query, durationSeconds) {
    const results = [];
    let textAcc = '';
    let inText = true;
    for (const block of result) {
        if (!block) {
            continue;
        }
        if (block.type === 'server_tool_use') {
            if (inText) {
                inText = false;
                if (textAcc.trim().length > 0) {
                    results.push(textAcc.trim());
                }
                textAcc = '';
            }
            continue;
        }
        if (block.type === 'web_search_tool_result') {
            if (!Array.isArray(block.content)) {
                const errorMessage = `Web search error: ${block.content.error_code}`;
                logError(new Error(errorMessage));
                results.push(errorMessage);
                continue;
            }
            const hits = block.content.map(r => ({ title: r.title, url: r.url }));
            results.push({
                tool_use_id: block.tool_use_id,
                content: hits,
            });
        }
        if (block.type === 'text') {
            if (inText) {
                textAcc += block.text;
            }
            else {
                inText = true;
                textAcc = block.text;
            }
        }
    }
    if (textAcc.length) {
        results.push(textAcc.trim());
    }
    return {
        query,
        results,
        durationSeconds,
    };
}
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
        const { query, depth = 'standard' } = input;

        // Phase 1: Search using SearXNG Python module
        onProgress?.({
            type: 'web_search',
            query,
            status: 'searching',
            message: `Searching for "${query}"...`,
        });

        console.error('[WEBSEARCH] Query:', query);

        // Call searxng.py Python module
        let searchData = { results: [], num_results: 0 };
        try {
            const homeDir = process.env.HOME || '/root';
            const { stdout } = await execa('python3', [
                '-c',
                `import asyncio; import sys; sys.path.insert(0, '${homeDir}/claude-code-haha'); from searxng import search; print(asyncio.run(search('${query.replace(/'/g, "\\'")}', max_results=15, depth='${depth}')))`
            ], { timeout: 30000 });
            searchData = JSON.parse(stdout);
        } catch (e) {
            console.error('[WEBSEARCH] SearXNG search failed:', e);
        }

        const results = searchData.results || [];
        const resultCount = searchData.num_results || results.length;

        console.error('[WEBSEARCH] Found', resultCount, 'results');

        onProgress?.({
            type: 'web_search',
            query,
            status: 'complete',
            message: `Found ${resultCount} results. Fetching top sources...`,
        });

        // Phase 2: Auto-select top 3 URLs by score
        const topUrls = results
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .slice(0, 3)
            .map((r) => r.url)
            .filter((url) => url && url.startsWith('http'));

        console.error('[WEBSEARCH] Selected URLs:', topUrls);

        // Phase 3: Auto-fetch content from selected URLs using WebFetchTool
        let fetchResults = '';
        if (topUrls.length > 0) {
            onProgress?.({
                type: 'web_search',
                query,
                status: 'fetching',
                message: `Fetching details from ${topUrls.length} sources...`,
            });

            try {
                // Import WebFetchTool dynamically to avoid circular dependency
                const { WebFetchTool } = await import('../WebFetchTool/WebFetchTool.js');
                const fetchPromises = topUrls.map(async (url) => {
                    try {
                        const result = await WebFetchTool.call(
                            { urls: [url], prompt: 'Extract the main content and key information', max_concurrent: 1 },
                            { abortController: context.abortController, options: { isNonInteractiveSession: false } }
                        );
                        return { url, content: result.data?.result || '', success: true };
                    } catch (err) {
                        return { url, content: '', success: false, error: String(err) };
                    }
                });

                const fetchData = await Promise.all(fetchPromises);

                // Build fetch results summary
                const fetchResults_list = [];
                for (const r of fetchData) {
                    if (r.success && r.content) {
                        fetchResults_list.push(`## ${r.url}\n\n${r.content.substring(0, 5000)}\n\n---`);
                    }
                }
                fetchResults = fetchResults_list.join('\n\n');
            } catch (e) {
                console.error('[WEBSEARCH] Fetch failed:', e);
                fetchResults = 'Note: Could not fetch details from sources.';
            }
        }

        onProgress?.({
            type: 'web_search',
            status: 'complete',
            message: `Found ${resultCount} results, fetched ${topUrls.length} sources. Ready to synthesize.`,
        });

        const endTime = performance.now();

        // Combine everything
        const searchText = JSON.stringify(searchData, null, 2);
        const combinedResults = `SEARCH RESULTS:\n\n${searchText}\n\n---\n\nFETCHED CONTENT:\n\n${fetchResults}`;

        return {
            data: {
                query,
                results: [combinedResults],
                durationSeconds: (endTime - startTime) / 1000,
            }
        };
    },
    mapToolResultToToolResultBlockParam(output, toolUseID) {
        const { query, results } = output;
        let formattedOutput = `Research complete for: "${query}"\n\n`;
        formattedOutput += `Search and content fetching done. Synthesize the findings below into a clear answer.\n\n`;
        (results ?? []).forEach(result => {
            if (result == null)
                return;
            if (typeof result === 'string') {
                formattedOutput += result + '\n\n';
            }
            else {
                if (result.content?.length > 0) {
                    formattedOutput += `Links: ${jsonStringify(result.content)}\n\n`;
                }
            }
        });
        return {
            tool_use_id: toolUseID,
            type: 'tool_result',
            content: formattedOutput.trim(),
        };
    },
});
