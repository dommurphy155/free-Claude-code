import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { MessageResponse } from '../../components/MessageResponse.js';
import { TOOL_SUMMARY_MAX_LENGTH } from '../../constants/toolLimits.js';
import { Box, Text } from '../../ink.js';
import { formatFileSize, truncate } from '../../utils/format.js';
export function renderToolUseMessage({ url, prompt }, { verbose }) {
    if (!url) {
        return null;
    }
    if (verbose) {
        return `url: "${url}"${verbose && prompt ? `, prompt: "${prompt}"` : ''}`;
    }
    return url;
}
export function renderToolUseProgressMessage() {
    return _jsx(MessageResponse, { height: 1, children: _jsx(Text, { dimColor: true, children: "Fetching\u2026" }) });
}
export function renderToolResultMessage({ bytes, code, codeText, result }, _progressMessagesForMessage, { verbose }) {
    const formattedSize = formatFileSize(bytes);
    if (verbose) {
        return _jsxs(Box, { flexDirection: "column", children: [_jsx(MessageResponse, { height: 1, children: _jsxs(Text, { children: ["Received ", _jsx(Text, { bold: true, children: formattedSize }), " (", code, " ", codeText, ")"] }) }), _jsx(Box, { flexDirection: "column", children: _jsx(Text, { children: result }) })] });
    }
    return _jsx(MessageResponse, { height: 1, children: _jsxs(Text, { children: ["Received ", _jsx(Text, { bold: true, children: formattedSize }), " (", code, " ", codeText, ")"] }) });
}
export function getToolUseSummary(input) {
    if (!input?.url) {
        return null;
    }
    return truncate(input.url, TOOL_SUMMARY_MAX_LENGTH);
}
