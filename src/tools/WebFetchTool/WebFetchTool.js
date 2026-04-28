import { z } from 'zod/v4';
import { buildTool } from '../../Tool.js';
import { lazySchema } from '../../utils/lazySchema.js';
import { getRuleByContentsForTool } from '../../utils/permissions/permissions.js';
import { isPreapprovedHost } from './preapproved.js';
import { DESCRIPTION, WEB_FETCH_TOOL_NAME } from './prompt.js';
import { getToolUseSummary, renderToolResultMessage, renderToolUseMessage, renderToolUseProgressMessage, } from './UI.js';
import { applyPromptToMarkdown, getURLMarkdownContent, isPreapprovedUrl } from './utils.js';

const inputSchema = lazySchema(() => z.strictObject({
    urls: z
        .array(z.string().url())
        .describe('Array of URLs to fetch in parallel (max 5)'),
    prompt: z.string().describe('The prompt to run on the fetched content'),
    max_concurrent: z
        .number()
        .min(1)
        .max(5)
        .optional()
        .describe('Max parallel requests (default 3, max 5)'),
}));
const outputSchema = lazySchema(() => z.object({
    bytes: z.number().describe('Size of the fetched content in bytes'),
    code: z.number().describe('HTTP response code'),
    codeText: z.string().describe('HTTP response code text'),
    result: z
        .string()
        .describe('Processed result from applying the prompt to the content'),
    durationMs: z
        .number()
        .describe('Time taken to fetch and process the content'),
    url: z.string().describe('The URL that was fetched'),
}));

function webFetchToolInputToPermissionRuleContent(input) {
    try {
        const parsedInput = WebFetchTool.inputSchema.safeParse(input);
        if (!parsedInput.success) {
            return `input:${input.toString()}`;
        }
        const { urls } = parsedInput.data;
        const hostname = new URL(urls[0]).hostname;
        return `domain:${hostname}`;
    }
    catch {
        return `input:${input.toString()}`;
    }
}

