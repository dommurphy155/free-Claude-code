import { jsxs as _jsxs, Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import { feature } from 'bun:bundle';
import * as React from 'react';
import { Box, Text } from '../ink.js';
import { generateContextSuggestions } from '../utils/contextSuggestions.js';
import { getDisplayPath } from '../utils/file.js';
import { formatTokens } from '../utils/format.js';
import { getSourceDisplayName } from '../utils/settings/constants.js';
import { plural } from '../utils/stringUtils.js';
import { ContextSuggestions } from './ContextSuggestions.js';
const RESERVED_CATEGORY_NAME = 'Autocompact buffer';
/**
 * One-liner for the legend header showing what context-collapse has done.
 * Returns null when nothing's summarized/staged so we don't add visual
 * noise in the common case. This is the one place a user can see that
 * their context was rewritten — the <collapsed> placeholders are isMeta
 * and don't appear in the conversation view.
 */
function CollapseStatus() {
    const $ = _c(2);
    if (feature("CONTEXT_COLLAPSE")) {
        let t0;
        let t1;
        if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
            t1 = Symbol.for("react.early_return_sentinel");
            bb0: {
                const { getStats, isContextCollapseEnabled } = require("../services/contextCollapse/index.js");
                if (!isContextCollapseEnabled()) {
                    t1 = null;
                    break bb0;
                }
                const s = getStats();
                const { health: h } = s;
                const parts = [];
                if (s.collapsedSpans > 0) {
                    parts.push(`${s.collapsedSpans} ${plural(s.collapsedSpans, "span")} summarized (${s.collapsedMessages} msgs)`);
                }
                if (s.stagedSpans > 0) {
                    parts.push(`${s.stagedSpans} staged`);
                }
                const summary = parts.length > 0 ? parts.join(", ") : h.totalSpawns > 0 ? `${h.totalSpawns} ${plural(h.totalSpawns, "spawn")}, nothing staged yet` : "waiting for first trigger";
                let line2 = null;
                if (h.totalErrors > 0) {
                    line2 = _jsxs(Text, { color: "warning", children: ["Collapse errors: ", h.totalErrors, "/", h.totalSpawns, " spawns failed", h.lastError ? ` (last: ${h.lastError.slice(0, 60)})` : ""] });
                }
                else {
                    if (h.emptySpawnWarningEmitted) {
                        line2 = _jsxs(Text, { color: "warning", children: ["Collapse idle: ", h.totalEmptySpawns, " consecutive empty runs"] });
                    }
                }
                t0 = _jsxs(_Fragment, { children: [_jsxs(Text, { dimColor: true, children: ["Context strategy: collapse (", summary, ")"] }), line2] });
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
    return null;
}
// Order for displaying source groups: Project > User > Managed > Plugin > Built-in
const SOURCE_DISPLAY_ORDER = ['Project', 'User', 'Managed', 'Plugin', 'Built-in'];
/** Group items by source type for display, sorted by tokens descending within each group */
function groupBySource(items) {
    const groups = new Map();
    for (const item of items) {
        const key = getSourceDisplayName(item.source);
        const existing = groups.get(key) || [];
        existing.push(item);
        groups.set(key, existing);
    }
    // Sort each group by tokens descending
    for (const [key, group] of groups.entries()) {
        groups.set(key, group.sort((a, b) => b.tokens - a.tokens));
    }
    // Return groups in consistent order
    const orderedGroups = new Map();
    for (const source of SOURCE_DISPLAY_ORDER) {
        const group = groups.get(source);
        if (group) {
            orderedGroups.set(source, group);
        }
    }
    return orderedGroups;
}
export function ContextVisualization(t0) {
    const $ = _c(87);
    const { data } = t0;
    const { categories, totalTokens, rawMaxTokens, percentage, gridRows, model, memoryFiles, mcpTools, deferredBuiltinTools: t1, systemTools, systemPromptSections, agents, skills, messageBreakdown } = data;
    let T0;
    let T1;
    let t2;
    let t3;
    let t4;
    let t5;
    let t6;
    let t7;
    let t8;
    let t9;
    if ($[0] !== categories || $[1] !== gridRows || $[2] !== mcpTools || $[3] !== model || $[4] !== percentage || $[5] !== rawMaxTokens || $[6] !== systemTools || $[7] !== t1 || $[8] !== totalTokens) {
        const deferredBuiltinTools = t1 === undefined ? [] : t1;
        const visibleCategories = categories.filter(_temp);
        let t10;
        if ($[19] !== categories) {
            t10 = categories.some(_temp2);
            $[19] = categories;
            $[20] = t10;
        }
        else {
            t10 = $[20];
        }
        const hasDeferredMcpTools = t10;
        const hasDeferredBuiltinTools = deferredBuiltinTools.length > 0;
        const autocompactCategory = categories.find(_temp3);
        T1 = Box;
        t6 = "column";
        t7 = 1;
        if ($[21] === Symbol.for("react.memo_cache_sentinel")) {
            t8 = _jsx(Text, { bold: true, children: "Context Usage" });
            $[21] = t8;
        }
        else {
            t8 = $[21];
        }
        let t11;
        if ($[22] !== gridRows) {
            t11 = gridRows.map(_temp5);
            $[22] = gridRows;
            $[23] = t11;
        }
        else {
            t11 = $[23];
        }
        let t12;
        if ($[24] !== t11) {
            t12 = _jsx(Box, { flexDirection: "column", flexShrink: 0, children: t11 });
            $[24] = t11;
            $[25] = t12;
        }
        else {
            t12 = $[25];
        }
        let t13;
        if ($[26] !== totalTokens) {
            t13 = formatTokens(totalTokens);
            $[26] = totalTokens;
            $[27] = t13;
        }
        else {
            t13 = $[27];
        }
        let t14;
        if ($[28] !== rawMaxTokens) {
            t14 = formatTokens(rawMaxTokens);
            $[28] = rawMaxTokens;
            $[29] = t14;
        }
        else {
            t14 = $[29];
        }
        let t15;
        if ($[30] !== model || $[31] !== percentage || $[32] !== t13 || $[33] !== t14) {
            t15 = _jsxs(Text, { dimColor: true, children: [model, " \u00B7 ", t13, "/", t14, " ", "tokens (", percentage, "%)"] });
            $[30] = model;
            $[31] = percentage;
            $[32] = t13;
            $[33] = t14;
            $[34] = t15;
        }
        else {
            t15 = $[34];
        }
        let t16;
        let t17;
        let t18;
        if ($[35] === Symbol.for("react.memo_cache_sentinel")) {
            t16 = _jsx(CollapseStatus, {});
            t17 = _jsx(Text, { children: " " });
            t18 = _jsx(Text, { dimColor: true, italic: true, children: "Estimated usage by category" });
            $[35] = t16;
            $[36] = t17;
            $[37] = t18;
        }
        else {
            t16 = $[35];
            t17 = $[36];
            t18 = $[37];
        }
        let t19;
        if ($[38] !== rawMaxTokens) {
            t19 = (cat_2, index) => {
                const tokenDisplay = formatTokens(cat_2.tokens);
                const percentDisplay = cat_2.isDeferred ? "N/A" : `${(cat_2.tokens / rawMaxTokens * 100).toFixed(1)}%`;
                const isReserved = cat_2.name === RESERVED_CATEGORY_NAME;
                const displayName = cat_2.name;
                const symbol = cat_2.isDeferred ? " " : isReserved ? "\u26DD" : "\u26C1";
                return _jsxs(Box, { children: [_jsx(Text, { color: cat_2.color, children: symbol }), _jsxs(Text, { children: [" ", displayName, ": "] }), _jsxs(Text, { dimColor: true, children: [tokenDisplay, " tokens (", percentDisplay, ")"] })] }, index);
            };
            $[38] = rawMaxTokens;
            $[39] = t19;
        }
        else {
            t19 = $[39];
        }
        const t20 = visibleCategories.map(t19);
        let t21;
        if ($[40] !== categories || $[41] !== rawMaxTokens) {
            t21 = (categories.find(_temp6)?.tokens ?? 0) > 0 && _jsxs(Box, { children: [_jsx(Text, { dimColor: true, children: "\u26F6" }), _jsx(Text, { children: " Free space: " }), _jsxs(Text, { dimColor: true, children: [formatTokens(categories.find(_temp7)?.tokens || 0), " ", "(", ((categories.find(_temp8)?.tokens || 0) / rawMaxTokens * 100).toFixed(1), "%)"] })] });
            $[40] = categories;
            $[41] = rawMaxTokens;
            $[42] = t21;
        }
        else {
            t21 = $[42];
        }
        const t22 = autocompactCategory && autocompactCategory.tokens > 0 && _jsxs(Box, { children: [_jsx(Text, { color: autocompactCategory.color, children: "\u26DD" }), _jsxs(Text, { dimColor: true, children: [" ", autocompactCategory.name, ": "] }), _jsxs(Text, { dimColor: true, children: [formatTokens(autocompactCategory.tokens), " tokens (", (autocompactCategory.tokens / rawMaxTokens * 100).toFixed(1), "%)"] })] });
        let t23;
        if ($[43] !== t15 || $[44] !== t20 || $[45] !== t21 || $[46] !== t22) {
            t23 = _jsxs(Box, { flexDirection: "column", gap: 0, flexShrink: 0, children: [t15, t16, t17, t18, t20, t21, t22] });
            $[43] = t15;
            $[44] = t20;
            $[45] = t21;
            $[46] = t22;
            $[47] = t23;
        }
        else {
            t23 = $[47];
        }
        if ($[48] !== t12 || $[49] !== t23) {
            t9 = _jsxs(Box, { flexDirection: "row", gap: 2, children: [t12, t23] });
            $[48] = t12;
            $[49] = t23;
            $[50] = t9;
        }
        else {
            t9 = $[50];
        }
        T0 = Box;
        t2 = "column";
        t3 = -1;
        if ($[51] !== hasDeferredMcpTools || $[52] !== mcpTools) {
            t4 = mcpTools.length > 0 && _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsxs(Box, { children: [_jsx(Text, { bold: true, children: "MCP tools" }), _jsxs(Text, { dimColor: true, children: [" ", "\u00B7 /mcp", hasDeferredMcpTools ? " (loaded on-demand)" : ""] })] }), mcpTools.some(_temp9) && _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { dimColor: true, children: "Loaded" }), mcpTools.filter(_temp0).map(_temp1)] }), hasDeferredMcpTools && mcpTools.some(_temp10) && _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { dimColor: true, children: "Available" }), mcpTools.filter(_temp11).map(_temp12)] }), !hasDeferredMcpTools && mcpTools.map(_temp13)] });
            $[51] = hasDeferredMcpTools;
            $[52] = mcpTools;
            $[53] = t4;
        }
        else {
            t4 = $[53];
        }
        t5 = (systemTools && systemTools.length > 0 || hasDeferredBuiltinTools) && false && _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsxs(Box, { children: [_jsx(Text, { bold: true, children: "[ANT-ONLY] System tools" }), hasDeferredBuiltinTools && _jsx(Text, { dimColor: true, children: " (some loaded on-demand)" })] }), _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { dimColor: true, children: "Loaded" }), systemTools?.map(_temp14), deferredBuiltinTools.filter(_temp15).map(_temp16)] }), hasDeferredBuiltinTools && deferredBuiltinTools.some(_temp17) && _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { dimColor: true, children: "Available" }), deferredBuiltinTools.filter(_temp18).map(_temp19)] })] });
        $[0] = categories;
        $[1] = gridRows;
        $[2] = mcpTools;
        $[3] = model;
        $[4] = percentage;
        $[5] = rawMaxTokens;
        $[6] = systemTools;
        $[7] = t1;
        $[8] = totalTokens;
        $[9] = T0;
        $[10] = T1;
        $[11] = t2;
        $[12] = t3;
        $[13] = t4;
        $[14] = t5;
        $[15] = t6;
        $[16] = t7;
        $[17] = t8;
        $[18] = t9;
    }
    else {
        T0 = $[9];
        T1 = $[10];
        t2 = $[11];
        t3 = $[12];
        t4 = $[13];
        t5 = $[14];
        t6 = $[15];
        t7 = $[16];
        t8 = $[17];
        t9 = $[18];
    }
    let t10;
    if ($[54] !== systemPromptSections) {
        t10 = systemPromptSections && systemPromptSections.length > 0 && false && _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { bold: true, children: "[ANT-ONLY] System prompt sections" }), systemPromptSections.map(_temp20)] });
        $[54] = systemPromptSections;
        $[55] = t10;
    }
    else {
        t10 = $[55];
    }
    let t11;
    if ($[56] !== agents) {
        t11 = agents.length > 0 && _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsxs(Box, { children: [_jsx(Text, { bold: true, children: "Custom agents" }), _jsx(Text, { dimColor: true, children: " \u00B7 /agents" })] }), Array.from(groupBySource(agents).entries()).map(_temp22)] });
        $[56] = agents;
        $[57] = t11;
    }
    else {
        t11 = $[57];
    }
    let t12;
    if ($[58] !== memoryFiles) {
        t12 = memoryFiles.length > 0 && _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsxs(Box, { children: [_jsx(Text, { bold: true, children: "Memory files" }), _jsx(Text, { dimColor: true, children: " \u00B7 /memory" })] }), memoryFiles.map(_temp23)] });
        $[58] = memoryFiles;
        $[59] = t12;
    }
    else {
        t12 = $[59];
    }
    let t13;
    if ($[60] !== skills) {
        t13 = skills && skills.tokens > 0 && _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsxs(Box, { children: [_jsx(Text, { bold: true, children: "Skills" }), _jsx(Text, { dimColor: true, children: " \u00B7 /skills" })] }), Array.from(groupBySource(skills.skillFrontmatter).entries()).map(_temp25)] });
        $[60] = skills;
        $[61] = t13;
    }
    else {
        t13 = $[61];
    }
    let t14;
    if ($[62] !== messageBreakdown) {
        t14 = messageBreakdown && false && _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { bold: true, children: "[ANT-ONLY] Message breakdown" }), _jsxs(Box, { flexDirection: "column", marginLeft: 1, children: [_jsxs(Box, { children: [_jsx(Text, { children: "Tool calls: " }), _jsxs(Text, { dimColor: true, children: [formatTokens(messageBreakdown.toolCallTokens), " tokens"] })] }), _jsxs(Box, { children: [_jsx(Text, { children: "Tool results: " }), _jsxs(Text, { dimColor: true, children: [formatTokens(messageBreakdown.toolResultTokens), " tokens"] })] }), _jsxs(Box, { children: [_jsx(Text, { children: "Attachments: " }), _jsxs(Text, { dimColor: true, children: [formatTokens(messageBreakdown.attachmentTokens), " tokens"] })] }), _jsxs(Box, { children: [_jsx(Text, { children: "Assistant messages (non-tool): " }), _jsxs(Text, { dimColor: true, children: [formatTokens(messageBreakdown.assistantMessageTokens), " tokens"] })] }), _jsxs(Box, { children: [_jsx(Text, { children: "User messages (non-tool-result): " }), _jsxs(Text, { dimColor: true, children: [formatTokens(messageBreakdown.userMessageTokens), " tokens"] })] })] }), messageBreakdown.toolCallsByType.length > 0 && _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { bold: true, children: "[ANT-ONLY] Top tools" }), messageBreakdown.toolCallsByType.slice(0, 5).map(_temp26)] }), messageBreakdown.attachmentsByType.length > 0 && _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { bold: true, children: "[ANT-ONLY] Top attachments" }), messageBreakdown.attachmentsByType.slice(0, 5).map(_temp27)] })] });
        $[62] = messageBreakdown;
        $[63] = t14;
    }
    else {
        t14 = $[63];
    }
    let t15;
    if ($[64] !== T0 || $[65] !== t10 || $[66] !== t11 || $[67] !== t12 || $[68] !== t13 || $[69] !== t14 || $[70] !== t2 || $[71] !== t3 || $[72] !== t4 || $[73] !== t5) {
        t15 = _jsxs(T0, { flexDirection: t2, marginLeft: t3, children: [t4, t5, t10, t11, t12, t13, t14] });
        $[64] = T0;
        $[65] = t10;
        $[66] = t11;
        $[67] = t12;
        $[68] = t13;
        $[69] = t14;
        $[70] = t2;
        $[71] = t3;
        $[72] = t4;
        $[73] = t5;
        $[74] = t15;
    }
    else {
        t15 = $[74];
    }
    let t16;
    if ($[75] !== data) {
        t16 = generateContextSuggestions(data);
        $[75] = data;
        $[76] = t16;
    }
    else {
        t16 = $[76];
    }
    let t17;
    if ($[77] !== t16) {
        t17 = _jsx(ContextSuggestions, { suggestions: t16 });
        $[77] = t16;
        $[78] = t17;
    }
    else {
        t17 = $[78];
    }
    let t18;
    if ($[79] !== T1 || $[80] !== t15 || $[81] !== t17 || $[82] !== t6 || $[83] !== t7 || $[84] !== t8 || $[85] !== t9) {
        t18 = _jsxs(T1, { flexDirection: t6, paddingLeft: t7, children: [t8, t9, t15, t17] });
        $[79] = T1;
        $[80] = t15;
        $[81] = t17;
        $[82] = t6;
        $[83] = t7;
        $[84] = t8;
        $[85] = t9;
        $[86] = t18;
    }
    else {
        t18 = $[86];
    }
    return t18;
}
function _temp27(attachment, i_10) {
    return _jsxs(Box, { marginLeft: 1, children: [_jsxs(Text, { children: ["\u2514 ", attachment.name, ": "] }), _jsxs(Text, { dimColor: true, children: [formatTokens(attachment.tokens), " tokens"] })] }, i_10);
}
function _temp26(tool_5, i_9) {
    return _jsxs(Box, { marginLeft: 1, children: [_jsxs(Text, { children: ["\u2514 ", tool_5.name, ": "] }), _jsxs(Text, { dimColor: true, children: ["calls ", formatTokens(tool_5.callTokens), ", results", " ", formatTokens(tool_5.resultTokens)] })] }, i_9);
}
function _temp25(t0) {
    const [sourceDisplay_0, sourceSkills] = t0;
    return _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { dimColor: true, children: sourceDisplay_0 }), sourceSkills.map(_temp24)] }, sourceDisplay_0);
}
function _temp24(skill, i_8) {
    return _jsxs(Box, { children: [_jsxs(Text, { children: ["\u2514 ", skill.name, ": "] }), _jsxs(Text, { dimColor: true, children: [formatTokens(skill.tokens), " tokens"] })] }, i_8);
}
function _temp23(file, i_7) {
    return _jsxs(Box, { children: [_jsxs(Text, { children: ["\u2514 ", getDisplayPath(file.path), ": "] }), _jsxs(Text, { dimColor: true, children: [formatTokens(file.tokens), " tokens"] })] }, i_7);
}
function _temp22(t0) {
    const [sourceDisplay, sourceAgents] = t0;
    return _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { dimColor: true, children: sourceDisplay }), sourceAgents.map(_temp21)] }, sourceDisplay);
}
function _temp21(agent, i_6) {
    return _jsxs(Box, { children: [_jsxs(Text, { children: ["\u2514 ", agent.agentType, ": "] }), _jsxs(Text, { dimColor: true, children: [formatTokens(agent.tokens), " tokens"] })] }, i_6);
}
function _temp20(section, i_5) {
    return _jsxs(Box, { children: [_jsxs(Text, { children: ["\u2514 ", section.name, ": "] }), _jsxs(Text, { dimColor: true, children: [formatTokens(section.tokens), " tokens"] })] }, i_5);
}
function _temp19(tool_4, i_4) {
    return _jsx(Box, { children: _jsxs(Text, { dimColor: true, children: ["\u2514 ", tool_4.name] }) }, i_4);
}
function _temp18(t_4) {
    return !t_4.isLoaded;
}
function _temp17(t_5) {
    return !t_5.isLoaded;
}
function _temp16(tool_3, i_3) {
    return _jsxs(Box, { children: [_jsxs(Text, { children: ["\u2514 ", tool_3.name, ": "] }), _jsxs(Text, { dimColor: true, children: [formatTokens(tool_3.tokens), " tokens"] })] }, `def-${i_3}`);
}
function _temp15(t_3) {
    return t_3.isLoaded;
}
function _temp14(tool_2, i_2) {
    return _jsxs(Box, { children: [_jsxs(Text, { children: ["\u2514 ", tool_2.name, ": "] }), _jsxs(Text, { dimColor: true, children: [formatTokens(tool_2.tokens), " tokens"] })] }, `sys-${i_2}`);
}
function _temp13(tool_1, i_1) {
    return _jsxs(Box, { children: [_jsxs(Text, { children: ["\u2514 ", tool_1.name, ": "] }), _jsxs(Text, { dimColor: true, children: [formatTokens(tool_1.tokens), " tokens"] })] }, i_1);
}
function _temp12(tool_0, i_0) {
    return _jsx(Box, { children: _jsxs(Text, { dimColor: true, children: ["\u2514 ", tool_0.name] }) }, i_0);
}
function _temp11(t_1) {
    return !t_1.isLoaded;
}
function _temp10(t_2) {
    return !t_2.isLoaded;
}
function _temp1(tool, i) {
    return _jsxs(Box, { children: [_jsxs(Text, { children: ["\u2514 ", tool.name, ": "] }), _jsxs(Text, { dimColor: true, children: [formatTokens(tool.tokens), " tokens"] })] }, i);
}
function _temp0(t) {
    return t.isLoaded;
}
function _temp9(t_0) {
    return t_0.isLoaded;
}
function _temp8(c_0) {
    return c_0.name === "Free space";
}
function _temp7(c) {
    return c.name === "Free space";
}
function _temp6(c_1) {
    return c_1.name === "Free space";
}
function _temp5(row, rowIndex) {
    return _jsx(Box, { flexDirection: "row", marginLeft: -1, children: row.map(_temp4) }, rowIndex);
}
function _temp4(square, colIndex) {
    if (square.categoryName === "Free space") {
        return _jsx(Text, { dimColor: true, children: "\u26F6 " }, colIndex);
    }
    if (square.categoryName === RESERVED_CATEGORY_NAME) {
        return _jsx(Text, { color: square.color, children: "\u26DD " }, colIndex);
    }
    return _jsx(Text, { color: square.color, children: square.squareFullness >= 0.7 ? "\u26C1 " : "\u26C0 " }, colIndex);
}
function _temp3(cat_1) {
    return cat_1.name === RESERVED_CATEGORY_NAME;
}
function _temp2(cat_0) {
    return cat_0.isDeferred && cat_0.name.includes("MCP");
}
function _temp(cat) {
    return cat.tokens > 0 && cat.name !== "Free space" && cat.name !== RESERVED_CATEGORY_NAME && !cat.isDeferred;
}
