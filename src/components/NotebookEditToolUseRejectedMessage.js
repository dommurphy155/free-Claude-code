import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import { relative } from 'path';
import * as React from 'react';
import { getCwd } from 'src/utils/cwd.js';
import { Box, Text } from '../ink.js';
import { HighlightedCode } from './HighlightedCode.js';
import { MessageResponse } from './MessageResponse.js';
export function NotebookEditToolUseRejectedMessage(t0) {
    const $ = _c(20);
    const { notebook_path, cell_id, new_source, cell_type, edit_mode: t1, verbose } = t0;
    const edit_mode = t1 === undefined ? "replace" : t1;
    const operation = edit_mode === "delete" ? "delete" : `${edit_mode} cell in`;
    let t2;
    if ($[0] !== operation) {
        t2 = _jsxs(Text, { color: "subtle", children: ["User rejected ", operation, " "] });
        $[0] = operation;
        $[1] = t2;
    }
    else {
        t2 = $[1];
    }
    let t3;
    if ($[2] !== notebook_path || $[3] !== verbose) {
        t3 = verbose ? notebook_path : relative(getCwd(), notebook_path);
        $[2] = notebook_path;
        $[3] = verbose;
        $[4] = t3;
    }
    else {
        t3 = $[4];
    }
    let t4;
    if ($[5] !== t3) {
        t4 = _jsx(Text, { bold: true, color: "subtle", children: t3 });
        $[5] = t3;
        $[6] = t4;
    }
    else {
        t4 = $[6];
    }
    let t5;
    if ($[7] !== cell_id) {
        t5 = _jsxs(Text, { color: "subtle", children: [" at cell ", cell_id] });
        $[7] = cell_id;
        $[8] = t5;
    }
    else {
        t5 = $[8];
    }
    let t6;
    if ($[9] !== t2 || $[10] !== t4 || $[11] !== t5) {
        t6 = _jsxs(Box, { flexDirection: "row", children: [t2, t4, t5] });
        $[9] = t2;
        $[10] = t4;
        $[11] = t5;
        $[12] = t6;
    }
    else {
        t6 = $[12];
    }
    let t7;
    if ($[13] !== cell_type || $[14] !== edit_mode || $[15] !== new_source) {
        t7 = edit_mode !== "delete" && _jsx(Box, { marginTop: 1, flexDirection: "column", children: _jsx(HighlightedCode, { code: new_source, filePath: cell_type === "markdown" ? "file.md" : "file.py", dim: true }) });
        $[13] = cell_type;
        $[14] = edit_mode;
        $[15] = new_source;
        $[16] = t7;
    }
    else {
        t7 = $[16];
    }
    let t8;
    if ($[17] !== t6 || $[18] !== t7) {
        t8 = _jsx(MessageResponse, { children: _jsxs(Box, { flexDirection: "column", children: [t6, t7] }) });
        $[17] = t6;
        $[18] = t7;
        $[19] = t8;
    }
    else {
        t8 = $[19];
    }
    return t8;
}
