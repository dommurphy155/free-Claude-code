import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { relative } from 'path';
import React, { useMemo } from 'react';
import { useDiffInIDE } from '../../../hooks/useDiffInIDE.js';
import { Box, Text } from '../../../ink.js';
import { getLanguageName } from '../../../utils/cliHighlight.js';
import { getCwd } from '../../../utils/cwd.js';
import { getFsImplementation, safeResolvePath } from '../../../utils/fsOperations.js';
import { expandPath } from '../../../utils/path.js';
import { Select } from '../../CustomSelect/index.js';
import { ShowInIDEPrompt } from '../../ShowInIDEPrompt.js';
import { usePermissionRequestLogging } from '../hooks.js';
import { PermissionDialog } from '../PermissionDialog.js';
import { useFilePermissionDialog } from './useFilePermissionDialog.js';
export function FilePermissionDialog({ toolUseConfirm, toolUseContext, onDone, onReject, title, subtitle, question = 'Do you want to proceed?', content, completionType = 'tool_use_single', path, parseInput, operationType = 'write', ideDiffSupport, workerBadge, languageName: languageNameOverride }) {
    // Derive from path unless caller provided an explicit override (NotebookEdit
    // passes 'python'/'markdown' from cell_type). getLanguageName is async;
    // downstream UnaryEvent.language_name and logPermissionEvent already accept
    // Promise<string>. useMemo keeps the promise stable across renders.
    const languageName = useMemo(() => languageNameOverride ?? (path ? getLanguageName(path) : 'none'), [languageNameOverride, path]);
    const unaryEvent = useMemo(() => ({
        completion_type: completionType,
        language_name: languageName
    }), [completionType, languageName]);
    usePermissionRequestLogging(toolUseConfirm, unaryEvent);
    const symlinkTarget = useMemo(() => {
        if (!path || operationType === 'read') {
            return null;
        }
        const expandedPath = expandPath(path);
        const fs = getFsImplementation();
        const { resolvedPath, isSymlink } = safeResolvePath(fs, expandedPath);
        if (isSymlink) {
            return resolvedPath;
        }
        return null;
    }, [path, operationType]);
    const fileDialogResult = useFilePermissionDialog({
        filePath: path || '',
        completionType,
        languageName,
        toolUseConfirm,
        onDone,
        onReject,
        parseInput,
        operationType
    });
    // Use file dialog results for options
    const { options, acceptFeedback, rejectFeedback, setFocusedOption, handleInputModeToggle, focusedOption, yesInputMode, noInputMode } = fileDialogResult;
    // Parse input using the provided parser
    const parsedInput = parseInput(toolUseConfirm.input);
    // Set up IDE diff support if enabled. Memoized: getConfig may do disk I/O
    // (FileWrite's getConfig calls readFileSync for the old-content diff).
    // Keyed on the raw input — parseInput is a pure Zod parse whose result
    // depends only on toolUseConfirm.input.
    const ideDiffConfig = useMemo(() => ideDiffSupport ? ideDiffSupport.getConfig(parseInput(toolUseConfirm.input)) : null, [ideDiffSupport, toolUseConfirm.input]);
    // Create diff params based on whether IDE diff is available
    const diffParams = ideDiffConfig ? {
        onChange: (option, input) => {
            const transformedInput = ideDiffSupport.applyChanges(parsedInput, input.edits);
            fileDialogResult.onChange(option, transformedInput);
        },
        toolUseContext,
        filePath: ideDiffConfig.filePath,
        edits: (ideDiffConfig.edits || []).map(e => ({
            old_string: e.old_string,
            new_string: e.new_string,
            replace_all: e.replace_all || false
        })),
        editMode: ideDiffConfig.editMode || 'single'
    } : {
        onChange: () => { },
        toolUseContext,
        filePath: '',
        edits: [],
        editMode: 'single'
    };
    const { closeTabInIDE, showingDiffInIDE, ideName } = useDiffInIDE(diffParams);
    const onChange = (option_0, feedback) => {
        closeTabInIDE?.();
        fileDialogResult.onChange(option_0, parsedInput, feedback?.trim());
    };
    if (showingDiffInIDE && ideDiffConfig && path) {
        return _jsx(ShowInIDEPrompt, { onChange: (option_1, _input, feedback_0) => onChange(option_1, feedback_0), options: options, filePath: path, input: parsedInput, ideName: ideName, symlinkTarget: symlinkTarget, rejectFeedback: rejectFeedback, acceptFeedback: acceptFeedback, setFocusedOption: setFocusedOption, onInputModeToggle: handleInputModeToggle, focusedOption: focusedOption, yesInputMode: yesInputMode, noInputMode: noInputMode });
    }
    const isSymlinkOutsideCwd = symlinkTarget != null && relative(getCwd(), symlinkTarget).startsWith('..');
    const symlinkWarning = symlinkTarget ? _jsx(Box, { paddingX: 1, marginBottom: 1, children: _jsx(Text, { color: "warning", children: isSymlinkOutsideCwd ? `This will modify ${symlinkTarget} (outside working directory) via a symlink` : `Symlink target: ${symlinkTarget}` }) }) : null;
    return _jsxs(_Fragment, { children: [_jsxs(PermissionDialog, { title: title, subtitle: subtitle, innerPaddingX: 0, workerBadge: workerBadge, children: [symlinkWarning, content, _jsxs(Box, { flexDirection: "column", paddingX: 1, children: [typeof question === 'string' ? _jsx(Text, { children: question }) : question, _jsx(Select, { options: options, inlineDescriptions: true, onChange: value => {
                                    const selected = options.find(opt => opt.value === value);
                                    if (selected) {
                                        // For reject option
                                        if (selected.option.type === 'reject') {
                                            const trimmedFeedback = rejectFeedback.trim();
                                            onChange(selected.option, trimmedFeedback || undefined);
                                            return;
                                        }
                                        // For accept-once option, pass accept feedback if present
                                        if (selected.option.type === 'accept-once') {
                                            const trimmedFeedback_0 = acceptFeedback.trim();
                                            onChange(selected.option, trimmedFeedback_0 || undefined);
                                            return;
                                        }
                                        onChange(selected.option);
                                    }
                                }, onCancel: () => onChange({
                                    type: 'reject'
                                }), onFocus: value_0 => setFocusedOption(value_0), onInputModeToggle: handleInputModeToggle })] })] }), _jsx(Box, { paddingX: 1, marginTop: 1, children: _jsxs(Text, { dimColor: true, children: ["Esc to cancel", (focusedOption === 'yes' && !yesInputMode || focusedOption === 'no' && !noInputMode) && ' · Tab to amend'] }) })] });
}
