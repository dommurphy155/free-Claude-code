import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import * as React from 'react';
import { Box, Text } from '../../ink.js';
import { env } from '../../utils/env.js';
const POSES = {
    default: {
        r1L: ' ▐',
        r1E: '▛███▜',
        r1R: '▌',
        r2L: '▝▜',
        r2R: '▛▘'
    },
    'look-left': {
        r1L: ' ▐',
        r1E: '▟███▟',
        r1R: '▌',
        r2L: '▝▜',
        r2R: '▛▘'
    },
    'look-right': {
        r1L: ' ▐',
        r1E: '▙███▙',
        r1R: '▌',
        r2L: '▝▜',
        r2R: '▛▘'
    },
    'arms-up': {
        r1L: '▗▟',
        r1E: '▛███▜',
        r1R: '▙▖',
        r2L: ' ▜',
        r2R: '▛ '
    }
};
// Apple Terminal uses a bg-fill trick (see below), so only eye poses make
// sense. Arm poses fall back to default.
const APPLE_EYES = {
    default: ' ▗   ▖ ',
    'look-left': ' ▘   ▘ ',
    'look-right': ' ▝   ▝ ',
    'arms-up': ' ▗   ▖ '
};
export function Clawd(t0) {
    const $ = _c(26);
    let t1;
    if ($[0] !== t0) {
        t1 = t0 === undefined ? {} : t0;
        $[0] = t0;
        $[1] = t1;
    }
    else {
        t1 = $[1];
    }
    const { pose: t2 } = t1;
    const pose = t2 === undefined ? "default" : t2;
    if (env.terminal === "Apple_Terminal") {
        let t3;
        if ($[2] !== pose) {
            t3 = _jsx(AppleTerminalClawd, { pose: pose });
            $[2] = pose;
            $[3] = t3;
        }
        else {
            t3 = $[3];
        }
        return t3;
    }
    const p = POSES[pose];
    let t3;
    if ($[4] !== p.r1L) {
        t3 = _jsx(Text, { color: "clawd_body", children: p.r1L });
        $[4] = p.r1L;
        $[5] = t3;
    }
    else {
        t3 = $[5];
    }
    let t4;
    if ($[6] !== p.r1E) {
        t4 = _jsx(Text, { color: "clawd_body", backgroundColor: "clawd_background", children: p.r1E });
        $[6] = p.r1E;
        $[7] = t4;
    }
    else {
        t4 = $[7];
    }
    let t5;
    if ($[8] !== p.r1R) {
        t5 = _jsx(Text, { color: "clawd_body", children: p.r1R });
        $[8] = p.r1R;
        $[9] = t5;
    }
    else {
        t5 = $[9];
    }
    let t6;
    if ($[10] !== t3 || $[11] !== t4 || $[12] !== t5) {
        t6 = _jsxs(Text, { children: [t3, t4, t5] });
        $[10] = t3;
        $[11] = t4;
        $[12] = t5;
        $[13] = t6;
    }
    else {
        t6 = $[13];
    }
    let t7;
    if ($[14] !== p.r2L) {
        t7 = _jsx(Text, { color: "clawd_body", children: p.r2L });
        $[14] = p.r2L;
        $[15] = t7;
    }
    else {
        t7 = $[15];
    }
    let t8;
    if ($[16] === Symbol.for("react.memo_cache_sentinel")) {
        t8 = _jsx(Text, { color: "clawd_body", backgroundColor: "clawd_background", children: "\u2588\u2588\u2588\u2588\u2588" });
        $[16] = t8;
    }
    else {
        t8 = $[16];
    }
    let t9;
    if ($[17] !== p.r2R) {
        t9 = _jsx(Text, { color: "clawd_body", children: p.r2R });
        $[17] = p.r2R;
        $[18] = t9;
    }
    else {
        t9 = $[18];
    }
    let t10;
    if ($[19] !== t7 || $[20] !== t9) {
        t10 = _jsxs(Text, { children: [t7, t8, t9] });
        $[19] = t7;
        $[20] = t9;
        $[21] = t10;
    }
    else {
        t10 = $[21];
    }
    let t11;
    if ($[22] === Symbol.for("react.memo_cache_sentinel")) {
        t11 = _jsxs(Text, { color: "clawd_body", children: ["  ", "\u2598\u2598 \u259D\u259D", "  "] });
        $[22] = t11;
    }
    else {
        t11 = $[22];
    }
    let t12;
    if ($[23] !== t10 || $[24] !== t6) {
        t12 = _jsxs(Box, { flexDirection: "column", children: [t6, t10, t11] });
        $[23] = t10;
        $[24] = t6;
        $[25] = t12;
    }
    else {
        t12 = $[25];
    }
    return t12;
}
function AppleTerminalClawd(t0) {
    const $ = _c(10);
    const { pose } = t0;
    let t1;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = _jsx(Text, { color: "clawd_body", children: "\u2597" });
        $[0] = t1;
    }
    else {
        t1 = $[0];
    }
    const t2 = APPLE_EYES[pose];
    let t3;
    if ($[1] !== t2) {
        t3 = _jsx(Text, { color: "clawd_background", backgroundColor: "clawd_body", children: t2 });
        $[1] = t2;
        $[2] = t3;
    }
    else {
        t3 = $[2];
    }
    let t4;
    if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
        t4 = _jsx(Text, { color: "clawd_body", children: "\u2596" });
        $[3] = t4;
    }
    else {
        t4 = $[3];
    }
    let t5;
    if ($[4] !== t3) {
        t5 = _jsxs(Text, { children: [t1, t3, t4] });
        $[4] = t3;
        $[5] = t5;
    }
    else {
        t5 = $[5];
    }
    let t6;
    let t7;
    if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
        t6 = _jsx(Text, { backgroundColor: "clawd_body", children: " ".repeat(7) });
        t7 = _jsx(Text, { color: "clawd_body", children: "\u2598\u2598 \u259D\u259D" });
        $[6] = t6;
        $[7] = t7;
    }
    else {
        t6 = $[6];
        t7 = $[7];
    }
    let t8;
    if ($[8] !== t5) {
        t8 = _jsxs(Box, { flexDirection: "column", alignItems: "center", children: [t5, t6, t7] });
        $[8] = t5;
        $[9] = t8;
    }
    else {
        t8 = $[9];
    }
    return t8;
}
