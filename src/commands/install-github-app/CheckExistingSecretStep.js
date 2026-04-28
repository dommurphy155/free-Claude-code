import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import React, { useState } from 'react';
import TextInput from '../../components/TextInput.js';
import { useTerminalSize } from '../../hooks/useTerminalSize.js';
import { Box, color, Text, useTheme } from '../../ink.js';
import { useKeybindings } from '../../keybindings/useKeybinding.js';
export function CheckExistingSecretStep(t0) {
    const $ = _c(42);
    const { useExistingSecret, secretName, onToggleUseExistingSecret, onSecretNameChange, onSubmit } = t0;
    const [cursorOffset, setCursorOffset] = useState(0);
    const terminalSize = useTerminalSize();
    const [theme] = useTheme();
    let t1;
    if ($[0] !== onToggleUseExistingSecret) {
        t1 = () => onToggleUseExistingSecret(true);
        $[0] = onToggleUseExistingSecret;
        $[1] = t1;
    }
    else {
        t1 = $[1];
    }
    const handlePrevious = t1;
    let t2;
    if ($[2] !== onToggleUseExistingSecret) {
        t2 = () => onToggleUseExistingSecret(false);
        $[2] = onToggleUseExistingSecret;
        $[3] = t2;
    }
    else {
        t2 = $[3];
    }
    const handleNext = t2;
    let t3;
    if ($[4] !== handleNext || $[5] !== handlePrevious || $[6] !== onSubmit) {
        t3 = {
            "confirm:previous": handlePrevious,
            "confirm:next": handleNext,
            "confirm:yes": onSubmit
        };
        $[4] = handleNext;
        $[5] = handlePrevious;
        $[6] = onSubmit;
        $[7] = t3;
    }
    else {
        t3 = $[7];
    }
    let t4;
    if ($[8] !== useExistingSecret) {
        t4 = {
            context: "Confirmation",
            isActive: useExistingSecret
        };
        $[8] = useExistingSecret;
        $[9] = t4;
    }
    else {
        t4 = $[9];
    }
    useKeybindings(t3, t4);
    let t5;
    if ($[10] !== handleNext || $[11] !== handlePrevious) {
        t5 = {
            "confirm:previous": handlePrevious,
            "confirm:next": handleNext
        };
        $[10] = handleNext;
        $[11] = handlePrevious;
        $[12] = t5;
    }
    else {
        t5 = $[12];
    }
    const t6 = !useExistingSecret;
    let t7;
    if ($[13] !== t6) {
        t7 = {
            context: "Confirmation",
            isActive: t6
        };
        $[13] = t6;
        $[14] = t7;
    }
    else {
        t7 = $[14];
    }
    useKeybindings(t5, t7);
    let t8;
    if ($[15] === Symbol.for("react.memo_cache_sentinel")) {
        t8 = _jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsx(Text, { bold: true, children: "Install GitHub App" }), _jsx(Text, { dimColor: true, children: "Setup API key secret" })] });
        $[15] = t8;
    }
    else {
        t8 = $[15];
    }
    let t9;
    if ($[16] === Symbol.for("react.memo_cache_sentinel")) {
        t9 = _jsx(Box, { marginBottom: 1, children: _jsx(Text, { color: "warning", children: "ANTHROPIC_API_KEY already exists in repository secrets!" }) });
        $[16] = t9;
    }
    else {
        t9 = $[16];
    }
    let t10;
    if ($[17] === Symbol.for("react.memo_cache_sentinel")) {
        t10 = _jsx(Box, { marginBottom: 1, children: _jsx(Text, { children: "Would you like to:" }) });
        $[17] = t10;
    }
    else {
        t10 = $[17];
    }
    let t11;
    if ($[18] !== theme || $[19] !== useExistingSecret) {
        t11 = useExistingSecret ? color("success", theme)("> ") : "  ";
        $[18] = theme;
        $[19] = useExistingSecret;
        $[20] = t11;
    }
    else {
        t11 = $[20];
    }
    let t12;
    if ($[21] !== t11) {
        t12 = _jsx(Box, { marginBottom: 1, children: _jsxs(Text, { children: [t11, "Use the existing API key"] }) });
        $[21] = t11;
        $[22] = t12;
    }
    else {
        t12 = $[22];
    }
    let t13;
    if ($[23] !== theme || $[24] !== useExistingSecret) {
        t13 = !useExistingSecret ? color("success", theme)("> ") : "  ";
        $[23] = theme;
        $[24] = useExistingSecret;
        $[25] = t13;
    }
    else {
        t13 = $[25];
    }
    let t14;
    if ($[26] !== t13) {
        t14 = _jsx(Box, { marginBottom: 1, children: _jsxs(Text, { children: [t13, "Create a new secret with a different name"] }) });
        $[26] = t13;
        $[27] = t14;
    }
    else {
        t14 = $[27];
    }
    let t15;
    if ($[28] !== cursorOffset || $[29] !== onSecretNameChange || $[30] !== onSubmit || $[31] !== secretName || $[32] !== terminalSize || $[33] !== useExistingSecret) {
        t15 = !useExistingSecret && _jsxs(_Fragment, { children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { children: "Enter new secret name (alphanumeric with underscores):" }) }), _jsx(TextInput, { value: secretName, onChange: onSecretNameChange, onSubmit: onSubmit, focus: true, placeholder: "e.g., CLAUDE_API_KEY", columns: terminalSize.columns, cursorOffset: cursorOffset, onChangeCursorOffset: setCursorOffset, showCursor: true })] });
        $[28] = cursorOffset;
        $[29] = onSecretNameChange;
        $[30] = onSubmit;
        $[31] = secretName;
        $[32] = terminalSize;
        $[33] = useExistingSecret;
        $[34] = t15;
    }
    else {
        t15 = $[34];
    }
    let t16;
    if ($[35] !== t12 || $[36] !== t14 || $[37] !== t15) {
        t16 = _jsxs(Box, { flexDirection: "column", borderStyle: "round", paddingX: 1, children: [t8, t9, t10, t12, t14, t15] });
        $[35] = t12;
        $[36] = t14;
        $[37] = t15;
        $[38] = t16;
    }
    else {
        t16 = $[38];
    }
    let t17;
    if ($[39] === Symbol.for("react.memo_cache_sentinel")) {
        t17 = _jsx(Box, { marginLeft: 3, children: _jsx(Text, { dimColor: true, children: "\u2191/\u2193 to select \u00B7 Enter to continue" }) });
        $[39] = t17;
    }
    else {
        t17 = $[39];
    }
    let t18;
    if ($[40] !== t16) {
        t18 = _jsxs(_Fragment, { children: [t16, t17] });
        $[40] = t16;
        $[41] = t18;
    }
    else {
        t18 = $[41];
    }
    return t18;
}
