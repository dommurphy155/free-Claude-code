import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { Box, Text } from '../../ink.js';
export function renderToolUseMessage() {
    return 'Exiting worktree…';
}
export function renderToolResultMessage(output, _progressMessagesForMessage, _options) {
    const actionLabel = output.action === 'keep' ? 'Kept worktree' : 'Removed worktree';
    return _jsxs(Box, { flexDirection: "column", children: [_jsxs(Text, { children: [actionLabel, output.worktreeBranch ? _jsxs(_Fragment, { children: [' ', "(branch ", _jsx(Text, { bold: true, children: output.worktreeBranch }), ")"] }) : null] }), _jsxs(Text, { dimColor: true, children: ["Returned to ", output.originalCwd] })] });
}
