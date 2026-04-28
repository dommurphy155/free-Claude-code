import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import React, { useState } from 'react';
import { Box, Link, Text } from '../ink.js';
import { ConfigurableShortcutHint } from './ConfigurableShortcutHint.js';
import { SelectMulti } from './CustomSelect/SelectMulti.js';
import { Byline } from './design-system/Byline.js';
import { Dialog } from './design-system/Dialog.js';
import { KeyboardShortcutHint } from './design-system/KeyboardShortcutHint.js';
const WORKFLOWS = [{
        value: 'claude',
        label: '@Claude Code - Tag @claude in issues and PR comments'
    }, {
        value: 'claude-review',
        label: 'Claude Code Review - Automated code review on new PRs'
    }];
function renderInputGuide(exitState) {
    if (exitState.pending) {
        return _jsxs(Text, { children: ["Press ", exitState.keyName, " again to exit"] });
    }
    return _jsxs(Byline, { children: [_jsx(KeyboardShortcutHint, { shortcut: "\u2191\u2193", action: "navigate" }), _jsx(KeyboardShortcutHint, { shortcut: "Space", action: "toggle" }), _jsx(KeyboardShortcutHint, { shortcut: "Enter", action: "confirm" }), _jsx(ConfigurableShortcutHint, { action: "confirm:no", context: "Confirmation", fallback: "Esc", description: "cancel" })] });
}
export function WorkflowMultiselectDialog(t0) {
    const $ = _c(14);
    const { onSubmit, defaultSelections } = t0;
    const [showError, setShowError] = useState(false);
    let t1;
    if ($[0] !== onSubmit) {
        t1 = selectedValues => {
            if (selectedValues.length === 0) {
                setShowError(true);
                return;
            }
            setShowError(false);
            onSubmit(selectedValues);
        };
        $[0] = onSubmit;
        $[1] = t1;
    }
    else {
        t1 = $[1];
    }
    const handleSubmit = t1;
    let t2;
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
        t2 = () => {
            setShowError(false);
        };
        $[2] = t2;
    }
    else {
        t2 = $[2];
    }
    const handleChange = t2;
    let t3;
    if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
        t3 = () => {
            setShowError(true);
        };
        $[3] = t3;
    }
    else {
        t3 = $[3];
    }
    const handleCancel = t3;
    let t4;
    if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
        t4 = _jsx(Box, { children: _jsxs(Text, { dimColor: true, children: ["More workflow examples (issue triage, CI fixes, etc.) at:", " ", _jsx(Link, { url: "https://github.com/anthropics/claude-code-action/blob/main/examples/", children: "https://github.com/anthropics/claude-code-action/blob/main/examples/" })] }) });
        $[4] = t4;
    }
    else {
        t4 = $[4];
    }
    let t5;
    if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
        t5 = WORKFLOWS.map(_temp);
        $[5] = t5;
    }
    else {
        t5 = $[5];
    }
    let t6;
    if ($[6] !== defaultSelections || $[7] !== handleSubmit) {
        t6 = _jsx(SelectMulti, { options: t5, defaultValue: defaultSelections, onSubmit: handleSubmit, onChange: handleChange, onCancel: handleCancel, hideIndexes: true });
        $[6] = defaultSelections;
        $[7] = handleSubmit;
        $[8] = t6;
    }
    else {
        t6 = $[8];
    }
    let t7;
    if ($[9] !== showError) {
        t7 = showError && _jsx(Box, { children: _jsx(Text, { color: "error", children: "You must select at least one workflow to continue" }) });
        $[9] = showError;
        $[10] = t7;
    }
    else {
        t7 = $[10];
    }
    let t8;
    if ($[11] !== t6 || $[12] !== t7) {
        t8 = _jsxs(Dialog, { title: "Select GitHub workflows to install", subtitle: "We'll create a workflow file in your repository for each one you select.", onCancel: handleCancel, inputGuide: renderInputGuide, children: [t4, t6, t7] });
        $[11] = t6;
        $[12] = t7;
        $[13] = t8;
    }
    else {
        t8 = $[13];
    }
    return t8;
}
function _temp(workflow) {
    return {
        label: workflow.label,
        value: workflow.value
    };
}
