import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import React from 'react';
import { Box } from '../../../../ink.js';
import { useKeybinding } from '../../../../keybindings/useKeybinding.js';
import { ConfigurableShortcutHint } from '../../../ConfigurableShortcutHint.js';
import { Byline } from '../../../design-system/Byline.js';
import { KeyboardShortcutHint } from '../../../design-system/KeyboardShortcutHint.js';
import { useWizard } from '../../../wizard/index.js';
import { WizardDialogLayout } from '../../../wizard/WizardDialogLayout.js';
import { ColorPicker } from '../../ColorPicker.js';
export function ColorStep() {
    const $ = _c(14);
    const { goNext, goBack, updateWizardData, wizardData } = useWizard();
    let t0;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = {
            context: "Confirmation"
        };
        $[0] = t0;
    }
    else {
        t0 = $[0];
    }
    useKeybinding("confirm:no", goBack, t0);
    let t1;
    if ($[1] !== goNext || $[2] !== updateWizardData || $[3] !== wizardData.agentType || $[4] !== wizardData.location || $[5] !== wizardData.selectedModel || $[6] !== wizardData.selectedTools || $[7] !== wizardData.systemPrompt || $[8] !== wizardData.whenToUse) {
        t1 = color => {
            updateWizardData({
                selectedColor: color,
                finalAgent: {
                    agentType: wizardData.agentType,
                    whenToUse: wizardData.whenToUse,
                    getSystemPrompt: () => wizardData.systemPrompt,
                    tools: wizardData.selectedTools,
                    ...(wizardData.selectedModel ? {
                        model: wizardData.selectedModel
                    } : {}),
                    ...(color ? {
                        color: color
                    } : {}),
                    source: wizardData.location
                }
            });
            goNext();
        };
        $[1] = goNext;
        $[2] = updateWizardData;
        $[3] = wizardData.agentType;
        $[4] = wizardData.location;
        $[5] = wizardData.selectedModel;
        $[6] = wizardData.selectedTools;
        $[7] = wizardData.systemPrompt;
        $[8] = wizardData.whenToUse;
        $[9] = t1;
    }
    else {
        t1 = $[9];
    }
    const handleConfirm = t1;
    let t2;
    if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
        t2 = _jsxs(Byline, { children: [_jsx(KeyboardShortcutHint, { shortcut: "\u2191\u2193", action: "navigate" }), _jsx(KeyboardShortcutHint, { shortcut: "Enter", action: "select" }), _jsx(ConfigurableShortcutHint, { action: "confirm:no", context: "Confirmation", fallback: "Esc", description: "go back" })] });
        $[10] = t2;
    }
    else {
        t2 = $[10];
    }
    const t3 = wizardData.agentType || "agent";
    let t4;
    if ($[11] !== handleConfirm || $[12] !== t3) {
        t4 = _jsx(WizardDialogLayout, { subtitle: "Choose background color", footerText: t2, children: _jsx(Box, { children: _jsx(ColorPicker, { agentName: t3, currentColor: "automatic", onConfirm: handleConfirm }) }) });
        $[11] = handleConfirm;
        $[12] = t3;
        $[13] = t4;
    }
    else {
        t4 = $[13];
    }
    return t4;
}
