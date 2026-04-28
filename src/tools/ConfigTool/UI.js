import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { MessageResponse } from '../../components/MessageResponse.js';
import { Text } from '../../ink.js';
import { jsonStringify } from '../../utils/slowOperations.js';
export function renderToolUseMessage(input) {
    if (!input.setting)
        return null;
    if (input.value === undefined) {
        return _jsxs(Text, { dimColor: true, children: ["Getting ", input.setting] });
    }
    return _jsxs(Text, { dimColor: true, children: ["Setting ", input.setting, " to ", jsonStringify(input.value)] });
}
export function renderToolResultMessage(content) {
    if (!content.success) {
        return _jsx(MessageResponse, { children: _jsxs(Text, { color: "error", children: ["Failed: ", content.error] }) });
    }
    if (content.operation === 'get') {
        return _jsx(MessageResponse, { children: _jsxs(Text, { children: [_jsx(Text, { bold: true, children: content.setting }), " = ", jsonStringify(content.value)] }) });
    }
    return _jsx(MessageResponse, { children: _jsxs(Text, { children: ["Set ", _jsx(Text, { bold: true, children: content.setting }), " to", ' ', _jsx(Text, { bold: true, children: jsonStringify(content.newValue) })] }) });
}
export function renderToolUseRejectedMessage() {
    return _jsx(Text, { color: "warning", children: "Config change rejected" });
}
