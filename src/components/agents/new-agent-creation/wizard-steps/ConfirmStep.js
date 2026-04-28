import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import React from 'react';
import { Box, Text } from '../../../../ink.js';
import { useKeybinding } from '../../../../keybindings/useKeybinding.js';
import { isAutoMemoryEnabled } from '../../../../memdir/paths.js';
import { getMemoryScopeDisplay } from '../../../../tools/AgentTool/agentMemory.js';
import { truncateToWidth } from '../../../../utils/format.js';
import { getAgentModelDisplay } from '../../../../utils/model/agent.js';
import { ConfigurableShortcutHint } from '../../../ConfigurableShortcutHint.js';
import { Byline } from '../../../design-system/Byline.js';
import { KeyboardShortcutHint } from '../../../design-system/KeyboardShortcutHint.js';
import { useWizard } from '../../../wizard/index.js';
import { WizardDialogLayout } from '../../../wizard/WizardDialogLayout.js';
import { getNewRelativeAgentFilePath } from '../../agentFileUtils.js';
import { validateAgent } from '../../validateAgent.js';
export function ConfirmStep(t0) {
    const $ = _c(88);
    const { tools, existingAgents, onSave, onSaveAndEdit, error } = t0;
    const { goBack, wizardData } = useWizard();
    let t1;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = {
            context: "Confirmation"
        };
        $[0] = t1;
    }
    else {
        t1 = $[0];
    }
    useKeybinding("confirm:no", goBack, t1);
    let t2;
    if ($[1] !== onSave || $[2] !== onSaveAndEdit) {
        t2 = e => {
            if (e.key === "s" || e.key === "return") {
                e.preventDefault();
                onSave();
            }
            else {
                if (e.key === "e") {
                    e.preventDefault();
                    onSaveAndEdit();
                }
            }
        };
        $[1] = onSave;
        $[2] = onSaveAndEdit;
        $[3] = t2;
    }
    else {
        t2 = $[3];
    }
    const handleKeyDown = t2;
    const agent = wizardData.finalAgent;
    let T0;
    let T1;
    let t10;
    let t11;
    let t12;
    let t13;
    let t14;
    let t15;
    let t16;
    let t17;
    let t18;
    let t19;
    let t3;
    let t4;
    let t5;
    let t6;
    let t7;
    let t8;
    let t9;
    if ($[4] !== agent || $[5] !== existingAgents || $[6] !== handleKeyDown || $[7] !== tools || $[8] !== wizardData.location) {
        const validation = validateAgent(agent, tools, existingAgents);
        let t20;
        if ($[28] !== agent) {
            t20 = truncateToWidth(agent.getSystemPrompt(), 240);
            $[28] = agent;
            $[29] = t20;
        }
        else {
            t20 = $[29];
        }
        const systemPromptPreview = t20;
        let t21;
        if ($[30] !== agent.whenToUse) {
            t21 = truncateToWidth(agent.whenToUse, 240);
            $[30] = agent.whenToUse;
            $[31] = t21;
        }
        else {
            t21 = $[31];
        }
        const whenToUsePreview = t21;
        const getToolsDisplay = _temp;
        let t22;
        if ($[32] !== agent.memory) {
            t22 = isAutoMemoryEnabled() ? _jsxs(Text, { children: [_jsx(Text, { bold: true, children: "Memory" }), ": ", getMemoryScopeDisplay(agent.memory)] }) : null;
            $[32] = agent.memory;
            $[33] = t22;
        }
        else {
            t22 = $[33];
        }
        const memoryDisplayElement = t22;
        T1 = WizardDialogLayout;
        t18 = "Confirm and save";
        if ($[34] === Symbol.for("react.memo_cache_sentinel")) {
            t19 = _jsxs(Byline, { children: [_jsx(KeyboardShortcutHint, { shortcut: "s/Enter", action: "save" }), _jsx(KeyboardShortcutHint, { shortcut: "e", action: "edit in your editor" }), _jsx(ConfigurableShortcutHint, { action: "confirm:no", context: "Confirmation", fallback: "Esc", description: "cancel" })] });
            $[34] = t19;
        }
        else {
            t19 = $[34];
        }
        T0 = Box;
        t3 = "column";
        t4 = 0;
        t5 = true;
        t6 = handleKeyDown;
        let t23;
        if ($[35] === Symbol.for("react.memo_cache_sentinel")) {
            t23 = _jsx(Text, { bold: true, children: "Name" });
            $[35] = t23;
        }
        else {
            t23 = $[35];
        }
        if ($[36] !== agent.agentType) {
            t7 = _jsxs(Text, { children: [t23, ": ", agent.agentType] });
            $[36] = agent.agentType;
            $[37] = t7;
        }
        else {
            t7 = $[37];
        }
        let t24;
        if ($[38] === Symbol.for("react.memo_cache_sentinel")) {
            t24 = _jsx(Text, { bold: true, children: "Location" });
            $[38] = t24;
        }
        else {
            t24 = $[38];
        }
        let t25;
        if ($[39] !== agent.agentType || $[40] !== wizardData.location) {
            t25 = getNewRelativeAgentFilePath({
                source: wizardData.location,
                agentType: agent.agentType
            });
            $[39] = agent.agentType;
            $[40] = wizardData.location;
            $[41] = t25;
        }
        else {
            t25 = $[41];
        }
        if ($[42] !== t25) {
            t8 = _jsxs(Text, { children: [t24, ":", " ", t25] });
            $[42] = t25;
            $[43] = t8;
        }
        else {
            t8 = $[43];
        }
        let t26;
        if ($[44] === Symbol.for("react.memo_cache_sentinel")) {
            t26 = _jsx(Text, { bold: true, children: "Tools" });
            $[44] = t26;
        }
        else {
            t26 = $[44];
        }
        let t27;
        if ($[45] !== agent.tools) {
            t27 = getToolsDisplay(agent.tools);
            $[45] = agent.tools;
            $[46] = t27;
        }
        else {
            t27 = $[46];
        }
        if ($[47] !== t27) {
            t9 = _jsxs(Text, { children: [t26, ": ", t27] });
            $[47] = t27;
            $[48] = t9;
        }
        else {
            t9 = $[48];
        }
        let t28;
        if ($[49] === Symbol.for("react.memo_cache_sentinel")) {
            t28 = _jsx(Text, { bold: true, children: "Model" });
            $[49] = t28;
        }
        else {
            t28 = $[49];
        }
        let t29;
        if ($[50] !== agent.model) {
            t29 = getAgentModelDisplay(agent.model);
            $[50] = agent.model;
            $[51] = t29;
        }
        else {
            t29 = $[51];
        }
        if ($[52] !== t29) {
            t10 = _jsxs(Text, { children: [t28, ": ", t29] });
            $[52] = t29;
            $[53] = t10;
        }
        else {
            t10 = $[53];
        }
        t11 = memoryDisplayElement;
        if ($[54] === Symbol.for("react.memo_cache_sentinel")) {
            t12 = _jsx(Box, { marginTop: 1, children: _jsxs(Text, { children: [_jsx(Text, { bold: true, children: "Description" }), " (tells Claude when to use this agent):"] }) });
            $[54] = t12;
        }
        else {
            t12 = $[54];
        }
        if ($[55] !== whenToUsePreview) {
            t13 = _jsx(Box, { marginLeft: 2, marginTop: 1, children: _jsx(Text, { children: whenToUsePreview }) });
            $[55] = whenToUsePreview;
            $[56] = t13;
        }
        else {
            t13 = $[56];
        }
        if ($[57] === Symbol.for("react.memo_cache_sentinel")) {
            t14 = _jsx(Box, { marginTop: 1, children: _jsxs(Text, { children: [_jsx(Text, { bold: true, children: "System prompt" }), ":"] }) });
            $[57] = t14;
        }
        else {
            t14 = $[57];
        }
        if ($[58] !== systemPromptPreview) {
            t15 = _jsx(Box, { marginLeft: 2, marginTop: 1, children: _jsx(Text, { children: systemPromptPreview }) });
            $[58] = systemPromptPreview;
            $[59] = t15;
        }
        else {
            t15 = $[59];
        }
        t16 = validation.warnings.length > 0 && _jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsx(Text, { color: "warning", children: "Warnings:" }), validation.warnings.map(_temp2)] });
        t17 = validation.errors.length > 0 && _jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsx(Text, { color: "error", children: "Errors:" }), validation.errors.map(_temp3)] });
        $[4] = agent;
        $[5] = existingAgents;
        $[6] = handleKeyDown;
        $[7] = tools;
        $[8] = wizardData.location;
        $[9] = T0;
        $[10] = T1;
        $[11] = t10;
        $[12] = t11;
        $[13] = t12;
        $[14] = t13;
        $[15] = t14;
        $[16] = t15;
        $[17] = t16;
        $[18] = t17;
        $[19] = t18;
        $[20] = t19;
        $[21] = t3;
        $[22] = t4;
        $[23] = t5;
        $[24] = t6;
        $[25] = t7;
        $[26] = t8;
        $[27] = t9;
    }
    else {
        T0 = $[9];
        T1 = $[10];
        t10 = $[11];
        t11 = $[12];
        t12 = $[13];
        t13 = $[14];
        t14 = $[15];
        t15 = $[16];
        t16 = $[17];
        t17 = $[18];
        t18 = $[19];
        t19 = $[20];
        t3 = $[21];
        t4 = $[22];
        t5 = $[23];
        t6 = $[24];
        t7 = $[25];
        t8 = $[26];
        t9 = $[27];
    }
    let t20;
    if ($[60] !== error) {
        t20 = error && _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: "error", children: error }) });
        $[60] = error;
        $[61] = t20;
    }
    else {
        t20 = $[61];
    }
    let t21;
    if ($[62] === Symbol.for("react.memo_cache_sentinel")) {
        t21 = _jsx(Text, { bold: true, children: "s" });
        $[62] = t21;
    }
    else {
        t21 = $[62];
    }
    let t22;
    if ($[63] === Symbol.for("react.memo_cache_sentinel")) {
        t22 = _jsx(Text, { bold: true, children: "Enter" });
        $[63] = t22;
    }
    else {
        t22 = $[63];
    }
    let t23;
    if ($[64] === Symbol.for("react.memo_cache_sentinel")) {
        t23 = _jsx(Box, { marginTop: 2, children: _jsxs(Text, { color: "success", children: ["Press ", t21, " or ", t22, " to save,", " ", _jsx(Text, { bold: true, children: "e" }), " to save and edit"] }) });
        $[64] = t23;
    }
    else {
        t23 = $[64];
    }
    let t24;
    if ($[65] !== T0 || $[66] !== t10 || $[67] !== t11 || $[68] !== t12 || $[69] !== t13 || $[70] !== t14 || $[71] !== t15 || $[72] !== t16 || $[73] !== t17 || $[74] !== t20 || $[75] !== t3 || $[76] !== t4 || $[77] !== t5 || $[78] !== t6 || $[79] !== t7 || $[80] !== t8 || $[81] !== t9) {
        t24 = _jsxs(T0, { flexDirection: t3, tabIndex: t4, autoFocus: t5, onKeyDown: t6, children: [t7, t8, t9, t10, t11, t12, t13, t14, t15, t16, t17, t20, t23] });
        $[65] = T0;
        $[66] = t10;
        $[67] = t11;
        $[68] = t12;
        $[69] = t13;
        $[70] = t14;
        $[71] = t15;
        $[72] = t16;
        $[73] = t17;
        $[74] = t20;
        $[75] = t3;
        $[76] = t4;
        $[77] = t5;
        $[78] = t6;
        $[79] = t7;
        $[80] = t8;
        $[81] = t9;
        $[82] = t24;
    }
    else {
        t24 = $[82];
    }
    let t25;
    if ($[83] !== T1 || $[84] !== t18 || $[85] !== t19 || $[86] !== t24) {
        t25 = _jsx(T1, { subtitle: t18, footerText: t19, children: t24 });
        $[83] = T1;
        $[84] = t18;
        $[85] = t19;
        $[86] = t24;
        $[87] = t25;
    }
    else {
        t25 = $[87];
    }
    return t25;
}
function _temp3(err, i_0) {
    return _jsxs(Text, { color: "error", children: [" ", "\u2022 ", err] }, i_0);
}
function _temp2(warning, i) {
    return _jsxs(Text, { dimColor: true, children: [" ", "\u2022 ", warning] }, i);
}
function _temp(toolNames) {
    if (toolNames === undefined) {
        return "All tools";
    }
    if (toolNames.length === 0) {
        return "None";
    }
    if (toolNames.length === 1) {
        return toolNames[0] || "None";
    }
    if (toolNames.length === 2) {
        return toolNames.join(" and ");
    }
    return `${toolNames.slice(0, -1).join(", ")}, and ${toolNames[toolNames.length - 1]}`;
}
