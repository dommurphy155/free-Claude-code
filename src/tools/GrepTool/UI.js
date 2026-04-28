import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import React from 'react';
import { CtrlOToExpand } from '../../components/CtrlOToExpand.js';
import { FallbackToolUseErrorMessage } from '../../components/FallbackToolUseErrorMessage.js';
import { MessageResponse } from '../../components/MessageResponse.js';
import { TOOL_SUMMARY_MAX_LENGTH } from '../../constants/toolLimits.js';
import { Box, Text } from '../../ink.js';
import { FILE_NOT_FOUND_CWD_NOTE, getDisplayPath } from '../../utils/file.js';
import { truncate } from '../../utils/format.js';
import { extractTag } from '../../utils/messages.js';
// Reusable component for search result summaries
function SearchResultSummary(t0) {
    const $ = _c(26);
    const { count, countLabel, secondaryCount, secondaryLabel, content, verbose } = t0;
    let t1;
    if ($[0] !== count) {
        t1 = _jsxs(Text, { bold: true, children: [count, " "] });
        $[0] = count;
        $[1] = t1;
    }
    else {
        t1 = $[1];
    }
    let t2;
    if ($[2] !== count || $[3] !== countLabel) {
        t2 = count === 0 || count > 1 ? countLabel : countLabel.slice(0, -1);
        $[2] = count;
        $[3] = countLabel;
        $[4] = t2;
    }
    else {
        t2 = $[4];
    }
    let t3;
    if ($[5] !== t1 || $[6] !== t2) {
        t3 = _jsxs(Text, { children: ["Found ", t1, t2] });
        $[5] = t1;
        $[6] = t2;
        $[7] = t3;
    }
    else {
        t3 = $[7];
    }
    const primaryText = t3;
    let t4;
    if ($[8] !== secondaryCount || $[9] !== secondaryLabel) {
        t4 = secondaryCount !== undefined && secondaryLabel ? _jsxs(Text, { children: [" ", "across ", _jsxs(Text, { bold: true, children: [secondaryCount, " "] }), secondaryCount === 0 || secondaryCount > 1 ? secondaryLabel : secondaryLabel.slice(0, -1)] }) : null;
        $[8] = secondaryCount;
        $[9] = secondaryLabel;
        $[10] = t4;
    }
    else {
        t4 = $[10];
    }
    const secondaryText = t4;
    if (verbose) {
        let t5;
        if ($[11] === Symbol.for("react.memo_cache_sentinel")) {
            t5 = _jsx(Text, { dimColor: true, children: "\u00A0\u00A0\u23BF \u00A0" });
            $[11] = t5;
        }
        else {
            t5 = $[11];
        }
        let t6;
        if ($[12] !== primaryText || $[13] !== secondaryText) {
            t6 = _jsx(Box, { flexDirection: "row", children: _jsxs(Text, { children: [t5, primaryText, secondaryText] }) });
            $[12] = primaryText;
            $[13] = secondaryText;
            $[14] = t6;
        }
        else {
            t6 = $[14];
        }
        let t7;
        if ($[15] !== content) {
            t7 = _jsx(Box, { marginLeft: 5, children: _jsx(Text, { children: content }) });
            $[15] = content;
            $[16] = t7;
        }
        else {
            t7 = $[16];
        }
        let t8;
        if ($[17] !== t6 || $[18] !== t7) {
            t8 = _jsxs(Box, { flexDirection: "column", children: [t6, t7] });
            $[17] = t6;
            $[18] = t7;
            $[19] = t8;
        }
        else {
            t8 = $[19];
        }
        return t8;
    }
    let t5;
    if ($[20] !== count) {
        t5 = count > 0 && _jsx(CtrlOToExpand, {});
        $[20] = count;
        $[21] = t5;
    }
    else {
        t5 = $[21];
    }
    let t6;
    if ($[22] !== primaryText || $[23] !== secondaryText || $[24] !== t5) {
        t6 = _jsx(MessageResponse, { height: 1, children: _jsxs(Text, { children: [primaryText, secondaryText, " ", t5] }) });
        $[22] = primaryText;
        $[23] = secondaryText;
        $[24] = t5;
        $[25] = t6;
    }
    else {
        t6 = $[25];
    }
    return t6;
}
export function renderToolUseMessage({ pattern, path }, { verbose }) {
    if (!pattern) {
        return null;
    }
    const parts = [`pattern: "${pattern}"`];
    if (path) {
        parts.push(`path: "${verbose ? path : getDisplayPath(path)}"`);
    }
    return parts.join(', ');
}
export function renderToolUseErrorMessage(result, { verbose }) {
    if (!verbose && typeof result === 'string' && extractTag(result, 'tool_use_error')) {
        const errorMessage = extractTag(result, 'tool_use_error');
        if (errorMessage?.includes(FILE_NOT_FOUND_CWD_NOTE)) {
            return _jsx(MessageResponse, { children: _jsx(Text, { color: "error", children: "File not found" }) });
        }
        return _jsx(MessageResponse, { children: _jsx(Text, { color: "error", children: "Error searching files" }) });
    }
    return _jsx(FallbackToolUseErrorMessage, { result: result, verbose: verbose });
}
export function renderToolResultMessage({ mode = 'files_with_matches', filenames, numFiles, content, numLines, numMatches }, _progressMessagesForMessage, { verbose }) {
    if (mode === 'content') {
        return _jsx(SearchResultSummary, { count: numLines ?? 0, countLabel: "lines", content: content, verbose: verbose });
    }
    if (mode === 'count') {
        return _jsx(SearchResultSummary, { count: numMatches ?? 0, countLabel: "matches", secondaryCount: numFiles, secondaryLabel: "files", content: content, verbose: verbose });
    }
    // files_with_matches mode
    const fileListContent = filenames.map(filename => filename).join('\n');
    return _jsx(SearchResultSummary, { count: numFiles, countLabel: "files", content: fileListContent, verbose: verbose });
}
export function getToolUseSummary(input) {
    if (!input?.pattern) {
        return null;
    }
    return truncate(input.pattern, TOOL_SUMMARY_MAX_LENGTH);
}
