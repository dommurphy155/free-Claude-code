import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import * as React from 'react';
import { Box, Text } from '../../ink.js';
export function PermissionRequestTitle(t0) {
    const $ = _c(13);
    const { title, subtitle, color: t1, workerBadge } = t0;
    const color = t1 === undefined ? "permission" : t1;
    let t2;
    if ($[0] !== color || $[1] !== title) {
        t2 = _jsx(Text, { bold: true, color: color, children: title });
        $[0] = color;
        $[1] = title;
        $[2] = t2;
    }
    else {
        t2 = $[2];
    }
    let t3;
    if ($[3] !== workerBadge) {
        t3 = workerBadge && _jsxs(Text, { dimColor: true, children: ["\xB7 ", "@", workerBadge.name] });
        $[3] = workerBadge;
        $[4] = t3;
    }
    else {
        t3 = $[4];
    }
    let t4;
    if ($[5] !== t2 || $[6] !== t3) {
        t4 = _jsxs(Box, { flexDirection: "row", gap: 1, children: [t2, t3] });
        $[5] = t2;
        $[6] = t3;
        $[7] = t4;
    }
    else {
        t4 = $[7];
    }
    let t5;
    if ($[8] !== subtitle) {
        t5 = subtitle != null && (typeof subtitle === "string" ? _jsx(Text, { dimColor: true, wrap: "truncate-start", children: subtitle }) : subtitle);
        $[8] = subtitle;
        $[9] = t5;
    }
    else {
        t5 = $[9];
    }
    let t6;
    if ($[10] !== t4 || $[11] !== t5) {
        t6 = _jsxs(Box, { flexDirection: "column", children: [t4, t5] });
        $[10] = t4;
        $[11] = t5;
        $[12] = t6;
    }
    else {
        t6 = $[12];
    }
    return t6;
}
