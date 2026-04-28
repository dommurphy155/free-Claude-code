import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useMemo, useState } from 'react';
import { Box, Text } from '../../../ink.js';
import { getProjectRoot } from '../../../bootstrap/state.js';
import { useKeybinding } from '../../../hooks/useKeybinding.js';
import TextInput from '../../TextInput.js';
import { Select } from '../../CustomSelect/select.js';
import { WizardDialogLayout } from '../../wizard/index.js';
import { useWizard } from '../../wizard/useWizard.js';
/** Reject paths that escape the filesystem root or contain dangerous patterns. */
function isSafePath(path) {
    const normalized = path.trim();
    // Reject empty paths, absolute paths outside root, or traversal attempts.
    if (!normalized)
        return false;
    if (normalized.startsWith('/'))
        return true; // absolute paths are allowed
    if (normalized.startsWith('~'))
        return true; // home directory is allowed
    // Disallow traversal patterns.
    if (normalized.includes('..'))
        return false;
    return true;
}
export function FolderStep() {
    const { goNext, goBack, updateWizardData, wizardData } = useWizard();
    const [customPath, setCustomPath] = useState(false);
    const [pathValue, setPathValue] = useState(wizardData.folder ?? '');
    const [pathError, setPathError] = useState(null);
    const currentProject = getProjectRoot();
    useKeybinding('confirm:no', () => {
        if (customPath) {
            setCustomPath(false);
        }
        else {
            goBack();
        }
    }, { context: 'Settings' });
    const folderOptions = useMemo(() => {
        const options = [];
        // Current project is always first
        options.push({
            label: currentProject.split('/').pop() ?? currentProject,
            value: currentProject,
            description: currentProject,
        });
        return options;
    }, [currentProject]);
    // Custom path input mode — uses TextInput instead of Select input type
    if (customPath) {
        return (_jsx(WizardDialogLayout, { subtitle: "Working directory", children: _jsxs(Box, { flexDirection: "column", children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { dimColor: true, children: "Enter the full path to the working directory:" }) }), _jsx(TextInput, { value: pathValue, onChange: (v) => {
                            setPathValue(v);
                            setPathError(null);
                        }, onSubmit: () => {
                            const trimmed = pathValue.trim();
                            if (!trimmed) {
                                setPathError('Path cannot be empty');
                                return;
                            }
                            if (!isSafePath(trimmed)) {
                                setPathError('Invalid path');
                                return;
                            }
                            setPathError(null);
                            updateWizardData({ folder: trimmed });
                            goNext();
                        }, placeholder: "/path/to/project" }), pathError && (_jsx(Box, { marginTop: 1, children: _jsx(Text, { color: "red", children: pathError }) }))] }) }));
    }
    return (_jsx(WizardDialogLayout, { subtitle: "Working directory", children: _jsxs(Box, { flexDirection: "column", children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { dimColor: true, children: "Select the folder where this task will run." }) }), _jsx(Select, { options: [
                        ...folderOptions,
                        {
                            label: '+ Choose a different folder',
                            value: '__custom__',
                            description: 'Enter a custom path',
                        },
                    ], defaultValue: wizardData.folder ?? currentProject, onChange: (value) => {
                        if (value === '__custom__') {
                            setCustomPath(true);
                            return;
                        }
                        updateWizardData({ folder: value });
                        goNext();
                    }, onCancel: goBack })] }) }));
}
