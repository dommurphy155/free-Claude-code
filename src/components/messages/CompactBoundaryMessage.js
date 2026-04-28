import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import * as React from 'react';
import { Box, Text } from '../../ink.js';
import { useShortcutDisplay } from '../../keybindings/useShortcutDisplay.js';
export function CompactBoundaryMessage() {
    const $ = _c(2);
    const historyShortcut = useShortcutDisplay("app:toggleTranscript", "Global", "ctrl+o");
    let t0;
    if ($[0] !== historyShortcut) {
        t0 = _jsx(Box, { marginY: 1, children: _jsxs(Text, { dimColor: true, children: ["\u273B Conversation compacted (", historyShortcut, " for history)"] }) });
        $[0] = historyShortcut;
        $[1] = t0;
    }
    else {
        t0 = $[1];
    }
    return t0;
}
