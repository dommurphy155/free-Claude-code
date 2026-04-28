import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import * as React from 'react';
import { Markdown } from 'src/components/Markdown.js';
import { MessageResponse } from 'src/components/MessageResponse.js';
import { Box, Text } from '../../../ink.js';
export function RejectedPlanMessage(t0) {
    const $ = _c(3);
    const { plan } = t0;
    let t1;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = _jsx(Text, { color: "subtle", children: "User rejected Claude's plan:" });
        $[0] = t1;
    }
    else {
        t1 = $[0];
    }
    let t2;
    if ($[1] !== plan) {
        t2 = _jsx(MessageResponse, { children: _jsxs(Box, { flexDirection: "column", children: [t1, _jsx(Box, { borderStyle: "round", borderColor: "planMode", paddingX: 1, overflow: "hidden", children: _jsx(Markdown, { children: plan }) })] }) });
        $[1] = plan;
        $[2] = t2;
    }
    else {
        t2 = $[2];
    }
    return t2;
}
