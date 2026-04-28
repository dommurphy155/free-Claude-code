import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from 'react';
import { KeyboardShortcutHint } from '../../components/design-system/KeyboardShortcutHint.js';
import { FallbackToolUseErrorMessage } from '../../components/FallbackToolUseErrorMessage.js';
import { MessageResponse } from '../../components/MessageResponse.js';
import { OutputLine } from '../../components/shell/OutputLine.js';
import { ShellProgressMessage } from '../../components/shell/ShellProgressMessage.js';
import { ShellTimeDisplay } from '../../components/shell/ShellTimeDisplay.js';
import { Box, Text } from '../../ink.js';
// Constants for command display
const MAX_COMMAND_DISPLAY_LINES = 2;
const MAX_COMMAND_DISPLAY_CHARS = 160;
export function renderToolUseMessage(input, { verbose, theme: _theme }) {
    const { command } = input;
    if (!command) {
        return null;
    }
    const displayCommand = command;
    if (!verbose) {
        const lines = displayCommand.split('\n');
        const needsLineTruncation = lines.length > MAX_COMMAND_DISPLAY_LINES;
        const needsCharTruncation = displayCommand.length > MAX_COMMAND_DISPLAY_CHARS;
        if (needsLineTruncation || needsCharTruncation) {
            let truncated = displayCommand;
            if (needsLineTruncation) {
                truncated = lines.slice(0, MAX_COMMAND_DISPLAY_LINES).join('\n');
            }
            if (truncated.length > MAX_COMMAND_DISPLAY_CHARS) {
                truncated = truncated.slice(0, MAX_COMMAND_DISPLAY_CHARS);
            }
            return _jsxs(Text, { children: [truncated.trim(), "\u2026"] });
        }
    }
    return displayCommand;
}
export function renderToolUseProgressMessage(progressMessagesForMessage, { verbose, tools: _tools, terminalSize: _terminalSize, inProgressToolCallCount: _inProgressToolCallCount }) {
    const lastProgress = progressMessagesForMessage.at(-1);
    if (!lastProgress || !lastProgress.data) {
        return _jsx(MessageResponse, { height: 1, children: _jsx(Text, { dimColor: true, children: "Running\u2026" }) });
    }
    const data = lastProgress.data;
    return _jsx(ShellProgressMessage, { fullOutput: data.fullOutput, output: data.output, elapsedTimeSeconds: data.elapsedTimeSeconds, totalLines: data.totalLines, totalBytes: data.totalBytes, timeoutMs: data.timeoutMs, taskId: data.taskId, verbose: verbose });
}
export function renderToolUseQueuedMessage() {
    return _jsx(MessageResponse, { height: 1, children: _jsx(Text, { dimColor: true, children: "Waiting\u2026" }) });
}
export function renderToolResultMessage(content, progressMessagesForMessage, { verbose, theme: _theme, tools: _tools, style: _style }) {
    const lastProgress = progressMessagesForMessage.at(-1);
    const timeoutMs = lastProgress?.data?.timeoutMs;
    const { stdout, stderr, interrupted, returnCodeInterpretation, isImage, backgroundTaskId } = content;
    if (isImage) {
        return _jsx(MessageResponse, { height: 1, children: _jsx(Text, { dimColor: true, children: "[Image data detected and sent to Claude]" }) });
    }
    return _jsxs(Box, { flexDirection: "column", children: [stdout !== '' ? _jsx(OutputLine, { content: stdout, verbose: verbose }) : null, stderr.trim() !== '' ? _jsx(OutputLine, { content: stderr, verbose: verbose, isError: true }) : null, stdout === '' && stderr.trim() === '' ? _jsx(MessageResponse, { height: 1, children: _jsx(Text, { dimColor: true, children: backgroundTaskId ? _jsxs(_Fragment, { children: ["Running in the background", ' ', _jsx(KeyboardShortcutHint, { shortcut: "\u2193", action: "manage", parens: true })] }) : interrupted ? 'Interrupted' : returnCodeInterpretation || '(No output)' }) }) : null, timeoutMs ? _jsx(MessageResponse, { children: _jsx(ShellTimeDisplay, { timeoutMs: timeoutMs }) }) : null] });
}
export function renderToolUseErrorMessage(result, { verbose, progressMessagesForMessage: _progressMessagesForMessage, tools: _tools }) {
    return _jsx(FallbackToolUseErrorMessage, { result: result, verbose: verbose });
}
