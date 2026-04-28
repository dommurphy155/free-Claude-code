import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import React from 'react';
import { BLACK_CIRCLE } from '../../constants/figures.js';
import { Box, Text } from '../../ink.js';
import { useDebouncedDigitInput } from './useDebouncedDigitInput.js';
const RESPONSE_INPUTS = ['1', '2', '3'];
const inputToResponse = {
    '1': 'yes',
    '2': 'no',
    '3': 'dont_ask_again'
};
const isValidResponseInput = (input) => RESPONSE_INPUTS.includes(input);
export function TranscriptSharePrompt(t0) {
    const $ = _c(11);
    const { onSelect, inputValue, setInputValue } = t0;
    let t1;
    if ($[0] !== onSelect) {
        t1 = digit => onSelect(inputToResponse[digit]);
        $[0] = onSelect;
        $[1] = t1;
    }
    else {
        t1 = $[1];
    }
    let t2;
    if ($[2] !== inputValue || $[3] !== setInputValue || $[4] !== t1) {
        t2 = {
            inputValue,
            setInputValue,
            isValidDigit: isValidResponseInput,
            onDigit: t1
        };
        $[2] = inputValue;
        $[3] = setInputValue;
        $[4] = t1;
        $[5] = t2;
    }
    else {
        t2 = $[5];
    }
    useDebouncedDigitInput(t2);
    let t3;
    if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
        t3 = _jsxs(Box, { children: [_jsxs(Text, { color: "ansi:cyan", children: [BLACK_CIRCLE, " "] }), _jsx(Text, { bold: true, children: "Can Anthropic look at your session transcript to help us improve Claude Code?" })] });
        $[6] = t3;
    }
    else {
        t3 = $[6];
    }
    let t4;
    if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
        t4 = _jsx(Box, { marginLeft: 2, children: _jsx(Text, { dimColor: true, children: "Learn more: https://code.claude.com/docs/en/data-usage#session-quality-surveys" }) });
        $[7] = t4;
    }
    else {
        t4 = $[7];
    }
    let t5;
    if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
        t5 = _jsx(Box, { width: 10, children: _jsxs(Text, { children: [_jsx(Text, { color: "ansi:cyan", children: "1" }), ": Yes"] }) });
        $[8] = t5;
    }
    else {
        t5 = $[8];
    }
    let t6;
    if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
        t6 = _jsx(Box, { width: 10, children: _jsxs(Text, { children: [_jsx(Text, { color: "ansi:cyan", children: "2" }), ": No"] }) });
        $[9] = t6;
    }
    else {
        t6 = $[9];
    }
    let t7;
    if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
        t7 = _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [t3, t4, _jsxs(Box, { marginLeft: 2, children: [t5, t6, _jsx(Box, { children: _jsxs(Text, { children: [_jsx(Text, { color: "ansi:cyan", children: "3" }), ": Don't ask again"] }) })] })] });
        $[10] = t7;
    }
    else {
        t7 = $[10];
    }
    return t7;
}
