import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import React from 'react';
import { Box, Text } from '../../ink.js';
export function SuccessStep(t0) {
    const $ = _c(21);
    const { secretExists, useExistingSecret, secretName, skipWorkflow: t1 } = t0;
    const skipWorkflow = t1 === undefined ? false : t1;
    let t2;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t2 = _jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsx(Text, { bold: true, children: "Install GitHub App" }), _jsx(Text, { dimColor: true, children: "Success" })] });
        $[0] = t2;
    }
    else {
        t2 = $[0];
    }
    let t3;
    if ($[1] !== skipWorkflow) {
        t3 = !skipWorkflow && _jsx(Text, { color: "success", children: "\u2713 GitHub Actions workflow created!" });
        $[1] = skipWorkflow;
        $[2] = t3;
    }
    else {
        t3 = $[2];
    }
    let t4;
    if ($[3] !== secretExists || $[4] !== useExistingSecret) {
        t4 = secretExists && useExistingSecret && _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: "success", children: "\u2713 Using existing ANTHROPIC_API_KEY secret" }) });
        $[3] = secretExists;
        $[4] = useExistingSecret;
        $[5] = t4;
    }
    else {
        t4 = $[5];
    }
    let t5;
    if ($[6] !== secretExists || $[7] !== secretName || $[8] !== useExistingSecret) {
        t5 = (!secretExists || !useExistingSecret) && _jsx(Box, { marginTop: 1, children: _jsxs(Text, { color: "success", children: ["\u2713 API key saved as ", secretName, " secret"] }) });
        $[6] = secretExists;
        $[7] = secretName;
        $[8] = useExistingSecret;
        $[9] = t5;
    }
    else {
        t5 = $[9];
    }
    let t6;
    if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
        t6 = _jsx(Box, { marginTop: 1, children: _jsx(Text, { children: "Next steps:" }) });
        $[10] = t6;
    }
    else {
        t6 = $[10];
    }
    let t7;
    if ($[11] !== skipWorkflow) {
        t7 = skipWorkflow ? _jsxs(_Fragment, { children: [_jsx(Text, { children: "1. Install the Claude GitHub App if you haven't already" }), _jsx(Text, { children: "2. Your workflow file was kept unchanged" }), _jsx(Text, { children: "3. API key is configured and ready to use" })] }) : _jsxs(_Fragment, { children: [_jsx(Text, { children: "1. A pre-filled PR page has been created" }), _jsx(Text, { children: "2. Install the Claude GitHub App if you haven't already" }), _jsx(Text, { children: "3. Merge the PR to enable Claude PR assistance" })] });
        $[11] = skipWorkflow;
        $[12] = t7;
    }
    else {
        t7 = $[12];
    }
    let t8;
    if ($[13] !== t3 || $[14] !== t4 || $[15] !== t5 || $[16] !== t7) {
        t8 = _jsxs(Box, { flexDirection: "column", borderStyle: "round", paddingX: 1, children: [t2, t3, t4, t5, t6, t7] });
        $[13] = t3;
        $[14] = t4;
        $[15] = t5;
        $[16] = t7;
        $[17] = t8;
    }
    else {
        t8 = $[17];
    }
    let t9;
    if ($[18] === Symbol.for("react.memo_cache_sentinel")) {
        t9 = _jsx(Box, { marginLeft: 3, children: _jsx(Text, { dimColor: true, children: "Press any key to exit" }) });
        $[18] = t9;
    }
    else {
        t9 = $[18];
    }
    let t10;
    if ($[19] !== t8) {
        t10 = _jsxs(_Fragment, { children: [t8, t9] });
        $[19] = t8;
        $[20] = t10;
    }
    else {
        t10 = $[20];
    }
    return t10;
}
