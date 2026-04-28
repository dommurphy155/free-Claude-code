import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import React from 'react';
import { Link, Text } from '../ink.js';
export function PrBadge(t0) {
    const $ = _c(21);
    const { number, url, reviewState, bold } = t0;
    let t1;
    if ($[0] !== reviewState) {
        t1 = getPrStatusColor(reviewState);
        $[0] = reviewState;
        $[1] = t1;
    }
    else {
        t1 = $[1];
    }
    const statusColor = t1;
    const t2 = !statusColor && !bold;
    let t3;
    if ($[2] !== bold || $[3] !== number || $[4] !== statusColor || $[5] !== t2) {
        t3 = _jsxs(Text, { color: statusColor, dimColor: t2, bold: bold, children: ["#", number] });
        $[2] = bold;
        $[3] = number;
        $[4] = statusColor;
        $[5] = t2;
        $[6] = t3;
    }
    else {
        t3 = $[6];
    }
    const label = t3;
    const t4 = !bold;
    let t5;
    if ($[7] !== t4) {
        t5 = _jsx(Text, { dimColor: t4, children: "PR" });
        $[7] = t4;
        $[8] = t5;
    }
    else {
        t5 = $[8];
    }
    const t6 = !statusColor && !bold;
    let t7;
    if ($[9] !== bold || $[10] !== number || $[11] !== statusColor || $[12] !== t6) {
        t7 = _jsxs(Text, { color: statusColor, dimColor: t6, underline: true, bold: bold, children: ["#", number] });
        $[9] = bold;
        $[10] = number;
        $[11] = statusColor;
        $[12] = t6;
        $[13] = t7;
    }
    else {
        t7 = $[13];
    }
    let t8;
    if ($[14] !== label || $[15] !== t7 || $[16] !== url) {
        t8 = _jsx(Link, { url: url, fallback: label, children: t7 });
        $[14] = label;
        $[15] = t7;
        $[16] = url;
        $[17] = t8;
    }
    else {
        t8 = $[17];
    }
    let t9;
    if ($[18] !== t5 || $[19] !== t8) {
        t9 = _jsxs(Text, { children: [t5, " ", t8] });
        $[18] = t5;
        $[19] = t8;
        $[20] = t9;
    }
    else {
        t9 = $[20];
    }
    return t9;
}
function getPrStatusColor(state) {
    switch (state) {
        case 'approved':
            return 'success';
        case 'changes_requested':
            return 'error';
        case 'pending':
            return 'warning';
        case 'merged':
            return 'merged';
        default:
            return undefined;
    }
}
