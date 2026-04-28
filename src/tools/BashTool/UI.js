import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import * as React from 'react';
import { KeyboardShortcutHint } from '../../components/design-system/KeyboardShortcutHint.js';
import { FallbackToolUseErrorMessage } from '../../components/FallbackToolUseErrorMessage.js';
import { MessageResponse } from '../../components/MessageResponse.js';
import { ShellProgressMessage } from '../../components/shell/ShellProgressMessage.js';
import { Box, Text } from '../../ink.js';
import { useKeybinding } from '../../keybindings/useKeybinding.js';
import { useShortcutDisplay } from '../../keybindings/useShortcutDisplay.js';
import { useAppStateStore, useSetAppState } from '../../state/AppState.js';
import { backgroundAll } from '../../tasks/LocalShellTask/LocalShellTask.js';
import { env } from '../../utils/env.js';
import { isEnvTruthy } from '../../utils/envUtils.js';
import { getDisplayPath } from '../../utils/file.js';
import { isFullscreenEnvEnabled } from '../../utils/fullscreen.js';
import BashToolResultMessage from './BashToolResultMessage.js';
import { extractBashCommentLabel } from './commentLabel.js';
import { parseSedEditCommand } from './sedEditParser.js';
// Constants for command display
const MAX_COMMAND_DISPLAY_LINES = 2;
const MAX_COMMAND_DISPLAY_CHARS = 160;
// Simple component to show background hint and handle ctrl+b
// When ctrl+b is pressed, backgrounds ALL running foreground commands
export function BackgroundHint(t0) {
    const $ = _c(9);
    let t1;
    if ($[0] !== t0) {
        t1 = t0 === undefined ? {} : t0;
        $[0] = t0;
        $[1] = t1;
    }
    else {
        t1 = $[1];
    }
    const { onBackground } = t1;
    const store = useAppStateStore();
    const setAppState = useSetAppState();
    let t2;
    if ($[2] !== onBackground || $[3] !== setAppState || $[4] !== store) {
        t2 = () => {
            backgroundAll(() => store.getState(), setAppState);
            onBackground?.();
        };
        $[2] = onBackground;
        $[3] = setAppState;
        $[4] = store;
        $[5] = t2;
    }
    else {
        t2 = $[5];
    }
    const handleBackground = t2;
    let t3;
    if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
        t3 = {
            context: "Task"
        };
        $[6] = t3;
    }
    else {
        t3 = $[6];
    }
    useKeybinding("task:background", handleBackground, t3);
    const baseShortcut = useShortcutDisplay("task:background", "Task", "ctrl+b");
    const shortcut = env.terminal === "tmux" && baseShortcut === "ctrl+b" ? "ctrl+b ctrl+b (twice)" : baseShortcut;
    if (isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_BACKGROUND_TASKS)) {
        return null;
    }
    let t4;
    if ($[7] !== shortcut) {
        t4 = _jsx(Box, { paddingLeft: 5, children: _jsx(Text, { dimColor: true, children: _jsx(KeyboardShortcutHint, { shortcut: shortcut, action: "run in background", parens: true }) }) });
        $[7] = shortcut;
        $[8] = t4;
    }
    else {
        t4 = $[8];
    }
    return t4;
}
export function renderToolUseMessage(input, { verbose, theme: _theme }) {
    const { command } = input;
    if (!command) {
        return null;
    }
    // Render sed in-place edits like file edits (show file path only)
    const sedInfo = parseSedEditCommand(command);
    if (sedInfo) {
        return verbose ? sedInfo.filePath : getDisplayPath(sedInfo.filePath);
    }
    if (!verbose) {
        const lines = command.split('\n');
        if (isFullscreenEnvEnabled()) {
            const label = extractBashCommentLabel(command);
            if (label) {
                return label.length > MAX_COMMAND_DISPLAY_CHARS ? label.slice(0, MAX_COMMAND_DISPLAY_CHARS) + '…' : label;
            }
        }
        const needsLineTruncation = lines.length > MAX_COMMAND_DISPLAY_LINES;
        const needsCharTruncation = command.length > MAX_COMMAND_DISPLAY_CHARS;
        if (needsLineTruncation || needsCharTruncation) {
            let truncated = command;
            // First truncate by lines if needed
            if (needsLineTruncation) {
                truncated = lines.slice(0, MAX_COMMAND_DISPLAY_LINES).join('\n');
            }
            // Then truncate by chars if still too long
            if (truncated.length > MAX_COMMAND_DISPLAY_CHARS) {
                truncated = truncated.slice(0, MAX_COMMAND_DISPLAY_CHARS);
            }
            return _jsxs(Text, { children: [truncated.trim(), "\u2026"] });
        }
    }
    return command;
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
    return _jsx(BashToolResultMessage, { content: content, verbose: verbose, timeoutMs: timeoutMs });
}
export function renderToolUseErrorMessage(result, { verbose, progressMessagesForMessage: _progressMessagesForMessage, tools: _tools }) {
    return _jsx(FallbackToolUseErrorMessage, { result: result, verbose: verbose });
}
