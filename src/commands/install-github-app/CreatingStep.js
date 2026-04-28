import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import React from 'react';
import { Box, Text } from '../../ink.js';
export function CreatingStep(t0) {
    const $ = _c(10);
    const { currentWorkflowInstallStep, secretExists, useExistingSecret, secretName, skipWorkflow: t1, selectedWorkflows } = t0;
    const skipWorkflow = t1 === undefined ? false : t1;
    let t2;
    if ($[0] !== secretExists || $[1] !== secretName || $[2] !== selectedWorkflows || $[3] !== skipWorkflow || $[4] !== useExistingSecret) {
        t2 = skipWorkflow ? ["Getting repository information", secretExists && useExistingSecret ? "Using existing API key secret" : `Setting up ${secretName} secret`] : ["Getting repository information", "Creating branch", selectedWorkflows.length > 1 ? "Creating workflow files" : "Creating workflow file", secretExists && useExistingSecret ? "Using existing API key secret" : `Setting up ${secretName} secret`, "Opening pull request page"];
        $[0] = secretExists;
        $[1] = secretName;
        $[2] = selectedWorkflows;
        $[3] = skipWorkflow;
        $[4] = useExistingSecret;
        $[5] = t2;
    }
    else {
        t2 = $[5];
    }
    const progressSteps = t2;
    let t3;
    if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
        t3 = _jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsx(Text, { bold: true, children: "Install GitHub App" }), _jsx(Text, { dimColor: true, children: "Create GitHub Actions workflow" })] });
        $[6] = t3;
    }
    else {
        t3 = $[6];
    }
    let t4;
    if ($[7] !== currentWorkflowInstallStep || $[8] !== progressSteps) {
        t4 = _jsx(_Fragment, { children: _jsxs(Box, { flexDirection: "column", borderStyle: "round", paddingX: 1, children: [t3, progressSteps.map((stepText, index) => {
                        let status = "pending";
                        if (index < currentWorkflowInstallStep) {
                            status = "completed";
                        }
                        else {
                            if (index === currentWorkflowInstallStep) {
                                status = "in-progress";
                            }
                        }
                        return _jsx(Box, { children: _jsxs(Text, { color: status === "completed" ? "success" : status === "in-progress" ? "warning" : undefined, children: [status === "completed" ? "\u2713 " : "", stepText, status === "in-progress" ? "\u2026" : ""] }) }, index);
                    })] }) });
        $[7] = currentWorkflowInstallStep;
        $[8] = progressSteps;
        $[9] = t4;
    }
    else {
        t4 = $[9];
    }
    return t4;
}