export const WebFetchTool = buildTool({
    name: WEB_FETCH_TOOL_NAME,
    searchHint: 'fetch and extract content from a URL',
    maxResultSizeChars: 100_000,
    shouldDefer: true,
    async description(input) {
        const { urls } = input;
        if (urls.length === 1) {
            try {
                const hostname = new URL(urls[0]).hostname;
                return `Claude wants to fetch content from ${hostname}`;
            }
            catch {
                return `Claude wants to fetch content from this URL`;
            }
        }
        return `Claude wants to fetch content from ${urls.length} URLs in parallel`;
    },
    userFacingName() {
        return 'Fetch';
    },
    getToolUseSummary,
    getActivityDescription(input) {
        const summary = getToolUseSummary(input);
        return summary ? `Fetching ${summary}` : 'Fetching web page';
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
        const urlList = input.urls.join(', ');
        return input.prompt ? `${urlList}: ${input.prompt}` : urlList;
    },
    async checkPermissions(input, context) {
        const appState = context.getAppState();
        const permissionContext = appState.toolPermissionContext;
        const { urls } = input;
        for (const url of urls) {
            try {
                const parsedUrl = new URL(url);
                if (isPreapprovedHost(parsedUrl.hostname, parsedUrl.pathname)) {
                    return {
                        behavior: 'allow',
                        updatedInput: input,
                        decisionReason: { type: 'other', reason: 'Preapproved host' },
                    };
                }
            }
            catch {
            }
        }
        const ruleContent = webFetchToolInputToPermissionRuleContent({ url: urls[0] });
        const denyRule = getRuleByContentsForTool(permissionContext, WebFetchTool, 'deny').get(ruleContent);
        if (denyRule) {
            return {
                behavior: 'deny',
                message: `${WebFetchTool.name} denied access to ${ruleContent}.`,
                decisionReason: {
                    type: 'rule',
                    rule: denyRule,
                },
            };
        }
        const askRule = getRuleByContentsForTool(permissionContext, WebFetchTool, 'ask').get(ruleContent);
        if (askRule) {
            return {
                behavior: 'ask',
                message: `Claude requested permissions to use ${WebFetchTool.name}, but you haven't granted it yet.`,
                decisionReason: {
                    type: 'rule',
                    rule: askRule,
                },
                suggestions: buildSuggestions(ruleContent),
            };
        }
        const allowRule = getRuleByContentsForTool(permissionContext, WebFetchTool, 'allow').get(ruleContent);
        if (allowRule) {
            return {
                behavior: 'allow',
                updatedInput: input,
                decisionReason: {
                    type: 'rule',
                    rule: allowRule,
                },
            };
        }
        return {
            behavior: 'ask',
            message: `Claude requested permissions to use ${WebFetchTool.name}, but you haven't granted it yet.`,
            suggestions: buildSuggestions(ruleContent),
        };
    },
    async prompt(_options) {
        return `IMPORTANT: WebFetch WILL FAIL for authenticated or private URLs. Before using this tool, check if the URL points to an authenticated service (e.g. Google Docs, Confluence, Jira, GitHub). If so, look for a specialized MCP tool that provides authenticated access.
${DESCRIPTION}`;
    },
    async validateInput(input) {
        const { urls } = input;
        if (!urls || urls.length === 0) {
            return {
                result: false,
                message: 'Error: At least one URL is required',
                meta: { reason: 'missing_urls' },
                errorCode: 1,
            };
        }
        for (const url of urls) {
            try {
                new URL(url);
            }
            catch {
                return {
                    result: false,
                    message: `Error: Invalid URL "${url}". The URL provided could not be parsed.`,
                    meta: { reason: 'invalid_url' },
                    errorCode: 1,
                };
            }
        }
        if (urls.length > 5) {
            return {
                result: false,
                message: 'Error: Maximum 5 URLs allowed per fetch',
                meta: { reason: 'too_many_urls' },
                errorCode: 2,
            };
        }
        return { result: true };
    },
    renderToolUseMessage,
    renderToolUseProgressMessage,
    renderToolResultMessage,
    async call(
        { urls, prompt, max_concurrent = 3 },
        { abortController, options: { isNonInteractiveSession } },
    ) {
        const start = Date.now();

        console.error('[WEBFETCH] Parallel fetch:', urls.length, 'URLs');

        // Fetch URLs directly using getURLMarkdownContent
        const fetchPromises = urls.map(async (url) => {
            try {
                const fetched = await getURLMarkdownContent(url, abortController);
                // Check if we got a redirect instead of content
                if ('type' in fetched && fetched.type === 'redirect') {
                    return {
                        url,
                        content: '',
                        success: false,
                        error: `Redirect to ${fetched.redirectUrl} (${fetched.statusCode})`,
                        size: 0,
                    };
                }
                return {
                    url,
                    content: fetched.content,
                    success: true,
                    size: fetched.bytes,
                };
            } catch (error) {
                return {
                    url,
                    content: '',
                    success: false,
                    error: String(error),
                    size: 0,
                };
            }
        });

        const results = await Promise.all(fetchPromises);

        console.error('[WEBFETCH] Got', results.length, 'results');

        // Process each result with the prompt using Haiku
        const processedResults = [];
        for (const result of results) {
            if (result.success && result.content) {
                const isPreapproved = isPreapprovedUrl(result.url);
                const extracted = await applyPromptToMarkdown(
                    prompt,
                    result.content,
                    abortController.signal,
                    isNonInteractiveSession,
                    isPreapproved,
                );
                processedResults.push(`## ${result.url}\n\n${extracted}\n\n---`);
            } else {
                processedResults.push(
                    `## ${result.url}\n\nError: ${result.error || 'Failed to fetch'}\n\n---`,
                );
            }
        }

        const combinedResult = processedResults.join('\n\n');
        const totalBytes = results.reduce(
            (sum, r) => sum + (r.size || 0),
            0,
        );

        const output = {
            bytes: totalBytes,
            code: results.every((r) => r.success) ? 200 : 207,
            codeText: results.every((r) => r.success) ? 'OK' : 'Partial Content',
            result: combinedResult,
            durationMs: Date.now() - start,
            url: urls[0],
        };

        return { data: output };
    },
    mapToolResultToToolResultBlockParam({ result }, toolUseID) {
        const content = `╔════════════════════════════════════════════════════════════════╗\n` +
            `║ ✅ PHASE 3 COMPLETE - READY TO SYNTHESIZE ║\n` +
            `╚════════════════════════════════════════════════════════════════╝\n\n` +
            `Fetched content from URLs:\n\n${result}\n\n` +
            `══════════════════════════════════════════════════════════════════\n` +
            `MANDATORY: Before providing final answer, you MUST:\n` +
            `1. Mark synthesis phase complete by calling research state\n` +
            `2. Verify all phases are done: POST /research/check-completion\n` +
            `3. Only then provide your synthesized answer with citations\n` +
            `══════════════════════════════════════════════════════════════════\n\n` +
            `NEXT: Synthesize findings and provide comprehensive answer with citations.`;

        return {
            tool_use_id: toolUseID,
            type: 'tool_result',
            content: content,
        };
    },
});

function buildSuggestions(ruleContent) {
    return [
        {
            type: 'addRules',
            destination: 'localSettings',
            rules: [{ toolName: WEB_FETCH_TOOL_NAME, ruleContent }],
            behavior: 'allow',
        },
    ];
}
