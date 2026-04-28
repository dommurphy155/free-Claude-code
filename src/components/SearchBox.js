import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import React from 'react';
import { Box, Text } from '../ink.js';
export function SearchBox(t0) {
    const $ = _c(17);
    const { query, placeholder: t1, isFocused, isTerminalFocused, prefix: t2, width, cursorOffset, borderless: t3 } = t0;
    const placeholder = t1 === undefined ? "Search\u2026" : t1;
    const prefix = t2 === undefined ? "\u2315" : t2;
    const borderless = t3 === undefined ? false : t3;
    const offset = cursorOffset ?? query.length;
    const t4 = borderless ? undefined : "round";
    const t5 = isFocused ? "suggestion" : undefined;
    const t6 = !isFocused;
    const t7 = borderless ? 0 : 1;
    const t8 = !isFocused;
    let t9;
    if ($[0] !== isFocused || $[1] !== isTerminalFocused || $[2] !== offset || $[3] !== placeholder || $[4] !== query) {
        t9 = isFocused ? _jsx(_Fragment, { children: query ? isTerminalFocused ? _jsxs(_Fragment, { children: [_jsx(Text, { children: query.slice(0, offset) }), _jsx(Text, { inverse: true, children: offset < query.length ? query[offset] : " " }), offset < query.length && _jsx(Text, { children: query.slice(offset + 1) })] }) : _jsx(Text, { children: query }) : isTerminalFocused ? _jsxs(_Fragment, { children: [_jsx(Text, { inverse: true, children: placeholder.charAt(0) }), _jsx(Text, { dimColor: true, children: placeholder.slice(1) })] }) : _jsx(Text, { dimColor: true, children: placeholder }) }) : query ? _jsx(Text, { children: query }) : _jsx(Text, { children: placeholder });
        $[0] = isFocused;
        $[1] = isTerminalFocused;
        $[2] = offset;
        $[3] = placeholder;
        $[4] = query;
        $[5] = t9;
    }
    else {
        t9 = $[5];
    }
    let t10;
    if ($[6] !== prefix || $[7] !== t8 || $[8] !== t9) {
        t10 = _jsxs(Text, { dimColor: t8, children: [prefix, " ", t9] });
        $[6] = prefix;
        $[7] = t8;
        $[8] = t9;
        $[9] = t10;
    }
    else {
        t10 = $[9];
    }
    let t11;
    if ($[10] !== t10 || $[11] !== t4 || $[12] !== t5 || $[13] !== t6 || $[14] !== t7 || $[15] !== width) {
        t11 = _jsx(Box, { flexShrink: 0, borderStyle: t4, borderColor: t5, borderDimColor: t6, paddingX: t7, width: width, children: t10 });
        $[10] = t10;
        $[11] = t4;
        $[12] = t5;
        $[13] = t6;
        $[14] = t7;
        $[15] = width;
        $[16] = t11;
    }
    else {
        t11 = $[16];
    }
    return t11;
}
