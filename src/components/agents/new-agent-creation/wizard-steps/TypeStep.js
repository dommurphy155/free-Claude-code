import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import React, { useState } from 'react';
import { Box, Text } from '../../../../ink.js';
import { useKeybinding } from '../../../../keybindings/useKeybinding.js';
import { ConfigurableShortcutHint } from '../../../ConfigurableShortcutHint.js';
import { Byline } from '../../../design-system/Byline.js';
import { KeyboardShortcutHint } from '../../../design-system/KeyboardShortcutHint.js';
import TextInput from '../../../TextInput.js';
import { useWizard } from '../../../wizard/index.js';
import { WizardDialogLayout } from '../../../wizard/WizardDialogLayout.js';
import { validateAgentType } from '../../validateAgent.js';
export function TypeStep(_props) {
    const $ = _c(15);
    const { goNext, goBack, updateWizardData, wizardData } = useWizard();
    const [agentType, setAgentType] = useState(wizardData.agentType || "");
    const [error, setError] = useState(null);
    const [cursorOffset, setCursorOffset] = useState(agentType.length);
    let t0;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = {
            context: "Settings"
        };
        $[0] = t0;
    }
    else {
        t0 = $[0];
    }
    useKeybinding("confirm:no", goBack, t0);
    let t1;
    if ($[1] !== goNext || $[2] !== updateWizardData) {
        t1 = value => {
            const trimmedValue = value.trim();
            const validationError = validateAgentType(trimmedValue);
            if (validationError) {
                setError(validationError);
                return;
            }
            setError(null);
            updateWizardData({
                agentType: trimmedValue
            });
            goNext();
        };
        $[1] = goNext;
        $[2] = updateWizardData;
        $[3] = t1;
    }
    else {
        t1 = $[3];
    }
    const handleSubmit = t1;
    let t2;
    if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
        t2 = _jsxs(Byline, { children: [_jsx(KeyboardShortcutHint, { shortcut: "Type", action: "enter text" }), _jsx(KeyboardShortcutHint, { shortcut: "Enter", action: "continue" }), _jsx(ConfigurableShortcutHint, { action: "confirm:no", context: "Settings", fallback: "Esc", description: "go back" })] });
        $[4] = t2;
    }
    else {
        t2 = $[4];
    }
    let t3;
    if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
        t3 = _jsx(Text, { children: "Enter a unique identifier for your agent:" });
        $[5] = t3;
    }
    else {
        t3 = $[5];
    }
    let t4;
    if ($[6] !== agentType || $[7] !== cursorOffset || $[8] !== handleSubmit) {
        t4 = _jsx(Box, { marginTop: 1, children: _jsx(TextInput, { value: agentType, onChange: setAgentType, onSubmit: handleSubmit, placeholder: "e.g., test-runner, tech-lead, etc", columns: 60, cursorOffset: cursorOffset, onChangeCursorOffset: setCursorOffset, focus: true, showCursor: true }) });
        $[6] = agentType;
        $[7] = cursorOffset;
        $[8] = handleSubmit;
        $[9] = t4;
    }
    else {
        t4 = $[9];
    }
    let t5;
    if ($[10] !== error) {
        t5 = error && _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: "error", children: error }) });
        $[10] = error;
        $[11] = t5;
    }
    else {
        t5 = $[11];
    }
    let t6;
    if ($[12] !== t4 || $[13] !== t5) {
        t6 = _jsx(WizardDialogLayout, { subtitle: "Agent type (identifier)", footerText: t2, children: _jsxs(Box, { flexDirection: "column", children: [t3, t4, t5] }) });
        $[12] = t4;
        $[13] = t5;
        $[14] = t6;
    }
    else {
        t6 = $[14];
    }
    return t6;
}
