import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { MessageResponse } from '../../components/MessageResponse.js';
import { TOOL_SUMMARY_MAX_LENGTH } from '../../constants/toolLimits.js';
import { Box, Text } from '../../ink.js';
import { truncate } from '../../utils/format.js';
function getSearchSummary(results) {
    let searchCount = 0;
    let totalResultCount = 0;
    for (const result of results) {
        if (result != null && typeof result !== 'string') {
            searchCount++;
            totalResultCount += result.content?.length ?? 0;
        }
    }
    return {
        searchCount,
        totalResultCount
    };
}
export function renderToolUseMessage({ query, allowed_domains, blocked_domains }, { verbose }) {
    if (!query) {
        return null;
    }
    let message = '';
    if (query) {
        message += `"${query}"`;
    }
    if (verbose) {
        if (allowed_domains && allowed_domains.length > 0) {
            message += `, only allowing domains: ${allowed_domains.join(', ')}`;
        }
        if (blocked_domains && blocked_domains.length > 0) {
            message += `, blocking domains: ${blocked_domains.join(', ')}`;
        }
    }
    return message;
}
export function renderToolUseProgressMessage(progressMessages) {
    if (progressMessages.length === 0) {
        return null;
    }
    const lastProgress = progressMessages[progressMessages.length - 1];
    if (!lastProgress?.data) {
        return null;
    }
    const data = lastProgress.data;
    switch (data.type) {
        case 'query_update':
            return _jsx(MessageResponse, { children: _jsxs(Text, { dimColor: true, children: ["Searching: ", data.query] }) });
        case 'search_results_received':
            return _jsx(MessageResponse, { children: _jsxs(Text, { dimColor: true, children: ["Found ", data.resultCount, " results for \"", data.query, "\""] }) });
        default:
            return null;
    }
}
export function renderToolResultMessage(output) {
    const { searchCount } = getSearchSummary(output.results ?? []);
    const timeDisplay = output.durationSeconds >= 1 ? `${Math.round(output.durationSeconds)}s` : `${Math.round(output.durationSeconds * 1000)}ms`;
    return _jsx(Box, { justifyContent: "space-between", width: "100%", children: _jsx(MessageResponse, { height: 1, children: _jsxs(Text, { children: ["Did ", searchCount, " search", searchCount !== 1 ? 'es' : '', " in ", timeDisplay] }) }) });
}
export function getToolUseSummary(input) {
    if (!input?.query) {
        return null;
    }
    return truncate(input.query, TOOL_SUMMARY_MAX_LENGTH);
}
