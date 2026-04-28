import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import React from 'react';
import { Box, Text } from '../../ink.js';
import { Spinner } from '../Spinner.js';
/**
 * A spinner with loading message for async operations.
 *
 * @example
 * // Basic loading
 * <LoadingState message="Loading..." />
 *
 * @example
 * // Bold loading message
 * <LoadingState message="Loading sessions" bold />
 *
 * @example
 * // With subtitle
 * <LoadingState
 *   message="Loading sessions"
 *   bold
 *   subtitle="Fetching your Claude Code sessions..."
 * />
 */
export function LoadingState(t0) {
    const $ = _c(10);
    const { message, bold: t1, dimColor: t2, subtitle } = t0;
    const bold = t1 === undefined ? false : t1;
    const dimColor = t2 === undefined ? false : t2;
    let t3;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t3 = _jsx(Spinner, {});
        $[0] = t3;
    }
    else {
        t3 = $[0];
    }
    let t4;
    if ($[1] !== bold || $[2] !== dimColor || $[3] !== message) {
        t4 = _jsxs(Box, { flexDirection: "row", children: [t3, _jsxs(Text, { bold: bold, dimColor: dimColor, children: [" ", message] })] });
        $[1] = bold;
        $[2] = dimColor;
        $[3] = message;
        $[4] = t4;
    }
    else {
        t4 = $[4];
    }
    let t5;
    if ($[5] !== subtitle) {
        t5 = subtitle && _jsx(Text, { dimColor: true, children: subtitle });
        $[5] = subtitle;
        $[6] = t5;
    }
    else {
        t5 = $[6];
    }
    let t6;
    if ($[7] !== t4 || $[8] !== t5) {
        t6 = _jsxs(Box, { flexDirection: "column", children: [t4, t5] });
        $[7] = t4;
        $[8] = t5;
        $[9] = t6;
    }
    else {
        t6 = $[9];
    }
    return t6;
}
