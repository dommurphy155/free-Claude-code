import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { Box, Text } from '../../ink.js';
export function renderToolUseMessage() {
    return 'Creating worktree…';
}
export function renderToolResultMessage(output, _progressMessagesForMessage, _options) {
    return _jsxs(Box, { flexDirection: "column", children: [_jsxs(Text, { children: ["Switched to worktree on branch ", _jsx(Text, { bold: true, children: output.worktreeBranch })] }), _jsx(Text, { dimColor: true, children: output.worktreePath })] });
}
