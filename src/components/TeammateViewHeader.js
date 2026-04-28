import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import * as React from 'react';
import { Box, Text } from '../ink.js';
import { useAppState } from '../state/AppState.js';
import { getViewedTeammateTask } from '../state/selectors.js';
import { toInkColor } from '../utils/ink.js';
import { KeyboardShortcutHint } from './design-system/KeyboardShortcutHint.js';
import { OffscreenFreeze } from './OffscreenFreeze.js';
/**
 * Header shown when viewing a teammate's transcript.
 * Displays teammate name (colored), task description, and exit hint.
 */
export function TeammateViewHeader() {
    const $ = _c(14);
    const viewedTeammate = useAppState(_temp);
    if (!viewedTeammate) {
        return null;
    }
    let t0;
    if ($[0] !== viewedTeammate.identity.color) {
        t0 = toInkColor(viewedTeammate.identity.color);
        $[0] = viewedTeammate.identity.color;
        $[1] = t0;
    }
    else {
        t0 = $[1];
    }
    const nameColor = t0;
    let t1;
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = _jsx(Text, { children: "Viewing " });
        $[2] = t1;
    }
    else {
        t1 = $[2];
    }
    let t2;
    if ($[3] !== nameColor || $[4] !== viewedTeammate.identity.agentName) {
        t2 = _jsxs(Text, { color: nameColor, bold: true, children: ["@", viewedTeammate.identity.agentName] });
        $[3] = nameColor;
        $[4] = viewedTeammate.identity.agentName;
        $[5] = t2;
    }
    else {
        t2 = $[5];
    }
    let t3;
    if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
        t3 = _jsxs(Text, { dimColor: true, children: [" \xB7 ", _jsx(KeyboardShortcutHint, { shortcut: "esc", action: "return" })] });
        $[6] = t3;
    }
    else {
        t3 = $[6];
    }
    let t4;
    if ($[7] !== t2) {
        t4 = _jsxs(Box, { children: [t1, t2, t3] });
        $[7] = t2;
        $[8] = t4;
    }
    else {
        t4 = $[8];
    }
    let t5;
    if ($[9] !== viewedTeammate.prompt) {
        t5 = _jsx(Text, { dimColor: true, children: viewedTeammate.prompt });
        $[9] = viewedTeammate.prompt;
        $[10] = t5;
    }
    else {
        t5 = $[10];
    }
    let t6;
    if ($[11] !== t4 || $[12] !== t5) {
        t6 = _jsx(OffscreenFreeze, { children: _jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [t4, t5] }) });
        $[11] = t4;
        $[12] = t5;
        $[13] = t6;
    }
    else {
        t6 = $[13];
    }
    return t6;
}
function _temp(s) {
    return getViewedTeammateTask(s);
}
