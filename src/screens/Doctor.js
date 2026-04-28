import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import figures from 'figures';
import { join } from 'path';
import React, { Suspense, use, useEffect, useState } from 'react';
import { KeybindingWarnings } from 'src/components/KeybindingWarnings.js';
import { McpParsingWarnings } from 'src/components/mcp/McpParsingWarnings.js';
import { getModelMaxOutputTokens } from 'src/utils/context.js';
import { getClaudeConfigHomeDir } from 'src/utils/envUtils.js';
import { getOriginalCwd } from '../bootstrap/state.js';
import { Pane } from '../components/design-system/Pane.js';
import { PressEnterToContinue } from '../components/PressEnterToContinue.js';
import { SandboxDoctorSection } from '../components/sandbox/SandboxDoctorSection.js';
import { ValidationErrorsList } from '../components/ValidationErrorsList.js';
import { useSettingsErrors } from '../hooks/notifs/useSettingsErrors.js';
import { useExitOnCtrlCDWithKeybindings } from '../hooks/useExitOnCtrlCDWithKeybindings.js';
import { Box, Text } from '../ink.js';
import { useKeybindings } from '../keybindings/useKeybinding.js';
import { useAppState } from '../state/AppState.js';
import { getPluginErrorMessage } from '../types/plugin.js';
import { getGcsDistTags, getNpmDistTags } from '../utils/autoUpdater.js';
import { checkContextWarnings } from '../utils/doctorContextWarnings.js';
import { getDoctorDiagnostic } from '../utils/doctorDiagnostic.js';
import { validateBoundedIntEnvVar } from '../utils/envValidation.js';
import { pathExists } from '../utils/file.js';
import { cleanupStaleLocks, getAllLockInfo, isPidBasedLockingEnabled } from '../utils/nativeInstaller/pidLock.js';
import { getInitialSettings } from '../utils/settings/settings.js';
import { BASH_MAX_OUTPUT_DEFAULT, BASH_MAX_OUTPUT_UPPER_LIMIT } from '../utils/shell/outputLimits.js';
import { TASK_MAX_OUTPUT_DEFAULT, TASK_MAX_OUTPUT_UPPER_LIMIT } from '../utils/task/outputFormatting.js';
import { getXDGStateHome } from '../utils/xdg.js';
function DistTagsDisplay(t0) {
    const $ = _c(8);
    const { promise } = t0;
    const distTags = use(promise);
    if (!distTags.latest) {
        let t1;
        if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
            t1 = _jsx(Text, { dimColor: true, children: "\u2514 Failed to fetch versions" });
            $[0] = t1;
        }
        else {
            t1 = $[0];
        }
        return t1;
    }
    let t1;
    if ($[1] !== distTags.stable) {
        t1 = distTags.stable && _jsxs(Text, { children: ["\u2514 Stable version: ", distTags.stable] });
        $[1] = distTags.stable;
        $[2] = t1;
    }
    else {
        t1 = $[2];
    }
    let t2;
    if ($[3] !== distTags.latest) {
        t2 = _jsxs(Text, { children: ["\u2514 Latest version: ", distTags.latest] });
        $[3] = distTags.latest;
        $[4] = t2;
    }
    else {
        t2 = $[4];
    }
    let t3;
    if ($[5] !== t1 || $[6] !== t2) {
        t3 = _jsxs(_Fragment, { children: [t1, t2] });
        $[5] = t1;
        $[6] = t2;
        $[7] = t3;
    }
    else {
        t3 = $[7];
    }
    return t3;
}
export function Doctor(t0) {
    const $ = _c(84);
    const { onDone } = t0;
    const agentDefinitions = useAppState(_temp);
    const mcpTools = useAppState(_temp2);
    const toolPermissionContext = useAppState(_temp3);
    const pluginsErrors = useAppState(_temp4);
    useExitOnCtrlCDWithKeybindings();
    let t1;
    if ($[0] !== mcpTools) {
        t1 = mcpTools || [];
        $[0] = mcpTools;
        $[1] = t1;
    }
    else {
        t1 = $[1];
    }
    const tools = t1;
    const [diagnostic, setDiagnostic] = useState(null);
    const [agentInfo, setAgentInfo] = useState(null);
    const [contextWarnings, setContextWarnings] = useState(null);
    const [versionLockInfo, setVersionLockInfo] = useState(null);
    const validationErrors = useSettingsErrors();
    let t2;
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
        t2 = getDoctorDiagnostic().then(_temp6);
        $[2] = t2;
    }
    else {
        t2 = $[2];
    }
    const distTagsPromise = t2;
    const autoUpdatesChannel = getInitialSettings()?.autoUpdatesChannel ?? "latest";
    let t3;
    if ($[3] !== validationErrors) {
        t3 = validationErrors.filter(_temp7);
        $[3] = validationErrors;
        $[4] = t3;
    }
    else {
        t3 = $[4];
    }
    const errorsExcludingMcp = t3;
    let t4;
    if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
        const envVars = [{
                name: "BASH_MAX_OUTPUT_LENGTH",
                default: BASH_MAX_OUTPUT_DEFAULT,
                upperLimit: BASH_MAX_OUTPUT_UPPER_LIMIT
            }, {
                name: "TASK_MAX_OUTPUT_LENGTH",
                default: TASK_MAX_OUTPUT_DEFAULT,
                upperLimit: TASK_MAX_OUTPUT_UPPER_LIMIT
            }, {
                name: "CLAUDE_CODE_MAX_OUTPUT_TOKENS",
                ...getModelMaxOutputTokens("claude-opus-4-6")
            }];
        t4 = envVars.map(_temp8).filter(_temp9);
        $[5] = t4;
    }
    else {
        t4 = $[5];
    }
    const envValidationErrors = t4;
    let t5;
    let t6;
    if ($[6] !== agentDefinitions || $[7] !== toolPermissionContext || $[8] !== tools) {
        t5 = () => {
            getDoctorDiagnostic().then(setDiagnostic);
            (async () => {
                const userAgentsDir = join(getClaudeConfigHomeDir(), "agents");
                const projectAgentsDir = join(getOriginalCwd(), ".claude", "agents");
                const { activeAgents, allAgents, failedFiles } = agentDefinitions;
                const [userDirExists, projectDirExists] = await Promise.all([pathExists(userAgentsDir), pathExists(projectAgentsDir)]);
                const agentInfoData = {
                    activeAgents: activeAgents.map(_temp0),
                    userAgentsDir,
                    projectAgentsDir,
                    userDirExists,
                    projectDirExists,
                    failedFiles
                };
                setAgentInfo(agentInfoData);
                const warnings = await checkContextWarnings(tools, {
                    activeAgents,
                    allAgents,
                    failedFiles
                }, async () => toolPermissionContext);
                setContextWarnings(warnings);
                if (isPidBasedLockingEnabled()) {
                    const locksDir = join(getXDGStateHome(), "claude", "locks");
                    const staleLocksCleaned = cleanupStaleLocks(locksDir);
                    const locks = getAllLockInfo(locksDir);
                    setVersionLockInfo({
                        enabled: true,
                        locks,
                        locksDir,
                        staleLocksCleaned
                    });
                }
                else {
                    setVersionLockInfo({
                        enabled: false,
                        locks: [],
                        locksDir: "",
                        staleLocksCleaned: 0
                    });
                }
            })();
        };
        t6 = [toolPermissionContext, tools, agentDefinitions];
        $[6] = agentDefinitions;
        $[7] = toolPermissionContext;
        $[8] = tools;
        $[9] = t5;
        $[10] = t6;
    }
    else {
        t5 = $[9];
        t6 = $[10];
    }
    useEffect(t5, t6);
    let t7;
    if ($[11] !== onDone) {
        t7 = () => {
            onDone("Claude Code diagnostics dismissed", {
                display: "system"
            });
        };
        $[11] = onDone;
        $[12] = t7;
    }
    else {
        t7 = $[12];
    }
    const handleDismiss = t7;
    let t8;
    if ($[13] !== handleDismiss) {
        t8 = {
            "confirm:yes": handleDismiss,
            "confirm:no": handleDismiss
        };
        $[13] = handleDismiss;
        $[14] = t8;
    }
    else {
        t8 = $[14];
    }
    let t9;
    if ($[15] === Symbol.for("react.memo_cache_sentinel")) {
        t9 = {
            context: "Confirmation"
        };
        $[15] = t9;
    }
    else {
        t9 = $[15];
    }
    useKeybindings(t8, t9);
    if (!diagnostic) {
        let t10;
        if ($[16] === Symbol.for("react.memo_cache_sentinel")) {
            t10 = _jsx(Pane, { children: _jsx(Text, { dimColor: true, children: "Checking installation status\u2026" }) });
            $[16] = t10;
        }
        else {
            t10 = $[16];
        }
        return t10;
    }
    let t10;
    if ($[17] === Symbol.for("react.memo_cache_sentinel")) {
        t10 = _jsx(Text, { bold: true, children: "Diagnostics" });
        $[17] = t10;
    }
    else {
        t10 = $[17];
    }
    let t11;
    if ($[18] !== diagnostic.installationType || $[19] !== diagnostic.version) {
        t11 = _jsxs(Text, { children: ["\u2514 Currently running: ", diagnostic.installationType, " (", diagnostic.version, ")"] });
        $[18] = diagnostic.installationType;
        $[19] = diagnostic.version;
        $[20] = t11;
    }
    else {
        t11 = $[20];
    }
    let t12;
    if ($[21] !== diagnostic.packageManager) {
        t12 = diagnostic.packageManager && _jsxs(Text, { children: ["\u2514 Package manager: ", diagnostic.packageManager] });
        $[21] = diagnostic.packageManager;
        $[22] = t12;
    }
    else {
        t12 = $[22];
    }
    let t13;
    if ($[23] !== diagnostic.installationPath) {
        t13 = _jsxs(Text, { children: ["\u2514 Path: ", diagnostic.installationPath] });
        $[23] = diagnostic.installationPath;
        $[24] = t13;
    }
    else {
        t13 = $[24];
    }
    let t14;
    if ($[25] !== diagnostic.invokedBinary) {
        t14 = _jsxs(Text, { children: ["\u2514 Invoked: ", diagnostic.invokedBinary] });
        $[25] = diagnostic.invokedBinary;
        $[26] = t14;
    }
    else {
        t14 = $[26];
    }
    let t15;
    if ($[27] !== diagnostic.configInstallMethod) {
        t15 = _jsxs(Text, { children: ["\u2514 Config install method: ", diagnostic.configInstallMethod] });
        $[27] = diagnostic.configInstallMethod;
        $[28] = t15;
    }
    else {
        t15 = $[28];
    }
    const t16 = diagnostic.ripgrepStatus.working ? "OK" : "Not working";
    const t17 = diagnostic.ripgrepStatus.mode === "embedded" ? "bundled" : diagnostic.ripgrepStatus.mode === "builtin" ? "vendor" : diagnostic.ripgrepStatus.systemPath || "system";
    let t18;
    if ($[29] !== t16 || $[30] !== t17) {
        t18 = _jsxs(Text, { children: ["\u2514 Search: ", t16, " (", t17, ")"] });
        $[29] = t16;
        $[30] = t17;
        $[31] = t18;
    }
    else {
        t18 = $[31];
    }
    let t19;
    if ($[32] !== diagnostic.recommendation) {
        t19 = diagnostic.recommendation && _jsxs(_Fragment, { children: [_jsx(Text, {}), _jsxs(Text, { color: "warning", children: ["Recommendation: ", diagnostic.recommendation.split("\n")[0]] }), _jsx(Text, { dimColor: true, children: diagnostic.recommendation.split("\n")[1] })] });
        $[32] = diagnostic.recommendation;
        $[33] = t19;
    }
    else {
        t19 = $[33];
    }
    let t20;
    if ($[34] !== diagnostic.multipleInstallations) {
        t20 = diagnostic.multipleInstallations.length > 1 && _jsxs(_Fragment, { children: [_jsx(Text, {}), _jsx(Text, { color: "warning", children: "Warning: Multiple installations found" }), diagnostic.multipleInstallations.map(_temp1)] });
        $[34] = diagnostic.multipleInstallations;
        $[35] = t20;
    }
    else {
        t20 = $[35];
    }
    let t21;
    if ($[36] !== diagnostic.warnings) {
        t21 = diagnostic.warnings.length > 0 && _jsxs(_Fragment, { children: [_jsx(Text, {}), diagnostic.warnings.map(_temp10)] });
        $[36] = diagnostic.warnings;
        $[37] = t21;
    }
    else {
        t21 = $[37];
    }
    let t22;
    if ($[38] !== errorsExcludingMcp) {
        t22 = errorsExcludingMcp.length > 0 && _jsxs(Box, { flexDirection: "column", marginTop: 1, marginBottom: 1, children: [_jsx(Text, { bold: true, children: "Invalid Settings" }), _jsx(ValidationErrorsList, { errors: errorsExcludingMcp })] });
        $[38] = errorsExcludingMcp;
        $[39] = t22;
    }
    else {
        t22 = $[39];
    }
    let t23;
    if ($[40] !== t11 || $[41] !== t12 || $[42] !== t13 || $[43] !== t14 || $[44] !== t15 || $[45] !== t18 || $[46] !== t19 || $[47] !== t20 || $[48] !== t21 || $[49] !== t22) {
        t23 = _jsxs(Box, { flexDirection: "column", children: [t10, t11, t12, t13, t14, t15, t18, t19, t20, t21, t22] });
        $[40] = t11;
        $[41] = t12;
        $[42] = t13;
        $[43] = t14;
        $[44] = t15;
        $[45] = t18;
        $[46] = t19;
        $[47] = t20;
        $[48] = t21;
        $[49] = t22;
        $[50] = t23;
    }
    else {
        t23 = $[50];
    }
    let t24;
    if ($[51] === Symbol.for("react.memo_cache_sentinel")) {
        t24 = _jsx(Text, { bold: true, children: "Updates" });
        $[51] = t24;
    }
    else {
        t24 = $[51];
    }
    const t25 = diagnostic.packageManager ? "Managed by package manager" : diagnostic.autoUpdates;
    let t26;
    if ($[52] !== t25) {
        t26 = _jsxs(Text, { children: ["\u2514 Auto-updates:", " ", t25] });
        $[52] = t25;
        $[53] = t26;
    }
    else {
        t26 = $[53];
    }
    let t27;
    if ($[54] !== diagnostic.hasUpdatePermissions) {
        t27 = diagnostic.hasUpdatePermissions !== null && _jsxs(Text, { children: ["\u2514 Update permissions:", " ", diagnostic.hasUpdatePermissions ? "Yes" : "No (requires sudo)"] });
        $[54] = diagnostic.hasUpdatePermissions;
        $[55] = t27;
    }
    else {
        t27 = $[55];
    }
    let t28;
    if ($[56] === Symbol.for("react.memo_cache_sentinel")) {
        t28 = _jsxs(Text, { children: ["\u2514 Auto-update channel: ", autoUpdatesChannel] });
        $[56] = t28;
    }
    else {
        t28 = $[56];
    }
    let t29;
    if ($[57] === Symbol.for("react.memo_cache_sentinel")) {
        t29 = _jsx(Suspense, { fallback: null, children: _jsx(DistTagsDisplay, { promise: distTagsPromise }) });
        $[57] = t29;
    }
    else {
        t29 = $[57];
    }
    let t30;
    if ($[58] !== t26 || $[59] !== t27) {
        t30 = _jsxs(Box, { flexDirection: "column", children: [t24, t26, t27, t28, t29] });
        $[58] = t26;
        $[59] = t27;
        $[60] = t30;
    }
    else {
        t30 = $[60];
    }
    let t31;
    let t32;
    let t33;
    let t34;
    if ($[61] === Symbol.for("react.memo_cache_sentinel")) {
        t31 = _jsx(SandboxDoctorSection, {});
        t32 = _jsx(McpParsingWarnings, {});
        t33 = _jsx(KeybindingWarnings, {});
        t34 = envValidationErrors.length > 0 && _jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { bold: true, children: "Environment Variables" }), envValidationErrors.map(_temp11)] });
        $[61] = t31;
        $[62] = t32;
        $[63] = t33;
        $[64] = t34;
    }
    else {
        t31 = $[61];
        t32 = $[62];
        t33 = $[63];
        t34 = $[64];
    }
    let t35;
    if ($[65] !== versionLockInfo) {
        t35 = versionLockInfo?.enabled && _jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { bold: true, children: "Version Locks" }), versionLockInfo.staleLocksCleaned > 0 && _jsxs(Text, { dimColor: true, children: ["\u2514 Cleaned ", versionLockInfo.staleLocksCleaned, " stale lock(s)"] }), versionLockInfo.locks.length === 0 ? _jsx(Text, { dimColor: true, children: "\u2514 No active version locks" }) : versionLockInfo.locks.map(_temp12)] });
        $[65] = versionLockInfo;
        $[66] = t35;
    }
    else {
        t35 = $[66];
    }
    let t36;
    if ($[67] !== agentInfo) {
        t36 = agentInfo?.failedFiles && agentInfo.failedFiles.length > 0 && _jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { bold: true, color: "error", children: "Agent Parse Errors" }), _jsxs(Text, { color: "error", children: ["\u2514 Failed to parse ", agentInfo.failedFiles.length, " agent file(s):"] }), agentInfo.failedFiles.map(_temp13)] });
        $[67] = agentInfo;
        $[68] = t36;
    }
    else {
        t36 = $[68];
    }
    let t37;
    if ($[69] !== pluginsErrors) {
        t37 = pluginsErrors.length > 0 && _jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { bold: true, color: "error", children: "Plugin Errors" }), _jsxs(Text, { color: "error", children: ["\u2514 ", pluginsErrors.length, " plugin error(s) detected:"] }), pluginsErrors.map(_temp14)] });
        $[69] = pluginsErrors;
        $[70] = t37;
    }
    else {
        t37 = $[70];
    }
    let t38;
    if ($[71] !== contextWarnings) {
        t38 = contextWarnings?.unreachableRulesWarning && _jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { bold: true, color: "warning", children: "Unreachable Permission Rules" }), _jsxs(Text, { children: ["\u2514", " ", _jsxs(Text, { color: "warning", children: [figures.warning, " ", contextWarnings.unreachableRulesWarning.message] })] }), contextWarnings.unreachableRulesWarning.details.map(_temp15)] });
        $[71] = contextWarnings;
        $[72] = t38;
    }
    else {
        t38 = $[72];
    }
    let t39;
    if ($[73] !== contextWarnings) {
        t39 = contextWarnings && (contextWarnings.claudeMdWarning || contextWarnings.agentWarning || contextWarnings.mcpWarning) && _jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { bold: true, children: "Context Usage Warnings" }), contextWarnings.claudeMdWarning && _jsxs(_Fragment, { children: [_jsxs(Text, { children: ["\u2514", " ", _jsxs(Text, { color: "warning", children: [figures.warning, " ", contextWarnings.claudeMdWarning.message] })] }), _jsxs(Text, { children: ["  ", "\u2514 Files:"] }), contextWarnings.claudeMdWarning.details.map(_temp16)] }), contextWarnings.agentWarning && _jsxs(_Fragment, { children: [_jsxs(Text, { children: ["\u2514", " ", _jsxs(Text, { color: "warning", children: [figures.warning, " ", contextWarnings.agentWarning.message] })] }), _jsxs(Text, { children: ["  ", "\u2514 Top contributors:"] }), contextWarnings.agentWarning.details.map(_temp17)] }), contextWarnings.mcpWarning && _jsxs(_Fragment, { children: [_jsxs(Text, { children: ["\u2514", " ", _jsxs(Text, { color: "warning", children: [figures.warning, " ", contextWarnings.mcpWarning.message] })] }), _jsxs(Text, { children: ["  ", "\u2514 MCP servers:"] }), contextWarnings.mcpWarning.details.map(_temp18)] })] });
        $[73] = contextWarnings;
        $[74] = t39;
    }
    else {
        t39 = $[74];
    }
    let t40;
    if ($[75] === Symbol.for("react.memo_cache_sentinel")) {
        t40 = _jsx(Box, { children: _jsx(PressEnterToContinue, {}) });
        $[75] = t40;
    }
    else {
        t40 = $[75];
    }
    let t41;
    if ($[76] !== t23 || $[77] !== t30 || $[78] !== t35 || $[79] !== t36 || $[80] !== t37 || $[81] !== t38 || $[82] !== t39) {
        t41 = _jsxs(Pane, { children: [t23, t30, t31, t32, t33, t34, t35, t36, t37, t38, t39, t40] });
        $[76] = t23;
        $[77] = t30;
        $[78] = t35;
        $[79] = t36;
        $[80] = t37;
        $[81] = t38;
        $[82] = t39;
        $[83] = t41;
    }
    else {
        t41 = $[83];
    }
    return t41;
}
function _temp18(detail_2, i_8) {
    return _jsxs(Text, { dimColor: true, children: ["    ", "\u2514 ", detail_2] }, i_8);
}
function _temp17(detail_1, i_7) {
    return _jsxs(Text, { dimColor: true, children: ["    ", "\u2514 ", detail_1] }, i_7);
}
function _temp16(detail_0, i_6) {
    return _jsxs(Text, { dimColor: true, children: ["    ", "\u2514 ", detail_0] }, i_6);
}
function _temp15(detail, i_5) {
    return _jsxs(Text, { dimColor: true, children: ["  ", "\u2514 ", detail] }, i_5);
}
function _temp14(error_0, i_4) {
    return _jsxs(Text, { dimColor: true, children: ["  ", "\u2514 ", error_0.source || "unknown", "plugin" in error_0 && error_0.plugin ? ` [${error_0.plugin}]` : "", ":", " ", getPluginErrorMessage(error_0)] }, i_4);
}
function _temp13(file, i_3) {
    return _jsxs(Text, { dimColor: true, children: ["  ", "\u2514 ", file.path, ": ", file.error] }, i_3);
}
function _temp12(lock, i_2) {
    return _jsxs(Text, { children: ["\u2514 ", lock.version, ": PID ", lock.pid, " ", lock.isProcessRunning ? _jsx(Text, { children: "(running)" }) : _jsx(Text, { color: "warning", children: "(stale)" })] }, i_2);
}
function _temp11(validation, i_1) {
    return _jsxs(Text, { children: ["\u2514 ", validation.name, ":", " ", _jsx(Text, { color: validation.status === "capped" ? "warning" : "error", children: validation.message })] }, i_1);
}
function _temp10(warning, i_0) {
    return _jsxs(Box, { flexDirection: "column", children: [_jsxs(Text, { color: "warning", children: ["Warning: ", warning.issue] }), _jsxs(Text, { children: ["Fix: ", warning.fix] })] }, i_0);
}
function _temp1(install, i) {
    return _jsxs(Text, { children: ["\u2514 ", install.type, " at ", install.path] }, i);
}
function _temp0(a) {
    return {
        agentType: a.agentType,
        source: a.source
    };
}
function _temp9(v_0) {
    return v_0.status !== "valid";
}
function _temp8(v) {
    const value = process.env[v.name];
    const result = validateBoundedIntEnvVar(v.name, value, v.default, v.upperLimit);
    return {
        name: v.name,
        ...result
    };
}
function _temp7(error) {
    return error.mcpErrorMetadata === undefined;
}
function _temp6(diag) {
    const fetchDistTags = diag.installationType === "native" ? getGcsDistTags : getNpmDistTags;
    return fetchDistTags().catch(_temp5);
}
function _temp5() {
    return {
        latest: null,
        stable: null
    };
}
function _temp4(s_2) {
    return s_2.plugins.errors;
}
function _temp3(s_1) {
    return s_1.toolPermissionContext;
}
function _temp2(s_0) {
    return s_0.mcp.tools;
}
function _temp(s) {
    return s.agentDefinitions;
}
