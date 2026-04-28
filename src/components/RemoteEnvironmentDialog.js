import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import chalk from 'chalk';
import figures from 'figures';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { Text } from '../ink.js';
import { useKeybinding } from '../keybindings/useKeybinding.js';
import { toError } from '../utils/errors.js';
import { logError } from '../utils/log.js';
import { getSettingSourceName } from '../utils/settings/constants.js';
import { updateSettingsForSource } from '../utils/settings/settings.js';
import { getEnvironmentSelectionInfo } from '../utils/teleport/environmentSelection.js';
import { ConfigurableShortcutHint } from './ConfigurableShortcutHint.js';
import { Select } from './CustomSelect/select.js';
import { Byline } from './design-system/Byline.js';
import { Dialog } from './design-system/Dialog.js';
import { KeyboardShortcutHint } from './design-system/KeyboardShortcutHint.js';
import { LoadingState } from './design-system/LoadingState.js';
const DIALOG_TITLE = 'Select Remote Environment';
const SETUP_HINT = `Configure environments at: https://claude.ai/code`;
export function RemoteEnvironmentDialog(t0) {
    const $ = _c(27);
    const { onDone } = t0;
    const [loadingState, setLoadingState] = useState("loading");
    let t1;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = [];
        $[0] = t1;
    }
    else {
        t1 = $[0];
    }
    const [environments, setEnvironments] = useState(t1);
    const [selectedEnvironment, setSelectedEnvironment] = useState(null);
    const [selectedEnvironmentSource, setSelectedEnvironmentSource] = useState(null);
    const [error, setError] = useState(null);
    let t2;
    let t3;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        t2 = () => {
            let cancelled = false;
            const fetchInfo = async function fetchInfo() {
                ;
                try {
                    const result = await getEnvironmentSelectionInfo();
                    if (cancelled) {
                        return;
                    }
                    setEnvironments(result.availableEnvironments);
                    setSelectedEnvironment(result.selectedEnvironment);
                    setSelectedEnvironmentSource(result.selectedEnvironmentSource);
                    setLoadingState(null);
                }
                catch (t4) {
                    const err = t4;
                    if (cancelled) {
                        return;
                    }
                    const fetchError = toError(err);
                    logError(fetchError);
                    setError(fetchError.message);
                    setLoadingState(null);
                }
            };
            fetchInfo();
            return () => {
                cancelled = true;
            };
        };
        t3 = [];
        $[1] = t2;
        $[2] = t3;
    }
    else {
        t2 = $[1];
        t3 = $[2];
    }
    useEffect(t2, t3);
    let t4;
    if ($[3] !== environments || $[4] !== onDone) {
        t4 = function handleSelect(value) {
            if (value === "cancel") {
                onDone();
                return;
            }
            setLoadingState("updating");
            const selectedEnv = environments.find(env => env.environment_id === value);
            if (!selectedEnv) {
                onDone("Error: Selected environment not found");
                return;
            }
            updateSettingsForSource("localSettings", {
                remote: {
                    defaultEnvironmentId: selectedEnv.environment_id
                }
            });
            onDone(`Set default remote environment to ${chalk.bold(selectedEnv.name)} (${selectedEnv.environment_id})`);
        };
        $[3] = environments;
        $[4] = onDone;
        $[5] = t4;
    }
    else {
        t4 = $[5];
    }
    const handleSelect = t4;
    if (loadingState === "loading") {
        let t5;
        if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
            t5 = _jsx(LoadingState, { message: "Loading environments\u2026" });
            $[6] = t5;
        }
        else {
            t5 = $[6];
        }
        let t6;
        if ($[7] !== onDone) {
            t6 = _jsx(Dialog, { title: DIALOG_TITLE, onCancel: onDone, hideInputGuide: true, children: t5 });
            $[7] = onDone;
            $[8] = t6;
        }
        else {
            t6 = $[8];
        }
        return t6;
    }
    if (error) {
        let t5;
        if ($[9] !== error) {
            t5 = _jsxs(Text, { color: "error", children: ["Error: ", error] });
            $[9] = error;
            $[10] = t5;
        }
        else {
            t5 = $[10];
        }
        let t6;
        if ($[11] !== onDone || $[12] !== t5) {
            t6 = _jsx(Dialog, { title: DIALOG_TITLE, onCancel: onDone, children: t5 });
            $[11] = onDone;
            $[12] = t5;
            $[13] = t6;
        }
        else {
            t6 = $[13];
        }
        return t6;
    }
    if (!selectedEnvironment) {
        let t5;
        if ($[14] === Symbol.for("react.memo_cache_sentinel")) {
            t5 = _jsx(Text, { children: "No remote environments available." });
            $[14] = t5;
        }
        else {
            t5 = $[14];
        }
        let t6;
        if ($[15] !== onDone) {
            t6 = _jsx(Dialog, { title: DIALOG_TITLE, subtitle: SETUP_HINT, onCancel: onDone, children: t5 });
            $[15] = onDone;
            $[16] = t6;
        }
        else {
            t6 = $[16];
        }
        return t6;
    }
    if (environments.length === 1) {
        let t5;
        if ($[17] !== onDone || $[18] !== selectedEnvironment) {
            t5 = _jsx(SingleEnvironmentContent, { environment: selectedEnvironment, onDone: onDone });
            $[17] = onDone;
            $[18] = selectedEnvironment;
            $[19] = t5;
        }
        else {
            t5 = $[19];
        }
        return t5;
    }
    let t5;
    if ($[20] !== environments || $[21] !== handleSelect || $[22] !== loadingState || $[23] !== onDone || $[24] !== selectedEnvironment || $[25] !== selectedEnvironmentSource) {
        t5 = _jsx(MultipleEnvironmentsContent, { environments: environments, selectedEnvironment: selectedEnvironment, selectedEnvironmentSource: selectedEnvironmentSource, loadingState: loadingState, onSelect: handleSelect, onCancel: onDone });
        $[20] = environments;
        $[21] = handleSelect;
        $[22] = loadingState;
        $[23] = onDone;
        $[24] = selectedEnvironment;
        $[25] = selectedEnvironmentSource;
        $[26] = t5;
    }
    else {
        t5 = $[26];
    }
    return t5;
}
function EnvironmentLabel(t0) {
    const $ = _c(7);
    const { environment } = t0;
    let t1;
    if ($[0] !== environment.name) {
        t1 = _jsx(Text, { bold: true, children: environment.name });
        $[0] = environment.name;
        $[1] = t1;
    }
    else {
        t1 = $[1];
    }
    let t2;
    if ($[2] !== environment.environment_id) {
        t2 = _jsxs(Text, { dimColor: true, children: ["(", environment.environment_id, ")"] });
        $[2] = environment.environment_id;
        $[3] = t2;
    }
    else {
        t2 = $[3];
    }
    let t3;
    if ($[4] !== t1 || $[5] !== t2) {
        t3 = _jsxs(Text, { children: [figures.tick, " Using ", t1, " ", t2] });
        $[4] = t1;
        $[5] = t2;
        $[6] = t3;
    }
    else {
        t3 = $[6];
    }
    return t3;
}
function SingleEnvironmentContent(t0) {
    const $ = _c(6);
    const { environment, onDone } = t0;
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
    useKeybinding("confirm:yes", onDone, t1);
    let t2;
    if ($[1] !== environment) {
        t2 = _jsx(EnvironmentLabel, { environment: environment });
        $[1] = environment;
        $[2] = t2;
    }
    else {
        t2 = $[2];
    }
    let t3;
    if ($[3] !== onDone || $[4] !== t2) {
        t3 = _jsx(Dialog, { title: DIALOG_TITLE, subtitle: SETUP_HINT, onCancel: onDone, children: t2 });
        $[3] = onDone;
        $[4] = t2;
        $[5] = t3;
    }
    else {
        t3 = $[5];
    }
    return t3;
}
function MultipleEnvironmentsContent(t0) {
    const $ = _c(18);
    const { environments, selectedEnvironment, selectedEnvironmentSource, loadingState, onSelect, onCancel } = t0;
    let t1;
    if ($[0] !== selectedEnvironmentSource) {
        t1 = selectedEnvironmentSource && selectedEnvironmentSource !== "localSettings" ? ` (from ${getSettingSourceName(selectedEnvironmentSource)} settings)` : "";
        $[0] = selectedEnvironmentSource;
        $[1] = t1;
    }
    else {
        t1 = $[1];
    }
    const sourceSuffix = t1;
    let t2;
    if ($[2] !== selectedEnvironment.name) {
        t2 = _jsx(Text, { bold: true, children: selectedEnvironment.name });
        $[2] = selectedEnvironment.name;
        $[3] = t2;
    }
    else {
        t2 = $[3];
    }
    let t3;
    if ($[4] !== sourceSuffix || $[5] !== t2) {
        t3 = _jsxs(Text, { children: ["Currently using: ", t2, sourceSuffix] });
        $[4] = sourceSuffix;
        $[5] = t2;
        $[6] = t3;
    }
    else {
        t3 = $[6];
    }
    const subtitle = t3;
    let t4;
    if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
        t4 = _jsx(Text, { dimColor: true, children: SETUP_HINT });
        $[7] = t4;
    }
    else {
        t4 = $[7];
    }
    let t5;
    if ($[8] !== environments || $[9] !== loadingState || $[10] !== onSelect || $[11] !== selectedEnvironment.environment_id) {
        t5 = loadingState === "updating" ? _jsx(LoadingState, { message: "Updating\u2026" }) : _jsx(Select, { options: environments.map(_temp), defaultValue: selectedEnvironment.environment_id, onChange: onSelect, onCancel: () => onSelect("cancel"), layout: "compact-vertical" });
        $[8] = environments;
        $[9] = loadingState;
        $[10] = onSelect;
        $[11] = selectedEnvironment.environment_id;
        $[12] = t5;
    }
    else {
        t5 = $[12];
    }
    let t6;
    if ($[13] === Symbol.for("react.memo_cache_sentinel")) {
        t6 = _jsx(Text, { dimColor: true, children: _jsxs(Byline, { children: [_jsx(KeyboardShortcutHint, { shortcut: "Enter", action: "select" }), _jsx(ConfigurableShortcutHint, { action: "confirm:no", context: "Confirmation", fallback: "Esc", description: "cancel" })] }) });
        $[13] = t6;
    }
    else {
        t6 = $[13];
    }
    let t7;
    if ($[14] !== onCancel || $[15] !== subtitle || $[16] !== t5) {
        t7 = _jsxs(Dialog, { title: DIALOG_TITLE, subtitle: subtitle, onCancel: onCancel, hideInputGuide: true, children: [t4, t5, t6] });
        $[14] = onCancel;
        $[15] = subtitle;
        $[16] = t5;
        $[17] = t7;
    }
    else {
        t7 = $[17];
    }
    return t7;
}
function _temp(env) {
    return {
        label: _jsxs(Text, { children: [env.name, " ", _jsxs(Text, { dimColor: true, children: ["(", env.environment_id, ")"] })] }),
        value: env.environment_id
    };
}
