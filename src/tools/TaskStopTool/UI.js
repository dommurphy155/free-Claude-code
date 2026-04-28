import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { MessageResponse } from '../../components/MessageResponse.js';
import { stringWidth } from '../../ink/stringWidth.js';
import { Text } from '../../ink.js';
import { truncateToWidthNoEllipsis } from '../../utils/format.js';
export function renderToolUseMessage() {
    return '';
}
const MAX_COMMAND_DISPLAY_LINES = 2;
const MAX_COMMAND_DISPLAY_CHARS = 160;
function truncateCommand(command) {
    const lines = command.split('\n');
    let truncated = command;
    if (lines.length > MAX_COMMAND_DISPLAY_LINES) {
        truncated = lines.slice(0, MAX_COMMAND_DISPLAY_LINES).join('\n');
    }
    if (stringWidth(truncated) > MAX_COMMAND_DISPLAY_CHARS) {
        truncated = truncateToWidthNoEllipsis(truncated, MAX_COMMAND_DISPLAY_CHARS);
    }
    return truncated.trim();
}
export function renderToolResultMessage(output, _progressMessagesForMessage, { verbose }) {
    if ("external" === 'ant') {
        return null;
    }
    const rawCommand = output.command ?? '';
    const command = verbose ? rawCommand : truncateCommand(rawCommand);
    const suffix = command !== rawCommand ? '… · stopped' : ' · stopped';
    return _jsx(MessageResponse, { children: _jsxs(Text, { children: [command, suffix] }) });
}
