import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import figures from 'figures';
import * as React from 'react';
import { Suspense, use } from 'react';
import { getSessionId } from '../../bootstrap/state.js';
import { useIsInsideModal } from '../../context/modalContext.js';
import { Box, Text, useTheme } from '../../ink.js';
import { useAppState } from '../../state/AppState.js';
import { getCwd } from '../../utils/cwd.js';
import { getCurrentSessionTitle } from '../../utils/sessionStorage.js';
import { buildAccountProperties, buildAPIProviderProperties, buildIDEProperties, buildInstallationDiagnostics, buildInstallationHealthDiagnostics, buildMcpProperties, buildMemoryDiagnostics, buildSandboxProperties, buildSettingSourcesProperties, getModelDisplayLabel } from '../../utils/status.js';
import { ConfigurableShortcutHint } from '../ConfigurableShortcutHint.js';
function buildPrimarySection() {
    const sessionId = getSessionId();
    const customTitle = getCurrentSessionTitle(sessionId);
    const nameValue = customTitle ?? _jsx(Text, { dimColor: true, children: "/rename to add a name" });
    return [{
            label: 'Version',
            value: MACRO.VERSION
        }, {
            label: 'Session name',
            value: nameValue
        }, {
            label: 'Session ID',
            value: sessionId
        }, {
            label: 'cwd',
            value: getCwd()
        }, ...buildAccountProperties(), ...buildAPIProviderProperties()];
}
function buildSecondarySection({ mainLoopModel, mcp, theme, context }) {
    const modelLabel = getModelDisplayLabel(mainLoopModel);
    return [{
            label: 'Model',
            value: modelLabel
        }, ...buildIDEProperties(mcp.clients, context.options.ideInstallationStatus, theme), ...buildMcpProperties(mcp.clients, theme), ...buildSandboxProperties(), ...buildSettingSourcesProperties()];
}
export async function buildDiagnostics() {
    return [...(await buildInstallationDiagnostics()), ...(await buildInstallationHealthDiagnostics()), ...(await buildMemoryDiagnostics())];
}
function PropertyValue(t0) {
    const $ = _c(8);
    const { value } = t0;
    if (Array.isArray(value)) {
        let t1;
        if ($[0] !== value) {
            let t2;
            if ($[2] !== value.length) {
                t2 = (item, i) => _jsxs(Text, { children: [item, i < value.length - 1 ? "," : ""] }, i);
                $[2] = value.length;
                $[3] = t2;
            }
            else {
                t2 = $[3];
            }
            t1 = value.map(t2);
            $[0] = value;
            $[1] = t1;
        }
        else {
            t1 = $[1];
        }
        let t2;
        if ($[4] !== t1) {
            t2 = _jsx(Box, { flexWrap: "wrap", columnGap: 1, flexShrink: 99, children: t1 });
            $[4] = t1;
            $[5] = t2;
        }
        else {
            t2 = $[5];
        }
        return t2;
    }
    if (typeof value === "string") {
        let t1;
        if ($[6] !== value) {
            t1 = _jsx(Text, { children: value });
            $[6] = value;
            $[7] = t1;
        }
        else {
            t1 = $[7];
        }
        return t1;
    }
    return value;
}
export function Status(t0) {
    const $ = _c(20);
    const { context, diagnosticsPromise } = t0;
    const mainLoopModel = useAppState(_temp);
    const mcp = useAppState(_temp2);
    const [theme] = useTheme();
    let t1;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = buildPrimarySection();
        $[0] = t1;
    }
    else {
        t1 = $[0];
    }
    let t2;
    if ($[1] !== context || $[2] !== mainLoopModel || $[3] !== mcp || $[4] !== theme) {
        t2 = buildSecondarySection({
            mainLoopModel,
            mcp,
            theme,
            context
        });
        $[1] = context;
        $[2] = mainLoopModel;
        $[3] = mcp;
        $[4] = theme;
        $[5] = t2;
    }
    else {
        t2 = $[5];
    }
    let t3;
    if ($[6] !== t2) {
        t3 = [t1, t2];
        $[6] = t2;
        $[7] = t3;
    }
    else {
        t3 = $[7];
    }
    const sections = t3;
    const grow = useIsInsideModal() ? 1 : undefined;
    let t4;
    if ($[8] !== sections) {
        t4 = sections.map(_temp4);
        $[8] = sections;
        $[9] = t4;
    }
    else {
        t4 = $[9];
    }
    let t5;
    if ($[10] !== diagnosticsPromise) {
        t5 = _jsx(Suspense, { fallback: null, children: _jsx(Diagnostics, { promise: diagnosticsPromise }) });
        $[10] = diagnosticsPromise;
        $[11] = t5;
    }
    else {
        t5 = $[11];
    }
    let t6;
    if ($[12] !== grow || $[13] !== t4 || $[14] !== t5) {
        t6 = _jsxs(Box, { flexDirection: "column", gap: 1, flexGrow: grow, children: [t4, t5] });
        $[12] = grow;
        $[13] = t4;
        $[14] = t5;
        $[15] = t6;
    }
    else {
        t6 = $[15];
    }
    let t7;
    if ($[16] === Symbol.for("react.memo_cache_sentinel")) {
        t7 = _jsx(Text, { dimColor: true, children: _jsx(ConfigurableShortcutHint, { action: "confirm:no", context: "Settings", fallback: "Esc", description: "cancel" }) });
        $[16] = t7;
    }
    else {
        t7 = $[16];
    }
    let t8;
    if ($[17] !== grow || $[18] !== t6) {
        t8 = _jsxs(Box, { flexDirection: "column", flexGrow: grow, children: [t6, t7] });
        $[17] = grow;
        $[18] = t6;
        $[19] = t8;
    }
    else {
        t8 = $[19];
    }
    return t8;
}
function _temp4(properties, i) {
    return properties.length > 0 && _jsx(Box, { flexDirection: "column", children: properties.map(_temp3) }, i);
}
function _temp3(t0, j) {
    const { label, value } = t0;
    return _jsxs(Box, { flexDirection: "row", gap: 1, flexShrink: 0, children: [label !== undefined && _jsxs(Text, { bold: true, children: [label, ":"] }), _jsx(PropertyValue, { value: value })] }, j);
}
function _temp2(s_0) {
    return s_0.mcp;
}
function _temp(s) {
    return s.mainLoopModel;
}
function Diagnostics(t0) {
    const $ = _c(5);
    const { promise } = t0;
    const diagnostics = use(promise);
    if (diagnostics.length === 0) {
        return null;
    }
    let t1;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = _jsx(Text, { bold: true, children: "System Diagnostics" });
        $[0] = t1;
    }
    else {
        t1 = $[0];
    }
    let t2;
    if ($[1] !== diagnostics) {
        t2 = diagnostics.map(_temp5);
        $[1] = diagnostics;
        $[2] = t2;
    }
    else {
        t2 = $[2];
    }
    let t3;
    if ($[3] !== t2) {
        t3 = _jsxs(Box, { flexDirection: "column", paddingBottom: 1, children: [t1, t2] });
        $[3] = t2;
        $[4] = t3;
    }
    else {
        t3 = $[4];
    }
    return t3;
}
function _temp5(diagnostic, i) {
    return _jsxs(Box, { flexDirection: "row", gap: 1, paddingX: 1, children: [_jsx(Text, { color: "error", children: figures.warning }), typeof diagnostic === "string" ? _jsx(Text, { wrap: "wrap", children: diagnostic }) : diagnostic] }, i);
}
