import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import * as React from 'react';
import { Box, Text } from '../../ink.js';
import { getAgentName, getTeammateColor, getTeamName } from '../../utils/teammate.js';
import { Spinner } from '../Spinner.js';
import { WorkerBadge } from './WorkerBadge.js';
/**
 * Visual indicator shown on workers while waiting for leader to approve a permission request.
 * Displays the pending tool with a spinner and information about what's being requested.
 */
export function WorkerPendingPermission(t0) {
    const $ = _c(15);
    const { toolName, description } = t0;
    let t1;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = getTeamName();
        $[0] = t1;
    }
    else {
        t1 = $[0];
    }
    const teamName = t1;
    let t2;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        t2 = getAgentName();
        $[1] = t2;
    }
    else {
        t2 = $[1];
    }
    const agentName = t2;
    let t3;
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
        t3 = getTeammateColor();
        $[2] = t3;
    }
    else {
        t3 = $[2];
    }
    const agentColor = t3;
    let t4;
    let t5;
    if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
        t4 = _jsxs(Box, { marginBottom: 1, children: [_jsx(Spinner, {}), _jsxs(Text, { color: "warning", bold: true, children: [" ", "Waiting for team lead approval"] })] });
        t5 = agentName && agentColor && _jsx(Box, { marginBottom: 1, children: _jsx(WorkerBadge, { name: agentName, color: agentColor }) });
        $[3] = t4;
        $[4] = t5;
    }
    else {
        t4 = $[3];
        t5 = $[4];
    }
    let t6;
    if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
        t6 = _jsx(Text, { dimColor: true, children: "Tool: " });
        $[5] = t6;
    }
    else {
        t6 = $[5];
    }
    let t7;
    if ($[6] !== toolName) {
        t7 = _jsxs(Box, { children: [t6, _jsx(Text, { children: toolName })] });
        $[6] = toolName;
        $[7] = t7;
    }
    else {
        t7 = $[7];
    }
    let t8;
    if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
        t8 = _jsx(Text, { dimColor: true, children: "Action: " });
        $[8] = t8;
    }
    else {
        t8 = $[8];
    }
    let t9;
    if ($[9] !== description) {
        t9 = _jsxs(Box, { children: [t8, _jsx(Text, { children: description })] });
        $[9] = description;
        $[10] = t9;
    }
    else {
        t9 = $[10];
    }
    let t10;
    if ($[11] === Symbol.for("react.memo_cache_sentinel")) {
        t10 = teamName && _jsx(Box, { marginTop: 1, children: _jsxs(Text, { dimColor: true, children: ["Permission request sent to team ", "\"", teamName, "\"", " leader"] }) });
        $[11] = t10;
    }
    else {
        t10 = $[11];
    }
    let t11;
    if ($[12] !== t7 || $[13] !== t9) {
        t11 = _jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: "warning", paddingX: 1, children: [t4, t5, t7, t9, t10] });
        $[12] = t7;
        $[13] = t9;
        $[14] = t11;
    }
    else {
        t11 = $[14];
    }
    return t11;
}
