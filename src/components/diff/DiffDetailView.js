import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import { resolve } from 'path';
import React from 'react';
import { useTerminalSize } from '../../hooks/useTerminalSize.js';
import { Box, Text } from '../../ink.js';
import { getCwd } from '../../utils/cwd.js';
import { readFileSafe } from '../../utils/file.js';
import { Divider } from '../design-system/Divider.js';
import { StructuredDiff } from '../StructuredDiff.js';
/**
 * Displays the diff content for a single file.
 * Uses StructuredDiff for word-level diffing and syntax highlighting.
 * No scrolling - renders all lines (max 400 due to parsing limits).
 */
export function DiffDetailView(t0) {
    const $ = _c(53);
    const { filePath, hunks, isLargeFile, isBinary, isTruncated, isUntracked } = t0;
    const { columns } = useTerminalSize();
    let t1;
    bb0: {
        if (!filePath) {
            let t2;
            if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
                t2 = {
                    firstLine: null,
                    fileContent: undefined
                };
                $[0] = t2;
            }
            else {
                t2 = $[0];
            }
            t1 = t2;
            break bb0;
        }
        let content;
        let t2;
        if ($[1] !== filePath) {
            const fullPath = resolve(getCwd(), filePath);
            content = readFileSafe(fullPath);
            t2 = content?.split("\n")[0] ?? null;
            $[1] = filePath;
            $[2] = content;
            $[3] = t2;
        }
        else {
            content = $[2];
            t2 = $[3];
        }
        const t3 = content ?? undefined;
        let t4;
        if ($[4] !== t2 || $[5] !== t3) {
            t4 = {
                firstLine: t2,
                fileContent: t3
            };
            $[4] = t2;
            $[5] = t3;
            $[6] = t4;
        }
        else {
            t4 = $[6];
        }
        t1 = t4;
    }
    const { firstLine, fileContent } = t1;
    if (isUntracked) {
        let t2;
        if ($[7] !== filePath) {
            t2 = _jsx(Text, { bold: true, children: filePath });
            $[7] = filePath;
            $[8] = t2;
        }
        else {
            t2 = $[8];
        }
        let t3;
        if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
            t3 = _jsx(Text, { dimColor: true, children: " (untracked)" });
            $[9] = t3;
        }
        else {
            t3 = $[9];
        }
        let t4;
        if ($[10] !== t2) {
            t4 = _jsxs(Box, { children: [t2, t3] });
            $[10] = t2;
            $[11] = t4;
        }
        else {
            t4 = $[11];
        }
        let t5;
        if ($[12] === Symbol.for("react.memo_cache_sentinel")) {
            t5 = _jsx(Divider, { padding: 4 });
            $[12] = t5;
        }
        else {
            t5 = $[12];
        }
        let t6;
        if ($[13] === Symbol.for("react.memo_cache_sentinel")) {
            t6 = _jsx(Text, { dimColor: true, italic: true, children: "New file not yet staged." });
            $[13] = t6;
        }
        else {
            t6 = $[13];
        }
        let t7;
        if ($[14] !== filePath) {
            t7 = _jsxs(Box, { flexDirection: "column", children: [t6, _jsxs(Text, { dimColor: true, italic: true, children: ["Run `git add ", filePath, "` to see line counts."] })] });
            $[14] = filePath;
            $[15] = t7;
        }
        else {
            t7 = $[15];
        }
        let t8;
        if ($[16] !== t4 || $[17] !== t7) {
            t8 = _jsxs(Box, { flexDirection: "column", width: "100%", children: [t4, t5, t7] });
            $[16] = t4;
            $[17] = t7;
            $[18] = t8;
        }
        else {
            t8 = $[18];
        }
        return t8;
    }
    if (isBinary) {
        let t2;
        if ($[19] !== filePath) {
            t2 = _jsx(Box, { children: _jsx(Text, { bold: true, children: filePath }) });
            $[19] = filePath;
            $[20] = t2;
        }
        else {
            t2 = $[20];
        }
        let t3;
        if ($[21] === Symbol.for("react.memo_cache_sentinel")) {
            t3 = _jsx(Divider, { padding: 4 });
            $[21] = t3;
        }
        else {
            t3 = $[21];
        }
        let t4;
        if ($[22] === Symbol.for("react.memo_cache_sentinel")) {
            t4 = _jsx(Box, { flexDirection: "column", children: _jsx(Text, { dimColor: true, italic: true, children: "Binary file - cannot display diff" }) });
            $[22] = t4;
        }
        else {
            t4 = $[22];
        }
        let t5;
        if ($[23] !== t2) {
            t5 = _jsxs(Box, { flexDirection: "column", width: "100%", children: [t2, t3, t4] });
            $[23] = t2;
            $[24] = t5;
        }
        else {
            t5 = $[24];
        }
        return t5;
    }
    if (isLargeFile) {
        let t2;
        if ($[25] !== filePath) {
            t2 = _jsx(Box, { children: _jsx(Text, { bold: true, children: filePath }) });
            $[25] = filePath;
            $[26] = t2;
        }
        else {
            t2 = $[26];
        }
        let t3;
        if ($[27] === Symbol.for("react.memo_cache_sentinel")) {
            t3 = _jsx(Divider, { padding: 4 });
            $[27] = t3;
        }
        else {
            t3 = $[27];
        }
        let t4;
        if ($[28] === Symbol.for("react.memo_cache_sentinel")) {
            t4 = _jsx(Box, { flexDirection: "column", children: _jsx(Text, { dimColor: true, italic: true, children: "Large file - diff exceeds 1 MB limit" }) });
            $[28] = t4;
        }
        else {
            t4 = $[28];
        }
        let t5;
        if ($[29] !== t2) {
            t5 = _jsxs(Box, { flexDirection: "column", width: "100%", children: [t2, t3, t4] });
            $[29] = t2;
            $[30] = t5;
        }
        else {
            t5 = $[30];
        }
        return t5;
    }
    let t2;
    if ($[31] !== filePath) {
        t2 = _jsx(Text, { bold: true, children: filePath });
        $[31] = filePath;
        $[32] = t2;
    }
    else {
        t2 = $[32];
    }
    let t3;
    if ($[33] !== isTruncated) {
        t3 = isTruncated && _jsx(Text, { dimColor: true, children: " (truncated)" });
        $[33] = isTruncated;
        $[34] = t3;
    }
    else {
        t3 = $[34];
    }
    let t4;
    if ($[35] !== t2 || $[36] !== t3) {
        t4 = _jsxs(Box, { children: [t2, t3] });
        $[35] = t2;
        $[36] = t3;
        $[37] = t4;
    }
    else {
        t4 = $[37];
    }
    let t5;
    if ($[38] === Symbol.for("react.memo_cache_sentinel")) {
        t5 = _jsx(Divider, { padding: 4 });
        $[38] = t5;
    }
    else {
        t5 = $[38];
    }
    let t6;
    if ($[39] !== columns || $[40] !== fileContent || $[41] !== filePath || $[42] !== firstLine || $[43] !== hunks) {
        t6 = hunks.length === 0 ? _jsx(Text, { dimColor: true, children: "No diff content" }) : hunks.map((hunk, index) => _jsx(StructuredDiff, { patch: hunk, filePath: filePath, firstLine: firstLine, fileContent: fileContent, dim: false, width: columns - 2 - 2 }, index));
        $[39] = columns;
        $[40] = fileContent;
        $[41] = filePath;
        $[42] = firstLine;
        $[43] = hunks;
        $[44] = t6;
    }
    else {
        t6 = $[44];
    }
    let t7;
    if ($[45] !== t6) {
        t7 = _jsx(Box, { flexDirection: "column", children: t6 });
        $[45] = t6;
        $[46] = t7;
    }
    else {
        t7 = $[46];
    }
    let t8;
    if ($[47] !== isTruncated) {
        t8 = isTruncated && _jsx(Text, { dimColor: true, italic: true, children: "\u2026 diff truncated (exceeded 400 line limit)" });
        $[47] = isTruncated;
        $[48] = t8;
    }
    else {
        t8 = $[48];
    }
    let t9;
    if ($[49] !== t4 || $[50] !== t7 || $[51] !== t8) {
        t9 = _jsxs(Box, { flexDirection: "column", width: "100%", children: [t4, t5, t7, t8] });
        $[49] = t4;
        $[50] = t7;
        $[51] = t8;
        $[52] = t9;
    }
    else {
        t9 = $[52];
    }
    return t9;
}
