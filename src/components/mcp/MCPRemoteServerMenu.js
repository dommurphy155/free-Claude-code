import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import figures from 'figures';
import React, { useEffect, useRef, useState } from 'react';
import { logEvent } from 'src/services/analytics/index.js';
import { getOauthConfig } from '../../constants/oauth.js';
import { useExitOnCtrlCDWithKeybindings } from '../../hooks/useExitOnCtrlCDWithKeybindings.js';
import { useTerminalSize } from '../../hooks/useTerminalSize.js';
import { setClipboard } from '../../ink/termio/osc.js';
// eslint-disable-next-line custom-rules/prefer-use-keybindings -- raw j/k/arrow menu navigation
import { Box, color, Link, Text, useInput, useTheme } from '../../ink.js';
import { useKeybinding } from '../../keybindings/useKeybinding.js';
import { AuthenticationCancelledError, performMCPOAuthFlow, revokeServerTokens } from '../../services/mcp/auth.js';
import { clearServerCache } from '../../services/mcp/client.js';
import { useMcpReconnect, useMcpToggleEnabled } from '../../services/mcp/MCPConnectionManager.js';
import { describeMcpConfigFilePath, excludeCommandsByServer, excludeResourcesByServer, excludeToolsByServer, filterMcpPromptsByServer } from '../../services/mcp/utils.js';
import { useAppState, useSetAppState } from '../../state/AppState.js';
import { getOauthAccountInfo } from '../../utils/auth.js';
import { openBrowser } from '../../utils/browser.js';
import { errorMessage } from '../../utils/errors.js';
import { logMCPDebug } from '../../utils/log.js';
import { capitalize } from '../../utils/stringUtils.js';
import { ConfigurableShortcutHint } from '../ConfigurableShortcutHint.js';
import { Select } from '../CustomSelect/index.js';
import { Byline } from '../design-system/Byline.js';
import { KeyboardShortcutHint } from '../design-system/KeyboardShortcutHint.js';
import { Spinner } from '../Spinner.js';
import TextInput from '../TextInput.js';
import { CapabilitiesSection } from './CapabilitiesSection.js';
import { handleReconnectError, handleReconnectResult } from './utils/reconnectHelpers.js';
export function MCPRemoteServerMenu({ server, serverToolsCount, onViewTools, onCancel, onComplete, borderless = false }) {
    const [theme] = useTheme();
    const exitState = useExitOnCtrlCDWithKeybindings();
    const { columns: terminalColumns } = useTerminalSize();
    const [isAuthenticating, setIsAuthenticating] = React.useState(false);
    const [error, setError] = React.useState(null);
    const mcp = useAppState(s => s.mcp);
    const setAppState = useSetAppState();
    const [authorizationUrl, setAuthorizationUrl] = React.useState(null);
    const [isReconnecting, setIsReconnecting] = useState(false);
    const authAbortControllerRef = useRef(null);
    const [isClaudeAIAuthenticating, setIsClaudeAIAuthenticating] = useState(false);
    const [claudeAIAuthUrl, setClaudeAIAuthUrl] = useState(null);
    const [isClaudeAIClearingAuth, setIsClaudeAIClearingAuth] = useState(false);
    const [claudeAIClearAuthUrl, setClaudeAIClearAuthUrl] = useState(null);
    const [claudeAIClearAuthBrowserOpened, setClaudeAIClearAuthBrowserOpened] = useState(false);
    const [urlCopied, setUrlCopied] = useState(false);
    const copyTimeoutRef = useRef(undefined);
    const unmountedRef = useRef(false);
    const [callbackUrlInput, setCallbackUrlInput] = useState('');
    const [callbackUrlCursorOffset, setCallbackUrlCursorOffset] = useState(0);
    const [manualCallbackSubmit, setManualCallbackSubmit] = useState(null);
    // If the component unmounts mid-auth (e.g. a parent component's Esc handler
    // navigates away before ours fires), abort the OAuth flow so the callback
    // server is closed. Without this, the server stays bound and the process
    // can outlive the terminal. Also clear the copy-feedback timer and mark
    // unmounted so the async setClipboard callback doesn't setUrlCopied /
    // schedule a new timer after unmount.
    useEffect(() => () => {
        unmountedRef.current = true;
        authAbortControllerRef.current?.abort();
        if (copyTimeoutRef.current !== undefined) {
            clearTimeout(copyTimeoutRef.current);
        }
    }, []);
    // A server is effectively authenticated if:
    // 1. It has OAuth tokens (server.isAuthenticated), OR
    // 2. It's connected and has tools (meaning it's working via some auth mechanism)
    const isEffectivelyAuthenticated = server.isAuthenticated || server.client.type === 'connected' && serverToolsCount > 0;
    const reconnectMcpServer = useMcpReconnect();
    const handleClaudeAIAuthComplete = React.useCallback(async () => {
        setIsClaudeAIAuthenticating(false);
        setClaudeAIAuthUrl(null);
        setIsReconnecting(true);
        try {
            const result = await reconnectMcpServer(server.name);
            const success = result.client.type === 'connected';
            logEvent('tengu_claudeai_mcp_auth_completed', {
                success
            });
            if (success) {
                onComplete?.(`Authentication successful. Connected to ${server.name}.`);
            }
            else if (result.client.type === 'needs-auth') {
                onComplete?.('Authentication successful, but server still requires authentication. You may need to manually restart Claude Code.');
            }
            else {
                onComplete?.('Authentication successful, but server reconnection failed. You may need to manually restart Claude Code for the changes to take effect.');
            }
        }
        catch (err) {
            logEvent('tengu_claudeai_mcp_auth_completed', {
                success: false
            });
            onComplete?.(handleReconnectError(err, server.name));
        }
        finally {
            setIsReconnecting(false);
        }
    }, [reconnectMcpServer, server.name, onComplete]);
    const handleClaudeAIClearAuthComplete = React.useCallback(async () => {
        await clearServerCache(server.name, {
            ...server.config,
            scope: server.scope
        });
        setAppState(prev => {
            const newClients = prev.mcp.clients.map(c => c.name === server.name ? {
                ...c,
                type: 'needs-auth'
            } : c);
            const newTools = excludeToolsByServer(prev.mcp.tools, server.name);
            const newCommands = excludeCommandsByServer(prev.mcp.commands, server.name);
            const newResources = excludeResourcesByServer(prev.mcp.resources, server.name);
            return {
                ...prev,
                mcp: {
                    ...prev.mcp,
                    clients: newClients,
                    tools: newTools,
                    commands: newCommands,
                    resources: newResources
                }
            };
        });
        logEvent('tengu_claudeai_mcp_clear_auth_completed', {});
        onComplete?.(`Disconnected from ${server.name}.`);
        setIsClaudeAIClearingAuth(false);
        setClaudeAIClearAuthUrl(null);
        setClaudeAIClearAuthBrowserOpened(false);
    }, [server.name, server.config, server.scope, setAppState, onComplete]);
    // Escape to cancel authentication flow
    useKeybinding('confirm:no', () => {
        authAbortControllerRef.current?.abort();
        authAbortControllerRef.current = null;
        setIsAuthenticating(false);
        setAuthorizationUrl(null);
    }, {
        context: 'Confirmation',
        isActive: isAuthenticating
    });
    // Escape to cancel Claude AI authentication
    useKeybinding('confirm:no', () => {
        setIsClaudeAIAuthenticating(false);
        setClaudeAIAuthUrl(null);
    }, {
        context: 'Confirmation',
        isActive: isClaudeAIAuthenticating
    });
    // Escape to cancel Claude AI clear auth
    useKeybinding('confirm:no', () => {
        setIsClaudeAIClearingAuth(false);
        setClaudeAIClearAuthUrl(null);
        setClaudeAIClearAuthBrowserOpened(false);
    }, {
        context: 'Confirmation',
        isActive: isClaudeAIClearingAuth
    });
    // Return key handling for authentication flows and 'c' to copy URL
    useInput((input, key) => {
        if (key.return && isClaudeAIAuthenticating) {
            void handleClaudeAIAuthComplete();
        }
        if (key.return && isClaudeAIClearingAuth) {
            if (claudeAIClearAuthBrowserOpened) {
                void handleClaudeAIClearAuthComplete();
            }
            else {
                // First Enter: open the browser
                const connectorsUrl = `${getOauthConfig().CLAUDE_AI_ORIGIN}/settings/connectors`;
                setClaudeAIClearAuthUrl(connectorsUrl);
                setClaudeAIClearAuthBrowserOpened(true);
                void openBrowser(connectorsUrl);
            }
        }
        if (input === 'c' && !urlCopied) {
            const urlToCopy = authorizationUrl || claudeAIAuthUrl || claudeAIClearAuthUrl;
            if (urlToCopy) {
                void setClipboard(urlToCopy).then(raw => {
                    if (unmountedRef.current)
                        return;
                    if (raw)
                        process.stdout.write(raw);
                    setUrlCopied(true);
                    if (copyTimeoutRef.current !== undefined) {
                        clearTimeout(copyTimeoutRef.current);
                    }
                    copyTimeoutRef.current = setTimeout(setUrlCopied, 2000, false);
                });
            }
        }
    });
    const capitalizedServerName = capitalize(String(server.name));
    // Count MCP prompts for this server (skills are shown in /skills, not here)
    const serverCommandsCount = filterMcpPromptsByServer(mcp.commands, server.name).length;
    const toggleMcpServer = useMcpToggleEnabled();
    const handleClaudeAIAuth = React.useCallback(async () => {
        const claudeAiBaseUrl = getOauthConfig().CLAUDE_AI_ORIGIN;
        const accountInfo = getOauthAccountInfo();
        const orgUuid = accountInfo?.organizationUuid;
        let authUrl;
        if (orgUuid && server.config.type === 'claudeai-proxy' && server.config.id) {
            // Use the direct auth URL with org and server IDs
            // Replace 'mcprs' prefix with 'mcpsrv' if present
            const serverId = server.config.id.startsWith('mcprs') ? 'mcpsrv' + server.config.id.slice(5) : server.config.id;
            const productSurface = encodeURIComponent(process.env.CLAUDE_CODE_ENTRYPOINT || 'cli');
            authUrl = `${claudeAiBaseUrl}/api/organizations/${orgUuid}/mcp/start-auth/${serverId}?product_surface=${productSurface}`;
        }
        else {
            // Fall back to settings/connectors if we don't have the required IDs
            authUrl = `${claudeAiBaseUrl}/settings/connectors`;
        }
        setClaudeAIAuthUrl(authUrl);
        setIsClaudeAIAuthenticating(true);
        logEvent('tengu_claudeai_mcp_auth_started', {});
        await openBrowser(authUrl);
    }, [server.config]);
    const handleClaudeAIClearAuth = React.useCallback(() => {
        setIsClaudeAIClearingAuth(true);
        logEvent('tengu_claudeai_mcp_clear_auth_started', {});
    }, []);
    const handleToggleEnabled = React.useCallback(async () => {
        const wasEnabled = server.client.type !== 'disabled';
        try {
            await toggleMcpServer(server.name);
            if (server.config.type === 'claudeai-proxy') {
                logEvent('tengu_claudeai_mcp_toggle', {
                    new_state: (wasEnabled ? 'disabled' : 'enabled')
                });
            }
            // Return to the server list so user can continue managing other servers
            onCancel();
        }
        catch (err_0) {
            const action = wasEnabled ? 'disable' : 'enable';
            onComplete?.(`Failed to ${action} MCP server '${server.name}': ${errorMessage(err_0)}`);
        }
    }, [server.client.type, server.config.type, server.name, toggleMcpServer, onCancel, onComplete]);
    const handleAuthenticate = React.useCallback(async () => {
        if (server.config.type === 'claudeai-proxy')
            return;
        setIsAuthenticating(true);
        setError(null);
        const controller = new AbortController();
        authAbortControllerRef.current = controller;
        try {
            // Revoke existing tokens if re-authenticating, but preserve step-up
            // auth state so the next OAuth flow can reuse cached scope/discovery.
            if (server.isAuthenticated && server.config) {
                await revokeServerTokens(server.name, server.config, {
                    preserveStepUpState: true
                });
            }
            if (server.config) {
                await performMCPOAuthFlow(server.name, server.config, setAuthorizationUrl, controller.signal, {
                    onWaitingForCallback: submit => {
                        setManualCallbackSubmit(() => submit);
                    }
                });
                logEvent('tengu_mcp_auth_config_authenticate', {
                    wasAuthenticated: server.isAuthenticated
                });
                const result_0 = await reconnectMcpServer(server.name);
                if (result_0.client.type === 'connected') {
                    const message = isEffectivelyAuthenticated ? `Authentication successful. Reconnected to ${server.name}.` : `Authentication successful. Connected to ${server.name}.`;
                    onComplete?.(message);
                }
                else if (result_0.client.type === 'needs-auth') {
                    onComplete?.('Authentication successful, but server still requires authentication. You may need to manually restart Claude Code.');
                }
                else {
                    // result.client.type === 'failed'
                    logMCPDebug(server.name, `Reconnection failed after authentication`);
                    onComplete?.('Authentication successful, but server reconnection failed. You may need to manually restart Claude Code for the changes to take effect.');
                }
            }
        }
        catch (err_1) {
            // Don't show error if it was a cancellation
            if (err_1 instanceof Error && !(err_1 instanceof AuthenticationCancelledError)) {
                setError(err_1.message);
            }
        }
        finally {
            setIsAuthenticating(false);
            authAbortControllerRef.current = null;
            setManualCallbackSubmit(null);
            setCallbackUrlInput('');
        }
    }, [server.isAuthenticated, server.config, server.name, onComplete, reconnectMcpServer, isEffectivelyAuthenticated]);
    const handleClearAuth = async () => {
        if (server.config.type === 'claudeai-proxy')
            return;
        if (server.config) {
            // First revoke the authentication tokens and clear all auth state
            await revokeServerTokens(server.name, server.config);
            logEvent('tengu_mcp_auth_config_clear', {});
            // Disconnect the client and clear the cache
            await clearServerCache(server.name, {
                ...server.config,
                scope: server.scope
            });
            // Update app state to remove the disconnected server's tools, commands, and resources
            setAppState(prev_0 => {
                const newClients_0 = prev_0.mcp.clients.map(c_0 => 
                // 'failed' is a misnomer here, but we don't really differentiate between "not connected" and "failed" at the moment
                c_0.name === server.name ? {
                    ...c_0,
                    type: 'failed'
                } : c_0);
                const newTools_0 = excludeToolsByServer(prev_0.mcp.tools, server.name);
                const newCommands_0 = excludeCommandsByServer(prev_0.mcp.commands, server.name);
                const newResources_0 = excludeResourcesByServer(prev_0.mcp.resources, server.name);
                return {
                    ...prev_0,
                    mcp: {
                        ...prev_0.mcp,
                        clients: newClients_0,
                        tools: newTools_0,
                        commands: newCommands_0,
                        resources: newResources_0
                    }
                };
            });
            onComplete?.(`Authentication cleared for ${server.name}.`);
        }
    };
    if (isAuthenticating) {
        // XAA: silent exchange (cached id_token → no browser), so don't claim
        // one will open. If IdP login IS needed, authorizationUrl populates and
        // the URL fallback block below still renders.
        const authCopy = server.config.type !== 'claudeai-proxy' && server.config.oauth?.xaa ? ' Authenticating via your identity provider' : ' A browser window will open for authentication';
        return _jsxs(Box, { flexDirection: "column", gap: 1, padding: 1, children: [_jsxs(Text, { color: "claude", children: ["Authenticating with ", server.name, "\u2026"] }), _jsxs(Box, { children: [_jsx(Spinner, {}), _jsx(Text, { children: authCopy })] }), authorizationUrl && _jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { children: [_jsxs(Text, { dimColor: true, children: ["If your browser doesn't open automatically, copy this URL manually", ' '] }), urlCopied ? _jsx(Text, { color: "success", children: "(Copied!)" }) : _jsx(Text, { dimColor: true, children: _jsx(KeyboardShortcutHint, { shortcut: "c", action: "copy", parens: true }) })] }), _jsx(Link, { url: authorizationUrl })] }), isAuthenticating && authorizationUrl && manualCallbackSubmit && _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { dimColor: true, children: "If the redirect page shows a connection error, paste the URL from your browser's address bar:" }), _jsxs(Box, { children: [_jsxs(Text, { dimColor: true, children: ["URL ", '>', " "] }), _jsx(TextInput, { value: callbackUrlInput, onChange: setCallbackUrlInput, onSubmit: (value) => {
                                        manualCallbackSubmit(value.trim());
                                        setCallbackUrlInput('');
                                    }, cursorOffset: callbackUrlCursorOffset, onChangeCursorOffset: setCallbackUrlCursorOffset, columns: terminalColumns - 8 })] })] }), _jsx(Box, { marginLeft: 3, children: _jsx(Text, { dimColor: true, children: "Return here after authenticating in your browser. Press Esc to go back." }) })] });
    }
    if (isClaudeAIAuthenticating) {
        return _jsxs(Box, { flexDirection: "column", gap: 1, padding: 1, children: [_jsxs(Text, { color: "claude", children: ["Authenticating with ", server.name, "\u2026"] }), _jsxs(Box, { children: [_jsx(Spinner, {}), _jsx(Text, { children: " A browser window will open for authentication" })] }), claudeAIAuthUrl && _jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { children: [_jsxs(Text, { dimColor: true, children: ["If your browser doesn't open automatically, copy this URL manually", ' '] }), urlCopied ? _jsx(Text, { color: "success", children: "(Copied!)" }) : _jsx(Text, { dimColor: true, children: _jsx(KeyboardShortcutHint, { shortcut: "c", action: "copy", parens: true }) })] }), _jsx(Link, { url: claudeAIAuthUrl })] }), _jsxs(Box, { marginLeft: 3, flexDirection: "column", children: [_jsxs(Text, { color: "permission", children: ["Press ", _jsx(Text, { bold: true, children: "Enter" }), " after authenticating in your browser."] }), _jsx(Text, { dimColor: true, italic: true, children: _jsx(ConfigurableShortcutHint, { action: "confirm:no", context: "Confirmation", fallback: "Esc", description: "back" }) })] })] });
    }
    if (isClaudeAIClearingAuth) {
        return _jsxs(Box, { flexDirection: "column", gap: 1, padding: 1, children: [_jsxs(Text, { color: "claude", children: ["Clear authentication for ", server.name] }), claudeAIClearAuthBrowserOpened ? _jsxs(_Fragment, { children: [_jsx(Text, { children: "Find the MCP server in the browser and click \"Disconnect\"." }), claudeAIClearAuthUrl && _jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { children: [_jsxs(Text, { dimColor: true, children: ["If your browser didn't open automatically, copy this URL manually", ' '] }), urlCopied ? _jsx(Text, { color: "success", children: "(Copied!)" }) : _jsx(Text, { dimColor: true, children: _jsx(KeyboardShortcutHint, { shortcut: "c", action: "copy", parens: true }) })] }), _jsx(Link, { url: claudeAIClearAuthUrl })] }), _jsxs(Box, { marginLeft: 3, flexDirection: "column", children: [_jsxs(Text, { color: "permission", children: ["Press ", _jsx(Text, { bold: true, children: "Enter" }), " when done."] }), _jsx(Text, { dimColor: true, italic: true, children: _jsx(ConfigurableShortcutHint, { action: "confirm:no", context: "Confirmation", fallback: "Esc", description: "back" }) })] })] }) : _jsxs(_Fragment, { children: [_jsx(Text, { children: "This will open claude.ai in the browser. Find the MCP server in the list and click \"Disconnect\"." }), _jsxs(Box, { marginLeft: 3, flexDirection: "column", children: [_jsxs(Text, { color: "permission", children: ["Press ", _jsx(Text, { bold: true, children: "Enter" }), " to open the browser."] }), _jsx(Text, { dimColor: true, italic: true, children: _jsx(ConfigurableShortcutHint, { action: "confirm:no", context: "Confirmation", fallback: "Esc", description: "back" }) })] })] })] });
    }
    if (isReconnecting) {
        return _jsxs(Box, { flexDirection: "column", gap: 1, padding: 1, children: [_jsxs(Text, { color: "text", children: ["Connecting to ", _jsx(Text, { bold: true, children: server.name }), "\u2026"] }), _jsxs(Box, { children: [_jsx(Spinner, {}), _jsx(Text, { children: " Establishing connection to MCP server" })] }), _jsx(Text, { dimColor: true, children: "This may take a few moments." })] });
    }
    const menuOptions = [];
    // If server is disabled, show Enable first as the primary action
    if (server.client.type === 'disabled') {
        menuOptions.push({
            label: 'Enable',
            value: 'toggle-enabled'
        });
    }
    if (server.client.type === 'connected' && serverToolsCount > 0) {
        menuOptions.push({
            label: 'View tools',
            value: 'tools'
        });
    }
    if (server.config.type === 'claudeai-proxy') {
        if (server.client.type === 'connected') {
            menuOptions.push({
                label: 'Clear authentication',
                value: 'claudeai-clear-auth'
            });
        }
        else if (server.client.type !== 'disabled') {
            menuOptions.push({
                label: 'Authenticate',
                value: 'claudeai-auth'
            });
        }
    }
    else {
        if (isEffectivelyAuthenticated) {
            menuOptions.push({
                label: 'Re-authenticate',
                value: 'reauth'
            });
            menuOptions.push({
                label: 'Clear authentication',
                value: 'clear-auth'
            });
        }
        if (!isEffectivelyAuthenticated) {
            menuOptions.push({
                label: 'Authenticate',
                value: 'auth'
            });
        }
    }
    if (server.client.type !== 'disabled') {
        if (server.client.type !== 'needs-auth') {
            menuOptions.push({
                label: 'Reconnect',
                value: 'reconnectMcpServer'
            });
        }
        menuOptions.push({
            label: 'Disable',
            value: 'toggle-enabled'
        });
    }
    // If there are no other options, add a back option so Select handles escape
    if (menuOptions.length === 0) {
        menuOptions.push({
            label: 'Back',
            value: 'back'
        });
    }
    return _jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { flexDirection: "column", paddingX: 1, borderStyle: borderless ? undefined : 'round', children: [_jsx(Box, { marginBottom: 1, children: _jsxs(Text, { bold: true, children: [capitalizedServerName, " MCP Server"] }) }), _jsxs(Box, { flexDirection: "column", gap: 0, children: [_jsxs(Box, { children: [_jsx(Text, { bold: true, children: "Status: " }), server.client.type === 'disabled' ? _jsxs(Text, { children: [color('inactive', theme)(figures.radioOff), " disabled"] }) : server.client.type === 'connected' ? _jsxs(Text, { children: [color('success', theme)(figures.tick), " connected"] }) : server.client.type === 'pending' ? _jsxs(_Fragment, { children: [_jsx(Text, { dimColor: true, children: figures.radioOff }), _jsx(Text, { children: " connecting\u2026" })] }) : server.client.type === 'needs-auth' ? _jsxs(Text, { children: [color('warning', theme)(figures.triangleUpOutline), " needs authentication"] }) : _jsxs(Text, { children: [color('error', theme)(figures.cross), " failed"] })] }), server.transport !== 'claudeai-proxy' && _jsxs(Box, { children: [_jsx(Text, { bold: true, children: "Auth: " }), isEffectivelyAuthenticated ? _jsxs(Text, { children: [color('success', theme)(figures.tick), " authenticated"] }) : _jsxs(Text, { children: [color('error', theme)(figures.cross), " not authenticated"] })] }), _jsxs(Box, { children: [_jsx(Text, { bold: true, children: "URL: " }), _jsx(Text, { dimColor: true, children: server.config.url })] }), _jsxs(Box, { children: [_jsx(Text, { bold: true, children: "Config location: " }), _jsx(Text, { dimColor: true, children: describeMcpConfigFilePath(server.scope) })] }), server.client.type === 'connected' && _jsx(CapabilitiesSection, { serverToolsCount: serverToolsCount, serverPromptsCount: serverCommandsCount, serverResourcesCount: mcp.resources[server.name]?.length || 0 }), server.client.type === 'connected' && serverToolsCount > 0 && _jsxs(Box, { children: [_jsx(Text, { bold: true, children: "Tools: " }), _jsxs(Text, { dimColor: true, children: [serverToolsCount, " tools"] })] })] }), error && _jsx(Box, { marginTop: 1, children: _jsxs(Text, { color: "error", children: ["Error: ", error] }) }), menuOptions.length > 0 && _jsx(Box, { marginTop: 1, children: _jsx(Select, { options: menuOptions, onChange: async (value_0) => {
                                switch (value_0) {
                                    case 'tools':
                                        onViewTools();
                                        break;
                                    case 'auth':
                                    case 'reauth':
                                        await handleAuthenticate();
                                        break;
                                    case 'clear-auth':
                                        await handleClearAuth();
                                        break;
                                    case 'claudeai-auth':
                                        await handleClaudeAIAuth();
                                        break;
                                    case 'claudeai-clear-auth':
                                        handleClaudeAIClearAuth();
                                        break;
                                    case 'reconnectMcpServer':
                                        setIsReconnecting(true);
                                        try {
                                            const result_1 = await reconnectMcpServer(server.name);
                                            if (server.config.type === 'claudeai-proxy') {
                                                logEvent('tengu_claudeai_mcp_reconnect', {
                                                    success: result_1.client.type === 'connected'
                                                });
                                            }
                                            const { message: message_0 } = handleReconnectResult(result_1, server.name);
                                            onComplete?.(message_0);
                                        }
                                        catch (err_2) {
                                            if (server.config.type === 'claudeai-proxy') {
                                                logEvent('tengu_claudeai_mcp_reconnect', {
                                                    success: false
                                                });
                                            }
                                            onComplete?.(handleReconnectError(err_2, server.name));
                                        }
                                        finally {
                                            setIsReconnecting(false);
                                        }
                                        break;
                                    case 'toggle-enabled':
                                        await handleToggleEnabled();
                                        break;
                                    case 'back':
                                        onCancel();
                                        break;
                                }
                            }, onCancel: onCancel }) })] }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, italic: true, children: exitState.pending ? _jsxs(_Fragment, { children: ["Press ", exitState.keyName, " again to exit"] }) : _jsxs(Byline, { children: [_jsx(KeyboardShortcutHint, { shortcut: "\u2191\u2193", action: "navigate" }), _jsx(KeyboardShortcutHint, { shortcut: "Enter", action: "select" }), _jsx(ConfigurableShortcutHint, { action: "confirm:no", context: "Confirmation", fallback: "Esc", description: "back" })] }) }) })] });
}
