import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import * as React from 'react';
import { Box, Text } from 'src/ink.js';
import { shouldAllowManagedSandboxDomainsOnly } from 'src/utils/sandbox/sandbox-adapter.js';
import { Select } from '../CustomSelect/select.js';
import { PermissionDialog } from './PermissionDialog.js';
export function SandboxPermissionRequest(t0) {
    const $ = _c(22);
    const { hostPattern: t1, onUserResponse } = t0;
    const { host } = t1;
    let t2;
    if ($[0] !== onUserResponse) {
        t2 = function onSelect(value) {
            bb4: switch (value) {
                case "yes":
                    {
                        onUserResponse({
                            allow: true,
                            persistToSettings: false
                        });
                        break bb4;
                    }
                case "yes-dont-ask-again":
                    {
                        onUserResponse({
                            allow: true,
                            persistToSettings: true
                        });
                        break bb4;
                    }
                case "no":
                    {
                        onUserResponse({
                            allow: false,
                            persistToSettings: false
                        });
                    }
            }
        };
        $[0] = onUserResponse;
        $[1] = t2;
    }
    else {
        t2 = $[1];
    }
    const onSelect = t2;
    let t3;
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
        t3 = shouldAllowManagedSandboxDomainsOnly();
        $[2] = t3;
    }
    else {
        t3 = $[2];
    }
    const managedDomainsOnly = t3;
    let t4;
    if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
        t4 = {
            label: "Yes",
            value: "yes"
        };
        $[3] = t4;
    }
    else {
        t4 = $[3];
    }
    let t5;
    if ($[4] !== host) {
        t5 = !managedDomainsOnly ? [{
                label: _jsxs(Text, { children: ["Yes, and don't ask again for ", _jsx(Text, { bold: true, children: host })] }),
                value: "yes-dont-ask-again"
            }] : [];
        $[4] = host;
        $[5] = t5;
    }
    else {
        t5 = $[5];
    }
    let t6;
    if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
        t6 = {
            label: _jsxs(Text, { children: ["No, and tell Claude what to do differently ", _jsx(Text, { bold: true, children: "(esc)" })] }),
            value: "no"
        };
        $[6] = t6;
    }
    else {
        t6 = $[6];
    }
    let t7;
    if ($[7] !== t5) {
        t7 = [t4, ...t5, t6];
        $[7] = t5;
        $[8] = t7;
    }
    else {
        t7 = $[8];
    }
    const options = t7;
    let t8;
    if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
        t8 = _jsx(Text, { dimColor: true, children: "Host:" });
        $[9] = t8;
    }
    else {
        t8 = $[9];
    }
    let t9;
    if ($[10] !== host) {
        t9 = _jsxs(Box, { children: [t8, _jsxs(Text, { children: [" ", host] })] });
        $[10] = host;
        $[11] = t9;
    }
    else {
        t9 = $[11];
    }
    let t10;
    if ($[12] === Symbol.for("react.memo_cache_sentinel")) {
        t10 = _jsx(Box, { marginTop: 1, children: _jsx(Text, { children: "Do you want to allow this connection?" }) });
        $[12] = t10;
    }
    else {
        t10 = $[12];
    }
    let t11;
    if ($[13] !== onUserResponse) {
        t11 = () => {
            onUserResponse({
                allow: false,
                persistToSettings: false
            });
        };
        $[13] = onUserResponse;
        $[14] = t11;
    }
    else {
        t11 = $[14];
    }
    let t12;
    if ($[15] !== onSelect || $[16] !== options || $[17] !== t11) {
        t12 = _jsx(Box, { children: _jsx(Select, { options: options, onChange: onSelect, onCancel: t11 }) });
        $[15] = onSelect;
        $[16] = options;
        $[17] = t11;
        $[18] = t12;
    }
    else {
        t12 = $[18];
    }
    let t13;
    if ($[19] !== t12 || $[20] !== t9) {
        t13 = _jsx(PermissionDialog, { title: "Network request outside of sandbox", children: _jsxs(Box, { flexDirection: "column", paddingX: 2, paddingY: 1, children: [t9, t10, t12] }) });
        $[19] = t12;
        $[20] = t9;
        $[21] = t13;
    }
    else {
        t13 = $[21];
    }
    return t13;
}
