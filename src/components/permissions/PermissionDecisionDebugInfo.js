import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import { feature } from 'bun:bundle';
import chalk from 'chalk';
import figures from 'figures';
import React from 'react';
import { Ansi, Box, color, Text, useTheme } from '../../ink.js';
import { useAppState } from '../../state/AppState.js';
import { permissionModeTitle } from '../../utils/permissions/PermissionMode.js';
import { extractRules } from '../../utils/permissions/PermissionUpdate.js';
import { permissionRuleValueToString } from '../../utils/permissions/permissionRuleParser.js';
import { detectUnreachableRules } from '../../utils/permissions/shadowedRuleDetection.js';
import { SandboxManager } from '../../utils/sandbox/sandbox-adapter.js';
import { getSettingSourceDisplayNameLowercase } from '../../utils/settings/constants.js';
function decisionReasonDisplayString(decisionReason) {
    if ((feature('BASH_CLASSIFIER') || feature('TRANSCRIPT_CLASSIFIER')) && decisionReason.type === 'classifier') {
        return `${chalk.bold(decisionReason.classifier)} classifier: ${decisionReason.reason}`;
    }
    switch (decisionReason.type) {
        case 'rule':
            return `${chalk.bold(permissionRuleValueToString(decisionReason.rule.ruleValue))} rule from ${getSettingSourceDisplayNameLowercase(decisionReason.rule.source)}`;
        case 'mode':
            return `${permissionModeTitle(decisionReason.mode)} mode`;
        case 'sandboxOverride':
            return 'Requires permission to bypass sandbox';
        case 'workingDir':
            return decisionReason.reason;
        case 'safetyCheck':
        case 'other':
            return decisionReason.reason;
        case 'permissionPromptTool':
            return `${chalk.bold(decisionReason.permissionPromptToolName)} permission prompt tool`;
        case 'hook':
            return decisionReason.reason ? `${chalk.bold(decisionReason.hookName)} hook: ${decisionReason.reason}` : `${chalk.bold(decisionReason.hookName)} hook`;
        case 'asyncAgent':
            return decisionReason.reason;
        default:
            return '';
    }
}
function PermissionDecisionInfoItem(t0) {
    const $ = _c(10);
    const { title, decisionReason } = t0;
    const [theme] = useTheme();
    let t1;
    if ($[0] !== decisionReason || $[1] !== theme) {
        t1 = function formatDecisionReason() {
            switch (decisionReason.type) {
                case "subcommandResults":
                    {
                        return _jsx(Box, { flexDirection: "column", children: Array.from(decisionReason.reasons.entries()).map(t2 => {
                                const [subcommand, result] = t2;
                                const icon = result.behavior === "allow" ? color("success", theme)(figures.tick) : color("error", theme)(figures.cross);
                                return _jsxs(Box, { flexDirection: "column", children: [_jsxs(Text, { children: [icon, " ", subcommand] }), result.decisionReason !== undefined && result.decisionReason.type !== "subcommandResults" && _jsxs(Text, { children: [_jsxs(Text, { dimColor: true, children: ["  ", "\u23BF", "  "] }), _jsx(Ansi, { children: decisionReasonDisplayString(result.decisionReason) })] }), result.behavior === "ask" && _jsx(SuggestedRules, { suggestions: result.suggestions })] }, subcommand);
                            }) });
                    }
                default:
                    {
                        return _jsx(Text, { children: _jsx(Ansi, { children: decisionReasonDisplayString(decisionReason) }) });
                    }
            }
        };
        $[0] = decisionReason;
        $[1] = theme;
        $[2] = t1;
    }
    else {
        t1 = $[2];
    }
    const formatDecisionReason = t1;
    let t2;
    if ($[3] !== title) {
        t2 = title && _jsx(Text, { children: title });
        $[3] = title;
        $[4] = t2;
    }
    else {
        t2 = $[4];
    }
    let t3;
    if ($[5] !== formatDecisionReason) {
        t3 = formatDecisionReason();
        $[5] = formatDecisionReason;
        $[6] = t3;
    }
    else {
        t3 = $[6];
    }
    let t4;
    if ($[7] !== t2 || $[8] !== t3) {
        t4 = _jsxs(Box, { flexDirection: "column", children: [t2, t3] });
        $[7] = t2;
        $[8] = t3;
        $[9] = t4;
    }
    else {
        t4 = $[9];
    }
    return t4;
}
function SuggestedRules(t0) {
    const $ = _c(18);
    const { suggestions } = t0;
    let T0;
    let T1;
    let t1;
    let t2;
    let t3;
    let t4;
    let t5;
    if ($[0] !== suggestions) {
        t5 = Symbol.for("react.early_return_sentinel");
        bb0: {
            const rules = extractRules(suggestions);
            if (rules.length === 0) {
                t5 = null;
                break bb0;
            }
            T1 = Text;
            if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
                t2 = _jsxs(Text, { dimColor: true, children: ["  ", "\u23BF", "  "] });
                $[8] = t2;
            }
            else {
                t2 = $[8];
            }
            t3 = "Suggested rules:";
            t4 = " ";
            T0 = Ansi;
            t1 = rules.map(_temp).join(", ");
        }
        $[0] = suggestions;
        $[1] = T0;
        $[2] = T1;
        $[3] = t1;
        $[4] = t2;
        $[5] = t3;
        $[6] = t4;
        $[7] = t5;
    }
    else {
        T0 = $[1];
        T1 = $[2];
        t1 = $[3];
        t2 = $[4];
        t3 = $[5];
        t4 = $[6];
        t5 = $[7];
    }
    if (t5 !== Symbol.for("react.early_return_sentinel")) {
        return t5;
    }
    let t6;
    if ($[9] !== T0 || $[10] !== t1) {
        t6 = _jsx(T0, { children: t1 });
        $[9] = T0;
        $[10] = t1;
        $[11] = t6;
    }
    else {
        t6 = $[11];
    }
    let t7;
    if ($[12] !== T1 || $[13] !== t2 || $[14] !== t3 || $[15] !== t4 || $[16] !== t6) {
        t7 = _jsxs(T1, { children: [t2, t3, t4, t6] });
        $[12] = T1;
        $[13] = t2;
        $[14] = t3;
        $[15] = t4;
        $[16] = t6;
        $[17] = t7;
    }
    else {
        t7 = $[17];
    }
    return t7;
}
function _temp(rule) {
    return chalk.bold(permissionRuleValueToString(rule));
}
// Helper function to extract directories from permission updates
function extractDirectories(updates) {
    if (!updates)
        return [];
    return updates.flatMap(update => {
        switch (update.type) {
            case 'addDirectories':
                return update.directories;
            default:
                return [];
        }
    });
}
// Helper function to extract mode from permission updates
function extractMode(updates) {
    if (!updates)
        return undefined;
    const update = updates.findLast(u => u.type === 'setMode');
    return update?.type === 'setMode' ? update.mode : undefined;
}
function SuggestionDisplay(t0) {
    const $ = _c(22);
    const { suggestions, width } = t0;
    if (!suggestions || suggestions.length === 0) {
        let t1;
        if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
            t1 = _jsx(Text, { dimColor: true, children: "Suggestions " });
            $[0] = t1;
        }
        else {
            t1 = $[0];
        }
        let t2;
        if ($[1] !== width) {
            t2 = _jsx(Box, { justifyContent: "flex-end", minWidth: width, children: t1 });
            $[1] = width;
            $[2] = t2;
        }
        else {
            t2 = $[2];
        }
        let t3;
        if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
            t3 = _jsx(Text, { children: "None" });
            $[3] = t3;
        }
        else {
            t3 = $[3];
        }
        let t4;
        if ($[4] !== t2) {
            t4 = _jsxs(Box, { flexDirection: "row", children: [t2, t3] });
            $[4] = t2;
            $[5] = t4;
        }
        else {
            t4 = $[5];
        }
        return t4;
    }
    let t1;
    let t2;
    if ($[6] !== suggestions || $[7] !== width) {
        t2 = Symbol.for("react.early_return_sentinel");
        bb0: {
            const rules = extractRules(suggestions);
            const directories = extractDirectories(suggestions);
            const mode = extractMode(suggestions);
            if (rules.length === 0 && directories.length === 0 && !mode) {
                let t3;
                if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
                    t3 = _jsx(Text, { dimColor: true, children: "Suggestion " });
                    $[10] = t3;
                }
                else {
                    t3 = $[10];
                }
                let t4;
                if ($[11] !== width) {
                    t4 = _jsx(Box, { justifyContent: "flex-end", minWidth: width, children: t3 });
                    $[11] = width;
                    $[12] = t4;
                }
                else {
                    t4 = $[12];
                }
                let t5;
                if ($[13] === Symbol.for("react.memo_cache_sentinel")) {
                    t5 = _jsx(Text, { children: "None" });
                    $[13] = t5;
                }
                else {
                    t5 = $[13];
                }
                let t6;
                if ($[14] !== t4) {
                    t6 = _jsxs(Box, { flexDirection: "row", children: [t4, t5] });
                    $[14] = t4;
                    $[15] = t6;
                }
                else {
                    t6 = $[15];
                }
                t2 = t6;
                break bb0;
            }
            let t3;
            if ($[16] === Symbol.for("react.memo_cache_sentinel")) {
                t3 = _jsx(Text, { dimColor: true, children: "Suggestions " });
                $[16] = t3;
            }
            else {
                t3 = $[16];
            }
            let t4;
            if ($[17] !== width) {
                t4 = _jsx(Box, { justifyContent: "flex-end", minWidth: width, children: t3 });
                $[17] = width;
                $[18] = t4;
            }
            else {
                t4 = $[18];
            }
            let t5;
            if ($[19] === Symbol.for("react.memo_cache_sentinel")) {
                t5 = _jsx(Text, { children: " " });
                $[19] = t5;
            }
            else {
                t5 = $[19];
            }
            let t6;
            if ($[20] !== t4) {
                t6 = _jsxs(Box, { flexDirection: "row", children: [t4, t5] });
                $[20] = t4;
                $[21] = t6;
            }
            else {
                t6 = $[21];
            }
            t1 = _jsxs(Box, { flexDirection: "column", children: [t6, rules.length > 0 && _jsxs(Box, { flexDirection: "row", children: [_jsx(Box, { justifyContent: "flex-end", minWidth: width, children: _jsx(Text, { dimColor: true, children: " Rules " }) }), _jsx(Box, { flexDirection: "column", children: rules.map(_temp2) })] }), directories.length > 0 && _jsxs(Box, { flexDirection: "row", children: [_jsx(Box, { justifyContent: "flex-end", minWidth: width, children: _jsx(Text, { dimColor: true, children: " Directories " }) }), _jsx(Box, { flexDirection: "column", children: directories.map(_temp3) })] }), mode && _jsxs(Box, { flexDirection: "row", children: [_jsx(Box, { justifyContent: "flex-end", minWidth: width, children: _jsx(Text, { dimColor: true, children: " Mode " }) }), _jsx(Text, { children: permissionModeTitle(mode) })] })] });
        }
        $[6] = suggestions;
        $[7] = width;
        $[8] = t1;
        $[9] = t2;
    }
    else {
        t1 = $[8];
        t2 = $[9];
    }
    if (t2 !== Symbol.for("react.early_return_sentinel")) {
        return t2;
    }
    return t1;
}
function _temp3(dir, index_0) {
    return _jsxs(Text, { children: [figures.bullet, " ", dir] }, index_0);
}
function _temp2(rule, index) {
    return _jsxs(Text, { children: [figures.bullet, " ", permissionRuleValueToString(rule)] }, index);
}
export function PermissionDecisionDebugInfo(t0) {
    const $ = _c(25);
    const { permissionResult, toolName } = t0;
    const toolPermissionContext = useAppState(_temp4);
    const decisionReason = permissionResult.decisionReason;
    const suggestions = "suggestions" in permissionResult ? permissionResult.suggestions : undefined;
    let t1;
    if ($[0] !== suggestions || $[1] !== toolName || $[2] !== toolPermissionContext) {
        bb0: {
            const sandboxAutoAllowEnabled = SandboxManager.isSandboxingEnabled() && SandboxManager.isAutoAllowBashIfSandboxedEnabled();
            const all = detectUnreachableRules(toolPermissionContext, {
                sandboxAutoAllowEnabled
            });
            const suggestedRules = extractRules(suggestions);
            if (suggestedRules.length > 0) {
                t1 = all.filter(u => suggestedRules.some(suggested => suggested.toolName === u.rule.ruleValue.toolName && suggested.ruleContent === u.rule.ruleValue.ruleContent));
                break bb0;
            }
            if (toolName) {
                let t2;
                if ($[4] !== toolName) {
                    t2 = u_0 => u_0.rule.ruleValue.toolName === toolName;
                    $[4] = toolName;
                    $[5] = t2;
                }
                else {
                    t2 = $[5];
                }
                t1 = all.filter(t2);
                break bb0;
            }
            t1 = all;
        }
        $[0] = suggestions;
        $[1] = toolName;
        $[2] = toolPermissionContext;
        $[3] = t1;
    }
    else {
        t1 = $[3];
    }
    const unreachableRules = t1;
    let t2;
    if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
        t2 = _jsx(Box, { justifyContent: "flex-end", minWidth: 10, children: _jsx(Text, { dimColor: true, children: "Behavior " }) });
        $[6] = t2;
    }
    else {
        t2 = $[6];
    }
    let t3;
    if ($[7] !== permissionResult.behavior) {
        t3 = _jsxs(Box, { flexDirection: "row", children: [t2, _jsx(Text, { children: permissionResult.behavior })] });
        $[7] = permissionResult.behavior;
        $[8] = t3;
    }
    else {
        t3 = $[8];
    }
    let t4;
    if ($[9] !== permissionResult.behavior || $[10] !== permissionResult.message) {
        t4 = permissionResult.behavior !== "allow" && _jsxs(Box, { flexDirection: "row", children: [_jsx(Box, { justifyContent: "flex-end", minWidth: 10, children: _jsx(Text, { dimColor: true, children: "Message " }) }), _jsx(Text, { children: permissionResult.message })] });
        $[9] = permissionResult.behavior;
        $[10] = permissionResult.message;
        $[11] = t4;
    }
    else {
        t4 = $[11];
    }
    let t5;
    if ($[12] === Symbol.for("react.memo_cache_sentinel")) {
        t5 = _jsx(Box, { justifyContent: "flex-end", minWidth: 10, children: _jsx(Text, { dimColor: true, children: "Reason " }) });
        $[12] = t5;
    }
    else {
        t5 = $[12];
    }
    let t6;
    if ($[13] !== decisionReason) {
        t6 = _jsxs(Box, { flexDirection: "row", children: [t5, decisionReason === undefined ? _jsx(Text, { children: "undefined" }) : _jsx(PermissionDecisionInfoItem, { decisionReason: decisionReason })] });
        $[13] = decisionReason;
        $[14] = t6;
    }
    else {
        t6 = $[14];
    }
    let t7;
    if ($[15] !== suggestions) {
        t7 = _jsx(SuggestionDisplay, { suggestions: suggestions, width: 10 });
        $[15] = suggestions;
        $[16] = t7;
    }
    else {
        t7 = $[16];
    }
    let t8;
    if ($[17] !== unreachableRules) {
        t8 = unreachableRules.length > 0 && _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsxs(Text, { color: "warning", children: [figures.warning, " Unreachable Rules (", unreachableRules.length, ")"] }), unreachableRules.map(_temp5)] });
        $[17] = unreachableRules;
        $[18] = t8;
    }
    else {
        t8 = $[18];
    }
    let t9;
    if ($[19] !== t3 || $[20] !== t4 || $[21] !== t6 || $[22] !== t7 || $[23] !== t8) {
        t9 = _jsxs(Box, { flexDirection: "column", children: [t3, t4, t6, t7, t8] });
        $[19] = t3;
        $[20] = t4;
        $[21] = t6;
        $[22] = t7;
        $[23] = t8;
        $[24] = t9;
    }
    else {
        t9 = $[24];
    }
    return t9;
}
function _temp5(u_1, i) {
    return _jsxs(Box, { flexDirection: "column", marginLeft: 2, children: [_jsx(Text, { color: "warning", children: permissionRuleValueToString(u_1.rule.ruleValue) }), _jsxs(Text, { dimColor: true, children: ["  ", u_1.reason] }), _jsxs(Text, { dimColor: true, children: ["  ", "Fix: ", u_1.fix] })] }, i);
}
function _temp4(s) {
    return s.toolPermissionContext;
}
