import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
/**
 * SelectMatcherMode shows the configured matchers for a selected hook event.
 *
 * The /hooks menu is read-only: this view no longer offers "add new matcher"
 * and simply lets the user drill into each matcher to see its hooks.
 */
import * as React from 'react';
import { Box, Text } from '../../ink.js';
import { hookSourceInlineDisplayString } from '../../utils/hooks/hooksSettings.js';
import { plural } from '../../utils/stringUtils.js';
import { Select } from '../CustomSelect/select.js';
import { Dialog } from '../design-system/Dialog.js';
export function SelectMatcherMode(t0) {
    const $ = _c(25);
    const { selectedEvent, matchersForSelectedEvent, hooksByEventAndMatcher, eventDescription, onSelect, onCancel } = t0;
    let t1;
    if ($[0] !== hooksByEventAndMatcher || $[1] !== matchersForSelectedEvent || $[2] !== selectedEvent) {
        let t2;
        if ($[4] !== hooksByEventAndMatcher || $[5] !== selectedEvent) {
            t2 = matcher => {
                const hooks = hooksByEventAndMatcher[selectedEvent]?.[matcher] || [];
                const sources = Array.from(new Set(hooks.map(_temp)));
                return {
                    matcher,
                    sources,
                    hookCount: hooks.length
                };
            };
            $[4] = hooksByEventAndMatcher;
            $[5] = selectedEvent;
            $[6] = t2;
        }
        else {
            t2 = $[6];
        }
        t1 = matchersForSelectedEvent.map(t2);
        $[0] = hooksByEventAndMatcher;
        $[1] = matchersForSelectedEvent;
        $[2] = selectedEvent;
        $[3] = t1;
    }
    else {
        t1 = $[3];
    }
    const matchersWithSources = t1;
    if (matchersForSelectedEvent.length === 0) {
        const t2 = `${selectedEvent} - Matchers`;
        let t3;
        if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
            t3 = _jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { dimColor: true, children: "No hooks configured for this event." }), _jsx(Text, { dimColor: true, children: "To add hooks, edit settings.json directly or ask Claude." })] });
            $[7] = t3;
        }
        else {
            t3 = $[7];
        }
        let t4;
        if ($[8] !== eventDescription || $[9] !== onCancel || $[10] !== t2) {
            t4 = _jsx(Dialog, { title: t2, subtitle: eventDescription, onCancel: onCancel, inputGuide: _temp2, children: t3 });
            $[8] = eventDescription;
            $[9] = onCancel;
            $[10] = t2;
            $[11] = t4;
        }
        else {
            t4 = $[11];
        }
        return t4;
    }
    const t2 = `${selectedEvent} - Matchers`;
    let t3;
    if ($[12] !== matchersWithSources) {
        t3 = matchersWithSources.map(_temp3);
        $[12] = matchersWithSources;
        $[13] = t3;
    }
    else {
        t3 = $[13];
    }
    let t4;
    if ($[14] !== onSelect) {
        t4 = value => {
            onSelect(value);
        };
        $[14] = onSelect;
        $[15] = t4;
    }
    else {
        t4 = $[15];
    }
    let t5;
    if ($[16] !== onCancel || $[17] !== t3 || $[18] !== t4) {
        t5 = _jsx(Box, { flexDirection: "column", children: _jsx(Select, { options: t3, onChange: t4, onCancel: onCancel }) });
        $[16] = onCancel;
        $[17] = t3;
        $[18] = t4;
        $[19] = t5;
    }
    else {
        t5 = $[19];
    }
    let t6;
    if ($[20] !== eventDescription || $[21] !== onCancel || $[22] !== t2 || $[23] !== t5) {
        t6 = _jsx(Dialog, { title: t2, subtitle: eventDescription, onCancel: onCancel, children: t5 });
        $[20] = eventDescription;
        $[21] = onCancel;
        $[22] = t2;
        $[23] = t5;
        $[24] = t6;
    }
    else {
        t6 = $[24];
    }
    return t6;
}
function _temp3(item) {
    const sourceText = item.sources.map(hookSourceInlineDisplayString).join(", ");
    const matcherLabel = item.matcher || "(all)";
    return {
        label: `[${sourceText}] ${matcherLabel}`,
        value: item.matcher,
        description: `${item.hookCount} ${plural(item.hookCount, "hook")}`
    };
}
function _temp2() {
    return _jsx(Text, { children: "Esc to go back" });
}
function _temp(h) {
    return h.source;
}
