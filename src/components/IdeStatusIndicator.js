import { jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import { basename } from 'path';
import * as React from 'react';
import { useIdeConnectionStatus } from '../hooks/useIdeConnectionStatus.js';
import { Text } from '../ink.js';
export function IdeStatusIndicator(t0) {
    const $ = _c(7);
    const { ideSelection, mcpClients } = t0;
    const { status: ideStatus } = useIdeConnectionStatus(mcpClients);
    const shouldShowIdeSelection = ideStatus === "connected" && (ideSelection?.filePath || ideSelection?.text && ideSelection.lineCount > 0);
    if (ideStatus === null || !shouldShowIdeSelection || !ideSelection) {
        return null;
    }
    if (ideSelection.text && ideSelection.lineCount > 0) {
        const t1 = ideSelection.lineCount === 1 ? "line" : "lines";
        let t2;
        if ($[0] !== ideSelection.lineCount || $[1] !== t1) {
            t2 = _jsxs(Text, { color: "ide", wrap: "truncate", children: ["\u29C9 ", ideSelection.lineCount, " ", t1, " selected"] }, "selection-indicator");
            $[0] = ideSelection.lineCount;
            $[1] = t1;
            $[2] = t2;
        }
        else {
            t2 = $[2];
        }
        return t2;
    }
    if (ideSelection.filePath) {
        let t1;
        if ($[3] !== ideSelection.filePath) {
            t1 = basename(ideSelection.filePath);
            $[3] = ideSelection.filePath;
            $[4] = t1;
        }
        else {
            t1 = $[4];
        }
        let t2;
        if ($[5] !== t1) {
            t2 = _jsxs(Text, { color: "ide", wrap: "truncate", children: ["\u29C9 In ", t1] }, "selection-indicator");
            $[5] = t1;
            $[6] = t2;
        }
        else {
            t2 = $[6];
        }
        return t2;
    }
}
