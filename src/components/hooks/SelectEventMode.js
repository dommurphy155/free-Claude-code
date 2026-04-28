import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
/**
 * SelectEventMode is the entrypoint of the Hooks config menu, where the user
 * sees the list of available hook events.
 *
 * The /hooks menu is read-only: selecting an event lets you browse its
 * configured hooks but not modify them. To add or change hooks, users should
 * edit settings.json directly or ask Claude.
 */
import figures from 'figures';
import * as React from 'react';
import { Box, Link, Text } from '../../ink.js';
import { plural } from '../../utils/stringUtils.js';
import { Select } from '../CustomSelect/select.js';
import { Dialog } from '../design-system/Dialog.js';
export function SelectEventMode(t0) {
    const $ = _c(23);
    const { hookEventMetadata, hooksByEvent, totalHooksCount, restrictedByPolicy, onSelectEvent, onCancel } = t0;
    let t1;
    if ($[0] !== totalHooksCount) {
        t1 = plural(totalHooksCount, "hook");
        $[0] = totalHooksCount;
        $[1] = t1;
    }
    else {
        t1 = $[1];
    }
    const subtitle = `${totalHooksCount} ${t1} configured`;
    let t2;
    if ($[2] !== restrictedByPolicy) {
        t2 = restrictedByPolicy && _jsxs(Box, { flexDirection: "column", children: [_jsxs(Text, { color: "suggestion", children: [figures.info, " Hooks Restricted by Policy"] }), _jsx(Text, { dimColor: true, children: "Only hooks from managed settings can run. User-defined hooks from ~/.claude/settings.json, .claude/settings.json, and .claude/settings.local.json are blocked." })] });
        $[2] = restrictedByPolicy;
        $[3] = t2;
    }
    else {
        t2 = $[3];
    }
    let t3;
    if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
        t3 = _jsx(Box, { flexDirection: "column", children: _jsxs(Text, { dimColor: true, children: [figures.info, " This menu is read-only. To add or modify hooks, edit settings.json directly or ask Claude.", " ", _jsx(Link, { url: "https://code.claude.com/docs/en/hooks", children: "Learn more" })] }) });
        $[4] = t3;
    }
    else {
        t3 = $[4];
    }
    let t4;
    if ($[5] !== onSelectEvent) {
        t4 = value => {
            onSelectEvent(value);
        };
        $[5] = onSelectEvent;
        $[6] = t4;
    }
    else {
        t4 = $[6];
    }
    let t5;
    if ($[7] !== hookEventMetadata) {
        t5 = Object.entries(hookEventMetadata);
        $[7] = hookEventMetadata;
        $[8] = t5;
    }
    else {
        t5 = $[8];
    }
    let t6;
    if ($[9] !== hooksByEvent || $[10] !== t5) {
        t6 = t5.map(t7 => {
            const [name, metadata] = t7;
            const count = hooksByEvent[name] || 0;
            return {
                label: count > 0 ? _jsxs(Text, { children: [name, " ", _jsxs(Text, { color: "suggestion", children: ["(", count, ")"] })] }) : name,
                value: name,
                description: metadata.summary
            };
        });
        $[9] = hooksByEvent;
        $[10] = t5;
        $[11] = t6;
    }
    else {
        t6 = $[11];
    }
    let t7;
    if ($[12] !== onCancel || $[13] !== t4 || $[14] !== t6) {
        t7 = _jsx(Box, { flexDirection: "column", children: _jsx(Select, { onChange: t4, onCancel: onCancel, options: t6 }) });
        $[12] = onCancel;
        $[13] = t4;
        $[14] = t6;
        $[15] = t7;
    }
    else {
        t7 = $[15];
    }
    let t8;
    if ($[16] !== t2 || $[17] !== t7) {
        t8 = _jsxs(Box, { flexDirection: "column", gap: 1, children: [t2, t3, t7] });
        $[16] = t2;
        $[17] = t7;
        $[18] = t8;
    }
    else {
        t8 = $[18];
    }
    let t9;
    if ($[19] !== onCancel || $[20] !== subtitle || $[21] !== t8) {
        t9 = _jsx(Dialog, { title: "Hooks", subtitle: subtitle, onCancel: onCancel, children: t8 });
        $[19] = onCancel;
        $[20] = subtitle;
        $[21] = t8;
        $[22] = t9;
    }
    else {
        t9 = $[22];
    }
    return t9;
}
