import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import React from 'react';
import { ConfigurableShortcutHint } from '../../../ConfigurableShortcutHint.js';
import { Byline } from '../../../design-system/Byline.js';
import { KeyboardShortcutHint } from '../../../design-system/KeyboardShortcutHint.js';
import { useWizard } from '../../../wizard/index.js';
import { WizardDialogLayout } from '../../../wizard/WizardDialogLayout.js';
import { ToolSelector } from '../../ToolSelector.js';
export function ToolsStep(t0) {
    const $ = _c(9);
    const { tools } = t0;
    const { goNext, goBack, updateWizardData, wizardData } = useWizard();
    let t1;
    if ($[0] !== goNext || $[1] !== updateWizardData) {
        t1 = selectedTools => {
            updateWizardData({
                selectedTools
            });
            goNext();
        };
        $[0] = goNext;
        $[1] = updateWizardData;
        $[2] = t1;
    }
    else {
        t1 = $[2];
    }
    const handleComplete = t1;
    const initialTools = wizardData.selectedTools;
    let t2;
    if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
        t2 = _jsxs(Byline, { children: [_jsx(KeyboardShortcutHint, { shortcut: "Enter", action: "toggle selection" }), _jsx(KeyboardShortcutHint, { shortcut: "\u2191\u2193", action: "navigate" }), _jsx(ConfigurableShortcutHint, { action: "confirm:no", context: "Confirmation", fallback: "Esc", description: "go back" })] });
        $[3] = t2;
    }
    else {
        t2 = $[3];
    }
    let t3;
    if ($[4] !== goBack || $[5] !== handleComplete || $[6] !== initialTools || $[7] !== tools) {
        t3 = _jsx(WizardDialogLayout, { subtitle: "Select tools", footerText: t2, children: _jsx(ToolSelector, { tools: tools, initialTools: initialTools, onComplete: handleComplete, onCancel: goBack }) });
        $[4] = goBack;
        $[5] = handleComplete;
        $[6] = initialTools;
        $[7] = tools;
        $[8] = t3;
    }
    else {
        t3 = $[8];
    }
    return t3;
}
