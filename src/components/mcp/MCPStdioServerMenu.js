import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import figures from 'figures';
import React, { useState } from 'react';
import { useExitOnCtrlCDWithKeybindings } from '../../hooks/useExitOnCtrlCDWithKeybindings.js';
import { Box, color, Text, useTheme } from '../../ink.js';
import { getMcpConfigByName } from '../../services/mcp/config.js';
import { useMcpReconnect, useMcpToggleEnabled } from '../../services/mcp/MCPConnectionManager.js';
import { describeMcpConfigFilePath, filterMcpPromptsByServer } from '../../services/mcp/utils.js';
import { useAppState } from '../../state/AppState.js';
import { errorMessage } from '../../utils/errors.js';
import { capitalize } from '../../utils/stringUtils.js';
import { ConfigurableShortcutHint } from '../ConfigurableShortcutHint.js';
import { Select } from '../CustomSelect/index.js';
import { Byline } from '../design-system/Byline.js';
import { KeyboardShortcutHint } from '../design-system/KeyboardShortcutHint.js';
import { Spinner } from '../Spinner.js';
import { CapabilitiesSection } from './CapabilitiesSection.js';
import { handleReconnectError, handleReconnectResult } from './utils/reconnectHelpers.js';
export function MCPStdioServerMenu({ server, serverToolsCount, onViewTools, onCancel, onComplete, borderless = false }) {
    const [theme] = useTheme();
    const exitState = useExitOnCtrlCDWithKeybindings();
    const mcp = useAppState(s => s.mcp);
    const reconnectMcpServer = useMcpReconnect();
    const toggleMcpServer = useMcpToggleEnabled();
    const [isReconnecting, setIsReconnecting] = useState(false);
    const handleToggleEnabled = React.useCallback(async () => {
        const wasEnabled = server.client.type !== 'disabled';
        try {
            await toggleMcpServer(server.name);
            // Return to the server list so user can continue managing other servers
            onCancel();
        }
        catch (err) {
            const action = wasEnabled ? 'disable' : 'enable';
            onComplete(`Failed to ${action} MCP server '${server.name}': ${errorMessage(err)}`);
        }
    }, [server.client.type, server.name, toggleMcpServer, onCancel, onComplete]);
    const capitalizedServerName = capitalize(String(server.name));
    // Count MCP prompts for this server (skills are shown in /skills, not here)
    const serverCommandsCount = filterMcpPromptsByServer(mcp.commands, server.name).length;
    const menuOptions = [];
    // Only show "View tools" if server is not disabled and has tools
    if (server.client.type !== 'disabled' && serverToolsCount > 0) {
        menuOptions.push({
            label: 'View tools',
            value: 'tools'
        });
    }
    // Only show reconnect option if the server is not disabled
    if (server.client.type !== 'disabled') {
        menuOptions.push({
            label: 'Reconnect',
            value: 'reconnectMcpServer'
        });
    }
    menuOptions.push({
        label: server.client.type !== 'disabled' ? 'Disable' : 'Enable',
        value: 'toggle-enabled'
    });
    // If there are no other options, add a back option so Select handles escape
    if (menuOptions.length === 0) {
        menuOptions.push({
            label: 'Back',
            value: 'back'
        });
    }
    if (isReconnecting) {
        return _jsxs(Box, { flexDirection: "column", gap: 1, padding: 1, children: [_jsxs(Text, { color: "text", children: ["Reconnecting to ", _jsx(Text, { bold: true, children: server.name })] }), _jsxs(Box, { children: [_jsx(Spinner, {}), _jsx(Text, { children: " Restarting MCP server process" })] }), _jsx(Text, { dimColor: true, children: "This may take a few moments." })] });
    }
    return _jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { flexDirection: "column", paddingX: 1, borderStyle: borderless ? undefined : 'round', children: [_jsx(Box, { marginBottom: 1, children: _jsxs(Text, { bold: true, children: [capitalizedServerName, " MCP Server"] }) }), _jsxs(Box, { flexDirection: "column", gap: 0, children: [_jsxs(Box, { children: [_jsx(Text, { bold: true, children: "Status: " }), server.client.type === 'disabled' ? _jsxs(Text, { children: [color('inactive', theme)(figures.radioOff), " disabled"] }) : server.client.type === 'connected' ? _jsxs(Text, { children: [color('success', theme)(figures.tick), " connected"] }) : server.client.type === 'pending' ? _jsxs(_Fragment, { children: [_jsx(Text, { dimColor: true, children: figures.radioOff }), _jsx(Text, { children: " connecting\u2026" })] }) : _jsxs(Text, { children: [color('error', theme)(figures.cross), " failed"] })] }), _jsxs(Box, { children: [_jsx(Text, { bold: true, children: "Command: " }), _jsx(Text, { dimColor: true, children: server.config.command })] }), server.config.args && server.config.args.length > 0 && _jsxs(Box, { children: [_jsx(Text, { bold: true, children: "Args: " }), _jsx(Text, { dimColor: true, children: server.config.args.join(' ') })] }), _jsxs(Box, { children: [_jsx(Text, { bold: true, children: "Config location: " }), _jsx(Text, { dimColor: true, children: describeMcpConfigFilePath(getMcpConfigByName(server.name)?.scope ?? 'dynamic') })] }), server.client.type === 'connected' && _jsx(CapabilitiesSection, { serverToolsCount: serverToolsCount, serverPromptsCount: serverCommandsCount, serverResourcesCount: mcp.resources[server.name]?.length || 0 }), server.client.type === 'connected' && serverToolsCount > 0 && _jsxs(Box, { children: [_jsx(Text, { bold: true, children: "Tools: " }), _jsxs(Text, { dimColor: true, children: [serverToolsCount, " tools"] })] })] }), menuOptions.length > 0 && _jsx(Box, { marginTop: 1, children: _jsx(Select, { options: menuOptions, onChange: async (value) => {
                                if (value === 'tools') {
                                    onViewTools();
                                }
                                else if (value === 'reconnectMcpServer') {
                                    setIsReconnecting(true);
                                    try {
                                        const result = await reconnectMcpServer(server.name);
                                        const { message } = handleReconnectResult(result, server.name);
                                        onComplete?.(message);
                                    }
                                    catch (err_0) {
                                        onComplete?.(handleReconnectError(err_0, server.name));
                                    }
                                    finally {
                                        setIsReconnecting(false);
                                    }
                                }
                                else if (value === 'toggle-enabled') {
                                    await handleToggleEnabled();
                                }
                                else if (value === 'back') {
                                    onCancel();
                                }
                            }, onCancel: onCancel }) })] }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, italic: true, children: exitState.pending ? _jsxs(_Fragment, { children: ["Press ", exitState.keyName, " again to exit"] }) : _jsxs(Byline, { children: [_jsx(KeyboardShortcutHint, { shortcut: "\u2191\u2193", action: "navigate" }), _jsx(KeyboardShortcutHint, { shortcut: "Enter", action: "select" }), _jsx(ConfigurableShortcutHint, { action: "confirm:no", context: "Confirmation", fallback: "Esc", description: "back" })] }) }) })] });
}
