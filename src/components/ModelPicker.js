import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import capitalize from 'lodash-es/capitalize.js';
import * as React from 'react';
import { useState } from 'react';
import { useExitOnCtrlCDWithKeybindings } from 'src/hooks/useExitOnCtrlCDWithKeybindings.js';
import { logEvent } from 'src/services/analytics/index.js';
import { FAST_MODE_MODEL_DISPLAY, isFastModeAvailable, isFastModeCooldown, isFastModeEnabled } from 'src/utils/fastMode.js';
import { Box, Text } from '../ink.js';
import { useKeybindings } from '../keybindings/useKeybinding.js';
import { useAppState, useSetAppState } from '../state/AppState.js';
import { convertEffortValueToLevel, getDefaultEffortForModel, modelSupportsEffort, modelSupportsMaxEffort, resolvePickerEffortPersistence, toPersistableEffort } from '../utils/effort.js';
import { getDefaultMainLoopModel, modelDisplayString, parseUserSpecifiedModel } from '../utils/model/model.js';
import { getModelOptions } from '../utils/model/modelOptions.js';
import { getSettingsForSource, updateSettingsForSource } from '../utils/settings/settings.js';
import { ConfigurableShortcutHint } from './ConfigurableShortcutHint.js';
import { Select } from './CustomSelect/index.js';
import { Byline } from './design-system/Byline.js';
import { KeyboardShortcutHint } from './design-system/KeyboardShortcutHint.js';
import { Pane } from './design-system/Pane.js';
import { effortLevelToSymbol } from './EffortIndicator.js';
const NO_PREFERENCE = '__NO_PREFERENCE__';
export function ModelPicker(t0) {
    const $ = _c(82);
    const { initial, sessionModel, onSelect, onCancel, isStandaloneCommand, showFastModeNotice, headerText, skipSettingsWrite } = t0;
    const setAppState = useSetAppState();
    const exitState = useExitOnCtrlCDWithKeybindings();
    const initialValue = initial === null ? NO_PREFERENCE : initial;
    const [focusedValue, setFocusedValue] = useState(initialValue);
    const isFastMode = useAppState(_temp);
    const [hasToggledEffort, setHasToggledEffort] = useState(false);
    const effortValue = useAppState(_temp2);
    let t1;
    if ($[0] !== effortValue) {
        t1 = effortValue !== undefined ? convertEffortValueToLevel(effortValue) : undefined;
        $[0] = effortValue;
        $[1] = t1;
    }
    else {
        t1 = $[1];
    }
    const [effort, setEffort] = useState(t1);
    const t2 = isFastMode ?? false;
    let t3;
    if ($[2] !== t2) {
        t3 = getModelOptions(t2);
        $[2] = t2;
        $[3] = t3;
    }
    else {
        t3 = $[3];
    }
    const modelOptions = t3;
    let t4;
    bb0: {
        if (initial !== null && !modelOptions.some(opt => opt.value === initial)) {
            let t5;
            if ($[4] !== initial) {
                t5 = modelDisplayString(initial);
                $[4] = initial;
                $[5] = t5;
            }
            else {
                t5 = $[5];
            }
            let t6;
            if ($[6] !== initial || $[7] !== t5) {
                t6 = {
                    value: initial,
                    label: t5,
                    description: "Current model"
                };
                $[6] = initial;
                $[7] = t5;
                $[8] = t6;
            }
            else {
                t6 = $[8];
            }
            let t7;
            if ($[9] !== modelOptions || $[10] !== t6) {
                t7 = [...modelOptions, t6];
                $[9] = modelOptions;
                $[10] = t6;
                $[11] = t7;
            }
            else {
                t7 = $[11];
            }
            t4 = t7;
            break bb0;
        }
        t4 = modelOptions;
    }
    const optionsWithInitial = t4;
    let t5;
    if ($[12] !== optionsWithInitial) {
        t5 = optionsWithInitial.map(_temp3);
        $[12] = optionsWithInitial;
        $[13] = t5;
    }
    else {
        t5 = $[13];
    }
    const selectOptions = t5;
    let t6;
    if ($[14] !== initialValue || $[15] !== selectOptions) {
        t6 = selectOptions.some(_ => _.value === initialValue) ? initialValue : selectOptions[0]?.value ?? undefined;
        $[14] = initialValue;
        $[15] = selectOptions;
        $[16] = t6;
    }
    else {
        t6 = $[16];
    }
    const initialFocusValue = t6;
    const visibleCount = Math.min(10, selectOptions.length);
    const hiddenCount = Math.max(0, selectOptions.length - visibleCount);
    let t7;
    if ($[17] !== focusedValue || $[18] !== selectOptions) {
        t7 = selectOptions.find(opt_1 => opt_1.value === focusedValue)?.label;
        $[17] = focusedValue;
        $[18] = selectOptions;
        $[19] = t7;
    }
    else {
        t7 = $[19];
    }
    const focusedModelName = t7;
    let focusedSupportsEffort;
    let t8;
    if ($[20] !== focusedValue) {
        const focusedModel = resolveOptionModel(focusedValue);
        focusedSupportsEffort = focusedModel ? modelSupportsEffort(focusedModel) : false;
        t8 = focusedModel ? modelSupportsMaxEffort(focusedModel) : false;
        $[20] = focusedValue;
        $[21] = focusedSupportsEffort;
        $[22] = t8;
    }
    else {
        focusedSupportsEffort = $[21];
        t8 = $[22];
    }
    const focusedSupportsMax = t8;
    let t9;
    if ($[23] !== focusedValue) {
        t9 = getDefaultEffortLevelForOption(focusedValue);
        $[23] = focusedValue;
        $[24] = t9;
    }
    else {
        t9 = $[24];
    }
    const focusedDefaultEffort = t9;
    const displayEffort = effort === "max" && !focusedSupportsMax ? "high" : effort;
    let t10;
    if ($[25] !== effortValue || $[26] !== hasToggledEffort) {
        t10 = value => {
            setFocusedValue(value);
            if (!hasToggledEffort && effortValue === undefined) {
                setEffort(getDefaultEffortLevelForOption(value));
            }
        };
        $[25] = effortValue;
        $[26] = hasToggledEffort;
        $[27] = t10;
    }
    else {
        t10 = $[27];
    }
    const handleFocus = t10;
    let t11;
    if ($[28] !== focusedDefaultEffort || $[29] !== focusedSupportsEffort || $[30] !== focusedSupportsMax) {
        t11 = direction => {
            if (!focusedSupportsEffort) {
                return;
            }
            setEffort(prev => cycleEffortLevel(prev ?? focusedDefaultEffort, direction, focusedSupportsMax));
            setHasToggledEffort(true);
        };
        $[28] = focusedDefaultEffort;
        $[29] = focusedSupportsEffort;
        $[30] = focusedSupportsMax;
        $[31] = t11;
    }
    else {
        t11 = $[31];
    }
    const handleCycleEffort = t11;
    let t12;
    if ($[32] !== handleCycleEffort) {
        t12 = {
            "modelPicker:decreaseEffort": () => handleCycleEffort("left"),
            "modelPicker:increaseEffort": () => handleCycleEffort("right")
        };
        $[32] = handleCycleEffort;
        $[33] = t12;
    }
    else {
        t12 = $[33];
    }
    let t13;
    if ($[34] === Symbol.for("react.memo_cache_sentinel")) {
        t13 = {
            context: "ModelPicker"
        };
        $[34] = t13;
    }
    else {
        t13 = $[34];
    }
    useKeybindings(t12, t13);
    let t14;
    if ($[35] !== effort || $[36] !== hasToggledEffort || $[37] !== onSelect || $[38] !== setAppState || $[39] !== skipSettingsWrite) {
        t14 = function handleSelect(value_0) {
            logEvent("tengu_model_command_menu_effort", {
                effort: effort
            });
            if (!skipSettingsWrite) {
                const effortLevel = resolvePickerEffortPersistence(effort, getDefaultEffortLevelForOption(value_0), getSettingsForSource("userSettings")?.effortLevel, hasToggledEffort);
                const persistable = toPersistableEffort(effortLevel);
                if (persistable !== undefined) {
                    updateSettingsForSource("userSettings", {
                        effortLevel: persistable
                    });
                }
                setAppState(prev_0 => ({
                    ...prev_0,
                    effortValue: effortLevel
                }));
            }
            const selectedModel = resolveOptionModel(value_0);
            const selectedEffort = hasToggledEffort && selectedModel && modelSupportsEffort(selectedModel) ? effort : undefined;
            if (value_0 === NO_PREFERENCE) {
                onSelect(null, selectedEffort);
                return;
            }
            onSelect(value_0, selectedEffort);
        };
        $[35] = effort;
        $[36] = hasToggledEffort;
        $[37] = onSelect;
        $[38] = setAppState;
        $[39] = skipSettingsWrite;
        $[40] = t14;
    }
    else {
        t14 = $[40];
    }
    const handleSelect = t14;
    let t15;
    if ($[41] === Symbol.for("react.memo_cache_sentinel")) {
        t15 = _jsx(Text, { color: "remember", bold: true, children: "Select model" });
        $[41] = t15;
    }
    else {
        t15 = $[41];
    }
    const t16 = headerText ?? "Switch between Claude models. Applies to this session and future Claude Code sessions. For other/previous model names, specify with --model.";
    let t17;
    if ($[42] !== t16) {
        t17 = _jsx(Text, { dimColor: true, children: t16 });
        $[42] = t16;
        $[43] = t17;
    }
    else {
        t17 = $[43];
    }
    let t18;
    if ($[44] !== sessionModel) {
        t18 = sessionModel && _jsxs(Text, { dimColor: true, children: ["Currently using ", modelDisplayString(sessionModel), " for this session (set by plan mode). Selecting a model will undo this."] });
        $[44] = sessionModel;
        $[45] = t18;
    }
    else {
        t18 = $[45];
    }
    let t19;
    if ($[46] !== t17 || $[47] !== t18) {
        t19 = _jsxs(Box, { marginBottom: 1, flexDirection: "column", children: [t15, t17, t18] });
        $[46] = t17;
        $[47] = t18;
        $[48] = t19;
    }
    else {
        t19 = $[48];
    }
    const t20 = onCancel ?? _temp4;
    let t21;
    if ($[49] !== handleFocus || $[50] !== handleSelect || $[51] !== initialFocusValue || $[52] !== initialValue || $[53] !== selectOptions || $[54] !== t20 || $[55] !== visibleCount) {
        t21 = _jsx(Box, { flexDirection: "column", children: _jsx(Select, { defaultValue: initialValue, defaultFocusValue: initialFocusValue, options: selectOptions, onChange: handleSelect, onFocus: handleFocus, onCancel: t20, visibleOptionCount: visibleCount }) });
        $[49] = handleFocus;
        $[50] = handleSelect;
        $[51] = initialFocusValue;
        $[52] = initialValue;
        $[53] = selectOptions;
        $[54] = t20;
        $[55] = visibleCount;
        $[56] = t21;
    }
    else {
        t21 = $[56];
    }
    let t22;
    if ($[57] !== hiddenCount) {
        t22 = hiddenCount > 0 && _jsx(Box, { paddingLeft: 3, children: _jsxs(Text, { dimColor: true, children: ["and ", hiddenCount, " more\u2026"] }) });
        $[57] = hiddenCount;
        $[58] = t22;
    }
    else {
        t22 = $[58];
    }
    let t23;
    if ($[59] !== t21 || $[60] !== t22) {
        t23 = _jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [t21, t22] });
        $[59] = t21;
        $[60] = t22;
        $[61] = t23;
    }
    else {
        t23 = $[61];
    }
    let t24;
    if ($[62] !== displayEffort || $[63] !== focusedDefaultEffort || $[64] !== focusedModelName || $[65] !== focusedSupportsEffort) {
        t24 = _jsx(Box, { marginBottom: 1, flexDirection: "column", children: focusedSupportsEffort ? _jsxs(Text, { dimColor: true, children: [_jsx(EffortLevelIndicator, { effort: displayEffort }), " ", capitalize(displayEffort), " effort", displayEffort === focusedDefaultEffort ? " (default)" : "", " ", _jsx(Text, { color: "subtle", children: "\u2190 \u2192 to adjust" })] }) : _jsxs(Text, { color: "subtle", children: [_jsx(EffortLevelIndicator, { effort: undefined }), " Effort not supported", focusedModelName ? ` for ${focusedModelName}` : ""] }) });
        $[62] = displayEffort;
        $[63] = focusedDefaultEffort;
        $[64] = focusedModelName;
        $[65] = focusedSupportsEffort;
        $[66] = t24;
    }
    else {
        t24 = $[66];
    }
    let t25;
    if ($[67] !== showFastModeNotice) {
        t25 = isFastModeEnabled() ? showFastModeNotice ? _jsx(Box, { marginBottom: 1, children: _jsxs(Text, { dimColor: true, children: ["Fast mode is ", _jsx(Text, { bold: true, children: "ON" }), " and available with", " ", FAST_MODE_MODEL_DISPLAY, " only (/fast). Switching to other models turn off fast mode."] }) }) : isFastModeAvailable() && !isFastModeCooldown() ? _jsx(Box, { marginBottom: 1, children: _jsxs(Text, { dimColor: true, children: ["Use ", _jsx(Text, { bold: true, children: "/fast" }), " to turn on Fast mode (", FAST_MODE_MODEL_DISPLAY, " only)."] }) }) : null : null;
        $[67] = showFastModeNotice;
        $[68] = t25;
    }
    else {
        t25 = $[68];
    }
    let t26;
    if ($[69] !== t19 || $[70] !== t23 || $[71] !== t24 || $[72] !== t25) {
        t26 = _jsxs(Box, { flexDirection: "column", children: [t19, t23, t24, t25] });
        $[69] = t19;
        $[70] = t23;
        $[71] = t24;
        $[72] = t25;
        $[73] = t26;
    }
    else {
        t26 = $[73];
    }
    let t27;
    if ($[74] !== exitState || $[75] !== isStandaloneCommand) {
        t27 = isStandaloneCommand && _jsx(Text, { dimColor: true, italic: true, children: exitState.pending ? _jsxs(_Fragment, { children: ["Press ", exitState.keyName, " again to exit"] }) : _jsxs(Byline, { children: [_jsx(KeyboardShortcutHint, { shortcut: "Enter", action: "confirm" }), _jsx(ConfigurableShortcutHint, { action: "select:cancel", context: "Select", fallback: "Esc", description: "exit" })] }) });
        $[74] = exitState;
        $[75] = isStandaloneCommand;
        $[76] = t27;
    }
    else {
        t27 = $[76];
    }
    let t28;
    if ($[77] !== t26 || $[78] !== t27) {
        t28 = _jsxs(Box, { flexDirection: "column", children: [t26, t27] });
        $[77] = t26;
        $[78] = t27;
        $[79] = t28;
    }
    else {
        t28 = $[79];
    }
    const content = t28;
    if (!isStandaloneCommand) {
        return content;
    }
    let t29;
    if ($[80] !== content) {
        t29 = _jsx(Pane, { color: "permission", children: content });
        $[80] = content;
        $[81] = t29;
    }
    else {
        t29 = $[81];
    }
    return t29;
}
function _temp4() { }
function _temp3(opt_0) {
    return {
        ...opt_0,
        value: opt_0.value === null ? NO_PREFERENCE : opt_0.value
    };
}
function _temp2(s_0) {
    return s_0.effortValue;
}
function _temp(s) {
    return isFastModeEnabled() ? s.fastMode : false;
}
function resolveOptionModel(value) {
    if (!value)
        return undefined;
    return value === NO_PREFERENCE ? getDefaultMainLoopModel() : parseUserSpecifiedModel(value);
}
function EffortLevelIndicator(t0) {
    const $ = _c(5);
    const { effort } = t0;
    const t1 = effort ? "claude" : "subtle";
    const t2 = effort ?? "low";
    let t3;
    if ($[0] !== t2) {
        t3 = effortLevelToSymbol(t2);
        $[0] = t2;
        $[1] = t3;
    }
    else {
        t3 = $[1];
    }
    let t4;
    if ($[2] !== t1 || $[3] !== t3) {
        t4 = _jsx(Text, { color: t1, children: t3 });
        $[2] = t1;
        $[3] = t3;
        $[4] = t4;
    }
    else {
        t4 = $[4];
    }
    return t4;
}
function cycleEffortLevel(current, direction, includeMax) {
    const levels = includeMax ? ['low', 'medium', 'high', 'max'] : ['low', 'medium', 'high'];
    // If the current level isn't in the cycle (e.g. 'max' after switching to a
    // non-Opus model), clamp to 'high'.
    const idx = levels.indexOf(current);
    const currentIndex = idx !== -1 ? idx : levels.indexOf('high');
    if (direction === 'right') {
        return levels[(currentIndex + 1) % levels.length];
    }
    else {
        return levels[(currentIndex - 1 + levels.length) % levels.length];
    }
}
function getDefaultEffortLevelForOption(value) {
    const resolved = resolveOptionModel(value) ?? getDefaultMainLoopModel();
    const defaultValue = getDefaultEffortForModel(resolved);
    return defaultValue !== undefined ? convertEffortValueToLevel(defaultValue) : 'high';
}
