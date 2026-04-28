import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from 'react';
import { SubAgentProvider } from 'src/components/CtrlOToExpand.js';
import { FallbackToolUseErrorMessage } from 'src/components/FallbackToolUseErrorMessage.js';
import { FallbackToolUseRejectedMessage } from 'src/components/FallbackToolUseRejectedMessage.js';
import { Byline } from '../../components/design-system/Byline.js';
import { Message as MessageComponent } from '../../components/Message.js';
import { MessageResponse } from '../../components/MessageResponse.js';
import { Box, Text } from '../../ink.js';
import { buildSubagentLookups, EMPTY_LOOKUPS } from '../../utils/messages.js';
import { plural } from '../../utils/stringUtils.js';
const MAX_PROGRESS_MESSAGES_TO_SHOW = 3;
const INITIALIZING_TEXT = 'Initializing…';
export function renderToolResultMessage(output) {
    // Handle forked skill result
    if ('status' in output && output.status === 'forked') {
        return _jsx(MessageResponse, { height: 1, children: _jsx(Text, { children: _jsx(Byline, { children: ['Done'] }) }) });
    }
    const parts = ['Successfully loaded skill'];
    // Show tools count (only for inline skills)
    if ('allowedTools' in output && output.allowedTools && output.allowedTools.length > 0) {
        const count = output.allowedTools.length;
        parts.push(`${count} ${plural(count, 'tool')} allowed`);
    }
    // Show model if non-default (only for inline skills)
    if ('model' in output && output.model) {
        parts.push(output.model);
    }
    return _jsx(MessageResponse, { height: 1, children: _jsx(Text, { children: _jsx(Byline, { children: parts }) }) });
}
export function renderToolUseMessage({ skill }, { commands }) {
    if (!skill) {
        return null;
    }
    // Look up the command to check if it came from the legacy /commands folder
    const command = commands?.find(c => c.name === skill);
    const displayName = command?.loadedFrom === 'commands_DEPRECATED' ? `/${skill}` : skill;
    return displayName;
}
export function renderToolUseProgressMessage(progressMessages, { tools, verbose }) {
    if (!progressMessages.length) {
        return _jsx(MessageResponse, { height: 1, children: _jsx(Text, { dimColor: true, children: INITIALIZING_TEXT }) });
    }
    // Take only the last few messages for display in non-verbose mode
    const displayedMessages = verbose ? progressMessages : progressMessages.slice(-MAX_PROGRESS_MESSAGES_TO_SHOW);
    const hiddenCount = progressMessages.length - displayedMessages.length;
    const { inProgressToolUseIDs } = buildSubagentLookups(progressMessages.map(pm => pm.data));
    return _jsx(MessageResponse, { children: _jsxs(Box, { flexDirection: "column", children: [_jsx(SubAgentProvider, { children: displayedMessages.map(progressMessage => _jsx(Box, { height: 1, overflow: "hidden", children: _jsx(MessageComponent, { message: progressMessage.data.message, lookups: EMPTY_LOOKUPS, addMargin: false, tools: tools, commands: [], verbose: verbose, inProgressToolUseIDs: inProgressToolUseIDs, progressMessagesForMessage: [], shouldAnimate: false, shouldShowDot: false, style: "condensed", isTranscriptMode: false, isStatic: true }) }, progressMessage.uuid)) }), hiddenCount > 0 && _jsxs(Text, { dimColor: true, children: ["+", hiddenCount, " more tool ", plural(hiddenCount, 'use')] })] }) });
}
export function renderToolUseRejectedMessage(_input, { progressMessagesForMessage, tools, verbose }) {
    return _jsxs(_Fragment, { children: [renderToolUseProgressMessage(progressMessagesForMessage, {
                tools,
                verbose
            }), _jsx(FallbackToolUseRejectedMessage, {})] });
}
export function renderToolUseErrorMessage(result, { progressMessagesForMessage, tools, verbose }) {
    return _jsxs(_Fragment, { children: [renderToolUseProgressMessage(progressMessagesForMessage, {
                tools,
                verbose
            }), _jsx(FallbackToolUseErrorMessage, { result: result, verbose: verbose })] });
}
