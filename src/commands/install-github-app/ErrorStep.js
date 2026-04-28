import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import React from 'react';
import { GITHUB_ACTION_SETUP_DOCS_URL } from '../../constants/github-app.js';
import { Box, Text } from '../../ink.js';
export function ErrorStep(t0) {
    const $ = _c(15);
    const { error, errorReason, errorInstructions } = t0;
    let t1;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = _jsx(Box, { flexDirection: "column", marginBottom: 1, children: _jsx(Text, { bold: true, children: "Install GitHub App" }) });
        $[0] = t1;
    }
    else {
        t1 = $[0];
    }
    let t2;
    if ($[1] !== error) {
        t2 = _jsxs(Text, { color: "error", children: ["Error: ", error] });
        $[1] = error;
        $[2] = t2;
    }
    else {
        t2 = $[2];
    }
    let t3;
    if ($[3] !== errorReason) {
        t3 = errorReason && _jsx(Box, { marginTop: 1, children: _jsxs(Text, { dimColor: true, children: ["Reason: ", errorReason] }) });
        $[3] = errorReason;
        $[4] = t3;
    }
    else {
        t3 = $[4];
    }
    let t4;
    if ($[5] !== errorInstructions) {
        t4 = errorInstructions && errorInstructions.length > 0 && _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { dimColor: true, children: "How to fix:" }), errorInstructions.map(_temp)] });
        $[5] = errorInstructions;
        $[6] = t4;
    }
    else {
        t4 = $[6];
    }
    let t5;
    if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
        t5 = _jsx(Box, { marginTop: 1, children: _jsxs(Text, { dimColor: true, children: ["For manual setup instructions, see:", " ", _jsx(Text, { color: "claude", children: GITHUB_ACTION_SETUP_DOCS_URL })] }) });
        $[7] = t5;
    }
    else {
        t5 = $[7];
    }
    let t6;
    if ($[8] !== t2 || $[9] !== t3 || $[10] !== t4) {
        t6 = _jsxs(Box, { flexDirection: "column", borderStyle: "round", paddingX: 1, children: [t1, t2, t3, t4, t5] });
        $[8] = t2;
        $[9] = t3;
        $[10] = t4;
        $[11] = t6;
    }
    else {
        t6 = $[11];
    }
    let t7;
    if ($[12] === Symbol.for("react.memo_cache_sentinel")) {
        t7 = _jsx(Box, { marginLeft: 3, children: _jsx(Text, { dimColor: true, children: "Press any key to exit" }) });
        $[12] = t7;
    }
    else {
        t7 = $[12];
    }
    let t8;
    if ($[13] !== t6) {
        t8 = _jsxs(_Fragment, { children: [t6, t7] });
        $[13] = t6;
        $[14] = t8;
    }
    else {
        t8 = $[14];
    }
    return t8;
}
function _temp(instruction, index) {
    return _jsxs(Box, { marginLeft: 2, children: [_jsx(Text, { dimColor: true, children: "\u2022 " }), _jsx(Text, { children: instruction })] }, index);
}
