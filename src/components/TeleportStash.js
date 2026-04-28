import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import figures from 'figures';
import React, { useEffect, useState } from 'react';
import { Box, Text } from '../ink.js';
import { logForDebugging } from '../utils/debug.js';
import { getFileStatus, stashToCleanState } from '../utils/git.js';
import { Select } from './CustomSelect/index.js';
import { Dialog } from './design-system/Dialog.js';
import { Spinner } from './Spinner.js';
export function TeleportStash({ onStashAndContinue, onCancel }) {
    const [gitFileStatus, setGitFileStatus] = useState(null);
    const changedFiles = gitFileStatus !== null ? [...gitFileStatus.tracked, ...gitFileStatus.untracked] : [];
    const [loading, setLoading] = useState(true);
    const [stashing, setStashing] = useState(false);
    const [error, setError] = useState(null);
    // Load changed files on mount
    useEffect(() => {
        const loadChangedFiles = async () => {
            try {
                const fileStatus = await getFileStatus();
                setGitFileStatus(fileStatus);
            }
            catch (err) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                logForDebugging(`Error getting changed files: ${errorMessage}`, {
                    level: 'error'
                });
                setError('Failed to get changed files');
            }
            finally {
                setLoading(false);
            }
        };
        void loadChangedFiles();
    }, []);
    const handleStash = async () => {
        setStashing(true);
        try {
            logForDebugging('Stashing changes before teleport...');
            const success = await stashToCleanState('Teleport auto-stash');
            if (success) {
                logForDebugging('Successfully stashed changes');
                onStashAndContinue();
            }
            else {
                setError('Failed to stash changes');
            }
        }
        catch (err_0) {
            const errorMessage_0 = err_0 instanceof Error ? err_0.message : String(err_0);
            logForDebugging(`Error stashing changes: ${errorMessage_0}`, {
                level: 'error'
            });
            setError('Failed to stash changes');
        }
        finally {
            setStashing(false);
        }
    };
    const handleSelectChange = (value) => {
        if (value === 'stash') {
            void handleStash();
        }
        else {
            onCancel();
        }
    };
    if (loading) {
        return _jsx(Box, { flexDirection: "column", padding: 1, children: _jsxs(Box, { marginBottom: 1, children: [_jsx(Spinner, {}), _jsxs(Text, { children: [" Checking git status", figures.ellipsis] })] }) });
    }
    if (error) {
        return _jsxs(Box, { flexDirection: "column", padding: 1, children: [_jsxs(Text, { bold: true, color: "error", children: ["Error: ", error] }), _jsxs(Box, { marginTop: 1, children: [_jsx(Text, { dimColor: true, children: "Press " }), _jsx(Text, { bold: true, children: "Escape" }), _jsx(Text, { dimColor: true, children: " to cancel" })] })] });
    }
    const showFileCount = changedFiles.length > 8;
    return _jsxs(Dialog, { title: "Working Directory Has Changes", onCancel: onCancel, children: [_jsx(Text, { children: "Teleport will switch git branches. The following changes were found:" }), _jsx(Box, { flexDirection: "column", paddingLeft: 2, children: changedFiles.length > 0 ? showFileCount ? _jsxs(Text, { children: [changedFiles.length, " files changed"] }) : changedFiles.map((file, index) => _jsx(Text, { children: file }, index)) : _jsx(Text, { dimColor: true, children: "No changes detected" }) }), _jsx(Text, { children: "Would you like to stash these changes and continue with teleport?" }), stashing ? _jsxs(Box, { children: [_jsx(Spinner, {}), _jsx(Text, { children: " Stashing changes..." })] }) : _jsx(Select, { options: [{
                        label: 'Stash changes and continue',
                        value: 'stash'
                    }, {
                        label: 'Exit',
                        value: 'exit'
                    }], onChange: handleSelectChange })] });
}
