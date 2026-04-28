import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import * as React from 'react';
import { handlePlanModeTransition } from '../../bootstrap/state.js';
import { Box, Text } from '../../ink.js';
import { getExternalEditor } from '../../utils/editor.js';
import { toIDEDisplayName } from '../../utils/ide.js';
import { applyPermissionUpdate } from '../../utils/permissions/PermissionUpdate.js';
import { prepareContextForPlanMode } from '../../utils/permissions/permissionSetup.js';
import { getPlan, getPlanFilePath } from '../../utils/plans.js';
import { editFileInEditor } from '../../utils/promptEditor.js';
import { renderToString } from '../../utils/staticRender.js';
function PlanDisplay(t0) {
    const $ = _c(11);
    const { planContent, planPath, editorName } = t0;
    let t1;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = _jsx(Text, { bold: true, children: "Current Plan" });
        $[0] = t1;
    }
    else {
        t1 = $[0];
    }
    let t2;
    if ($[1] !== planPath) {
        t2 = _jsx(Text, { dimColor: true, children: planPath });
        $[1] = planPath;
        $[2] = t2;
    }
    else {
        t2 = $[2];
    }
    let t3;
    if ($[3] !== planContent) {
        t3 = _jsx(Box, { marginTop: 1, children: _jsx(Text, { children: planContent }) });
        $[3] = planContent;
        $[4] = t3;
    }
    else {
        t3 = $[4];
    }
    let t4;
    if ($[5] !== editorName) {
        t4 = editorName && _jsxs(Box, { marginTop: 1, children: [_jsx(Text, { dimColor: true, children: "\"/plan open\"" }), _jsx(Text, { dimColor: true, children: " to edit this plan in " }), _jsx(Text, { bold: true, dimColor: true, children: editorName })] });
        $[5] = editorName;
        $[6] = t4;
    }
    else {
        t4 = $[6];
    }
    let t5;
    if ($[7] !== t2 || $[8] !== t3 || $[9] !== t4) {
        t5 = _jsxs(Box, { flexDirection: "column", children: [t1, t2, t3, t4] });
        $[7] = t2;
        $[8] = t3;
        $[9] = t4;
        $[10] = t5;
    }
    else {
        t5 = $[10];
    }
    return t5;
}
export async function call(onDone, context, args) {
    const { getAppState, setAppState } = context;
    const appState = getAppState();
    const currentMode = appState.toolPermissionContext.mode;
    // If not in plan mode, enable it
    if (currentMode !== 'plan') {
        handlePlanModeTransition(currentMode, 'plan');
        setAppState(prev => ({
            ...prev,
            toolPermissionContext: applyPermissionUpdate(prepareContextForPlanMode(prev.toolPermissionContext), {
                type: 'setMode',
                mode: 'plan',
                destination: 'session'
            })
        }));
        const description = args.trim();
        if (description && description !== 'open') {
            onDone('Enabled plan mode', {
                shouldQuery: true
            });
        }
        else {
            onDone('Enabled plan mode');
        }
        return null;
    }
    // Already in plan mode - show the current plan
    const planContent = getPlan();
    const planPath = getPlanFilePath();
    if (!planContent) {
        onDone('Already in plan mode. No plan written yet.');
        return null;
    }
    // If user typed "/plan open", open in editor
    const argList = args.trim().split(/\s+/);
    if (argList[0] === 'open') {
        const result = await editFileInEditor(planPath);
        if (result.error) {
            onDone(`Failed to open plan in editor: ${result.error}`);
        }
        else {
            onDone(`Opened plan in editor: ${planPath}`);
        }
        return null;
    }
    const editor = getExternalEditor();
    const editorName = editor ? toIDEDisplayName(editor) : undefined;
    const display = _jsx(PlanDisplay, { planContent: planContent, planPath: planPath, editorName: editorName });
    // Render to string and pass to onDone like local commands do
    const output = await renderToString(display);
    onDone(output);
    return null;
}
