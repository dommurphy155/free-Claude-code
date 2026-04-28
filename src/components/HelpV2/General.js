import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import * as React from 'react';
import { Box, Text } from '../../ink.js';
import { PromptInputHelpMenu } from '../PromptInput/PromptInputHelpMenu.js';
export function General() {
    const $ = _c(2);
    let t0;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = _jsx(Box, { children: _jsx(Text, { children: "Claude understands your codebase, makes edits with your permission, and executes commands \u2014 right from your terminal." }) });
        $[0] = t0;
    }
    else {
        t0 = $[0];
    }
    let t1;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = _jsxs(Box, { flexDirection: "column", paddingY: 1, gap: 1, children: [t0, _jsxs(Box, { flexDirection: "column", children: [_jsx(Box, { children: _jsx(Text, { bold: true, children: "Shortcuts" }) }), _jsx(PromptInputHelpMenu, { gap: 2, fixedWidth: true })] })] });
        $[1] = t1;
    }
    else {
        t1 = $[1];
    }
    return t1;
}
