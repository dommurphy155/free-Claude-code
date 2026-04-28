import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// biome-ignore-all assist/source/organizeImports: ANT-ONLY import markers must not be reordered
import { Box, Text } from '../ink.js';
import * as React from 'react';
import { getLargeMemoryFiles, MAX_MEMORY_CHARACTER_COUNT } from './claudemd.js';
import figures from 'figures';
import { getCwd } from './cwd.js';
import { relative } from 'path';
import { formatNumber } from './format.js';
import { getAnthropicApiKeyWithSource, getApiKeyFromConfigOrMacOSKeychain, getAuthTokenSource, isClaudeAISubscriber } from './auth.js';
import { getAgentDescriptionsTotalTokens, AGENT_DESCRIPTIONS_THRESHOLD } from './statusNoticeHelpers.js';
import { isSupportedJetBrainsTerminal, toIDEDisplayName, getTerminalIdeType } from './ide.js';
import { isJetBrainsPluginInstalledCachedSync } from './jetbrains.js';
// Individual notice definitions
const largeMemoryFilesNotice = {
    id: 'large-memory-files',
    type: 'warning',
    isActive: ctx => getLargeMemoryFiles(ctx.memoryFiles).length > 0,
    render: ctx => {
        const largeMemoryFiles = getLargeMemoryFiles(ctx.memoryFiles);
        return _jsx(_Fragment, { children: largeMemoryFiles.map(file => {
                const displayPath = file.path.startsWith(getCwd()) ? relative(getCwd(), file.path) : file.path;
                return _jsxs(Box, { flexDirection: "row", children: [_jsx(Text, { color: "warning", children: figures.warning }), _jsxs(Text, { color: "warning", children: ["Large ", _jsx(Text, { bold: true, children: displayPath }), " will impact performance (", formatNumber(file.content.length), " chars >", ' ', formatNumber(MAX_MEMORY_CHARACTER_COUNT), ")", _jsx(Text, { dimColor: true, children: " \u00B7 /memory to edit" })] })] }, file.path);
            }) });
    }
};
const claudeAiSubscriberExternalTokenNotice = {
    id: 'claude-ai-external-token',
    type: 'warning',
    isActive: () => {
        const authTokenInfo = getAuthTokenSource();
        return isClaudeAISubscriber() && (authTokenInfo.source === 'ANTHROPIC_AUTH_TOKEN' || authTokenInfo.source === 'apiKeyHelper');
    },
    render: () => {
        const authTokenInfo = getAuthTokenSource();
        return _jsxs(Box, { flexDirection: "row", marginTop: 1, children: [_jsx(Text, { color: "warning", children: figures.warning }), _jsxs(Text, { color: "warning", children: ["Auth conflict: Using ", authTokenInfo.source, " instead of Claude account subscription token. Either unset ", authTokenInfo.source, ", or run `claude /logout`."] })] });
    }
};
const apiKeyConflictNotice = {
    id: 'api-key-conflict',
    type: 'warning',
    isActive: () => {
        const { source: apiKeySource } = getAnthropicApiKeyWithSource({
            skipRetrievingKeyFromApiKeyHelper: true
        });
        return !!getApiKeyFromConfigOrMacOSKeychain() && (apiKeySource === 'ANTHROPIC_API_KEY' || apiKeySource === 'apiKeyHelper');
    },
    render: () => {
        const { source: apiKeySource } = getAnthropicApiKeyWithSource({
            skipRetrievingKeyFromApiKeyHelper: true
        });
        return _jsxs(Box, { flexDirection: "row", marginTop: 1, children: [_jsx(Text, { color: "warning", children: figures.warning }), _jsxs(Text, { color: "warning", children: ["Auth conflict: Using ", apiKeySource, " instead of Anthropic Console key. Either unset ", apiKeySource, ", or run `claude /logout`."] })] });
    }
};
const bothAuthMethodsNotice = {
    id: 'both-auth-methods',
    type: 'warning',
    isActive: () => {
        const { source: apiKeySource } = getAnthropicApiKeyWithSource({
            skipRetrievingKeyFromApiKeyHelper: true
        });
        const authTokenInfo = getAuthTokenSource();
        return apiKeySource !== 'none' && authTokenInfo.source !== 'none' && !(apiKeySource === 'apiKeyHelper' && authTokenInfo.source === 'apiKeyHelper');
    },
    render: () => {
        const { source: apiKeySource } = getAnthropicApiKeyWithSource({
            skipRetrievingKeyFromApiKeyHelper: true
        });
        const authTokenInfo = getAuthTokenSource();
        return _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsxs(Box, { flexDirection: "row", children: [_jsx(Text, { color: "warning", children: figures.warning }), _jsxs(Text, { color: "warning", children: ["Auth conflict: Both a token (", authTokenInfo.source, ") and an API key (", apiKeySource, ") are set. This may lead to unexpected behavior."] })] }), _jsxs(Box, { flexDirection: "column", marginLeft: 3, children: [_jsxs(Text, { color: "warning", children: ["\u00B7 Trying to use", ' ', authTokenInfo.source === 'claude.ai' ? 'claude.ai' : authTokenInfo.source, "?", ' ', apiKeySource === 'ANTHROPIC_API_KEY' ? 'Unset the ANTHROPIC_API_KEY environment variable, or claude /logout then say "No" to the API key approval before login.' : apiKeySource === 'apiKeyHelper' ? 'Unset the apiKeyHelper setting.' : 'claude /logout'] }), _jsxs(Text, { color: "warning", children: ["\u00B7 Trying to use ", apiKeySource, "?", ' ', authTokenInfo.source === 'claude.ai' ? 'claude /logout to sign out of claude.ai.' : `Unset the ${authTokenInfo.source} environment variable.`] })] })] });
    }
};
const largeAgentDescriptionsNotice = {
    id: 'large-agent-descriptions',
    type: 'warning',
    isActive: context => {
        const totalTokens = getAgentDescriptionsTotalTokens(context.agentDefinitions);
        return totalTokens > AGENT_DESCRIPTIONS_THRESHOLD;
    },
    render: context => {
        const totalTokens = getAgentDescriptionsTotalTokens(context.agentDefinitions);
        return _jsxs(Box, { flexDirection: "row", children: [_jsx(Text, { color: "warning", children: figures.warning }), _jsxs(Text, { color: "warning", children: ["Large cumulative agent descriptions will impact performance (~", formatNumber(totalTokens), " tokens >", ' ', formatNumber(AGENT_DESCRIPTIONS_THRESHOLD), ")", _jsx(Text, { dimColor: true, children: " \u00B7 /agents to manage" })] })] });
    }
};
const jetbrainsPluginNotice = {
    id: 'jetbrains-plugin-install',
    type: 'info',
    isActive: context => {
        // Only show if running in JetBrains built-in terminal
        if (!isSupportedJetBrainsTerminal()) {
            return false;
        }
        // Don't show if auto-install is disabled
        const shouldAutoInstall = context.config.autoInstallIdeExtension ?? true;
        if (!shouldAutoInstall) {
            return false;
        }
        // Check if plugin is already installed (cached to avoid repeated filesystem checks)
        const ideType = getTerminalIdeType();
        return ideType !== null && !isJetBrainsPluginInstalledCachedSync(ideType);
    },
    render: () => {
        const ideType = getTerminalIdeType();
        const ideName = toIDEDisplayName(ideType);
        return _jsxs(Box, { flexDirection: "row", gap: 1, marginLeft: 1, children: [_jsx(Text, { color: "ide", children: figures.arrowUp }), _jsxs(Text, { children: ["Install the ", _jsx(Text, { color: "ide", children: ideName }), " plugin from the JetBrains Marketplace:", ' ', _jsx(Text, { bold: true, children: "https://docs.claude.com/s/claude-code-jetbrains" })] })] });
    }
};
// All notice definitions
export const statusNoticeDefinitions = [largeMemoryFilesNotice, largeAgentDescriptionsNotice, claudeAiSubscriberExternalTokenNotice, apiKeyConflictNotice, bothAuthMethodsNotice, jetbrainsPluginNotice];
// Helper functions for external use
export function getActiveNotices(context) {
    return statusNoticeDefinitions.filter(notice => notice.isActive(context));
}
