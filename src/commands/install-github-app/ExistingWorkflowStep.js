import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import React from 'react';
import { Select } from 'src/components/CustomSelect/index.js';
import { Box, Text } from '../../ink.js';
export function ExistingWorkflowStep(t0) {
    const $ = _c(16);
    const { repoName, onSelectAction } = t0;
    let t1;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = [{
                label: "Update workflow file with latest version",
                value: "update"
            }, {
                label: "Skip workflow update (configure secrets only)",
                value: "skip"
            }, {
                label: "Exit without making changes",
                value: "exit"
            }];
        $[0] = t1;
    }
    else {
        t1 = $[0];
    }
    const options = t1;
    let t2;
    if ($[1] !== onSelectAction) {
        t2 = value => {
            onSelectAction(value);
        };
        $[1] = onSelectAction;
        $[2] = t2;
    }
    else {
        t2 = $[2];
    }
    const handleSelect = t2;
    let t3;
    if ($[3] !== onSelectAction) {
        t3 = () => {
            onSelectAction("exit");
        };
        $[3] = onSelectAction;
        $[4] = t3;
    }
    else {
        t3 = $[4];
    }
    const handleCancel = t3;
    let t4;
    if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
        t4 = _jsx(Text, { bold: true, children: "Existing Workflow Found" });
        $[5] = t4;
    }
    else {
        t4 = $[5];
    }
    let t5;
    if ($[6] !== repoName) {
        t5 = _jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [t4, _jsxs(Text, { dimColor: true, children: ["Repository: ", repoName] })] });
        $[6] = repoName;
        $[7] = t5;
    }
    else {
        t5 = $[7];
    }
    let t6;
    if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
        t6 = _jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsxs(Text, { children: ["A Claude workflow file already exists at", " ", _jsx(Text, { color: "claude", children: ".github/workflows/claude.yml" })] }), _jsx(Text, { dimColor: true, children: "What would you like to do?" })] });
        $[8] = t6;
    }
    else {
        t6 = $[8];
    }
    let t7;
    if ($[9] !== handleCancel || $[10] !== handleSelect) {
        t7 = _jsx(Box, { flexDirection: "column", children: _jsx(Select, { options: options, onChange: handleSelect, onCancel: handleCancel }) });
        $[9] = handleCancel;
        $[10] = handleSelect;
        $[11] = t7;
    }
    else {
        t7 = $[11];
    }
    let t8;
    if ($[12] === Symbol.for("react.memo_cache_sentinel")) {
        t8 = _jsx(Box, { marginTop: 1, children: _jsxs(Text, { dimColor: true, children: ["View the latest workflow template at:", " ", _jsx(Text, { color: "claude", children: "https://github.com/anthropics/claude-code-action/blob/main/examples/claude.yml" })] }) });
        $[12] = t8;
    }
    else {
        t8 = $[12];
    }
    let t9;
    if ($[13] !== t5 || $[14] !== t7) {
        t9 = _jsxs(Box, { flexDirection: "column", borderStyle: "round", borderDimColor: true, paddingX: 1, children: [t5, t6, t7, t8] });
        $[13] = t5;
        $[14] = t7;
        $[15] = t9;
    }
    else {
        t9 = $[15];
    }
    return t9;
}
