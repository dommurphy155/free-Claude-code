import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import figures from 'figures';
import * as React from 'react';
import { Box, Text } from '../ink.js';
import { formatTokens } from '../utils/format.js';
import { StatusIcon } from './design-system/StatusIcon.js';
export function ContextSuggestions(t0) {
    const $ = _c(5);
    const { suggestions } = t0;
    if (suggestions.length === 0) {
        return null;
    }
    let t1;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = _jsx(Text, { bold: true, children: "Suggestions" });
        $[0] = t1;
    }
    else {
        t1 = $[0];
    }
    let t2;
    if ($[1] !== suggestions) {
        t2 = suggestions.map(_temp);
        $[1] = suggestions;
        $[2] = t2;
    }
    else {
        t2 = $[2];
    }
    let t3;
    if ($[3] !== t2) {
        t3 = _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [t1, t2] });
        $[3] = t2;
        $[4] = t3;
    }
    else {
        t3 = $[4];
    }
    return t3;
}
function _temp(suggestion, i) {
    return _jsxs(Box, { flexDirection: "column", marginTop: i === 0 ? 0 : 1, children: [_jsxs(Box, { children: [_jsx(StatusIcon, { status: suggestion.severity, withSpace: true }), _jsx(Text, { bold: true, children: suggestion.title }), suggestion.savingsTokens ? _jsxs(Text, { dimColor: true, children: [" ", figures.arrowRight, " save ~", formatTokens(suggestion.savingsTokens)] }) : null] }), _jsx(Box, { marginLeft: 2, children: _jsx(Text, { dimColor: true, children: suggestion.detail }) })] }, i);
}
