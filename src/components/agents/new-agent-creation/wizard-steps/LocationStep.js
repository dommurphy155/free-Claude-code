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
export function LocationStep() {
    const $ = _c(11);
    const { goNext, updateWizardData, cancel } = useWizard();
    let t0;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = {
            label: "Project (.claude/agents/)",
            value: "projectSettings"
        };
        $[0] = t0;
    }
    else {
        t0 = $[0];
    }
    let t1;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = [t0, {
                label: "Personal (~/.claude/agents/)",
                value: "userSettings"
            }];
        $[1] = t1;
    }
    else {
        t1 = $[1];
    }
    const locationOptions = t1;
    let t2;
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
        t2 = _jsxs(Byline, { children: [_jsx(KeyboardShortcutHint, { shortcut: "\u2191\u2193", action: "navigate" }), _jsx(KeyboardShortcutHint, { shortcut: "Enter", action: "select" }), _jsx(ConfigurableShortcutHint, { action: "confirm:no", context: "Confirmation", fallback: "Esc", description: "cancel" })] });
        $[2] = t2;
    }
    else {
        t2 = $[2];
    }
    let t3;
    if ($[3] !== goNext || $[4] !== updateWizardData) {
        t3 = value => {
            updateWizardData({
                location: value
            });
            goNext();
        };
        $[3] = goNext;
        $[4] = updateWizardData;
        $[5] = t3;
    }
    else {
        t3 = $[5];
    }
    let t4;
    if ($[6] !== cancel) {
        t4 = () => cancel();
        $[6] = cancel;
        $[7] = t4;
    }
    else {
        t4 = $[7];
    }
    let t5;
    if ($[8] !== t3 || $[9] !== t4) {
        t5 = _jsx(WizardDialogLayout, { subtitle: "Choose location", footerText: t2, children: _jsx(Box, { children: _jsx(Select, { options: locationOptions, onChange: t3, onCancel: t4 }, "location-select") }) });
        $[8] = t3;
        $[9] = t4;
        $[10] = t5;
    }
    else {
        t5 = $[10];
    }
    return t5;
}
