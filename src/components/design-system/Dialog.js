import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import React from 'react';
import { useExitOnCtrlCDWithKeybindings } from '../../hooks/useExitOnCtrlCDWithKeybindings.js';
import { Box, Text } from '../../ink.js';
import { useKeybinding } from '../../keybindings/useKeybinding.js';
import { ConfigurableShortcutHint } from '../ConfigurableShortcutHint.js';
import { Byline } from './Byline.js';
import { KeyboardShortcutHint } from './KeyboardShortcutHint.js';
import { Pane } from './Pane.js';
export function Dialog(t0) {
    const $ = _c(27);
    const { title, subtitle, children, onCancel, color: t1, hideInputGuide, hideBorder, inputGuide, isCancelActive: t2 } = t0;
    const color = t1 === undefined ? "permission" : t1;
    const isCancelActive = t2 === undefined ? true : t2;
    const exitState = useExitOnCtrlCDWithKeybindings(undefined, undefined, isCancelActive);
    let t3;
    if ($[0] !== isCancelActive) {
        t3 = {
            context: "Confirmation",
            isActive: isCancelActive
        };
        $[0] = isCancelActive;
        $[1] = t3;
    }
    else {
        t3 = $[1];
    }
    useKeybinding("confirm:no", onCancel, t3);
    let t4;
    if ($[2] !== exitState.keyName || $[3] !== exitState.pending) {
        t4 = exitState.pending ? _jsxs(Text, { children: ["Press ", exitState.keyName, " again to exit"] }) : _jsxs(Byline, { children: [_jsx(KeyboardShortcutHint, { shortcut: "Enter", action: "confirm" }), _jsx(ConfigurableShortcutHint, { action: "confirm:no", context: "Confirmation", fallback: "Esc", description: "cancel" })] });
        $[2] = exitState.keyName;
        $[3] = exitState.pending;
        $[4] = t4;
    }
    else {
        t4 = $[4];
    }
    const defaultInputGuide = t4;
    let t5;
    if ($[5] !== color || $[6] !== title) {
        t5 = _jsx(Text, { bold: true, color: color, children: title });
        $[5] = color;
        $[6] = title;
        $[7] = t5;
    }
    else {
        t5 = $[7];
    }
    let t6;
    if ($[8] !== subtitle) {
        t6 = subtitle && _jsx(Text, { dimColor: true, children: subtitle });
        $[8] = subtitle;
        $[9] = t6;
    }
    else {
        t6 = $[9];
    }
    let t7;
    if ($[10] !== t5 || $[11] !== t6) {
        t7 = _jsxs(Box, { flexDirection: "column", children: [t5, t6] });
        $[10] = t5;
        $[11] = t6;
        $[12] = t7;
    }
    else {
        t7 = $[12];
    }
    let t8;
    if ($[13] !== children || $[14] !== t7) {
        t8 = _jsxs(Box, { flexDirection: "column", gap: 1, children: [t7, children] });
        $[13] = children;
        $[14] = t7;
        $[15] = t8;
    }
    else {
        t8 = $[15];
    }
    let t9;
    if ($[16] !== defaultInputGuide || $[17] !== exitState || $[18] !== hideInputGuide || $[19] !== inputGuide) {
        t9 = !hideInputGuide && _jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, italic: true, children: inputGuide ? inputGuide(exitState) : defaultInputGuide }) });
        $[16] = defaultInputGuide;
        $[17] = exitState;
        $[18] = hideInputGuide;
        $[19] = inputGuide;
        $[20] = t9;
    }
    else {
        t9 = $[20];
    }
    let t10;
    if ($[21] !== t8 || $[22] !== t9) {
        t10 = _jsxs(_Fragment, { children: [t8, t9] });
        $[21] = t8;
        $[22] = t9;
        $[23] = t10;
    }
    else {
        t10 = $[23];
    }
    const content = t10;
    if (hideBorder) {
        return content;
    }
    let t11;
    if ($[24] !== color || $[25] !== content) {
        t11 = _jsx(Pane, { color: color, children: content });
        $[24] = color;
        $[25] = content;
        $[26] = t11;
    }
    else {
        t11 = $[26];
    }
    return t11;
}
