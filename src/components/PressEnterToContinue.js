import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import * as React from 'react';
import { Text } from '../ink.js';
export function PressEnterToContinue() {
    const $ = _c(1);
    let t0;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = _jsxs(Text, { color: "permission", children: ["Press ", _jsx(Text, { bold: true, children: "Enter" }), " to continue\u2026"] });
        $[0] = t0;
    }
    else {
        t0 = $[0];
    }
    return t0;
}
