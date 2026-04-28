import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import * as React from 'react';
import { Text } from '../ink.js';
export function InterruptedByUser() {
    const $ = _c(1);
    let t0;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = _jsxs(_Fragment, { children: [_jsx(Text, { dimColor: true, children: "Interrupted " }), false ? _jsx(Text, { dimColor: true, children: "\u00B7 [ANT-ONLY] /issue to report a model issue" }) : _jsx(Text, { dimColor: true, children: "\u00B7 What should Claude do instead?" })] });
        $[0] = t0;
    }
    else {
        t0 = $[0];
    }
    return t0;
}
