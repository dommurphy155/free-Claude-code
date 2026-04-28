import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import * as React from 'react';
import { useEffect, useState } from 'react';
import { Box, Text } from '../ink.js';
import { SandboxManager } from '../utils/sandbox/sandbox-adapter.js';
/**
 * Format a timestamp as "h:mm:ssa" (e.g., "1:30:45pm").
 * Replaces date-fns format() to avoid pulling in a 39MB dependency for one call.
 */
function formatTime(date) {
    const h = date.getHours() % 12 || 12;
    const m = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    const ampm = date.getHours() < 12 ? 'am' : 'pm';
    return `${h}:${m}:${s}${ampm}`;
}
import { getPlatform } from 'src/utils/platform.js';
export function SandboxViolationExpandedView() {
    const $ = _c(15);
    let t0;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = [];
        $[0] = t0;
    }
    else {
        t0 = $[0];
    }
    const [violations, setViolations] = useState(t0);
    const [totalCount, setTotalCount] = useState(0);
    let t1;
    let t2;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = () => {
            const store = SandboxManager.getSandboxViolationStore();
            const unsubscribe = store.subscribe(allViolations => {
                setViolations(allViolations.slice(-10));
                setTotalCount(store.getTotalCount());
            });
            return unsubscribe;
        };
        t2 = [];
        $[1] = t1;
        $[2] = t2;
    }
    else {
        t1 = $[1];
        t2 = $[2];
    }
    useEffect(t1, t2);
    if (!SandboxManager.isSandboxingEnabled() || getPlatform() === "linux") {
        return null;
    }
    if (totalCount === 0) {
        return null;
    }
    const t3 = totalCount === 1 ? "operation" : "operations";
    let t4;
    if ($[3] !== t3 || $[4] !== totalCount) {
        t4 = _jsx(Box, { marginLeft: 0, children: _jsxs(Text, { color: "permission", children: ["\u29C8 Sandbox blocked ", totalCount, " total", " ", t3] }) });
        $[3] = t3;
        $[4] = totalCount;
        $[5] = t4;
    }
    else {
        t4 = $[5];
    }
    let t5;
    if ($[6] !== violations) {
        t5 = violations.map(_temp);
        $[6] = violations;
        $[7] = t5;
    }
    else {
        t5 = $[7];
    }
    const t6 = Math.min(10, violations.length);
    let t7;
    if ($[8] !== t6 || $[9] !== totalCount) {
        t7 = _jsx(Box, { paddingLeft: 2, children: _jsxs(Text, { dimColor: true, children: ["\u2026 showing last ", t6, " of ", totalCount] }) });
        $[8] = t6;
        $[9] = totalCount;
        $[10] = t7;
    }
    else {
        t7 = $[10];
    }
    let t8;
    if ($[11] !== t4 || $[12] !== t5 || $[13] !== t7) {
        t8 = _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [t4, t5, t7] });
        $[11] = t4;
        $[12] = t5;
        $[13] = t7;
        $[14] = t8;
    }
    else {
        t8 = $[14];
    }
    return t8;
}
function _temp(v, i) {
    return _jsx(Box, { paddingLeft: 2, children: _jsxs(Text, { dimColor: true, children: [formatTime(v.timestamp), v.command ? ` ${v.command}:` : "", " ", v.line] }) }, `${v.timestamp.getTime()}-${i}`);
}
