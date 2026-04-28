import { jsx as _jsx } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import React from 'react';
import { Text } from '../../ink.js';
export function CheckGitHubStep() {
    const $ = _c(1);
    let t0;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = _jsx(Text, { children: "Checking GitHub CLI installation\u2026" });
        $[0] = t0;
    }
    else {
        t0 = $[0];
    }
    return t0;
}
