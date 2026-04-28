import { jsx as _jsx } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import * as React from 'react';
import { useShortcutDisplay } from '../keybindings/useShortcutDisplay.js';
import { KeyboardShortcutHint } from './design-system/KeyboardShortcutHint.js';
/**
 * KeyboardShortcutHint that displays the user-configured shortcut.
 * Falls back to default if keybinding context is not available.
 *
 * @example
 * <ConfigurableShortcutHint
 *   action="app:toggleTranscript"
 *   context="Global"
 *   fallback="ctrl+o"
 *   description="expand"
 * />
 */
export function ConfigurableShortcutHint(t0) {
    const $ = _c(5);
    const { action, context, fallback, description, parens, bold } = t0;
    const shortcut = useShortcutDisplay(action, context, fallback);
    let t1;
    if ($[0] !== bold || $[1] !== description || $[2] !== parens || $[3] !== shortcut) {
        t1 = _jsx(KeyboardShortcutHint, { shortcut: shortcut, action: description, parens: parens, bold: bold });
        $[0] = bold;
        $[1] = description;
        $[2] = parens;
        $[3] = shortcut;
        $[4] = t1;
    }
    else {
        t1 = $[4];
    }
    return t1;
}
