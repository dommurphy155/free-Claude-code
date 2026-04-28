import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import React from 'react';
import { Box, Text } from '../../ink.js';
import { useDebouncedDigitInput } from './useDebouncedDigitInput.js';
const RESPONSE_INPUTS = ['0', '1', '2', '3'];
const inputToResponse = {
    '0': 'dismissed',
    '1': 'bad',
    '2': 'fine',
    '3': 'good'
};
export const isValidResponseInput = (input) => RESPONSE_INPUTS.includes(input);
const DEFAULT_MESSAGE = 'How is Claude doing this session? (optional)';
export function FeedbackSurveyView(t0) {
    const $ = _c(15);
    const { onSelect, inputValue, setInputValue, message: t1 } = t0;
    const message = t1 === undefined ? DEFAULT_MESSAGE : t1;
    let t2;
    if ($[0] !== onSelect) {
        t2 = digit => onSelect(inputToResponse[digit]);
        $[0] = onSelect;
        $[1] = t2;
    }
    else {
        t2 = $[1];
    }
    let t3;
    if ($[2] !== inputValue || $[3] !== setInputValue || $[4] !== t2) {
        t3 = {
            inputValue,
            setInputValue,
            isValidDigit: isValidResponseInput,
            onDigit: t2
        };
        $[2] = inputValue;
        $[3] = setInputValue;
        $[4] = t2;
        $[5] = t3;
    }
    else {
        t3 = $[5];
    }
    useDebouncedDigitInput(t3);
    let t4;
    if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
        t4 = _jsx(Text, { color: "ansi:cyan", children: "\u25CF " });
        $[6] = t4;
    }
    else {
        t4 = $[6];
    }
    let t5;
    if ($[7] !== message) {
        t5 = _jsxs(Box, { children: [t4, _jsx(Text, { bold: true, children: message })] });
        $[7] = message;
        $[8] = t5;
    }
    else {
        t5 = $[8];
    }
    let t6;
    if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
        t6 = _jsx(Box, { width: 10, children: _jsxs(Text, { children: [_jsx(Text, { color: "ansi:cyan", children: "1" }), ": Bad"] }) });
        $[9] = t6;
    }
    else {
        t6 = $[9];
    }
    let t7;
    if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
        t7 = _jsx(Box, { width: 10, children: _jsxs(Text, { children: [_jsx(Text, { color: "ansi:cyan", children: "2" }), ": Fine"] }) });
        $[10] = t7;
    }
    else {
        t7 = $[10];
    }
    let t8;
    if ($[11] === Symbol.for("react.memo_cache_sentinel")) {
        t8 = _jsx(Box, { width: 10, children: _jsxs(Text, { children: [_jsx(Text, { color: "ansi:cyan", children: "3" }), ": Good"] }) });
        $[11] = t8;
    }
    else {
        t8 = $[11];
    }
    let t9;
    if ($[12] === Symbol.for("react.memo_cache_sentinel")) {
        t9 = _jsxs(Box, { marginLeft: 2, children: [t6, t7, t8, _jsx(Box, { children: _jsxs(Text, { children: [_jsx(Text, { color: "ansi:cyan", children: "0" }), ": Dismiss"] }) })] });
        $[12] = t9;
    }
    else {
        t9 = $[12];
    }
    let t10;
    if ($[13] !== t5) {
        t10 = _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [t5, t9] });
        $[13] = t5;
        $[14] = t10;
    }
    else {
        t10 = $[14];
    }
    return t10;
}
