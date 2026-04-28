import { jsxs as _jsxs, Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import React from 'react';
import { useElapsedTime } from '../../hooks/useElapsedTime.js';
import { Box, Text, useTheme } from '../../ink.js';
import { useKeybindings } from '../../keybindings/useKeybinding.js';
import { getEmptyToolPermissionContext } from '../../Tool.js';
import { getTools } from '../../tools.js';
import { formatNumber, truncateToWidth } from '../../utils/format.js';
import { toInkColor } from '../../utils/ink.js';
import { Byline } from '../design-system/Byline.js';
import { Dialog } from '../design-system/Dialog.js';
import { KeyboardShortcutHint } from '../design-system/KeyboardShortcutHint.js';
import { renderToolActivity } from './renderToolActivity.js';
import { describeTeammateActivity } from './taskStatusUtils.js';
export function InProcessTeammateDetailDialog(t0) {
    const $ = _c(63);
    const { teammate, onDone, onKill, onBack, onForeground } = t0;
    const [theme] = useTheme();
    let t1;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = getTools(getEmptyToolPermissionContext());
        $[0] = t1;
    }
    else {
        t1 = $[0];
    }
    const tools = t1;
    const elapsedTime = useElapsedTime(teammate.startTime, teammate.status === "running", 1000, teammate.totalPausedMs ?? 0);
    let t2;
    if ($[1] !== onDone) {
        t2 = {
            "confirm:yes": onDone
        };
        $[1] = onDone;
        $[2] = t2;
    }
    else {
        t2 = $[2];
    }
    let t3;
    if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
        t3 = {
            context: "Confirmation"
        };
        $[3] = t3;
    }
    else {
        t3 = $[3];
    }
    useKeybindings(t2, t3);
    let t4;
    if ($[4] !== onBack || $[5] !== onDone || $[6] !== onForeground || $[7] !== onKill || $[8] !== teammate.status) {
        t4 = e => {
            if (e.key === " ") {
                e.preventDefault();
                onDone();
            }
            else {
                if (e.key === "left" && onBack) {
                    e.preventDefault();
                    onBack();
                }
                else {
                    if (e.key === "x" && teammate.status === "running" && onKill) {
                        e.preventDefault();
                        onKill();
                    }
                    else {
                        if (e.key === "f" && teammate.status === "running" && onForeground) {
                            e.preventDefault();
                            onForeground();
                        }
                    }
                }
            }
        };
        $[4] = onBack;
        $[5] = onDone;
        $[6] = onForeground;
        $[7] = onKill;
        $[8] = teammate.status;
        $[9] = t4;
    }
    else {
        t4 = $[9];
    }
    const handleKeyDown = t4;
    let t5;
    if ($[10] !== teammate) {
        t5 = describeTeammateActivity(teammate);
        $[10] = teammate;
        $[11] = t5;
    }
    else {
        t5 = $[11];
    }
    const activity = t5;
    const tokenCount = teammate.result?.totalTokens ?? teammate.progress?.tokenCount;
    const toolUseCount = teammate.result?.totalToolUseCount ?? teammate.progress?.toolUseCount;
    let t6;
    if ($[12] !== teammate.prompt) {
        t6 = truncateToWidth(teammate.prompt, 300);
        $[12] = teammate.prompt;
        $[13] = t6;
    }
    else {
        t6 = $[13];
    }
    const displayPrompt = t6;
    let t7;
    if ($[14] !== teammate.identity.color) {
        t7 = toInkColor(teammate.identity.color);
        $[14] = teammate.identity.color;
        $[15] = t7;
    }
    else {
        t7 = $[15];
    }
    let t8;
    if ($[16] !== t7 || $[17] !== teammate.identity.agentName) {
        t8 = _jsxs(Text, { color: t7, children: ["@", teammate.identity.agentName] });
        $[16] = t7;
        $[17] = teammate.identity.agentName;
        $[18] = t8;
    }
    else {
        t8 = $[18];
    }
    let t9;
    if ($[19] !== activity) {
        t9 = activity && _jsxs(Text, { dimColor: true, children: [" (", activity, ")"] });
        $[19] = activity;
        $[20] = t9;
    }
    else {
        t9 = $[20];
    }
    let t10;
    if ($[21] !== t8 || $[22] !== t9) {
        t10 = _jsxs(Text, { children: [t8, t9] });
        $[21] = t8;
        $[22] = t9;
        $[23] = t10;
    }
    else {
        t10 = $[23];
    }
    const title = t10;
    let t11;
    if ($[24] !== teammate.status) {
        t11 = teammate.status !== "running" && _jsxs(Text, { color: teammate.status === "completed" ? "success" : teammate.status === "killed" ? "warning" : "error", children: [teammate.status === "completed" ? "Completed" : teammate.status === "failed" ? "Failed" : "Stopped", " \xB7 "] });
        $[24] = teammate.status;
        $[25] = t11;
    }
    else {
        t11 = $[25];
    }
    let t12;
    if ($[26] !== tokenCount) {
        t12 = tokenCount !== undefined && tokenCount > 0 && _jsxs(_Fragment, { children: [" \u00B7 ", formatNumber(tokenCount), " tokens"] });
        $[26] = tokenCount;
        $[27] = t12;
    }
    else {
        t12 = $[27];
    }
    let t13;
    if ($[28] !== toolUseCount) {
        t13 = toolUseCount !== undefined && toolUseCount > 0 && _jsxs(_Fragment, { children: [" ", "\u00B7 ", toolUseCount, " ", toolUseCount === 1 ? "tool" : "tools"] });
        $[28] = toolUseCount;
        $[29] = t13;
    }
    else {
        t13 = $[29];
    }
    let t14;
    if ($[30] !== elapsedTime || $[31] !== t12 || $[32] !== t13) {
        t14 = _jsxs(Text, { dimColor: true, children: [elapsedTime, t12, t13] });
        $[30] = elapsedTime;
        $[31] = t12;
        $[32] = t13;
        $[33] = t14;
    }
    else {
        t14 = $[33];
    }
    let t15;
    if ($[34] !== t11 || $[35] !== t14) {
        t15 = _jsxs(Text, { children: [t11, t14] });
        $[34] = t11;
        $[35] = t14;
        $[36] = t15;
    }
    else {
        t15 = $[36];
    }
    const subtitle = t15;
    let t16;
    if ($[37] !== onBack || $[38] !== onForeground || $[39] !== onKill || $[40] !== teammate.status) {
        t16 = exitState => exitState.pending ? _jsxs(Text, { children: ["Press ", exitState.keyName, " again to exit"] }) : _jsxs(Byline, { children: [onBack && _jsx(KeyboardShortcutHint, { shortcut: "\u2190", action: "go back" }), _jsx(KeyboardShortcutHint, { shortcut: "Esc/Enter/Space", action: "close" }), teammate.status === "running" && onKill && _jsx(KeyboardShortcutHint, { shortcut: "x", action: "stop" }), teammate.status === "running" && onForeground && _jsx(KeyboardShortcutHint, { shortcut: "f", action: "foreground" })] });
        $[37] = onBack;
        $[38] = onForeground;
        $[39] = onKill;
        $[40] = teammate.status;
        $[41] = t16;
    }
    else {
        t16 = $[41];
    }
    let t17;
    if ($[42] !== teammate.progress || $[43] !== teammate.status || $[44] !== theme) {
        t17 = teammate.status === "running" && teammate.progress?.recentActivities && teammate.progress.recentActivities.length > 0 && _jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { bold: true, dimColor: true, children: "Progress" }), teammate.progress.recentActivities.map((activity_0, i) => _jsxs(Text, { dimColor: i < teammate.progress.recentActivities.length - 1, wrap: "wrap", children: [i === teammate.progress.recentActivities.length - 1 ? "\u203A " : "  ", renderToolActivity(activity_0, tools, theme)] }, i))] });
        $[42] = teammate.progress;
        $[43] = teammate.status;
        $[44] = theme;
        $[45] = t17;
    }
    else {
        t17 = $[45];
    }
    let t18;
    if ($[46] === Symbol.for("react.memo_cache_sentinel")) {
        t18 = _jsx(Text, { bold: true, dimColor: true, children: "Prompt" });
        $[46] = t18;
    }
    else {
        t18 = $[46];
    }
    let t19;
    if ($[47] !== displayPrompt) {
        t19 = _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [t18, _jsx(Text, { wrap: "wrap", children: displayPrompt })] });
        $[47] = displayPrompt;
        $[48] = t19;
    }
    else {
        t19 = $[48];
    }
    let t20;
    if ($[49] !== teammate.error || $[50] !== teammate.status) {
        t20 = teammate.status === "failed" && teammate.error && _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { bold: true, color: "error", children: "Error" }), _jsx(Text, { color: "error", wrap: "wrap", children: teammate.error })] });
        $[49] = teammate.error;
        $[50] = teammate.status;
        $[51] = t20;
    }
    else {
        t20 = $[51];
    }
    let t21;
    if ($[52] !== onDone || $[53] !== subtitle || $[54] !== t16 || $[55] !== t17 || $[56] !== t19 || $[57] !== t20 || $[58] !== title) {
        t21 = _jsxs(Dialog, { title: title, subtitle: subtitle, onCancel: onDone, color: "background", inputGuide: t16, children: [t17, t19, t20] });
        $[52] = onDone;
        $[53] = subtitle;
        $[54] = t16;
        $[55] = t17;
        $[56] = t19;
        $[57] = t20;
        $[58] = title;
        $[59] = t21;
    }
    else {
        t21 = $[59];
    }
    let t22;
    if ($[60] !== handleKeyDown || $[61] !== t21) {
        t22 = _jsx(Box, { flexDirection: "column", tabIndex: 0, autoFocus: true, onKeyDown: handleKeyDown, children: t21 });
        $[60] = handleKeyDown;
        $[61] = t21;
        $[62] = t22;
    }
    else {
        t22 = $[62];
    }
    return t22;
}
