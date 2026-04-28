import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { BLACK_CIRCLE } from 'src/constants/figures.js';
import { getModeColor } from 'src/utils/permissions/PermissionMode.js';
import { Box, Text } from '../../ink.js';
export function renderToolUseMessage() {
    return null;
}
export function renderToolResultMessage(_output, _progressMessagesForMessage, _options) {
    return _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsxs(Box, { flexDirection: "row", children: [_jsx(Text, { color: getModeColor('plan'), children: BLACK_CIRCLE }), _jsx(Text, { children: " Entered plan mode" })] }), _jsx(Box, { paddingLeft: 2, children: _jsx(Text, { dimColor: true, children: "Claude is now exploring and designing an implementation approach." }) })] });
}
export function renderToolUseRejectedMessage() {
    return _jsxs(Box, { flexDirection: "row", marginTop: 1, children: [_jsx(Text, { color: getModeColor('default'), children: BLACK_CIRCLE }), _jsx(Text, { children: " User declined to enter plan mode" })] });
}
