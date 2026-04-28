import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import figures from 'figures';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, color, Link, Text, useTheme } from '../../ink.js';
import { useKeybinding } from '../../keybindings/useKeybinding.js';
import { AuthenticationCancelledError, performMCPOAuthFlow } from '../../services/mcp/auth.js';
import { capitalize } from '../../utils/stringUtils.js';
import { ConfigurableShortcutHint } from '../ConfigurableShortcutHint.js';
import { Select } from '../CustomSelect/index.js';
import { Byline } from '../design-system/Byline.js';
import { Dialog } from '../design-system/Dialog.js';
import { KeyboardShortcutHint } from '../design-system/KeyboardShortcutHint.js';
import { Spinner } from '../Spinner.js';
/**
 * Menu for agent-specific MCP servers.
 * These servers are defined in agent frontmatter and only connect when the agent runs.
 * For HTTP/SSE servers, this allows pre-authentication before using the agent.
 */
export function MCPAgentServerMenu({ agentServer, onCancel, onComplete }) {
    const [theme] = useTheme();
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [error, setError] = useState(null);
    const [authorizationUrl, setAuthorizationUrl] = useState(null);
    const authAbortControllerRef = useRef(null);
    // Abort OAuth flow on unmount so the callback server is closed even if a
    // parent component's Esc handler navigates away before ours fires.
    useEffect(() => () => authAbortControllerRef.current?.abort(), []);
    // Handle ESC to cancel authentication flow
    const handleEscCancel = useCallback(() => {
        if (isAuthenticating) {
            authAbortControllerRef.current?.abort();
            authAbortControllerRef.current = null;
            setIsAuthenticating(false);
            setAuthorizationUrl(null);
        }
    }, [isAuthenticating]);
    useKeybinding('confirm:no', handleEscCancel, {
        context: 'Confirmation',
        isActive: isAuthenticating
    });
    const handleAuthenticate = useCallback(async () => {
        if (!agentServer.needsAuth || !agentServer.url) {
            return;
        }
        setIsAuthenticating(true);
        setError(null);
        const controller = new AbortController();
        authAbortControllerRef.current = controller;
        try {
            // Create a temporary config for OAuth
            const tempConfig = {
                type: agentServer.transport,
                url: agentServer.url
            };
            await performMCPOAuthFlow(agentServer.name, tempConfig, setAuthorizationUrl, controller.signal);
            onComplete?.(`Authentication successful for ${agentServer.name}. The server will connect when the agent runs.`);
        }
        catch (err) {
            // Don't show error if it was a cancellation
            if (err instanceof Error && !(err instanceof AuthenticationCancelledError)) {
                setError(err.message);
            }
        }
        finally {
            setIsAuthenticating(false);
            authAbortControllerRef.current = null;
        }
    }, [agentServer, onComplete]);
    const capitalizedServerName = capitalize(String(agentServer.name));
    if (isAuthenticating) {
        return _jsxs(Box, { flexDirection: "column", gap: 1, padding: 1, children: [_jsxs(Text, { color: "claude", children: ["Authenticating with ", agentServer.name, "\u2026"] }), _jsxs(Box, { children: [_jsx(Spinner, {}), _jsx(Text, { children: " A browser window will open for authentication" })] }), authorizationUrl && _jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { dimColor: true, children: "If your browser doesn't open automatically, copy this URL manually:" }), _jsx(Link, { url: authorizationUrl })] }), _jsx(Box, { marginLeft: 3, children: _jsxs(Text, { dimColor: true, children: ["Return here after authenticating in your browser.", ' ', _jsx(ConfigurableShortcutHint, { action: "confirm:no", context: "Confirmation", fallback: "Esc", description: "go back" })] }) })] });
    }
    const menuOptions = [];
    // Only show authenticate option for HTTP/SSE servers
    if (agentServer.needsAuth) {
        menuOptions.push({
            label: agentServer.isAuthenticated ? 'Re-authenticate' : 'Authenticate',
            value: 'auth'
        });
    }
    menuOptions.push({
        label: 'Back',
        value: 'back'
    });
    return _jsxs(Dialog, { title: `${capitalizedServerName} MCP Server`, subtitle: "agent-only", onCancel: onCancel, inputGuide: exitState => exitState.pending ? _jsxs(Text, { children: ["Press ", exitState.keyName, " again to exit"] }) : _jsxs(Byline, { children: [_jsx(KeyboardShortcutHint, { shortcut: "\u2191\u2193", action: "navigate" }), _jsx(KeyboardShortcutHint, { shortcut: "Enter", action: "confirm" }), _jsx(ConfigurableShortcutHint, { action: "confirm:no", context: "Confirmation", fallback: "Esc", description: "go back" })] }), children: [_jsxs(Box, { flexDirection: "column", gap: 0, children: [_jsxs(Box, { children: [_jsx(Text, { bold: true, children: "Type: " }), _jsx(Text, { dimColor: true, children: agentServer.transport })] }), agentServer.url && _jsxs(Box, { children: [_jsx(Text, { bold: true, children: "URL: " }), _jsx(Text, { dimColor: true, children: agentServer.url })] }), agentServer.command && _jsxs(Box, { children: [_jsx(Text, { bold: true, children: "Command: " }), _jsx(Text, { dimColor: true, children: agentServer.command })] }), _jsxs(Box, { children: [_jsx(Text, { bold: true, children: "Used by: " }), _jsx(Text, { dimColor: true, children: agentServer.sourceAgents.join(', ') })] }), _jsxs(Box, { marginTop: 1, children: [_jsx(Text, { bold: true, children: "Status: " }), _jsxs(Text, { children: [color('inactive', theme)(figures.radioOff), " not connected (agent-only)"] })] }), agentServer.needsAuth && _jsxs(Box, { children: [_jsx(Text, { bold: true, children: "Auth: " }), agentServer.isAuthenticated ? _jsxs(Text, { children: [color('success', theme)(figures.tick), " authenticated"] }) : _jsxs(Text, { children: [color('warning', theme)(figures.triangleUpOutline), " may need authentication"] })] })] }), _jsx(Box, { children: _jsx(Text, { dimColor: true, children: "This server connects only when running the agent." }) }), error && _jsx(Box, { children: _jsxs(Text, { color: "error", children: ["Error: ", error] }) }), _jsx(Box, { children: _jsx(Select, { options: menuOptions, onChange: async (value) => {
                        switch (value) {
                            case 'auth':
                                await handleAuthenticate();
                                break;
                            case 'back':
                                onCancel();
                                break;
                        }
                    }, onCancel: onCancel }) })] });
}
