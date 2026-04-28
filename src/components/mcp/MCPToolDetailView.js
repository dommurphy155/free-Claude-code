import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import React from 'react';
import { Box, Text } from '../../ink.js';
import { extractMcpToolDisplayName, getMcpDisplayName } from '../../services/mcp/mcpStringUtils.js';
import { ConfigurableShortcutHint } from '../ConfigurableShortcutHint.js';
import { Dialog } from '../design-system/Dialog.js';
export function MCPToolDetailView(t0) {
    const $ = _c(44);
    const { tool, server, onBack } = t0;
    const [toolDescription, setToolDescription] = React.useState("");
    let t1;
    let toolName;
    if ($[0] !== server.name || $[1] !== tool) {
        toolName = getMcpDisplayName(tool.name, server.name);
        const fullDisplayName = tool.userFacingName ? tool.userFacingName({}) : toolName;
        t1 = extractMcpToolDisplayName(fullDisplayName);
        $[0] = server.name;
        $[1] = tool;
        $[2] = t1;
        $[3] = toolName;
    }
    else {
        t1 = $[2];
        toolName = $[3];
    }
    const displayName = t1;
    let t2;
    if ($[4] !== tool) {
        t2 = tool.isReadOnly?.({}) ?? false;
        $[4] = tool;
        $[5] = t2;
    }
    else {
        t2 = $[5];
    }
    const isReadOnly = t2;
    let t3;
    if ($[6] !== tool) {
        t3 = tool.isDestructive?.({}) ?? false;
        $[6] = tool;
        $[7] = t3;
    }
    else {
        t3 = $[7];
    }
    const isDestructive = t3;
    let t4;
    if ($[8] !== tool) {
        t4 = tool.isOpenWorld?.({}) ?? false;
        $[8] = tool;
        $[9] = t4;
    }
    else {
        t4 = $[9];
    }
    const isOpenWorld = t4;
    let t5;
    let t6;
    if ($[10] !== tool) {
        t5 = () => {
            const loadDescription = async function loadDescription() {
                try {
                    const desc = await tool.description({}, {
                        isNonInteractiveSession: false,
                        toolPermissionContext: {
                            mode: "default",
                            additionalWorkingDirectories: new Map(),
                            alwaysAllowRules: {},
                            alwaysDenyRules: {},
                            alwaysAskRules: {},
                            isBypassPermissionsModeAvailable: false
                        },
                        tools: []
                    });
                    setToolDescription(desc);
                }
                catch {
                    setToolDescription("Failed to load description");
                }
            };
            loadDescription();
        };
        t6 = [tool];
        $[10] = tool;
        $[11] = t5;
        $[12] = t6;
    }
    else {
        t5 = $[11];
        t6 = $[12];
    }
    React.useEffect(t5, t6);
    let t7;
    if ($[13] !== isReadOnly) {
        t7 = isReadOnly && _jsx(Text, { color: "success", children: " [read-only]" });
        $[13] = isReadOnly;
        $[14] = t7;
    }
    else {
        t7 = $[14];
    }
    let t8;
    if ($[15] !== isDestructive) {
        t8 = isDestructive && _jsx(Text, { color: "error", children: " [destructive]" });
        $[15] = isDestructive;
        $[16] = t8;
    }
    else {
        t8 = $[16];
    }
    let t9;
    if ($[17] !== isOpenWorld) {
        t9 = isOpenWorld && _jsx(Text, { dimColor: true, children: " [open-world]" });
        $[17] = isOpenWorld;
        $[18] = t9;
    }
    else {
        t9 = $[18];
    }
    let t10;
    if ($[19] !== displayName || $[20] !== t7 || $[21] !== t8 || $[22] !== t9) {
        t10 = _jsxs(_Fragment, { children: [displayName, t7, t8, t9] });
        $[19] = displayName;
        $[20] = t7;
        $[21] = t8;
        $[22] = t9;
        $[23] = t10;
    }
    else {
        t10 = $[23];
    }
    const titleContent = t10;
    let t11;
    if ($[24] === Symbol.for("react.memo_cache_sentinel")) {
        t11 = _jsx(Text, { bold: true, children: "Tool name: " });
        $[24] = t11;
    }
    else {
        t11 = $[24];
    }
    let t12;
    if ($[25] !== toolName) {
        t12 = _jsxs(Box, { children: [t11, _jsx(Text, { dimColor: true, children: toolName })] });
        $[25] = toolName;
        $[26] = t12;
    }
    else {
        t12 = $[26];
    }
    let t13;
    if ($[27] === Symbol.for("react.memo_cache_sentinel")) {
        t13 = _jsx(Text, { bold: true, children: "Full name: " });
        $[27] = t13;
    }
    else {
        t13 = $[27];
    }
    let t14;
    if ($[28] !== tool.name) {
        t14 = _jsxs(Box, { children: [t13, _jsx(Text, { dimColor: true, children: tool.name })] });
        $[28] = tool.name;
        $[29] = t14;
    }
    else {
        t14 = $[29];
    }
    let t15;
    if ($[30] !== toolDescription) {
        t15 = toolDescription && _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { bold: true, children: "Description:" }), _jsx(Text, { wrap: "wrap", children: toolDescription })] });
        $[30] = toolDescription;
        $[31] = t15;
    }
    else {
        t15 = $[31];
    }
    let t16;
    if ($[32] !== tool.inputJSONSchema) {
        t16 = tool.inputJSONSchema && tool.inputJSONSchema.properties && Object.keys(tool.inputJSONSchema.properties).length > 0 && _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { bold: true, children: "Parameters:" }), _jsx(Box, { marginLeft: 2, flexDirection: "column", children: Object.entries(tool.inputJSONSchema.properties).map(t17 => {
                        const [key, value] = t17;
                        const required = tool.inputJSONSchema?.required;
                        const isRequired = required?.includes(key);
                        return _jsxs(Text, { children: ["\u2022 ", key, isRequired && _jsx(Text, { dimColor: true, children: " (required)" }), ":", " ", _jsx(Text, { dimColor: true, children: typeof value === "object" && value && "type" in value ? String(value.type) : "unknown" }), typeof value === "object" && value && "description" in value && _jsxs(Text, { dimColor: true, children: [" - ", String(value.description)] })] }, key);
                    }) })] });
        $[32] = tool.inputJSONSchema;
        $[33] = t16;
    }
    else {
        t16 = $[33];
    }
    let t17;
    if ($[34] !== t12 || $[35] !== t14 || $[36] !== t15 || $[37] !== t16) {
        t17 = _jsxs(Box, { flexDirection: "column", children: [t12, t14, t15, t16] });
        $[34] = t12;
        $[35] = t14;
        $[36] = t15;
        $[37] = t16;
        $[38] = t17;
    }
    else {
        t17 = $[38];
    }
    let t18;
    if ($[39] !== onBack || $[40] !== server.name || $[41] !== t17 || $[42] !== titleContent) {
        t18 = _jsx(Dialog, { title: titleContent, subtitle: server.name, onCancel: onBack, inputGuide: _temp, children: t17 });
        $[39] = onBack;
        $[40] = server.name;
        $[41] = t17;
        $[42] = titleContent;
        $[43] = t18;
    }
    else {
        t18 = $[43];
    }
    return t18;
}
function _temp(exitState) {
    return exitState.pending ? _jsxs(Text, { children: ["Press ", exitState.keyName, " again to exit"] }) : _jsx(ConfigurableShortcutHint, { action: "confirm:no", context: "Confirmation", fallback: "Esc", description: "go back" });
}
