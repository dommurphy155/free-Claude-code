import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import React from 'react';
import Text from '../../ink/components/Text.js';
/**
 * Renders a keyboard shortcut hint like "ctrl+o to expand" or "(tab to toggle)"
 *
 * Wrap in <Text dimColor> for the common dim styling.
 *
 * @example
 * // Simple hint wrapped in dim Text
 * <Text dimColor><KeyboardShortcutHint shortcut="esc" action="cancel" /></Text>
 *
 * // With parentheses: "(ctrl+o to expand)"
 * <Text dimColor><KeyboardShortcutHint shortcut="ctrl+o" action="expand" parens /></Text>
 *
 * // With bold shortcut: "Enter to confirm" (Enter is bold)
 * <Text dimColor><KeyboardShortcutHint shortcut="Enter" action="confirm" bold /></Text>
 *
 * // Multiple hints with middot separator - use Byline
 * <Text dimColor>
 *   <Byline>
 *     <KeyboardShortcutHint shortcut="Enter" action="confirm" />
 *     <KeyboardShortcutHint shortcut="Esc" action="cancel" />
 *   </Byline>
 * </Text>
 */
export function KeyboardShortcutHint(t0) {
    const $ = _c(9);
    const { shortcut, action, parens: t1, bold: t2 } = t0;
    const parens = t1 === undefined ? false : t1;
    const bold = t2 === undefined ? false : t2;
    let t3;
    if ($[0] !== bold || $[1] !== shortcut) {
        t3 = bold ? _jsx(Text, { bold: true, children: shortcut }) : shortcut;
        $[0] = bold;
        $[1] = shortcut;
        $[2] = t3;
    }
    else {
        t3 = $[2];
    }
    const shortcutText = t3;
    if (parens) {
        let t4;
        if ($[3] !== action || $[4] !== shortcutText) {
            t4 = _jsxs(Text, { children: ["(", shortcutText, " to ", action, ")"] });
            $[3] = action;
            $[4] = shortcutText;
            $[5] = t4;
        }
        else {
            t4 = $[5];
        }
        return t4;
    }
    let t4;
    if ($[6] !== action || $[7] !== shortcutText) {
        t4 = _jsxs(Text, { children: [shortcutText, " to ", action] });
        $[6] = action;
        $[7] = shortcutText;
        $[8] = t4;
    }
    else {
        t4 = $[8];
    }
    return t4;
}
