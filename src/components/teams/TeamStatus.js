import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import * as React from 'react';
import { Text } from '../../ink.js';
import { useAppState } from '../../state/AppState.js';
/**
 * Footer status indicator showing teammate count
 * Similar to BackgroundTaskStatus but for teammates
 */
export function TeamStatus(t0) {
    const $ = _c(14);
    const { teamsSelected, showHint } = t0;
    const teamContext = useAppState(_temp);
    let t1;
    if ($[0] !== teamContext) {
        t1 = teamContext ? Object.values(teamContext.teammates).filter(_temp2).length : 0;
        $[0] = teamContext;
        $[1] = t1;
    }
    else {
        t1 = $[1];
    }
    const totalTeammates = t1;
    if (totalTeammates === 0) {
        return null;
    }
    let t2;
    if ($[2] !== showHint || $[3] !== teamsSelected) {
        t2 = showHint && teamsSelected ? _jsxs(_Fragment, { children: [_jsx(Text, { dimColor: true, children: "\u00B7 " }), _jsx(Text, { dimColor: true, children: "Enter to view" })] }) : null;
        $[2] = showHint;
        $[3] = teamsSelected;
        $[4] = t2;
    }
    else {
        t2 = $[4];
    }
    const hint = t2;
    const statusText = `${totalTeammates} ${totalTeammates === 1 ? "teammate" : "teammates"}`;
    const t3 = teamsSelected ? "selected" : "normal";
    let t4;
    if ($[5] !== statusText || $[6] !== t3 || $[7] !== teamsSelected) {
        t4 = _jsx(Text, { color: "background", inverse: teamsSelected, children: statusText }, t3);
        $[5] = statusText;
        $[6] = t3;
        $[7] = teamsSelected;
        $[8] = t4;
    }
    else {
        t4 = $[8];
    }
    let t5;
    if ($[9] !== hint) {
        t5 = hint ? _jsxs(Text, { children: [" ", hint] }) : null;
        $[9] = hint;
        $[10] = t5;
    }
    else {
        t5 = $[10];
    }
    let t6;
    if ($[11] !== t4 || $[12] !== t5) {
        t6 = _jsxs(_Fragment, { children: [t4, t5] });
        $[11] = t4;
        $[12] = t5;
        $[13] = t6;
    }
    else {
        t6 = $[13];
    }
    return t6;
}
function _temp2(t) {
    return t.name !== "team-lead";
}
function _temp(s) {
    return s.teamContext;
}
