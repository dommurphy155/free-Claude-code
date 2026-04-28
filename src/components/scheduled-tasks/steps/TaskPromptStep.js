import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { Box, Text } from '../../../ink.js';
import { useKeybinding } from '../../../hooks/useKeybinding.js';
import TextInput from '../../TextInput.js';
import { WizardDialogLayout } from '../../wizard/index.js';
import { useWizard } from '../../wizard/useWizard.js';
export function TaskPromptStep() {
    const { goNext, goBack, updateWizardData, wizardData } = useWizard();
    const [value, setValue] = useState(wizardData.prompt ?? '');
    const [error, setError] = useState(null);
    useKeybinding('confirm:no', goBack, { context: 'Settings' });
    const handleSubmit = () => {
        const trimmed = value.trim();
        if (!trimmed) {
            setError('Prompt is required');
            return;
        }
        setError(null);
        updateWizardData({ prompt: trimmed });
        goNext();
    };
    return (_jsx(WizardDialogLayout, { subtitle: "Prompt", children: _jsxs(Box, { flexDirection: "column", children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { dimColor: true, children: "Enter the prompt that will be sent to Claude when this task runs." }) }), _jsx(TextInput, { value: value, onChange: setValue, onSubmit: handleSubmit, placeholder: "e.g. Look at the commits from the last 24 hours..." }), error && (_jsx(Box, { marginTop: 1, children: _jsx(Text, { color: "red", children: error }) }))] }) }));
}
