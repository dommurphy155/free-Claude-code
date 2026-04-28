import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import chalk from 'chalk';
import figures from 'figures';
import React, { useEffect } from 'react';
import { getAdditionalDirectoriesForClaudeMd, setAdditionalDirectoriesForClaudeMd } from '../../bootstrap/state.js';
import { MessageResponse } from '../../components/MessageResponse.js';
import { AddWorkspaceDirectory } from '../../components/permissions/rules/AddWorkspaceDirectory.js';
import { Box, Text } from '../../ink.js';
import { applyPermissionUpdate, persistPermissionUpdate } from '../../utils/permissions/PermissionUpdate.js';
import { SandboxManager } from '../../utils/sandbox/sandbox-adapter.js';
import { addDirHelpMessage, validateDirectoryForWorkspace } from './validation.js';
function AddDirError(t0) {
    const $ = _c(10);
    const { message, args, onDone } = t0;
    let t1;
    let t2;
    if ($[0] !== onDone) {
        t1 = () => {
            const timer = setTimeout(onDone, 0);
            return () => clearTimeout(timer);
        };
        t2 = [onDone];
        $[0] = onDone;
        $[1] = t1;
        $[2] = t2;
    }
    else {
        t1 = $[1];
        t2 = $[2];
    }
    useEffect(t1, t2);
    let t3;
    if ($[3] !== args) {
        t3 = _jsxs(Text, { dimColor: true, children: [figures.pointer, " /add-dir ", args] });
        $[3] = args;
        $[4] = t3;
    }
    else {
        t3 = $[4];
    }
    let t4;
    if ($[5] !== message) {
        t4 = _jsx(MessageResponse, { children: _jsx(Text, { children: message }) });
        $[5] = message;
        $[6] = t4;
    }
    else {
        t4 = $[6];
    }
    let t5;
    if ($[7] !== t3 || $[8] !== t4) {
        t5 = _jsxs(Box, { flexDirection: "column", children: [t3, t4] });
        $[7] = t3;
        $[8] = t4;
        $[9] = t5;
    }
    else {
        t5 = $[9];
    }
    return t5;
}
export async function call(onDone, context, args) {
    const directoryPath = (args ?? '').trim();
    const appState = context.getAppState();
    // Helper to handle adding a directory (shared by both with-path and no-path cases)
    const handleAddDirectory = async (path, remember = false) => {
        const destination = remember ? 'localSettings' : 'session';
        const permissionUpdate = {
            type: 'addDirectories',
            directories: [path],
            destination
        };
        // Apply to session context
        const latestAppState = context.getAppState();
        const updatedContext = applyPermissionUpdate(latestAppState.toolPermissionContext, permissionUpdate);
        context.setAppState(prev => ({
            ...prev,
            toolPermissionContext: updatedContext
        }));
        // Update sandbox config so Bash commands can access the new directory.
        // Bootstrap state is the source of truth for session-only dirs; persisted
        // dirs are picked up via the settings subscription, but we refresh
        // eagerly here to avoid a race when the user acts immediately.
        const currentDirs = getAdditionalDirectoriesForClaudeMd();
        if (!currentDirs.includes(path)) {
            setAdditionalDirectoriesForClaudeMd([...currentDirs, path]);
        }
        SandboxManager.refreshConfig();
        let message;
        if (remember) {
            try {
                persistPermissionUpdate(permissionUpdate);
                message = `Added ${chalk.bold(path)} as a working directory and saved to local settings`;
            }
            catch (error) {
                message = `Added ${chalk.bold(path)} as a working directory. Failed to save to local settings: ${error instanceof Error ? error.message : 'Unknown error'}`;
            }
        }
        else {
            message = `Added ${chalk.bold(path)} as a working directory for this session`;
        }
        const messageWithHint = `${message} ${chalk.dim('· /permissions to manage')}`;
        onDone(messageWithHint);
    };
    // When no path is provided, show AddWorkspaceDirectory input form directly
    // and return to REPL after confirmation
    if (!directoryPath) {
        return _jsx(AddWorkspaceDirectory, { permissionContext: appState.toolPermissionContext, onAddDirectory: handleAddDirectory, onCancel: () => {
                onDone('Did not add a working directory.');
            } });
    }
    const result = await validateDirectoryForWorkspace(directoryPath, appState.toolPermissionContext);
    if (result.resultType !== 'success') {
        const message = addDirHelpMessage(result);
        return _jsx(AddDirError, { message: message, args: args ?? '', onDone: () => onDone(message) });
    }
    return _jsx(AddWorkspaceDirectory, { directoryPath: result.absolutePath, permissionContext: appState.toolPermissionContext, onAddDirectory: handleAddDirectory, onCancel: () => {
            onDone(`Did not add ${chalk.bold(result.absolutePath)} as a working directory.`);
        } });
}
