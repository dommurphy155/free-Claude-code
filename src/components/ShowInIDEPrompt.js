import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import { basename, relative } from 'path';
import React from 'react';
import { Box, Text } from '../ink.js';
import { getCwd } from '../utils/cwd.js';
import { isSupportedVSCodeTerminal } from '../utils/ide.js';
import { Select } from './CustomSelect/index.js';
import { Pane } from './design-system/Pane.js';
export function ShowInIDEPrompt(t0) {
    const $ = _c(36);
    const { onChange, options, input, filePath, ideName, symlinkTarget, rejectFeedback, acceptFeedback, setFocusedOption, onInputModeToggle, focusedOption, yesInputMode, noInputMode } = t0;
    let t1;
    if ($[0] !== ideName) {
        t1 = _jsxs(Text, { bold: true, color: "permission", children: ["Opened changes in ", ideName, " \u29C9"] });
        $[0] = ideName;
        $[1] = t1;
    }
    else {
        t1 = $[1];
    }
    let t2;
    if ($[2] !== symlinkTarget) {
        t2 = symlinkTarget && _jsx(Text, { color: "warning", children: relative(getCwd(), symlinkTarget).startsWith("..") ? `This will modify ${symlinkTarget} (outside working directory) via a symlink` : `Symlink target: ${symlinkTarget}` });
        $[2] = symlinkTarget;
        $[3] = t2;
    }
    else {
        t2 = $[3];
    }
    let t3;
    if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
        t3 = isSupportedVSCodeTerminal() && _jsx(Text, { dimColor: true, children: "Save file to continue\u2026" });
        $[4] = t3;
    }
    else {
        t3 = $[4];
    }
    let t4;
    if ($[5] !== filePath) {
        t4 = basename(filePath);
        $[5] = filePath;
        $[6] = t4;
    }
    else {
        t4 = $[6];
    }
    let t5;
    if ($[7] !== t4) {
        t5 = _jsxs(Text, { children: ["Do you want to make this edit to", " ", _jsx(Text, { bold: true, children: t4 }), "?"] });
        $[7] = t4;
        $[8] = t5;
    }
    else {
        t5 = $[8];
    }
    let t6;
    if ($[9] !== acceptFeedback || $[10] !== input || $[11] !== onChange || $[12] !== options || $[13] !== rejectFeedback) {
        t6 = value => {
            const selected = options.find(opt => opt.value === value);
            if (selected) {
                if (selected.option.type === "reject") {
                    const trimmedFeedback = rejectFeedback.trim();
                    onChange(selected.option, input, trimmedFeedback || undefined);
                    return;
                }
                if (selected.option.type === "accept-once") {
                    const trimmedFeedback_0 = acceptFeedback.trim();
                    onChange(selected.option, input, trimmedFeedback_0 || undefined);
                    return;
                }
                onChange(selected.option, input);
            }
        };
        $[9] = acceptFeedback;
        $[10] = input;
        $[11] = onChange;
        $[12] = options;
        $[13] = rejectFeedback;
        $[14] = t6;
    }
    else {
        t6 = $[14];
    }
    let t7;
    if ($[15] !== input || $[16] !== onChange) {
        t7 = () => onChange({
            type: "reject"
        }, input);
        $[15] = input;
        $[16] = onChange;
        $[17] = t7;
    }
    else {
        t7 = $[17];
    }
    let t8;
    if ($[18] !== setFocusedOption) {
        t8 = value_0 => setFocusedOption(value_0);
        $[18] = setFocusedOption;
        $[19] = t8;
    }
    else {
        t8 = $[19];
    }
    let t9;
    if ($[20] !== onInputModeToggle || $[21] !== options || $[22] !== t6 || $[23] !== t7 || $[24] !== t8) {
        t9 = _jsx(Select, { options: options, inlineDescriptions: true, onChange: t6, onCancel: t7, onFocus: t8, onInputModeToggle: onInputModeToggle });
        $[20] = onInputModeToggle;
        $[21] = options;
        $[22] = t6;
        $[23] = t7;
        $[24] = t8;
        $[25] = t9;
    }
    else {
        t9 = $[25];
    }
    let t10;
    if ($[26] !== t5 || $[27] !== t9) {
        t10 = _jsxs(Box, { flexDirection: "column", children: [t5, t9] });
        $[26] = t5;
        $[27] = t9;
        $[28] = t10;
    }
    else {
        t10 = $[28];
    }
    const t11 = (focusedOption === "yes" && !yesInputMode || focusedOption === "no" && !noInputMode) && " \xB7 Tab to amend";
    let t12;
    if ($[29] !== t11) {
        t12 = _jsx(Box, { marginTop: 1, children: _jsxs(Text, { dimColor: true, children: ["Esc to cancel", t11] }) });
        $[29] = t11;
        $[30] = t12;
    }
    else {
        t12 = $[30];
    }
    let t13;
    if ($[31] !== t1 || $[32] !== t10 || $[33] !== t12 || $[34] !== t2) {
        t13 = _jsx(Pane, { color: "permission", children: _jsxs(Box, { flexDirection: "column", gap: 1, children: [t1, t2, t3, t10, t12] }) });
        $[31] = t1;
        $[32] = t10;
        $[33] = t12;
        $[34] = t2;
        $[35] = t13;
    }
    else {
        t13 = $[35];
    }
    return t13;
}
