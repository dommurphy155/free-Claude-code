import { jsx as _jsx } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import React, { createContext, useContext } from 'react';
import { useManageMCPConnections } from './useManageMCPConnections.js';
const MCPConnectionContext = createContext(null);
export function useMcpReconnect() {
    const context = useContext(MCPConnectionContext);
    if (!context) {
        throw new Error("useMcpReconnect must be used within MCPConnectionManager");
    }
    return context.reconnectMcpServer;
}
export function useMcpToggleEnabled() {
    const context = useContext(MCPConnectionContext);
    if (!context) {
        throw new Error("useMcpToggleEnabled must be used within MCPConnectionManager");
    }
    return context.toggleMcpServer;
}
// TODO (ollie): We may be able to get rid of this context by putting these function on app state
export function MCPConnectionManager(t0) {
    const $ = _c(6);
    const { children, dynamicMcpConfig, isStrictMcpConfig } = t0;
    const { reconnectMcpServer, toggleMcpServer } = useManageMCPConnections(dynamicMcpConfig, isStrictMcpConfig);
    let t1;
    if ($[0] !== reconnectMcpServer || $[1] !== toggleMcpServer) {
        t1 = {
            reconnectMcpServer,
            toggleMcpServer
        };
        $[0] = reconnectMcpServer;
        $[1] = toggleMcpServer;
        $[2] = t1;
    }
    else {
        t1 = $[2];
    }
    const value = t1;
    let t2;
    if ($[3] !== children || $[4] !== value) {
        t2 = _jsx(MCPConnectionContext.Provider, { value: value, children: children });
        $[3] = children;
        $[4] = value;
        $[5] = t2;
    }
    else {
        t2 = $[5];
    }
    return t2;
}
