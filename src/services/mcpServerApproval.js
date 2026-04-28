import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { MCPServerApprovalDialog } from '../components/MCPServerApprovalDialog.js';
import { MCPServerMultiselectDialog } from '../components/MCPServerMultiselectDialog.js';
import { KeybindingSetup } from '../keybindings/KeybindingProviderSetup.js';
import { AppStateProvider } from '../state/AppState.js';
import { getMcpConfigsByScope } from './mcp/config.js';
import { getProjectMcpServerStatus } from './mcp/utils.js';
/**
 * Show MCP server approval dialogs for pending project servers.
 * Uses the provided Ink root to render (reusing the existing instance
 * from main.tsx instead of creating a separate one).
 */
export async function handleMcpjsonServerApprovals(root) {
    const { servers: projectServers } = getMcpConfigsByScope('project');
    const pendingServers = Object.keys(projectServers).filter(serverName => getProjectMcpServerStatus(serverName) === 'pending');
    if (pendingServers.length === 0) {
        return;
    }
    await new Promise(resolve => {
        const done = () => void resolve();
        if (pendingServers.length === 1 && pendingServers[0] !== undefined) {
            const serverName = pendingServers[0];
            root.render(_jsx(AppStateProvider, { children: _jsx(KeybindingSetup, { children: _jsx(MCPServerApprovalDialog, { serverName: serverName, onDone: done }) }) }));
        }
        else {
            root.render(_jsx(AppStateProvider, { children: _jsx(KeybindingSetup, { children: _jsx(MCPServerMultiselectDialog, { serverNames: pendingServers, onDone: done }) }) }));
        }
    });
}
