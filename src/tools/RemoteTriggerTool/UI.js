import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { MessageResponse } from '../../components/MessageResponse.js';
import { Text } from '../../ink.js';
import { countCharInString } from '../../utils/stringUtils.js';
export function renderToolUseMessage(input) {
    return `${input.action ?? ''}${input.trigger_id ? ` ${input.trigger_id}` : ''}`;
}
export function renderToolResultMessage(output) {
    const lines = countCharInString(output.json, '\n') + 1;
    return _jsx(MessageResponse, { children: _jsxs(Text, { children: ["HTTP ", output.status, " ", _jsxs(Text, { dimColor: true, children: ["(", lines, " lines)"] })] }) });
}
