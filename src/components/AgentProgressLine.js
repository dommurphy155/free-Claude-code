import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import * as React from 'react';
import { Box, Text } from '../ink.js';
import { formatNumber } from '../utils/format.js';
export function AgentProgressLine(t0) {
    const $ = _c(32);
    const { agentType, description, name, descriptionColor, taskDescription, toolUseCount, tokens, color, isLast, isResolved, isAsync: t1, lastToolInfo, hideType: t2 } = t0;
    const isAsync = t1 === undefined ? false : t1;
    const hideType = t2 === undefined ? false : t2;
    const treeChar = isLast ? "\u2514\u2500" : "\u251C\u2500";
    const isBackgrounded = isAsync && isResolved;
    let t3;
    if ($[0] !== isBackgrounded || $[1] !== isResolved || $[2] !== lastToolInfo || $[3] !== taskDescription) {
        t3 = () => {
            if (!isResolved) {
                return lastToolInfo || "Initializing\u2026";
            }
            if (isBackgrounded) {
                return taskDescription ?? "Running in the background";
            }
            return "Done";
        };
        $[0] = isBackgrounded;
        $[1] = isResolved;
        $[2] = lastToolInfo;
        $[3] = taskDescription;
        $[4] = t3;
    }
    else {
        t3 = $[4];
    }
    const getStatusText = t3;
    let t4;
    if ($[5] !== treeChar) {
        t4 = _jsxs(Text, { dimColor: true, children: [treeChar, " "] });
        $[5] = treeChar;
        $[6] = t4;
    }
    else {
        t4 = $[6];
    }
    const t5 = !isResolved;
    let t6;
    if ($[7] !== agentType || $[8] !== color || $[9] !== description || $[10] !== descriptionColor || $[11] !== hideType || $[12] !== name) {
        t6 = hideType ? _jsxs(_Fragment, { children: [_jsx(Text, { bold: true, children: name ?? description ?? agentType }), name && description && _jsxs(Text, { dimColor: true, children: [": ", description] })] }) : _jsxs(_Fragment, { children: [_jsx(Text, { bold: true, backgroundColor: color, color: color ? "inverseText" : undefined, children: agentType }), description && _jsxs(_Fragment, { children: [" (", _jsx(Text, { backgroundColor: descriptionColor, color: descriptionColor ? "inverseText" : undefined, children: description }), ")"] })] });
        $[7] = agentType;
        $[8] = color;
        $[9] = description;
        $[10] = descriptionColor;
        $[11] = hideType;
        $[12] = name;
        $[13] = t6;
    }
    else {
        t6 = $[13];
    }
    let t7;
    if ($[14] !== isBackgrounded || $[15] !== tokens || $[16] !== toolUseCount) {
        t7 = !isBackgrounded && _jsxs(_Fragment, { children: [" \xB7 ", toolUseCount, " tool ", toolUseCount === 1 ? "use" : "uses", tokens !== null && _jsxs(_Fragment, { children: [" \u00B7 ", formatNumber(tokens), " tokens"] })] });
        $[14] = isBackgrounded;
        $[15] = tokens;
        $[16] = toolUseCount;
        $[17] = t7;
    }
    else {
        t7 = $[17];
    }
    let t8;
    if ($[18] !== t5 || $[19] !== t6 || $[20] !== t7) {
        t8 = _jsxs(Text, { dimColor: t5, children: [t6, t7] });
        $[18] = t5;
        $[19] = t6;
        $[20] = t7;
        $[21] = t8;
    }
    else {
        t8 = $[21];
    }
    let t9;
    if ($[22] !== t4 || $[23] !== t8) {
        t9 = _jsxs(Box, { paddingLeft: 3, children: [t4, t8] });
        $[22] = t4;
        $[23] = t8;
        $[24] = t9;
    }
    else {
        t9 = $[24];
    }
    let t10;
    if ($[25] !== getStatusText || $[26] !== isBackgrounded || $[27] !== isLast) {
        t10 = !isBackgrounded && _jsxs(Box, { paddingLeft: 3, flexDirection: "row", children: [_jsx(Text, { dimColor: true, children: isLast ? "   \u23BF  " : "\u2502  \u23BF  " }), _jsx(Text, { dimColor: true, children: getStatusText() })] });
        $[25] = getStatusText;
        $[26] = isBackgrounded;
        $[27] = isLast;
        $[28] = t10;
    }
    else {
        t10 = $[28];
    }
    let t11;
    if ($[29] !== t10 || $[30] !== t9) {
        t11 = _jsxs(Box, { flexDirection: "column", children: [t9, t10] });
        $[29] = t10;
        $[30] = t9;
        $[31] = t11;
    }
    else {
        t11 = $[31];
    }
    return t11;
}
