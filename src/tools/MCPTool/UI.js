import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import { feature } from 'bun:bundle';
import figures from 'figures';
import * as React from 'react';
import { ProgressBar } from '../../components/design-system/ProgressBar.js';
import { MessageResponse } from '../../components/MessageResponse.js';
import { linkifyUrlsInText, OutputLine } from '../../components/shell/OutputLine.js';
import { stringWidth } from '../../ink/stringWidth.js';
import { Ansi, Box, Text } from '../../ink.js';
import { formatNumber } from '../../utils/format.js';
import { createHyperlink } from '../../utils/hyperlink.js';
import { getContentSizeEstimate } from '../../utils/mcpValidation.js';
import { jsonParse, jsonStringify } from '../../utils/slowOperations.js';
// Threshold for displaying warning about large MCP responses
const MCP_OUTPUT_WARNING_THRESHOLD_TOKENS = 10_000;
// In non-verbose mode, truncate individual input values to keep the header
// compact. Matches BashTool's philosophy of showing enough to identify the
// call without dumping the entire payload inline.
const MAX_INPUT_VALUE_CHARS = 80;
// Max number of top-level keys before we fall back to raw JSON display.
// Beyond this a flat k:v list is more noise than help.
const MAX_FLAT_JSON_KEYS = 12;
// Don't attempt flat-object parsing for large blobs.
const MAX_FLAT_JSON_CHARS = 5_000;
// Don't attempt to parse JSON blobs larger than this (perf safety).
const MAX_JSON_PARSE_CHARS = 200_000;
// A string value is "dominant text payload" if it has newlines or is
// long enough that inline display would be worse than unwrapping.
const UNWRAP_MIN_STRING_LEN = 200;
export function renderToolUseMessage(input, { verbose }) {
    if (Object.keys(input).length === 0) {
        return '';
    }
    return Object.entries(input).map(([key, value]) => {
        let rendered = jsonStringify(value);
        if (feature('MCP_RICH_OUTPUT') && !verbose && rendered.length > MAX_INPUT_VALUE_CHARS) {
            rendered = rendered.slice(0, MAX_INPUT_VALUE_CHARS).trimEnd() + '…';
        }
        return `${key}: ${rendered}`;
    }).join(', ');
}
export function renderToolUseProgressMessage(progressMessagesForMessage) {
    const lastProgress = progressMessagesForMessage.at(-1);
    if (!lastProgress?.data) {
        return _jsx(MessageResponse, { height: 1, children: _jsx(Text, { dimColor: true, children: "Running\u2026" }) });
    }
    const { progress, total, progressMessage } = lastProgress.data;
    if (progress === undefined) {
        return _jsx(MessageResponse, { height: 1, children: _jsx(Text, { dimColor: true, children: "Running\u2026" }) });
    }
    if (total !== undefined && total > 0) {
        const ratio = Math.min(1, Math.max(0, progress / total));
        const percentage = Math.round(ratio * 100);
        return _jsx(MessageResponse, { children: _jsxs(Box, { flexDirection: "column", children: [progressMessage && _jsx(Text, { dimColor: true, children: progressMessage }), _jsxs(Box, { flexDirection: "row", gap: 1, children: [_jsx(ProgressBar, { ratio: ratio, width: 20 }), _jsxs(Text, { dimColor: true, children: [percentage, "%"] })] })] }) });
    }
    return _jsx(MessageResponse, { height: 1, children: _jsx(Text, { dimColor: true, children: progressMessage ?? `Processing… ${progress}` }) });
}
export function renderToolResultMessage(output, _progressMessagesForMessage, { verbose, input }) {
    const mcpOutput = output;
    if (!verbose) {
        const slackSend = trySlackSendCompact(mcpOutput, input);
        if (slackSend !== null) {
            return _jsx(MessageResponse, { height: 1, children: _jsxs(Text, { children: ["Sent a message to", ' ', _jsx(Ansi, { children: createHyperlink(slackSend.url, slackSend.channel) })] }) });
        }
    }
    const estimatedTokens = getContentSizeEstimate(mcpOutput);
    const showWarning = estimatedTokens > MCP_OUTPUT_WARNING_THRESHOLD_TOKENS;
    const warningMessage = showWarning ? `${figures.warning} Large MCP response (~${formatNumber(estimatedTokens)} tokens), this can fill up context quickly` : null;
    let contentElement;
    if (Array.isArray(mcpOutput)) {
        const contentBlocks = mcpOutput.map((item, i) => {
            if (item.type === 'image') {
                return _jsx(Box, { justifyContent: "space-between", overflowX: "hidden", width: "100%", children: _jsx(MessageResponse, { height: 1, children: _jsx(Text, { children: "[Image]" }) }) }, i);
            }
            // For text blocks and any other block types, extract text if available
            const textContent = item.type === 'text' && 'text' in item && item.text !== null && item.text !== undefined ? String(item.text) : '';
            return feature('MCP_RICH_OUTPUT') ? _jsx(MCPTextOutput, { content: textContent, verbose: verbose }, i) : _jsx(OutputLine, { content: textContent, verbose: verbose }, i);
        });
        // Wrap array content in a column layout
        contentElement = _jsx(Box, { flexDirection: "column", width: "100%", children: contentBlocks });
    }
    else if (!mcpOutput) {
        contentElement = _jsx(Box, { justifyContent: "space-between", overflowX: "hidden", width: "100%", children: _jsx(MessageResponse, { height: 1, children: _jsx(Text, { dimColor: true, children: "(No content)" }) }) });
    }
    else {
        contentElement = feature('MCP_RICH_OUTPUT') ? _jsx(MCPTextOutput, { content: mcpOutput, verbose: verbose }) : _jsx(OutputLine, { content: mcpOutput, verbose: verbose });
    }
    if (warningMessage) {
        return _jsxs(Box, { flexDirection: "column", children: [_jsx(MessageResponse, { height: 1, children: _jsx(Text, { color: "warning", children: warningMessage }) }), contentElement] });
    }
    return contentElement;
}
/**
 * Render MCP text output. Tries three strategies in order:
 * 1. If JSON wraps a single dominant text payload (e.g. slack's
 *    {"messages":"line1\nline2..."}), unwrap and let OutputLine truncate.
 * 2. If JSON is a small flat-ish object, render as aligned key: value.
 * 3. Otherwise fall through to OutputLine (pretty-print + truncate).
 */
