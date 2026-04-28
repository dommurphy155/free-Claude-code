import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
/**
 * ViewHookMode shows read-only details for a single configured hook.
 *
 * The /hooks menu is read-only; this view replaces the former delete-hook
 * confirmation screen and directs users to settings.json or Claude for edits.
 */
import * as React from 'react';
import { Box, Text } from '../../ink.js';
import { hookSourceDescriptionDisplayString } from '../../utils/hooks/hooksSettings.js';
import { Dialog } from '../design-system/Dialog.js';
export function ViewHookMode(t0) {
    const $ = _c(40);
    const { selectedHook, eventSupportsMatcher, onCancel } = t0;
    let t1;
    if ($[0] !== selectedHook.event) {
        t1 = _jsxs(Text, { children: ["Event: ", _jsx(Text, { bold: true, children: selectedHook.event })] });
        $[0] = selectedHook.event;
        $[1] = t1;
    }
    else {
        t1 = $[1];
    }
    let t2;
    if ($[2] !== eventSupportsMatcher || $[3] !== selectedHook.matcher) {
        t2 = eventSupportsMatcher && _jsxs(Text, { children: ["Matcher: ", _jsx(Text, { bold: true, children: selectedHook.matcher || "(all)" })] });
        $[2] = eventSupportsMatcher;
        $[3] = selectedHook.matcher;
        $[4] = t2;
    }
    else {
        t2 = $[4];
    }
    let t3;
    if ($[5] !== selectedHook.config.type) {
        t3 = _jsxs(Text, { children: ["Type: ", _jsx(Text, { bold: true, children: selectedHook.config.type })] });
        $[5] = selectedHook.config.type;
        $[6] = t3;
    }
    else {
        t3 = $[6];
    }
    let t4;
    if ($[7] !== selectedHook.source) {
        t4 = hookSourceDescriptionDisplayString(selectedHook.source);
        $[7] = selectedHook.source;
        $[8] = t4;
    }
    else {
        t4 = $[8];
    }
    let t5;
    if ($[9] !== t4) {
        t5 = _jsxs(Text, { children: ["Source:", " ", _jsx(Text, { dimColor: true, children: t4 })] });
        $[9] = t4;
        $[10] = t5;
    }
    else {
        t5 = $[10];
    }
    let t6;
    if ($[11] !== selectedHook.pluginName) {
        t6 = selectedHook.pluginName && _jsxs(Text, { children: ["Plugin: ", _jsx(Text, { dimColor: true, children: selectedHook.pluginName })] });
        $[11] = selectedHook.pluginName;
        $[12] = t6;
    }
    else {
        t6 = $[12];
    }
    let t7;
    if ($[13] !== t1 || $[14] !== t2 || $[15] !== t3 || $[16] !== t5 || $[17] !== t6) {
        t7 = _jsxs(Box, { flexDirection: "column", children: [t1, t2, t3, t5, t6] });
        $[13] = t1;
        $[14] = t2;
        $[15] = t3;
        $[16] = t5;
        $[17] = t6;
        $[18] = t7;
    }
    else {
        t7 = $[18];
    }
    let t8;
    if ($[19] !== selectedHook.config) {
        t8 = getContentFieldLabel(selectedHook.config);
        $[19] = selectedHook.config;
        $[20] = t8;
    }
    else {
        t8 = $[20];
    }
    let t9;
    if ($[21] !== t8) {
        t9 = _jsxs(Text, { dimColor: true, children: [t8, ":"] });
        $[21] = t8;
        $[22] = t9;
    }
    else {
        t9 = $[22];
    }
    let t10;
    if ($[23] !== selectedHook.config) {
        t10 = getContentFieldValue(selectedHook.config);
        $[23] = selectedHook.config;
        $[24] = t10;
    }
    else {
        t10 = $[24];
    }
    let t11;
    if ($[25] !== t10) {
        t11 = _jsx(Box, { borderStyle: "round", borderDimColor: true, paddingLeft: 1, paddingRight: 1, children: _jsx(Text, { children: t10 }) });
        $[25] = t10;
        $[26] = t11;
    }
    else {
        t11 = $[26];
    }
    let t12;
    if ($[27] !== t11 || $[28] !== t9) {
        t12 = _jsxs(Box, { flexDirection: "column", children: [t9, t11] });
        $[27] = t11;
        $[28] = t9;
        $[29] = t12;
    }
    else {
        t12 = $[29];
    }
    let t13;
    if ($[30] !== selectedHook.config) {
        t13 = "statusMessage" in selectedHook.config && selectedHook.config.statusMessage && _jsxs(Text, { children: ["Status message:", " ", _jsx(Text, { dimColor: true, children: selectedHook.config.statusMessage })] });
        $[30] = selectedHook.config;
        $[31] = t13;
    }
    else {
        t13 = $[31];
    }
    let t14;
    if ($[32] === Symbol.for("react.memo_cache_sentinel")) {
        t14 = _jsx(Text, { dimColor: true, children: "To modify or remove this hook, edit settings.json directly or ask Claude to help." });
        $[32] = t14;
    }
    else {
        t14 = $[32];
    }
    let t15;
    if ($[33] !== t12 || $[34] !== t13 || $[35] !== t7) {
        t15 = _jsxs(Box, { flexDirection: "column", gap: 1, children: [t7, t12, t13, t14] });
        $[33] = t12;
        $[34] = t13;
        $[35] = t7;
        $[36] = t15;
    }
    else {
        t15 = $[36];
    }
    let t16;
    if ($[37] !== onCancel || $[38] !== t15) {
        t16 = _jsx(Dialog, { title: "Hook details", onCancel: onCancel, inputGuide: _temp, children: t15 });
        $[37] = onCancel;
        $[38] = t15;
        $[39] = t16;
    }
    else {
        t16 = $[39];
    }
    return t16;
}
/**
 * Get a human-readable label for the primary content field of a hook
 * based on its type.
 */
function _temp() {
    return _jsx(Text, { children: "Esc to go back" });
}
function getContentFieldLabel(config) {
    switch (config.type) {
        case 'command':
            return 'Command';
        case 'prompt':
            return 'Prompt';
        case 'agent':
            return 'Prompt';
        case 'http':
            return 'URL';
    }
}
/**
 * Get the actual content value for a hook's primary field, bypassing
 * statusMessage so the detail view always shows the real command/prompt/URL.
 */
function getContentFieldValue(config) {
    switch (config.type) {
        case 'command':
            return config.command;
        case 'prompt':
            return config.prompt;
        case 'agent':
            return config.prompt;
        case 'http':
            return config.url;
    }
}
