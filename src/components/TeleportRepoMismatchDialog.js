import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import React, { useState } from 'react';
import { Box, Text } from '../ink.js';
import { getDisplayPath } from '../utils/file.js';
import { removePathFromRepo, validateRepoAtPath } from '../utils/githubRepoPathMapping.js';
import { Select } from './CustomSelect/index.js';
import { Dialog } from './design-system/Dialog.js';
import { Spinner } from './Spinner.js';
export function TeleportRepoMismatchDialog(t0) {
    const $ = _c(18);
    const { targetRepo, initialPaths, onSelectPath, onCancel } = t0;
    const [availablePaths, setAvailablePaths] = useState(initialPaths);
    const [errorMessage, setErrorMessage] = useState(null);
    const [validating, setValidating] = useState(false);
    let t1;
    if ($[0] !== availablePaths || $[1] !== onCancel || $[2] !== onSelectPath || $[3] !== targetRepo) {
        t1 = async (value) => {
            if (value === "cancel") {
                onCancel();
                return;
            }
            setValidating(true);
            setErrorMessage(null);
            const isValid = await validateRepoAtPath(value, targetRepo);
            if (isValid) {
                onSelectPath(value);
                return;
            }
            removePathFromRepo(targetRepo, value);
            const updatedPaths = availablePaths.filter(p => p !== value);
            setAvailablePaths(updatedPaths);
            setValidating(false);
            setErrorMessage(`${getDisplayPath(value)} no longer contains the correct repository. Select another path.`);
        };
        $[0] = availablePaths;
        $[1] = onCancel;
        $[2] = onSelectPath;
        $[3] = targetRepo;
        $[4] = t1;
    }
    else {
        t1 = $[4];
    }
    const handleChange = t1;
    let t2;
    if ($[5] !== availablePaths) {
        let t3;
        if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
            t3 = {
                label: "Cancel",
                value: "cancel"
            };
            $[7] = t3;
        }
        else {
            t3 = $[7];
        }
        t2 = [...availablePaths.map(_temp), t3];
        $[5] = availablePaths;
        $[6] = t2;
    }
    else {
        t2 = $[6];
    }
    const options = t2;
    let t3;
    if ($[8] !== availablePaths.length || $[9] !== errorMessage || $[10] !== handleChange || $[11] !== options || $[12] !== targetRepo || $[13] !== validating) {
        t3 = availablePaths.length > 0 ? _jsxs(_Fragment, { children: [_jsxs(Box, { flexDirection: "column", gap: 1, children: [errorMessage && _jsx(Text, { color: "error", children: errorMessage }), _jsxs(Text, { children: ["Open Claude Code in ", _jsx(Text, { bold: true, children: targetRepo }), ":"] })] }), validating ? _jsxs(Box, { children: [_jsx(Spinner, {}), _jsx(Text, { children: " Validating repository\u2026" })] }) : _jsx(Select, { options: options, onChange: value_0 => void handleChange(value_0) })] }) : _jsxs(Box, { flexDirection: "column", gap: 1, children: [errorMessage && _jsx(Text, { color: "error", children: errorMessage }), _jsxs(Text, { dimColor: true, children: ["Run claude --teleport from a checkout of ", targetRepo] })] });
        $[8] = availablePaths.length;
        $[9] = errorMessage;
        $[10] = handleChange;
        $[11] = options;
        $[12] = targetRepo;
        $[13] = validating;
        $[14] = t3;
    }
    else {
        t3 = $[14];
    }
    let t4;
    if ($[15] !== onCancel || $[16] !== t3) {
        t4 = _jsx(Dialog, { title: "Teleport to Repo", onCancel: onCancel, color: "background", children: t3 });
        $[15] = onCancel;
        $[16] = t3;
        $[17] = t4;
    }
    else {
        t4 = $[17];
    }
    return t4;
}
function _temp(path) {
    return {
        label: _jsxs(Text, { children: ["Use ", _jsx(Text, { bold: true, children: getDisplayPath(path) })] }),
        value: path
    };
}
