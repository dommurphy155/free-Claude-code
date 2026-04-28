import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import * as React from 'react';
import { BLACK_CIRCLE } from '../constants/figures.js';
import { Box, Text } from '../ink.js';
import { getUserMessageText } from '../utils/messages.js';
import { ConfigurableShortcutHint } from './ConfigurableShortcutHint.js';
import { MessageResponse } from './MessageResponse.js';
export function CompactSummary(t0) {
    const $ = _c(24);
    const { message, screen } = t0;
    const isTranscriptMode = screen === "transcript";
    let t1;
    if ($[0] !== message) {
        t1 = getUserMessageText(message) || "";
        $[0] = message;
        $[1] = t1;
    }
    else {
        t1 = $[1];
    }
    const textContent = t1;
    const metadata = message.summarizeMetadata;
    if (metadata) {
        let t2;
        if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
            t2 = _jsx(Box, { minWidth: 2, children: _jsx(Text, { color: "text", children: BLACK_CIRCLE }) });
            $[2] = t2;
        }
        else {
            t2 = $[2];
        }
        let t3;
        if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
            t3 = _jsx(Text, { bold: true, children: "Summarized conversation" });
            $[3] = t3;
        }
        else {
            t3 = $[3];
        }
        let t4;
        if ($[4] !== isTranscriptMode || $[5] !== metadata) {
            t4 = !isTranscriptMode && _jsx(MessageResponse, { children: _jsxs(Box, { flexDirection: "column", children: [_jsxs(Text, { dimColor: true, children: ["Summarized ", metadata.messagesSummarized, " messages", " ", metadata.direction === "up_to" ? "up to this point" : "from this point"] }), metadata.userContext && _jsxs(Text, { dimColor: true, children: ["Context: ", "\u201C", metadata.userContext, "\u201D"] }), _jsx(Text, { dimColor: true, children: _jsx(ConfigurableShortcutHint, { action: "app:toggleTranscript", context: "Global", fallback: "ctrl+o", description: "expand history", parens: true }) })] }) });
            $[4] = isTranscriptMode;
            $[5] = metadata;
            $[6] = t4;
        }
        else {
            t4 = $[6];
        }
        let t5;
        if ($[7] !== isTranscriptMode || $[8] !== textContent) {
            t5 = isTranscriptMode && _jsx(MessageResponse, { children: _jsx(Text, { children: textContent }) });
            $[7] = isTranscriptMode;
            $[8] = textContent;
            $[9] = t5;
        }
        else {
            t5 = $[9];
        }
        let t6;
        if ($[10] !== t4 || $[11] !== t5) {
            t6 = _jsx(Box, { flexDirection: "column", marginTop: 1, children: _jsxs(Box, { flexDirection: "row", children: [t2, _jsxs(Box, { flexDirection: "column", children: [t3, t4, t5] })] }) });
            $[10] = t4;
            $[11] = t5;
            $[12] = t6;
        }
        else {
            t6 = $[12];
        }
        return t6;
    }
    let t2;
    if ($[13] === Symbol.for("react.memo_cache_sentinel")) {
        t2 = _jsx(Box, { minWidth: 2, children: _jsx(Text, { color: "text", children: BLACK_CIRCLE }) });
        $[13] = t2;
    }
    else {
        t2 = $[13];
    }
    let t3;
    if ($[14] !== isTranscriptMode) {
        t3 = !isTranscriptMode && _jsxs(Text, { dimColor: true, children: [" ", _jsx(ConfigurableShortcutHint, { action: "app:toggleTranscript", context: "Global", fallback: "ctrl+o", description: "expand", parens: true })] });
        $[14] = isTranscriptMode;
        $[15] = t3;
    }
    else {
        t3 = $[15];
    }
    let t4;
    if ($[16] !== t3) {
        t4 = _jsxs(Box, { flexDirection: "row", children: [t2, _jsx(Box, { flexDirection: "column", children: _jsxs(Text, { bold: true, children: ["Compact summary", t3] }) })] });
        $[16] = t3;
        $[17] = t4;
    }
    else {
        t4 = $[17];
    }
    let t5;
    if ($[18] !== isTranscriptMode || $[19] !== textContent) {
        t5 = isTranscriptMode && _jsx(MessageResponse, { children: _jsx(Text, { children: textContent }) });
        $[18] = isTranscriptMode;
        $[19] = textContent;
        $[20] = t5;
    }
    else {
        t5 = $[20];
    }
    let t6;
    if ($[21] !== t4 || $[22] !== t5) {
        t6 = _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [t4, t5] });
        $[21] = t4;
        $[22] = t5;
        $[23] = t6;
    }
    else {
        t6 = $[23];
    }
    return t6;
}
