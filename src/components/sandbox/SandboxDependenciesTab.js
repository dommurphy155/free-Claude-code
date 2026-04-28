import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import React from 'react';
import { Box, Text } from '../../ink.js';
import { getPlatform } from '../../utils/platform.js';
export function SandboxDependenciesTab(t0) {
    const $ = _c(24);
    const { depCheck } = t0;
    let t1;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = getPlatform();
        $[0] = t1;
    }
    else {
        t1 = $[0];
    }
    const platform = t1;
    const isMac = platform === "macos";
    let t2;
    if ($[1] !== depCheck.errors) {
        t2 = depCheck.errors.some(_temp);
        $[1] = depCheck.errors;
        $[2] = t2;
    }
    else {
        t2 = $[2];
    }
    const rgMissing = t2;
    let t3;
    if ($[3] !== depCheck.errors) {
        t3 = depCheck.errors.some(_temp2);
        $[3] = depCheck.errors;
        $[4] = t3;
    }
    else {
        t3 = $[4];
    }
    const bwrapMissing = t3;
    let t4;
    if ($[5] !== depCheck.errors) {
        t4 = depCheck.errors.some(_temp3);
        $[5] = depCheck.errors;
        $[6] = t4;
    }
    else {
        t4 = $[6];
    }
    const socatMissing = t4;
    const seccompMissing = depCheck.warnings.length > 0;
    let t5;
    if ($[7] !== bwrapMissing || $[8] !== depCheck.errors || $[9] !== rgMissing || $[10] !== seccompMissing || $[11] !== socatMissing) {
        const otherErrors = depCheck.errors.filter(_temp4);
        const rgInstallHint = isMac ? "brew install ripgrep" : "apt install ripgrep";
        let t6;
        if ($[13] === Symbol.for("react.memo_cache_sentinel")) {
            t6 = isMac && _jsx(Box, { flexDirection: "column", children: _jsxs(Text, { children: ["seatbelt: ", _jsx(Text, { color: "success", children: "built-in (macOS)" })] }) });
            $[13] = t6;
        }
        else {
            t6 = $[13];
        }
        let t7;
        let t8;
        if ($[14] !== rgMissing) {
            t7 = _jsxs(Text, { children: ["ripgrep (rg):", " ", rgMissing ? _jsx(Text, { color: "error", children: "not found" }) : _jsx(Text, { color: "success", children: "found" })] });
            t8 = rgMissing && _jsxs(Text, { dimColor: true, children: ["  ", "\u00B7 ", rgInstallHint] });
            $[14] = rgMissing;
            $[15] = t7;
            $[16] = t8;
        }
        else {
            t7 = $[15];
            t8 = $[16];
        }
        let t9;
        if ($[17] !== t7 || $[18] !== t8) {
            t9 = _jsxs(Box, { flexDirection: "column", children: [t7, t8] });
            $[17] = t7;
            $[18] = t8;
            $[19] = t9;
        }
        else {
            t9 = $[19];
        }
        let t10;
        if ($[20] !== bwrapMissing || $[21] !== seccompMissing || $[22] !== socatMissing) {
            t10 = !isMac && _jsxs(_Fragment, { children: [_jsxs(Box, { flexDirection: "column", children: [_jsxs(Text, { children: ["bubblewrap (bwrap):", " ", bwrapMissing ? _jsx(Text, { color: "error", children: "not installed" }) : _jsx(Text, { color: "success", children: "installed" })] }), bwrapMissing && _jsxs(Text, { dimColor: true, children: ["  ", "\u00B7 apt install bubblewrap"] })] }), _jsxs(Box, { flexDirection: "column", children: [_jsxs(Text, { children: ["socat:", " ", socatMissing ? _jsx(Text, { color: "error", children: "not installed" }) : _jsx(Text, { color: "success", children: "installed" })] }), socatMissing && _jsxs(Text, { dimColor: true, children: ["  ", "\u00B7 apt install socat"] })] }), _jsxs(Box, { flexDirection: "column", children: [_jsxs(Text, { children: ["seccomp filter:", " ", seccompMissing ? _jsx(Text, { color: "warning", children: "not installed" }) : _jsx(Text, { color: "success", children: "installed" }), seccompMissing && _jsx(Text, { dimColor: true, children: " (required to block unix domain sockets)" })] }), seccompMissing && _jsxs(Box, { flexDirection: "column", children: [_jsxs(Text, { dimColor: true, children: ["  ", "\u00B7 npm install -g @anthropic-ai/sandbox-runtime"] }), _jsxs(Text, { dimColor: true, children: ["  ", "\u00B7 or copy vendor/seccomp/* from sandbox-runtime and set"] }), _jsxs(Text, { dimColor: true, children: ["    ", "sandbox.seccomp.bpfPath and applyPath in settings.json"] })] })] })] });
            $[20] = bwrapMissing;
            $[21] = seccompMissing;
            $[22] = socatMissing;
            $[23] = t10;
        }
        else {
            t10 = $[23];
        }
        t5 = _jsxs(Box, { flexDirection: "column", paddingY: 1, gap: 1, children: [t6, t9, t10, otherErrors.map(_temp5)] });
        $[7] = bwrapMissing;
        $[8] = depCheck.errors;
        $[9] = rgMissing;
        $[10] = seccompMissing;
        $[11] = socatMissing;
        $[12] = t5;
    }
    else {
        t5 = $[12];
    }
    return t5;
}
function _temp5(err) {
    return _jsx(Text, { color: "error", children: err }, err);
}
function _temp4(e_2) {
    return !e_2.includes("ripgrep") && !e_2.includes("bwrap") && !e_2.includes("socat");
}
function _temp3(e_1) {
    return e_1.includes("socat");
}
function _temp2(e_0) {
    return e_0.includes("bwrap");
}
function _temp(e) {
    return e.includes("ripgrep");
}
