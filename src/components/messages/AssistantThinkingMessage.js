import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import React from 'react';
import { Box, Text } from '../../ink.js';
import { CtrlOToExpand } from '../CtrlOToExpand.js';
import { Markdown } from '../Markdown.js';
export function AssistantThinkingMessage(t0) {
    const $ = _c(9);
    const { param: t1, addMargin: t2, isTranscriptMode, verbose, hideInTranscript: t3 } = t0;
    const { thinking } = t1;
    const addMargin = t2 === undefined ? false : t2;
    const hideInTranscript = t3 === undefined ? false : t3;
    if (!thinking) {
        return null;
    }
    if (hideInTranscript) {
        return null;
    }
    const shouldShowFullThinking = isTranscriptMode || verbose;
    if (!shouldShowFullThinking) {
        const t4 = addMargin ? 1 : 0;
        let t5;
        if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
            t5 = _jsxs(Text, { dimColor: true, italic: true, children: ["\u2234 Thinking", " ", _jsx(CtrlOToExpand, {})] });
            $[0] = t5;
        }
        else {
            t5 = $[0];
        }
        let t6;
        if ($[1] !== t4) {
            t6 = _jsx(Box, { marginTop: t4, children: t5 });
            $[1] = t4;
            $[2] = t6;
        }
        else {
            t6 = $[2];
        }
        return t6;
    }
    const t4 = addMargin ? 1 : 0;
    let t5;
    if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
        t5 = _jsxs(Text, { dimColor: true, italic: true, children: ["\u2234 Thinking", "\u2026"] });
        $[3] = t5;
    }
    else {
        t5 = $[3];
    }
    let t6;
    if ($[4] !== thinking) {
        t6 = _jsx(Box, { paddingLeft: 2, children: _jsx(Markdown, { dimColor: true, children: thinking }) });
        $[4] = thinking;
        $[5] = t6;
    }
    else {
        t6 = $[5];
    }
    let t7;
    if ($[6] !== t4 || $[7] !== t6) {
        t7 = _jsxs(Box, { flexDirection: "column", gap: 1, marginTop: t4, width: "100%", children: [t5, t6] });
        $[6] = t4;
        $[7] = t6;
        $[8] = t7;
    }
    else {
        t7 = $[8];
    }
    return t7;
}
