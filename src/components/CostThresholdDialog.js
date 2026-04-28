import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import React from 'react';
import { Box, Link, Text } from '../ink.js';
import { Select } from './CustomSelect/index.js';
import { Dialog } from './design-system/Dialog.js';
export function CostThresholdDialog(t0) {
    const $ = _c(7);
    const { onDone } = t0;
    let t1;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = _jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { children: "Learn more about how to monitor your spending:" }), _jsx(Link, { url: "https://code.claude.com/docs/en/costs" })] });
        $[0] = t1;
    }
    else {
        t1 = $[0];
    }
    let t2;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        t2 = [{
                value: "ok",
                label: "Got it, thanks!"
            }];
        $[1] = t2;
    }
    else {
        t2 = $[1];
    }
    let t3;
    if ($[2] !== onDone) {
        t3 = _jsx(Select, { options: t2, onChange: onDone });
        $[2] = onDone;
        $[3] = t3;
    }
    else {
        t3 = $[3];
    }
    let t4;
    if ($[4] !== onDone || $[5] !== t3) {
        t4 = _jsxs(Dialog, { title: "You've spent $5 on the Anthropic API this session.", onCancel: onDone, children: [t1, t3] });
        $[4] = onDone;
        $[5] = t3;
        $[6] = t4;
    }
    else {
        t4 = $[6];
    }
    return t4;
}
