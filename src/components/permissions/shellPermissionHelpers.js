import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { basename, sep } from 'path';
import React from 'react';
import { getOriginalCwd } from '../../bootstrap/state.js';
import { Text } from '../../ink.js';
import { permissionRuleExtractPrefix } from '../../utils/permissions/shellRuleMatching.js';
function commandListDisplay(commands) {
    switch (commands.length) {
        case 0:
            return '';
        case 1:
            return _jsx(Text, { bold: true, children: commands[0] });
        case 2:
            return _jsxs(Text, { children: [_jsx(Text, { bold: true, children: commands[0] }), " and ", _jsx(Text, { bold: true, children: commands[1] })] });
        default:
            return _jsxs(Text, { children: [_jsx(Text, { bold: true, children: commands.slice(0, -1).join(', ') }), ", and", ' ', _jsx(Text, { bold: true, children: commands.slice(-1)[0] })] });
    }
}
function commandListDisplayTruncated(commands) {
    // Check if the plain text representation would be too long
    const plainText = commands.join(', ');
    if (plainText.length > 50) {
        return 'similar';
    }
    return commandListDisplay(commands);
}
function formatPathList(paths) {
    if (paths.length === 0)
        return '';
    // Extract directory names from paths
    const names = paths.map(p => basename(p) || p);
    if (names.length === 1) {
        return _jsxs(Text, { children: [_jsx(Text, { bold: true, children: names[0] }), sep] });
    }
    if (names.length === 2) {
        return _jsxs(Text, { children: [_jsx(Text, { bold: true, children: names[0] }), sep, " and ", _jsx(Text, { bold: true, children: names[1] }), sep] });
    }
    // For 3+, show first two with "and N more"
    return _jsxs(Text, { children: [_jsx(Text, { bold: true, children: names[0] }), sep, ", ", _jsx(Text, { bold: true, children: names[1] }), sep, " and ", paths.length - 2, " more"] });
}
/**
 * Generate the label for the "Yes, and apply suggestions" option in shell
 * permission dialogs (Bash, PowerShell). Parametrized by the shell tool name
 * and an optional command transform (e.g., Bash strips output redirections so
 * filenames don't show as commands).
 */
export function generateShellSuggestionsLabel(suggestions, shellToolName, commandTransform) {
    // Collect all rules for display
    const allRules = suggestions.filter(s => s.type === 'addRules').flatMap(s => s.rules || []);
    // Separate Read rules from shell rules
    const readRules = allRules.filter(r => r.toolName === 'Read');
    const shellRules = allRules.filter(r => r.toolName === shellToolName);
    // Get directory info
    const directories = suggestions.filter(s => s.type === 'addDirectories').flatMap(s => s.directories || []);
    // Extract paths from Read rules (keep separate from directories)
    const readPaths = readRules.map(r => r.ruleContent?.replace('/**', '') || '').filter(p => p);
    // Extract shell command prefixes, optionally transforming for display
    const shellCommands = [...new Set(shellRules.flatMap(rule => {
            if (!rule.ruleContent)
                return [];
            const command = permissionRuleExtractPrefix(rule.ruleContent) ?? rule.ruleContent;
            return commandTransform ? commandTransform(command) : command;
        }))];
    // Check what we have
    const hasDirectories = directories.length > 0;
    const hasReadPaths = readPaths.length > 0;
    const hasCommands = shellCommands.length > 0;
    // Handle single type cases
    if (hasReadPaths && !hasDirectories && !hasCommands) {
        // Only Read rules - use "reading from" language
        if (readPaths.length === 1) {
            const firstPath = readPaths[0];
            const dirName = basename(firstPath) || firstPath;
            return _jsxs(Text, { children: ["Yes, allow reading from ", _jsx(Text, { bold: true, children: dirName }), sep, " from this project"] });
        }
        // Multiple read paths
        return _jsxs(Text, { children: ["Yes, allow reading from ", formatPathList(readPaths), " from this project"] });
    }
    if (hasDirectories && !hasReadPaths && !hasCommands) {
        // Only directory permissions - use "access to" language
        if (directories.length === 1) {
            const firstDir = directories[0];
            const dirName = basename(firstDir) || firstDir;
            return _jsxs(Text, { children: ["Yes, and always allow access to ", _jsx(Text, { bold: true, children: dirName }), sep, " from this project"] });
        }
        // Multiple directories
        return _jsxs(Text, { children: ["Yes, and always allow access to ", formatPathList(directories), " from this project"] });
    }
    if (hasCommands && !hasDirectories && !hasReadPaths) {
        // Only shell command permissions
        return _jsxs(Text, { children: ["Yes, and don't ask again for ", commandListDisplayTruncated(shellCommands), " commands in", ' ', _jsx(Text, { bold: true, children: getOriginalCwd() })] });
    }
    // Handle mixed cases
    if ((hasDirectories || hasReadPaths) && !hasCommands) {
        // Combine directories and read paths since they're both path access
        const allPaths = [...directories, ...readPaths];
        if (hasDirectories && hasReadPaths) {
            // Mixed - use generic "access to"
            return _jsxs(Text, { children: ["Yes, and always allow access to ", formatPathList(allPaths), " from this project"] });
        }
    }
    if ((hasDirectories || hasReadPaths) && hasCommands) {
        // Build descriptive message for both types
        const allPaths = [...directories, ...readPaths];
        // Keep it concise but informative
        if (allPaths.length === 1 && shellCommands.length === 1) {
            return _jsxs(Text, { children: ["Yes, and allow access to ", formatPathList(allPaths), " and", ' ', commandListDisplayTruncated(shellCommands), " commands"] });
        }
        return _jsxs(Text, { children: ["Yes, and allow ", formatPathList(allPaths), " access and", ' ', commandListDisplayTruncated(shellCommands), " commands"] });
    }
    return null;
}