function MCPTextOutput(t0) {
    const $ = _c(18);
    const { content, verbose } = t0;
    let t1;
    if ($[0] !== content || $[1] !== verbose) {
        t1 = Symbol.for("react.early_return_sentinel");
        bb0: {
            const unwrapped = tryUnwrapTextPayload(content);
            if (unwrapped !== null) {
                const t2 = unwrapped.extras.length > 0 && _jsx(Text, { dimColor: true, children: unwrapped.extras.map(_temp).join(" \xB7 ") });
                let t3;
                if ($[3] !== unwrapped || $[4] !== verbose) {
                    t3 = _jsx(OutputLine, { content: unwrapped.body, verbose: verbose, linkifyUrls: true });
                    $[3] = unwrapped;
                    $[4] = verbose;
                    $[5] = t3;
                }
                else {
                    t3 = $[5];
                }
                let t4;
                if ($[6] !== t2 || $[7] !== t3) {
                    t4 = _jsx(MessageResponse, { children: _jsxs(Box, { flexDirection: "column", children: [t2, t3] }) });
                    $[6] = t2;
                    $[7] = t3;
                    $[8] = t4;
                }
                else {
                    t4 = $[8];
                }
                t1 = t4;
                break bb0;
            }
        }
        $[0] = content;
        $[1] = verbose;
        $[2] = t1;
    }
    else {
        t1 = $[2];
    }
    if (t1 !== Symbol.for("react.early_return_sentinel")) {
        return t1;
    }
    let t2;
    if ($[9] !== content) {
        t2 = Symbol.for("react.early_return_sentinel");
        bb1: {
            const flat = tryFlattenJson(content);
            if (flat !== null) {
                const maxKeyWidth = Math.max(...flat.map(_temp2));
                let t3;
                if ($[11] !== maxKeyWidth) {
                    t3 = (t4, i) => {
                        const [key, value] = t4;
                        return _jsxs(Text, { children: [_jsxs(Text, { dimColor: true, children: [key.padEnd(maxKeyWidth), ": "] }), _jsx(Ansi, { children: linkifyUrlsInText(value) })] }, i);
                    };
                    $[11] = maxKeyWidth;
                    $[12] = t3;
                }
                else {
                    t3 = $[12];
                }
                const t4 = _jsx(Box, { flexDirection: "column", children: flat.map(t3) });
                let t5;
                if ($[13] !== t4) {
                    t5 = _jsx(MessageResponse, { children: t4 });
                    $[13] = t4;
                    $[14] = t5;
                }
                else {
                    t5 = $[14];
                }
                t2 = t5;
                break bb1;
            }
        }
        $[9] = content;
        $[10] = t2;
    }
    else {
        t2 = $[10];
    }
    if (t2 !== Symbol.for("react.early_return_sentinel")) {
        return t2;
    }
    let t3;
    if ($[15] !== content || $[16] !== verbose) {
        t3 = _jsx(OutputLine, { content: content, verbose: verbose, linkifyUrls: true });
        $[15] = content;
        $[16] = verbose;
        $[17] = t3;
    }
    else {
        t3 = $[17];
    }
    return t3;
}
/**
 * Parse content as a JSON object and return its entries. Null if content
 * doesn't parse, isn't an object, is too large, or has 0/too-many keys.
 */
