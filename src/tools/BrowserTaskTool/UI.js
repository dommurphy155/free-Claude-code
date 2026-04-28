import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from '../../ink.js';
import { MessageResponse } from '../../components/MessageResponse.js';
export function getToolUseSummary(input) {
    if (!input.goal)
        return null;
    return `Browser task: ${input.goal.slice(0, 60)}${input.goal.length > 60 ? '...' : ''}`;
}
export function renderToolUseMessage(input, _options) {
    const summary = getToolUseSummary(input);
    if (!summary)
        return null;
    return (_jsx(MessageResponse, { height: 1, children: _jsx(Text, { children: summary }) }));
}
export function renderToolUseProgressMessage(progressMessages) {
    // Show the most recent progress message
    if (progressMessages.length === 0) {
        return (_jsx(MessageResponse, { height: 1, children: _jsx(Text, { dimColor: true, children: "Starting browser automation..." }) }));
    }
    const lastProgress = progressMessages[progressMessages.length - 1];
    if (!lastProgress?.data?.message) {
        return (_jsx(MessageResponse, { height: 1, children: _jsx(Text, { dimColor: true, children: "Working..." }) }));
    }
    return (_jsx(MessageResponse, { height: 1, children: _jsx(Text, { dimColor: true, children: lastProgress.data.message }) }));
}
export function renderToolResultMessage(output, progressMessages, _options) {
    const result = output.result || '';
    // Show progress history in verbose mode or if there are interesting messages
    const progressLines = progressMessages
        .filter(p => p.data?.message && !p.data.message.includes('Step'))
        .slice(-3)
        .map(p => p.data.message);
    if (progressLines.length > 0) {
        return (_jsxs(Box, { flexDirection: "column", children: [progressLines.map((msg, i) => (_jsx(MessageResponse, { height: 1, children: _jsx(Text, { dimColor: true, children: msg }) }, i))), _jsx(Box, { flexDirection: "column", marginTop: 1, children: _jsxs(Text, { children: [result.slice(0, 500), result.length > 500 ? '...' : ''] }) })] }));
    }
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(MessageResponse, { height: 1, children: _jsx(Text, { children: "Browser task completed" }) }), _jsxs(Text, { children: [result.slice(0, 500), result.length > 500 ? '...' : ''] })] }));
}
