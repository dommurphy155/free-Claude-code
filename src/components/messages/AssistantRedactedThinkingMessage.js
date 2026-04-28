import { jsx as _jsx } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import React from 'react';
import { Box, Text } from '../../ink.js';
export function AssistantRedactedThinkingMessage(t0) {
    const $ = _c(3);
    const { addMargin: t1 } = t0;
    const addMargin = t1 === undefined ? false : t1;
    const t2 = addMargin ? 1 : 0;
    let t3;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t3 = _jsx(Text, { dimColor: true, italic: true, children: "\u273B Thinking\u2026" });
        $[0] = t3;
    }
    else {
        t3 = $[0];
    }
    let t4;
    if ($[1] !== t2) {
        t4 = _jsx(Box, { marginTop: t2, children: t3 });
        $[1] = t2;
        $[2] = t4;
    }
    else {
        t4 = $[2];
    }
    return t4;
}