function _temp2(t0) {
    const [k_0] = t0;
    return stringWidth(k_0);
}
function _temp(t0) {
    const [k, v] = t0;
    return `${k}: ${v}`;
}
function parseJsonEntries(content, { maxChars, maxKeys }) {
    const trimmed = content.trim();
    if (trimmed.length === 0 || trimmed.length > maxChars || trimmed[0] !== '{') {
        return null;
    }
    let parsed;
    try {
        parsed = jsonParse(trimmed);
    }
    catch {
        return null;
    }
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return null;
    }
    const entries = Object.entries(parsed);
    if (entries.length === 0 || entries.length > maxKeys) {
        return null;
    }
    return entries;
}
/**
 * If content parses as a JSON object where every value is a scalar or a
 * small nested object, flatten it to [key, displayValue] pairs. Nested
 * objects get one-line JSON. Returns null if content doesn't qualify.
 */
export function tryFlattenJson(content) {
    const entries = parseJsonEntries(content, {
        maxChars: MAX_FLAT_JSON_CHARS,
        maxKeys: MAX_FLAT_JSON_KEYS
    });
    if (entries === null)
        return null;
    const result = [];
    for (const [key, value] of entries) {
        if (typeof value === 'string') {
            result.push([key, value]);
        }
        else if (value === null || typeof value === 'number' || typeof value === 'boolean') {
            result.push([key, String(value)]);
        }
        else if (typeof value === 'object') {
            const compact = jsonStringify(value);
            if (compact.length > 120)
                return null;
            result.push([key, compact]);
        }
        else {
            return null;
        }
    }
    return result;
}
/**
 * If content is a JSON object where one key holds a dominant string payload
 * (multiline or long) and all siblings are small scalars, unwrap it. This
 * handles the common MCP pattern of {"messages":"line1\nline2..."} where
 * pretty-printing keeps \n escaped but we want real line breaks + truncation.
 */
export function tryUnwrapTextPayload(content) {
    const entries = parseJsonEntries(content, {
        maxChars: MAX_JSON_PARSE_CHARS,
        maxKeys: 4
    });
    if (entries === null)
        return null;
    // Find the one dominant string payload. Trim first: a trailing \n on a
    // short sibling (e.g. pagination hints) shouldn't make it "dominant".
    let body = null;
    const extras = [];
    for (const [key, value] of entries) {
        if (typeof value === 'string') {
            const t = value.trimEnd();
            const isDominant = t.length > UNWRAP_MIN_STRING_LEN || t.includes('\n') && t.length > 50;
            if (isDominant) {
                if (body !== null)
                    return null; // two big strings — ambiguous
                body = t;
                continue;
            }
            if (t.length > 150)
                return null;
            extras.push([key, t.replace(/\s+/g, ' ')]);
        }
        else if (value === null || typeof value === 'number' || typeof value === 'boolean') {
            extras.push([key, String(value)]);
        }
        else {
            return null; // nested object/array — use flat or pretty-print path
        }
    }
    if (body === null)
        return null;
    return {
        body,
        extras
    };
}
const SLACK_ARCHIVES_RE = /^https:\/\/[a-z0-9-]+\.slack\.com\/archives\/([A-Z0-9]+)\/p\d+$/;
/**
 * Detect a Slack send-message result and return a compact {channel, url} pair.
 * Matches both hosted (claude.ai Slack) and community MCP server shapes —
 * both return `message_link` in the result. The channel label prefers the
 * tool input (may be a name like "#foo" or an ID like "C09EVDAN1NK") and
 * falls back to the ID parsed from the archives URL.
 */
export function trySlackSendCompact(output, input) {
    let text = output;
    if (Array.isArray(output)) {
        const block = output.find(b => b.type === 'text');
        text = block && 'text' in block ? block.text : undefined;
    }
    if (typeof text !== 'string' || !text.includes('"message_link"')) {
        return null;
    }
    const entries = parseJsonEntries(text, {
        maxChars: 2000,
        maxKeys: 6
    });
    const url = entries?.find(([k]) => k === 'message_link')?.[1];
    if (typeof url !== 'string')
        return null;
    const m = SLACK_ARCHIVES_RE.exec(url);
    if (!m)
        return null;
    const inp = input;
    const raw = inp?.channel_id ?? inp?.channel ?? m[1];
    const label = typeof raw === 'string' && raw ? raw : 'slack';
    return {
        channel: label.startsWith('#') ? label : `#${label}`,
        url
    };
}
