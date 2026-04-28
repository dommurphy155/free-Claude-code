import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Box, Text } from '../../../ink.js';
import { Select } from '../../CustomSelect/select.js';
import { WizardDialogLayout } from '../../wizard/index.js';
import { useWizard } from '../../wizard/useWizard.js';
const PERMISSION_OPTIONS = [
    {
        label: 'Ask permissions',
        value: 'ask',
        description: 'Always ask before making changes',
    },
    {
        label: 'Auto accept edits',
        value: 'auto-accept',
        description: 'Automatically accept all file edits',
    },
    {
        label: 'Plan mode',
        value: 'plan',
        description: 'Create a plan before making changes',
    },
    {
        label: 'Bypass permissions',
        value: 'bypass',
        description: 'Accepts all permissions',
    },
];
export function PermissionStep() {
    const { goNext, goBack, updateWizardData, wizardData } = useWizard();
    return (_jsx(WizardDialogLayout, { subtitle: "Permission mode", children: _jsxs(Box, { flexDirection: "column", children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { dimColor: true, children: "Choose the permission mode for this scheduled task." }) }), _jsx(Select, { options: PERMISSION_OPTIONS, defaultValue: wizardData.permissionMode ?? 'ask', onChange: (value) => {
                        updateWizardData({ permissionMode: value });
                        goNext();
                    }, onCancel: goBack })] }) }));
}
