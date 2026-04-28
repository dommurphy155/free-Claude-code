import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { Text } from '../ink.js';
import { isClaudeAISubscriber } from '../utils/auth.js';
import { isChromeExtensionInstalled, shouldEnableClaudeInChrome } from '../utils/claudeInChrome/setup.js';
import { isRunningOnHomespace } from '../utils/envUtils.js';
import { useStartupNotification } from './notifs/useStartupNotification.js';
function getChromeFlag() {
    if (process.argv.includes('--chrome')) {
        return true;
    }
    if (process.argv.includes('--no-chrome')) {
        return false;
    }
    return undefined;
}
export function useChromeExtensionNotification() {
    useStartupNotification(_temp);
}
async function _temp() {
    const chromeFlag = getChromeFlag();
    if (!shouldEnableClaudeInChrome(chromeFlag)) {
        return null;
    }
    if (true && !isClaudeAISubscriber()) {
        return {
            key: "chrome-requires-subscription",
            jsx: _jsx(Text, { color: "error", children: "Claude in Chrome requires a claude.ai subscription" }),
            priority: "immediate",
            timeoutMs: 5000
        };
    }
    const installed = await isChromeExtensionInstalled();
    if (!installed && !isRunningOnHomespace()) {
        return {
            key: "chrome-extension-not-detected",
            jsx: _jsx(Text, { color: "warning", children: "Chrome extension not detected \u00B7 https://claude.ai/chrome to install" }),
            priority: "immediate",
            timeoutMs: 3000
        };
    }
    if (chromeFlag === undefined) {
        return {
            key: "claude-in-chrome-default-enabled",
            text: "Claude in Chrome enabled \xB7 /chrome",
            priority: "low"
        };
    }
    return null;
}
