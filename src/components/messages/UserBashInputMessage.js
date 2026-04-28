import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import * as React from 'react';
import { Box, Text } from '../../ink.js';
import { extractTag } from '../../utils/messages.js';
export function UserBashInputMessage(t0) {
    const $ = _c(8);
    const { param: t1, addMargin } = t0;
    const { text } = t1;
    let t2;
    if ($[0] !== text) {
        t2 = extractTag(text, "bash-input");
        $[0] = text;
        $[1] = t2;
    }
    else {
        t2 = $[1];
    }
    const input = t2;
    if (!input) {
        return null;
    }
    const t3 = addMargin ? 1 : 0;
    let t4;
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
        t4 = _jsx(Text, { color: "bashBorder", children: "! " });
        $[2] = t4;
    }
    else {
        t4 = $[2];
    }
    let t5;
    if ($[3] !== input) {
        t5 = _jsx(Text, { color: "text", children: input });
        $[3] = input;
        $[4] = t5;
    }
    else {
        t5 = $[4];
    }
    let t6;
    if ($[5] !== t3 || $[6] !== t5) {
        t6 = _jsxs(Box, { flexDirection: "row", marginTop: t3, backgroundColor: "bashMessageBackgroundColor", paddingRight: 1, children: [t4, t5] });
        $[5] = t3;
        $[6] = t5;
        $[7] = t6;
    }
    else {
        t6 = $[7];
    }
    return t6;
}
