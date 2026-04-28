import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useCallback, useEffect, useRef } from 'react';
import { isBridgeEnabled } from '../bridge/bridgeEnabled.js';
import { Box, Text } from '../ink.js';
import { getClaudeAIOAuthTokens } from '../utils/auth.js';
import { getGlobalConfig, saveGlobalConfig } from '../utils/config.js';
import { Select } from './CustomSelect/select.js';
import { PermissionDialog } from './permissions/PermissionDialog.js';
export function RemoteCallout({ onDone }) {
    const onDoneRef = useRef(onDone);
    onDoneRef.current = onDone;
    const handleCancel = useCallback(() => {
        onDoneRef.current('dismiss');
    }, []);
    // Permanently mark as seen on mount so it only shows once
    useEffect(() => {
        saveGlobalConfig(current => {
            if (current.remoteDialogSeen)
                return current;
            return {
                ...current,
                remoteDialogSeen: true
            };
        });
    }, []);
    const handleSelect = useCallback((value) => {
        onDoneRef.current(value);
    }, []);
    const options = [{
            label: 'Enable Remote Control for this session',
            description: 'Opens a secure connection to claude.ai.',
            value: 'enable'
        }, {
            label: 'Never mind',
            description: 'You can always enable it later with /remote-control.',
            value: 'dismiss'
        }];
    return _jsx(PermissionDialog, { title: "Remote Control", children: _jsxs(Box, { flexDirection: "column", paddingX: 2, paddingY: 1, children: [_jsxs(Box, { marginBottom: 1, flexDirection: "column", children: [_jsx(Text, { children: "Remote Control lets you access this CLI session from the web (claude.ai/code) or the Claude app, so you can pick up where you left off on any device." }), _jsx(Text, { children: " " }), _jsx(Text, { children: "You can disconnect remote access anytime by running /remote-control again." })] }), _jsx(Box, { children: _jsx(Select, { options: options, onChange: handleSelect, onCancel: handleCancel }) })] }) });
}
/**
 * Check whether to show the remote callout (first-time dialog).
 */
export function shouldShowRemoteCallout() {
    const config = getGlobalConfig();
    if (config.remoteDialogSeen)
        return false;
    if (!isBridgeEnabled())
        return false;
    const tokens = getClaudeAIOAuthTokens();
    if (!tokens?.accessToken)
        return false;
    return true;
}
