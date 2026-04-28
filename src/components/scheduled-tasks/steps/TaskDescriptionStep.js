import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { Box, Text } from '../../../ink.js';
import { useKeybinding } from '../../../hooks/useKeybinding.js';
import TextInput from '../../TextInput.js';
import { WizardDialogLayout } from '../../wizard/index.js';
import { useWizard } from '../../wizard/useWizard.js';
export function TaskDescriptionStep() {
    const { goNext, goBack, updateWizardData, wizardData } = useWizard();
    const [value, setValue] = useState(wizardData.description ?? '');
    const [error, setError] = useState(null);
    useKeybinding('confirm:no', goBack, { context: 'Settings' });
    const handleSubmit = () => {
        const trimmed = value.trim();
        if (!trimmed) {
            setError('Description is required');
            return;
        }
        setError(null);
        updateWizardData({ description: trimmed });
        goNext();
    };
    return (_jsx(WizardDialogLayout, { subtitle: "Description", children: _jsxs(Box, { flexDirection: "column", children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { dimColor: true, children: "Briefly describe what this scheduled task does." }) }), _jsx(TextInput, { value: value, onChange: setValue, onSubmit: handleSubmit, placeholder: "e.g. Review yesterday's commits and flag anything concerning" }), error && (_jsx(Box, { marginTop: 1, children: _jsx(Text, { color: "red", children: error }) }))] }) }));
}
