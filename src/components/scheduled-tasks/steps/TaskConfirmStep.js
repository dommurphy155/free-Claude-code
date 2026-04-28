import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Box, Text } from '../../../ink.js';
import { useKeybinding } from '../../../hooks/useKeybinding.js';
import { cronToHuman } from '../../../utils/cron.js';
import { WizardDialogLayout } from '../../wizard/index.js';
import { useWizard } from '../../wizard/useWizard.js';
export function TaskConfirmStep() {
    const { goNext, goBack, wizardData } = useWizard();
    useKeybinding('confirm:no', goBack, { context: 'Settings' });
    const schedule = wizardData.cron
        ? cronToHuman(wizardData.cron)
        : wizardData.frequency === 'manual'
            ? 'Manual (on demand)'
            : 'Not set';
    return (_jsx(WizardDialogLayout, { subtitle: "Review & confirm", children: _jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsxs(Box, { children: [_jsx(Text, { bold: true, children: "Name: " }), _jsx(Text, { children: wizardData.name ?? '—' })] }), _jsxs(Box, { children: [_jsx(Text, { bold: true, children: "Description: " }), _jsx(Text, { children: wizardData.description ?? '—' })] }), _jsxs(Box, { children: [_jsx(Text, { bold: true, children: "Prompt: " }), _jsx(Text, { children: wizardData.prompt
                                ? wizardData.prompt.length > 60
                                    ? wizardData.prompt.slice(0, 57) + '...'
                                    : wizardData.prompt
                                : '—' })] }), _jsxs(Box, { children: [_jsx(Text, { bold: true, children: "Model: " }), _jsx(Text, { children: wizardData.model ?? 'default' })] }), _jsxs(Box, { children: [_jsx(Text, { bold: true, children: "Permissions: " }), _jsx(Text, { children: wizardData.permissionMode ?? 'ask' })] }), _jsxs(Box, { children: [_jsx(Text, { bold: true, children: "Folder: " }), _jsx(Text, { children: wizardData.folder ?? 'current project' })] }), _jsxs(Box, { children: [_jsx(Text, { bold: true, children: "Worktree: " }), _jsx(Text, { children: wizardData.worktree ? 'yes' : 'no' })] }), _jsxs(Box, { children: [_jsx(Text, { bold: true, children: "Schedule: " }), _jsx(Text, { children: schedule })] }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, children: "Press Enter to confirm, Esc to go back." }) })] }) }));
}
