import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import React from 'react';
import { getMcpConfigsByScope } from 'src/services/mcp/config.js';
import { describeMcpConfigFilePath, getScopeLabel } from 'src/services/mcp/utils.js';
import { Box, Link, Text } from '../../ink.js';
function McpConfigErrorSection(t0) {
    const $ = _c(26);
    const { scope, parsingErrors, warnings } = t0;
    const hasErrors = parsingErrors.length > 0;
    const hasWarnings = warnings.length > 0;
    if (!hasErrors && !hasWarnings) {
        return null;
    }
    let t1;
    if ($[0] !== hasErrors || $[1] !== hasWarnings) {
        t1 = (hasErrors || hasWarnings) && _jsxs(Text, { color: hasErrors ? "error" : "warning", children: ["[", hasErrors ? "Failed to parse" : "Contains warnings", "]", " "] });
        $[0] = hasErrors;
        $[1] = hasWarnings;
        $[2] = t1;
    }
    else {
        t1 = $[2];
    }
    let t2;
    if ($[3] !== scope) {
        t2 = getScopeLabel(scope);
        $[3] = scope;
        $[4] = t2;
    }
    else {
        t2 = $[4];
    }
    let t3;
    if ($[5] !== t2) {
        t3 = _jsx(Text, { children: t2 });
        $[5] = t2;
        $[6] = t3;
    }
    else {
        t3 = $[6];
    }
    let t4;
    if ($[7] !== t1 || $[8] !== t3) {
        t4 = _jsxs(Box, { children: [t1, t3] });
        $[7] = t1;
        $[8] = t3;
        $[9] = t4;
    }
    else {
        t4 = $[9];
    }
    let t5;
    if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
        t5 = _jsx(Text, { dimColor: true, children: "Location: " });
        $[10] = t5;
    }
    else {
        t5 = $[10];
    }
    let t6;
    if ($[11] !== scope) {
        t6 = describeMcpConfigFilePath(scope);
        $[11] = scope;
        $[12] = t6;
    }
    else {
        t6 = $[12];
    }
    let t7;
    if ($[13] !== t6) {
        t7 = _jsxs(Box, { children: [t5, _jsx(Text, { dimColor: true, children: t6 })] });
        $[13] = t6;
        $[14] = t7;
    }
    else {
        t7 = $[14];
    }
    let t8;
    if ($[15] !== parsingErrors) {
        t8 = parsingErrors.map(_temp);
        $[15] = parsingErrors;
        $[16] = t8;
    }
    else {
        t8 = $[16];
    }
    let t9;
    if ($[17] !== warnings) {
        t9 = warnings.map(_temp2);
        $[17] = warnings;
        $[18] = t9;
    }
    else {
        t9 = $[18];
    }
    let t10;
    if ($[19] !== t8 || $[20] !== t9) {
        t10 = _jsxs(Box, { marginLeft: 1, flexDirection: "column", children: [t8, t9] });
        $[19] = t8;
        $[20] = t9;
        $[21] = t10;
    }
    else {
        t10 = $[21];
    }
    let t11;
    if ($[22] !== t10 || $[23] !== t4 || $[24] !== t7) {
        t11 = _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [t4, t7, t10] });
        $[22] = t10;
        $[23] = t4;
        $[24] = t7;
        $[25] = t11;
    }
    else {
        t11 = $[25];
    }
    return t11;
}
function _temp2(warning, i_0) {
    const serverName_0 = warning.mcpErrorMetadata?.serverName;
    return _jsx(Box, { children: _jsxs(Text, { children: [_jsx(Text, { dimColor: true, children: "\u2514 " }), _jsx(Text, { color: "warning", children: "[Warning]" }), _jsxs(Text, { dimColor: true, children: [" ", serverName_0 && `[${serverName_0}] `, warning.path && warning.path !== "" ? `${warning.path}: ` : "", warning.message] })] }) }, `warning-${i_0}`);
}
function _temp(error, i) {
    const serverName = error.mcpErrorMetadata?.serverName;
    return _jsx(Box, { children: _jsxs(Text, { children: [_jsx(Text, { dimColor: true, children: "\u2514 " }), _jsx(Text, { color: "error", children: "[Error]" }), _jsxs(Text, { dimColor: true, children: [" ", serverName && `[${serverName}] `, error.path && error.path !== "" ? `${error.path}: ` : "", error.message] })] }) }, `error-${i}`);
}
export function McpParsingWarnings() {
    const $ = _c(6);
    let t0;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = {
            scope: "user",
            config: getMcpConfigsByScope("user")
        };
        $[0] = t0;
    }
    else {
        t0 = $[0];
    }
    let t1;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = {
            scope: "project",
            config: getMcpConfigsByScope("project")
        };
        $[1] = t1;
    }
    else {
        t1 = $[1];
    }
    let t2;
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
        t2 = {
            scope: "local",
            config: getMcpConfigsByScope("local")
        };
        $[2] = t2;
    }
    else {
        t2 = $[2];
    }
    let t3;
    if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
        t3 = [t0, t1, t2, {
                scope: "enterprise",
                config: getMcpConfigsByScope("enterprise")
            }];
        $[3] = t3;
    }
    else {
        t3 = $[3];
    }
    const scopes = t3;
    const hasParsingErrors = scopes.some(_temp3);
    const hasWarnings = scopes.some(_temp4);
    if (!hasParsingErrors && !hasWarnings) {
        return null;
    }
    let t4;
    if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
        t4 = _jsx(Text, { bold: true, children: "MCP Config Diagnostics" });
        $[4] = t4;
    }
    else {
        t4 = $[4];
    }
    let t5;
    if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
        t5 = _jsxs(Box, { flexDirection: "column", marginTop: 1, marginBottom: 1, children: [t4, _jsx(Box, { marginTop: 1, children: _jsxs(Text, { dimColor: true, children: ["For help configuring MCP servers, see:", " ", _jsx(Link, { url: "https://code.claude.com/docs/en/mcp", children: "https://code.claude.com/docs/en/mcp" })] }) }), scopes.map(_temp5)] });
        $[5] = t5;
    }
    else {
        t5 = $[5];
    }
    return t5;
}
function _temp5(t0) {
    const { scope, config: config_1 } = t0;
    return _jsx(McpConfigErrorSection, { scope: scope, parsingErrors: filterErrors(config_1.errors, "fatal"), warnings: filterErrors(config_1.errors, "warning") }, scope);
}
function _temp4(t0) {
    const { config: config_0 } = t0;
    return filterErrors(config_0.errors, "warning").length > 0;
}
function _temp3(t0) {
    const { config } = t0;
    return filterErrors(config.errors, "fatal").length > 0;
}
function filterErrors(errors, severity) {
    return errors.filter(e => e.mcpErrorMetadata?.severity === severity);
}
