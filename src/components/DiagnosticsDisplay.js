import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import { relative } from 'path';
import React from 'react';
import { Box, Text } from '../ink.js';
import { DiagnosticTrackingService } from '../services/diagnosticTracking.js';
import { getCwd } from '../utils/cwd.js';
import { CtrlOToExpand } from './CtrlOToExpand.js';
import { MessageResponse } from './MessageResponse.js';
export function DiagnosticsDisplay(t0) {
    const $ = _c(14);
    const { attachment, verbose } = t0;
    if (attachment.files.length === 0) {
        return null;
    }
    let t1;
    if ($[0] !== attachment.files) {
        t1 = attachment.files.reduce(_temp, 0);
        $[0] = attachment.files;
        $[1] = t1;
    }
    else {
        t1 = $[1];
    }
    const totalIssues = t1;
    const fileCount = attachment.files.length;
    if (verbose) {
        let t2;
        if ($[2] !== attachment.files) {
            t2 = attachment.files.map(_temp3);
            $[2] = attachment.files;
            $[3] = t2;
        }
        else {
            t2 = $[3];
        }
        let t3;
        if ($[4] !== t2) {
            t3 = _jsx(Box, { flexDirection: "column", children: t2 });
            $[4] = t2;
            $[5] = t3;
        }
        else {
            t3 = $[5];
        }
        return t3;
    }
    else {
        let t2;
        if ($[6] !== totalIssues) {
            t2 = _jsx(Text, { bold: true, children: totalIssues });
            $[6] = totalIssues;
            $[7] = t2;
        }
        else {
            t2 = $[7];
        }
        const t3 = totalIssues === 1 ? "issue" : "issues";
        const t4 = fileCount === 1 ? "file" : "files";
        let t5;
        if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
            t5 = _jsx(CtrlOToExpand, {});
            $[8] = t5;
        }
        else {
            t5 = $[8];
        }
        let t6;
        if ($[9] !== fileCount || $[10] !== t2 || $[11] !== t3 || $[12] !== t4) {
            t6 = _jsx(MessageResponse, { children: _jsxs(Text, { dimColor: true, wrap: "wrap", children: ["Found ", t2, " new diagnostic", " ", t3, " in ", fileCount, " ", t4, " ", t5] }) });
            $[9] = fileCount;
            $[10] = t2;
            $[11] = t3;
            $[12] = t4;
            $[13] = t6;
        }
        else {
            t6 = $[13];
        }
        return t6;
    }
}
function _temp3(file_0, fileIndex) {
    return _jsxs(React.Fragment, { children: [_jsx(MessageResponse, { children: _jsxs(Text, { dimColor: true, wrap: "wrap", children: [_jsx(Text, { bold: true, children: relative(getCwd(), file_0.uri.replace("file://", "").replace("_claude_fs_right:", "")) }), " ", _jsx(Text, { dimColor: true, children: file_0.uri.startsWith("file://") ? "(file://)" : file_0.uri.startsWith("_claude_fs_right:") ? "(claude_fs_right)" : `(${file_0.uri.split(":")[0]})` }), ":"] }) }), file_0.diagnostics.map(_temp2)] }, fileIndex);
}
function _temp2(diagnostic, diagIndex) {
    return _jsx(MessageResponse, { children: _jsxs(Text, { dimColor: true, wrap: "wrap", children: ["  ", DiagnosticTrackingService.getSeveritySymbol(diagnostic.severity), " [Line ", diagnostic.range.start.line + 1, ":", diagnostic.range.start.character + 1, "] ", diagnostic.message, diagnostic.code ? ` [${diagnostic.code}]` : "", diagnostic.source ? ` (${diagnostic.source})` : ""] }) }, diagIndex);
}
function _temp(sum, file) {
    return sum + file.diagnostics.length;
}
