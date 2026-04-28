import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import React from 'react';
import { Box } from '../../../../ink.js';
import { ConfigurableShortcutHint } from '../../../ConfigurableShortcutHint.js';
import { Select } from '../../../CustomSelect/select.js';
import { Byline } from '../../../design-system/Byline.js';
import { KeyboardShortcutHint } from '../../../design-system/KeyboardShortcutHint.js';
import { useWizard } from '../../../wizard/index.js';
import { WizardDialogLayout } from '../../../wizard/WizardDialogLayout.js';
export function MethodStep() {
    const $ = _c(11);
    const { goNext, goBack, updateWizardData, goToStep } = useWizard();
    let t0;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = [{
                label: "Generate with Claude (recommended)",
                value: "generate"
            }, {
                label: "Manual configuration",
                value: "manual"
            }];
        $[0] = t0;
    }
    else {
        t0 = $[0];
    }
    const methodOptions = t0;
    let t1;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = _jsxs(Byline, { children: [_jsx(KeyboardShortcutHint, { shortcut: "\u2191\u2193", action: "navigate" }), _jsx(KeyboardShortcutHint, { shortcut: "Enter", action: "select" }), _jsx(ConfigurableShortcutHint, { action: "confirm:no", context: "Confirmation", fallback: "Esc", description: "go back" })] });
        $[1] = t1;
    }
    else {
        t1 = $[1];
    }
    let t2;
    if ($[2] !== goNext || $[3] !== goToStep || $[4] !== updateWizardData) {
        t2 = value => {
            const method = value;
            updateWizardData({
                method,
                wasGenerated: method === "generate"
            });
            if (method === "generate") {
                goNext();
            }
            else {
                goToStep(3);
            }
        };
        $[2] = goNext;
        $[3] = goToStep;
        $[4] = updateWizardData;
        $[5] = t2;
    }
    else {
        t2 = $[5];
    }
    let t3;
    if ($[6] !== goBack) {
        t3 = () => goBack();
        $[6] = goBack;
        $[7] = t3;
    }
    else {
        t3 = $[7];
    }
    let t4;
    if ($[8] !== t2 || $[9] !== t3) {
        t4 = _jsx(WizardDialogLayout, { subtitle: "Creation method", footerText: t1, children: _jsx(Box, { children: _jsx(Select, { options: methodOptions, onChange: t2, onCancel: t3 }, "method-select") }) });
        $[8] = t2;
        $[9] = t3;
        $[10] = t4;
    }
    else {
        t4 = $[10];
    }
    return t4;
}
