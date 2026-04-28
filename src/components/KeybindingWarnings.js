import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import React from 'react';
import { Box, Text } from '../ink.js';
import { getCachedKeybindingWarnings, getKeybindingsPath, isKeybindingCustomizationEnabled } from '../keybindings/loadUserBindings.js';
/**
 * Displays keybinding validation warnings in the UI.
 * Similar to McpParsingWarnings, this provides persistent visibility
 * of configuration issues.
 *
 * Only shown when keybinding customization is enabled (ant users + feature gate).
 */
export function KeybindingWarnings() {
    const $ = _c(2);
    if (!isKeybindingCustomizationEnabled()) {
        return null;
    }
    let t0;
    let t1;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = Symbol.for("react.early_return_sentinel");
        bb0: {
            const warnings = getCachedKeybindingWarnings();
            if (warnings.length === 0) {
                t1 = null;
                break bb0;
            }
            const errors = warnings.filter(_temp);
            const warns = warnings.filter(_temp2);
            t0 = _jsxs(Box, { flexDirection: "column", marginTop: 1, marginBottom: 1, children: [_jsx(Text, { bold: true, color: errors.length > 0 ? "error" : "warning", children: "Keybinding Configuration Issues" }), _jsxs(Box, { children: [_jsx(Text, { dimColor: true, children: "Location: " }), _jsx(Text, { dimColor: true, children: getKeybindingsPath() })] }), _jsxs(Box, { marginLeft: 1, flexDirection: "column", marginTop: 1, children: [errors.map(_temp3), warns.map(_temp4)] })] });
        }
        $[0] = t0;
        $[1] = t1;
    }
    else {
        t0 = $[0];
        t1 = $[1];
    }
    if (t1 !== Symbol.for("react.early_return_sentinel")) {
        return t1;
    }
    return t0;
}
function _temp4(warning, i_0) {
    return _jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { children: [_jsx(Text, { dimColor: true, children: "\u2514 " }), _jsx(Text, { color: "warning", children: "[Warning]" }), _jsxs(Text, { dimColor: true, children: [" ", warning.message] })] }), warning.suggestion && _jsx(Box, { marginLeft: 3, children: _jsxs(Text, { dimColor: true, children: ["\u2192 ", warning.suggestion] }) })] }, `warning-${i_0}`);
}
function _temp3(error, i) {
    return _jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { children: [_jsx(Text, { dimColor: true, children: "\u2514 " }), _jsx(Text, { color: "error", children: "[Error]" }), _jsxs(Text, { dimColor: true, children: [" ", error.message] })] }), error.suggestion && _jsx(Box, { marginLeft: 3, children: _jsxs(Text, { dimColor: true, children: ["\u2192 ", error.suggestion] }) })] }, `error-${i}`);
}
function _temp2(w_0) {
    return w_0.severity === "warning";
}
function _temp(w) {
    return w.severity === "error";
}
