import { jsxs as _jsxs } from "react/jsx-runtime";
import { homedir } from 'os';
import { basename, join, sep } from 'path';
import React from 'react';
import { getOriginalCwd } from '../../../bootstrap/state.js';
import { Text } from '../../../ink.js';
import { getShortcutDisplay } from '../../../keybindings/shortcutFormat.js';
import { expandPath, getDirectoryForPath } from '../../../utils/path.js';
import { normalizeCaseForComparison, pathInAllowedWorkingPath } from '../../../utils/permissions/filesystem.js';
/**
 * Check if a path is within the project's .claude/ folder.
 * This is used to determine whether to show the special ".claude folder" permission option.
 */
export function isInClaudeFolder(filePath) {
    const absolutePath = expandPath(filePath);
    const claudeFolderPath = expandPath(`${getOriginalCwd()}/.claude`);
    // Check if the path is within the project's .claude folder
    const normalizedAbsolutePath = normalizeCaseForComparison(absolutePath);
    const normalizedClaudeFolderPath = normalizeCaseForComparison(claudeFolderPath);
    // Path must start with the .claude folder path (and be inside it, not just the folder itself)
    return normalizedAbsolutePath.startsWith(normalizedClaudeFolderPath + sep.toLowerCase()) ||
        // Also match case where sep is / on posix systems
        normalizedAbsolutePath.startsWith(normalizedClaudeFolderPath + '/');
}
/**
 * Check if a path is within the global ~/.claude/ folder.
 * This is used to determine whether to show the special ".claude folder" permission option
 * for files in the user's home directory.
 */
export function isInGlobalClaudeFolder(filePath) {
    const absolutePath = expandPath(filePath);
    const globalClaudeFolderPath = join(homedir(), '.claude');
    const normalizedAbsolutePath = normalizeCaseForComparison(absolutePath);
    const normalizedGlobalClaudeFolderPath = normalizeCaseForComparison(globalClaudeFolderPath);
    return normalizedAbsolutePath.startsWith(normalizedGlobalClaudeFolderPath + sep.toLowerCase()) || normalizedAbsolutePath.startsWith(normalizedGlobalClaudeFolderPath + '/');
}
export function getFilePermissionOptions({ filePath, toolPermissionContext, operationType = 'write', onRejectFeedbackChange, onAcceptFeedbackChange, yesInputMode = false, noInputMode = false }) {
    const options = [];
    const modeCycleShortcut = getShortcutDisplay('chat:cycleMode', 'Chat', 'shift+tab');
    // When in input mode, show input field
    if (yesInputMode && onAcceptFeedbackChange) {
        options.push({
            type: 'input',
            label: 'Yes',
            value: 'yes',
            placeholder: 'and tell Claude what to do next',
            onChange: onAcceptFeedbackChange,
            allowEmptySubmitToCancel: true,
            option: {
                type: 'accept-once'
            }
        });
    }
    else {
        options.push({
            label: 'Yes',
            value: 'yes',
            option: {
                type: 'accept-once'
            }
        });
    }
    const inAllowedPath = pathInAllowedWorkingPath(filePath, toolPermissionContext);
    // Check if this is a .claude/ folder path (project or global)
    const inClaudeFolder = isInClaudeFolder(filePath);
    const inGlobalClaudeFolder = isInGlobalClaudeFolder(filePath);
    // Option 2: For .claude/ folder, show special option instead of generic session option
    // Note: Session-level options are always shown since they only affect in-memory state,
    // not persisted settings. The allowManagedPermissionRulesOnly setting only restricts
    // persisted permission rules.
    if ((inClaudeFolder || inGlobalClaudeFolder) && operationType !== 'read') {
        options.push({
            label: 'Yes, and allow Claude to edit its own settings for this session',
            value: 'yes-claude-folder',
            option: {
                type: 'accept-session',
                scope: inGlobalClaudeFolder ? 'global-claude-folder' : 'claude-folder'
            }
        });
    }
    else {
        // Option 2: Allow all changes/reads during session
        let sessionLabel;
        if (inAllowedPath) {
            // Inside working directory
            if (operationType === 'read') {
                sessionLabel = 'Yes, during this session';
            }
            else {
                sessionLabel = _jsxs(Text, { children: ["Yes, allow all edits during this session", ' ', _jsxs(Text, { bold: true, children: ["(", modeCycleShortcut, ")"] })] });
            }
        }
        else {
            // Outside working directory - include directory name
            const dirPath = getDirectoryForPath(filePath);
            const dirName = basename(dirPath) || 'this directory';
            if (operationType === 'read') {
                sessionLabel = _jsxs(Text, { children: ["Yes, allow reading from ", _jsxs(Text, { bold: true, children: [dirName, "/"] }), " during this session"] });
            }
            else {
                sessionLabel = _jsxs(Text, { children: ["Yes, allow all edits in ", _jsxs(Text, { bold: true, children: [dirName, "/"] }), " during this session ", _jsxs(Text, { bold: true, children: ["(", modeCycleShortcut, ")"] })] });
            }
        }
        options.push({
            label: sessionLabel,
            value: 'yes-session',
            option: {
                type: 'accept-session'
            }
        });
    }
    // When in input mode, show input field for reject
    if (noInputMode && onRejectFeedbackChange) {
        options.push({
            type: 'input',
            label: 'No',
            value: 'no',
            placeholder: 'and tell Claude what to do differently',
            onChange: onRejectFeedbackChange,
            allowEmptySubmitToCancel: true,
            option: {
                type: 'reject'
            }
        });
    }
    else {
        // Not in input mode - simple option
        options.push({
            label: 'No',
            value: 'no',
            option: {
                type: 'reject'
            }
        });
    }
    return options;
}
