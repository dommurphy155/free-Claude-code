import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import React from 'react';
import { ConfigurableShortcutHint } from '../../../ConfigurableShortcutHint.js';
import { Byline } from '../../../design-system/Byline.js';
import { KeyboardShortcutHint } from '../../../design-system/KeyboardShortcutHint.js';
import { useWizard } from '../../../wizard/index.js';
import { WizardDialogLayout } from '../../../wizard/WizardDialogLayout.js';
import { ModelSelector } from '../../ModelSelector.js';
export function ModelStep() {
    const $ = _c(8);
    const { goNext, goBack, updateWizardData, wizardData } = useWizard();
    let t0;
    if ($[0] !== goNext || $[1] !== updateWizardData) {
        t0 = model => {
            updateWizardData({
                selectedModel: model
            });
            goNext();
        };
        $[0] = goNext;
        $[1] = updateWizardData;
        $[2] = t0;
    }
    else {
        t0 = $[2];
    }
    const handleComplete = t0;
    let t1;
    if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = _jsxs(Byline, { children: [_jsx(KeyboardShortcutHint, { shortcut: "\u2191\u2193", action: "navigate" }), _jsx(KeyboardShortcutHint, { shortcut: "Enter", action: "select" }), _jsx(ConfigurableShortcutHint, { action: "confirm:no", context: "Confirmation", fallback: "Esc", description: "go back" })] });
        $[3] = t1;
    }
    else {
        t1 = $[3];
    }
    let t2;
    if ($[4] !== goBack || $[5] !== handleComplete || $[6] !== wizardData.selectedModel) {
        t2 = _jsx(WizardDialogLayout, { subtitle: "Select model", footerText: t1, children: _jsx(ModelSelector, { initialModel: wizardData.selectedModel, onComplete: handleComplete, onCancel: goBack }) });
        $[4] = goBack;
        $[5] = handleComplete;
        $[6] = wizardData.selectedModel;
        $[7] = t2;
    }
    else {
        t2 = $[7];
    }
    return t2;
}
