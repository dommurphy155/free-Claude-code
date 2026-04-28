import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import React from 'react';
import { envDynamic } from 'src/utils/envDynamic.js';
import { Box, Text } from '../ink.js';
import { useKeybindings } from '../keybindings/useKeybinding.js';
import { getGlobalConfig, saveGlobalConfig } from '../utils/config.js';
import { env } from '../utils/env.js';
import { getTerminalIdeType, isJetBrainsIde, toIDEDisplayName } from '../utils/ide.js';
import { Dialog } from './design-system/Dialog.js';
export function IdeOnboardingDialog(t0) {
    const $ = _c(23);
    const { onDone, installationStatus } = t0;
    markDialogAsShown();
    let t1;
    if ($[0] !== onDone) {
        t1 = {
            "confirm:yes": onDone,
            "confirm:no": onDone
        };
        $[0] = onDone;
        $[1] = t1;
    }
    else {
        t1 = $[1];
    }
    let t2;
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
        t2 = {
            context: "Confirmation"
        };
        $[2] = t2;
    }
    else {
        t2 = $[2];
    }
    useKeybindings(t1, t2);
    let t3;
    if ($[3] !== installationStatus?.ideType) {
        t3 = installationStatus?.ideType ?? getTerminalIdeType();
        $[3] = installationStatus?.ideType;
        $[4] = t3;
    }
    else {
        t3 = $[4];
    }
    const ideType = t3;
    const isJetBrains = isJetBrainsIde(ideType);
    let t4;
    if ($[5] !== ideType) {
        t4 = toIDEDisplayName(ideType);
        $[5] = ideType;
        $[6] = t4;
    }
    else {
        t4 = $[6];
    }
    const ideName = t4;
    const installedVersion = installationStatus?.installedVersion;
    const pluginOrExtension = isJetBrains ? "plugin" : "extension";
    const mentionShortcut = env.platform === "darwin" ? "Cmd+Option+K" : "Ctrl+Alt+K";
    let t5;
    if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
        t5 = _jsx(Text, { color: "claude", children: "\u273B " });
        $[7] = t5;
    }
    else {
        t5 = $[7];
    }
    let t6;
    if ($[8] !== ideName) {
        t6 = _jsxs(_Fragment, { children: [t5, _jsxs(Text, { children: ["Welcome to Claude Code for ", ideName] })] });
        $[8] = ideName;
        $[9] = t6;
    }
    else {
        t6 = $[9];
    }
    const t7 = installedVersion ? `installed ${pluginOrExtension} v${installedVersion}` : undefined;
    let t8;
    if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
        t8 = _jsx(Text, { color: "suggestion", children: "\u29C9 open files" });
        $[10] = t8;
    }
    else {
        t8 = $[10];
    }
    let t9;
    if ($[11] === Symbol.for("react.memo_cache_sentinel")) {
        t9 = _jsxs(Text, { children: ["\u2022 Claude has context of ", t8, " ", "and ", _jsx(Text, { color: "suggestion", children: "\u29C9 selected lines" })] });
        $[11] = t9;
    }
    else {
        t9 = $[11];
    }
    let t10;
    if ($[12] === Symbol.for("react.memo_cache_sentinel")) {
        t10 = _jsx(Text, { color: "diffAddedWord", children: "+11" });
        $[12] = t10;
    }
    else {
        t10 = $[12];
    }
    let t11;
    if ($[13] === Symbol.for("react.memo_cache_sentinel")) {
        t11 = _jsxs(Text, { children: ["\u2022 Review Claude Code's changes", " ", t10, " ", _jsx(Text, { color: "diffRemovedWord", children: "-22" }), " in the comfort of your IDE"] });
        $[13] = t11;
    }
    else {
        t11 = $[13];
    }
    let t12;
    if ($[14] === Symbol.for("react.memo_cache_sentinel")) {
        t12 = _jsxs(Text, { children: ["\u2022 Cmd+Esc", _jsx(Text, { dimColor: true, children: " for Quick Launch" })] });
        $[14] = t12;
    }
    else {
        t12 = $[14];
    }
    let t13;
    if ($[15] === Symbol.for("react.memo_cache_sentinel")) {
        t13 = _jsxs(Box, { flexDirection: "column", gap: 1, children: [t9, t11, t12, _jsxs(Text, { children: ["\u2022 ", mentionShortcut, _jsx(Text, { dimColor: true, children: " to reference files or lines in your input" })] })] });
        $[15] = t13;
    }
    else {
        t13 = $[15];
    }
    let t14;
    if ($[16] !== onDone || $[17] !== t6 || $[18] !== t7) {
        t14 = _jsx(Dialog, { title: t6, subtitle: t7, color: "ide", onCancel: onDone, hideInputGuide: true, children: t13 });
        $[16] = onDone;
        $[17] = t6;
        $[18] = t7;
        $[19] = t14;
    }
    else {
        t14 = $[19];
    }
    let t15;
    if ($[20] === Symbol.for("react.memo_cache_sentinel")) {
        t15 = _jsx(Box, { paddingX: 1, children: _jsx(Text, { dimColor: true, italic: true, children: "Press Enter to continue" }) });
        $[20] = t15;
    }
    else {
        t15 = $[20];
    }
    let t16;
    if ($[21] !== t14) {
        t16 = _jsxs(_Fragment, { children: [t14, t15] });
        $[21] = t14;
        $[22] = t16;
    }
    else {
        t16 = $[22];
    }
    return t16;
}
export function hasIdeOnboardingDialogBeenShown() {
    const config = getGlobalConfig();
    const terminal = envDynamic.terminal || 'unknown';
    return config.hasIdeOnboardingBeenShown?.[terminal] === true;
}
function markDialogAsShown() {
    if (hasIdeOnboardingDialogBeenShown()) {
        return;
    }
    const terminal = envDynamic.terminal || 'unknown';
    saveGlobalConfig(current => ({
        ...current,
        hasIdeOnboardingBeenShown: {
            ...current.hasIdeOnboardingBeenShown,
            [terminal]: true
        }
    }));
}
