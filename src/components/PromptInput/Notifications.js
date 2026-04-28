import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import { feature } from 'bun:bundle';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { useNotifications } from 'src/context/notifications.js';
import { logEvent } from 'src/services/analytics/index.js';
import { useAppState } from 'src/state/AppState.js';
import { useVoiceState } from '../../context/voice.js';
import { useIdeConnectionStatus } from '../../hooks/useIdeConnectionStatus.js';
import { useMainLoopModel } from '../../hooks/useMainLoopModel.js';
import { useVoiceEnabled } from '../../hooks/useVoiceEnabled.js';
import { Box, Text } from '../../ink.js';
import { useClaudeAiLimits } from '../../services/claudeAiLimitsHook.js';
import { calculateTokenWarningState } from '../../services/compact/autoCompact.js';
import { getApiKeyHelperElapsedMs, getConfiguredApiKeyHelper, getSubscriptionType } from '../../utils/auth.js';
import { getExternalEditor } from '../../utils/editor.js';
import { isEnvTruthy } from '../../utils/envUtils.js';
import { formatDuration } from '../../utils/format.js';
import { setEnvHookNotifier } from '../../utils/hooks/fileChangedWatcher.js';
import { toIDEDisplayName } from '../../utils/ide.js';
import { getMessagesAfterCompactBoundary } from '../../utils/messages.js';
import { tokenCountFromLastAPIResponse } from '../../utils/tokens.js';
import { AutoUpdaterWrapper } from '../AutoUpdaterWrapper.js';
import { ConfigurableShortcutHint } from '../ConfigurableShortcutHint.js';
import { IdeStatusIndicator } from '../IdeStatusIndicator.js';
import { MemoryUsageIndicator } from '../MemoryUsageIndicator.js';
import { SentryErrorBoundary } from '../SentryErrorBoundary.js';
import { TokenWarning } from '../TokenWarning.js';
import { SandboxPromptFooterHint } from './SandboxPromptFooterHint.js';
/* eslint-disable @typescript-eslint/no-require-imports */
const VoiceIndicator = feature('VOICE_MODE') ? require('./VoiceIndicator.js').VoiceIndicator : () => null;
/* eslint-enable @typescript-eslint/no-require-imports */
export const FOOTER_TEMPORARY_STATUS_TIMEOUT = 5000;
export function Notifications(t0) {
    const $ = _c(34);
    const { apiKeyStatus, autoUpdaterResult, debug, isAutoUpdating, verbose, messages, onAutoUpdaterResult, onChangeIsUpdating, ideSelection, mcpClients, isInputWrapped: t1, isNarrow: t2 } = t0;
    const isInputWrapped = t1 === undefined ? false : t1;
    const isNarrow = t2 === undefined ? false : t2;
    let t3;
    if ($[0] !== messages) {
        const messagesForTokenCount = getMessagesAfterCompactBoundary(messages);
        t3 = tokenCountFromLastAPIResponse(messagesForTokenCount);
        $[0] = messages;
        $[1] = t3;
    }
    else {
        t3 = $[1];
    }
    const tokenUsage = t3;
    const mainLoopModel = useMainLoopModel();
    let t4;
    if ($[2] !== mainLoopModel || $[3] !== tokenUsage) {
        t4 = calculateTokenWarningState(tokenUsage, mainLoopModel);
        $[2] = mainLoopModel;
        $[3] = tokenUsage;
        $[4] = t4;
    }
    else {
        t4 = $[4];
    }
    const isShowingCompactMessage = t4.isAboveWarningThreshold;
    const { status: ideStatus } = useIdeConnectionStatus(mcpClients);
    const notifications = useAppState(_temp);
    const { addNotification, removeNotification } = useNotifications();
    const claudeAiLimits = useClaudeAiLimits();
    let t5;
    let t6;
    if ($[5] !== addNotification) {
        t5 = () => {
            setEnvHookNotifier((text, isError) => {
                addNotification({
                    key: "env-hook",
                    text,
                    color: isError ? "error" : undefined,
                    priority: isError ? "medium" : "low",
                    timeoutMs: isError ? 8000 : 5000
                });
            });
            return _temp2;
        };
        t6 = [addNotification];
        $[5] = addNotification;
        $[6] = t5;
        $[7] = t6;
    }
    else {
        t5 = $[6];
        t6 = $[7];
    }
    useEffect(t5, t6);
    const shouldShowIdeSelection = ideStatus === "connected" && (ideSelection?.filePath || ideSelection?.text && ideSelection.lineCount > 0);
    const shouldShowAutoUpdater = !shouldShowIdeSelection || isAutoUpdating || autoUpdaterResult?.status !== "success";
    const isInOverageMode = claudeAiLimits.isUsingOverage;
    let t7;
    if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
        t7 = getSubscriptionType();
        $[8] = t7;
    }
    else {
        t7 = $[8];
    }
    const subscriptionType = t7;
    const isTeamOrEnterprise = subscriptionType === "team" || subscriptionType === "enterprise";
    let t8;
    if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
        t8 = getExternalEditor();
        $[9] = t8;
    }
    else {
        t8 = $[9];
    }
    const editor = t8;
    const shouldShowExternalEditorHint = isInputWrapped && !isShowingCompactMessage && apiKeyStatus !== "invalid" && apiKeyStatus !== "missing" && editor !== undefined;
    let t10;
    let t9;
    if ($[10] !== addNotification || $[11] !== removeNotification || $[12] !== shouldShowExternalEditorHint) {
        t9 = () => {
            if (shouldShowExternalEditorHint && editor) {
                logEvent("tengu_external_editor_hint_shown", {});
                addNotification({
                    key: "external-editor-hint",
                    jsx: _jsx(Text, { dimColor: true, children: _jsx(ConfigurableShortcutHint, { action: "chat:externalEditor", context: "Chat", fallback: "ctrl+g", description: `edit in ${toIDEDisplayName(editor)}` }) }),
                    priority: "immediate",
                    timeoutMs: 5000
                });
            }
            else {
                removeNotification("external-editor-hint");
            }
        };
        t10 = [shouldShowExternalEditorHint, editor, addNotification, removeNotification];
        $[10] = addNotification;
        $[11] = removeNotification;
        $[12] = shouldShowExternalEditorHint;
        $[13] = t10;
        $[14] = t9;
    }
    else {
        t10 = $[13];
        t9 = $[14];
    }
    useEffect(t9, t10);
    const t11 = isNarrow ? "flex-start" : "flex-end";
    const t12 = isInOverageMode ?? false;
    let t13;
    if ($[15] !== apiKeyStatus || $[16] !== autoUpdaterResult || $[17] !== debug || $[18] !== ideSelection || $[19] !== isAutoUpdating || $[20] !== isShowingCompactMessage || $[21] !== mainLoopModel || $[22] !== mcpClients || $[23] !== notifications || $[24] !== onAutoUpdaterResult || $[25] !== onChangeIsUpdating || $[26] !== shouldShowAutoUpdater || $[27] !== t12 || $[28] !== tokenUsage || $[29] !== verbose) {
        t13 = _jsx(NotificationContent, { ideSelection: ideSelection, mcpClients: mcpClients, notifications: notifications, isInOverageMode: t12, isTeamOrEnterprise: isTeamOrEnterprise, apiKeyStatus: apiKeyStatus, debug: debug, verbose: verbose, tokenUsage: tokenUsage, mainLoopModel: mainLoopModel, shouldShowAutoUpdater: shouldShowAutoUpdater, autoUpdaterResult: autoUpdaterResult, isAutoUpdating: isAutoUpdating, isShowingCompactMessage: isShowingCompactMessage, onAutoUpdaterResult: onAutoUpdaterResult, onChangeIsUpdating: onChangeIsUpdating });
        $[15] = apiKeyStatus;
        $[16] = autoUpdaterResult;
        $[17] = debug;
        $[18] = ideSelection;
        $[19] = isAutoUpdating;
        $[20] = isShowingCompactMessage;
        $[21] = mainLoopModel;
        $[22] = mcpClients;
        $[23] = notifications;
        $[24] = onAutoUpdaterResult;
        $[25] = onChangeIsUpdating;
        $[26] = shouldShowAutoUpdater;
        $[27] = t12;
        $[28] = tokenUsage;
        $[29] = verbose;
        $[30] = t13;
    }
    else {
        t13 = $[30];
    }
    let t14;
    if ($[31] !== t11 || $[32] !== t13) {
        t14 = _jsx(SentryErrorBoundary, { children: _jsx(Box, { flexDirection: "column", alignItems: t11, flexShrink: 0, overflowX: "hidden", children: t13 }) });
        $[31] = t11;
        $[32] = t13;
        $[33] = t14;
    }
    else {
        t14 = $[33];
    }
    return t14;
}
function _temp2() {
    return setEnvHookNotifier(null);
}
function _temp(s) {
    return s.notifications;
}
function NotificationContent({ ideSelection, mcpClients, notifications, isInOverageMode, isTeamOrEnterprise, apiKeyStatus, debug, verbose, tokenUsage, mainLoopModel, shouldShowAutoUpdater, autoUpdaterResult, isAutoUpdating, isShowingCompactMessage, onAutoUpdaterResult, onChangeIsUpdating }) {
    // Poll apiKeyHelper inflight state to show slow-helper notice.
    // Gated on configuration — most users never set apiKeyHelper, so the
    // effect is a no-op for them (no interval allocated).
    const [apiKeyHelperSlow, setApiKeyHelperSlow] = useState(null);
    useEffect(() => {
        if (!getConfiguredApiKeyHelper())
            return;
        const interval = setInterval((setSlow) => {
            const ms = getApiKeyHelperElapsedMs();
            const next = ms >= 10_000 ? formatDuration(ms) : null;
            setSlow(prev => next === prev ? prev : next);
        }, 1000, setApiKeyHelperSlow);
        return () => clearInterval(interval);
    }, []);
    // Voice state (VOICE_MODE builds only, runtime-gated by GrowthBook)
    const voiceState = feature('VOICE_MODE') ?
        // biome-ignore lint/correctness/useHookAtTopLevel: feature() is a compile-time constant
        useVoiceState(s => s.voiceState) : 'idle';
    // biome-ignore lint/correctness/useHookAtTopLevel: feature() is a compile-time constant
    const voiceEnabled = feature('VOICE_MODE') ? useVoiceEnabled() : false;
    const voiceError = feature('VOICE_MODE') ?
        // biome-ignore lint/correctness/useHookAtTopLevel: feature() is a compile-time constant
        useVoiceState(s_0 => s_0.voiceError) : null;
    const isBriefOnly = feature('KAIROS') || feature('KAIROS_BRIEF') ?
        // biome-ignore lint/correctness/useHookAtTopLevel: feature() is a compile-time constant
        useAppState(s_1 => s_1.isBriefOnly) : false;
    // When voice is actively recording or processing, replace all
    // notifications with just the voice indicator.
    if (feature('VOICE_MODE') && voiceEnabled && (voiceState === 'recording' || voiceState === 'processing')) {
        return _jsx(VoiceIndicator, { voiceState: voiceState });
    }
    return _jsxs(_Fragment, { children: [_jsx(IdeStatusIndicator, { ideSelection: ideSelection, mcpClients: mcpClients }), notifications.current && ('jsx' in notifications.current ? _jsx(Text, { wrap: "truncate", children: notifications.current.jsx }, notifications.current.key) : _jsx(Text, { color: notifications.current.color, dimColor: !notifications.current.color, wrap: "truncate", children: notifications.current.text })), isInOverageMode && !isTeamOrEnterprise && _jsx(Box, { children: _jsx(Text, { dimColor: true, wrap: "truncate", children: "Now using extra usage" }) }), apiKeyHelperSlow && _jsxs(Box, { children: [_jsxs(Text, { color: "warning", wrap: "truncate", children: ["apiKeyHelper is taking a while", ' '] }), _jsxs(Text, { dimColor: true, wrap: "truncate", children: ["(", apiKeyHelperSlow, ")"] })] }), (apiKeyStatus === 'invalid' || apiKeyStatus === 'missing') && _jsx(Box, { children: _jsx(Text, { color: "error", wrap: "truncate", children: isEnvTruthy(process.env.CLAUDE_CODE_REMOTE) ? 'Authentication error · Try again' : 'Not logged in · Run /login' }) }), debug && _jsx(Box, { children: _jsx(Text, { color: "warning", wrap: "truncate", children: "Debug mode" }) }), apiKeyStatus !== 'invalid' && apiKeyStatus !== 'missing' && verbose && _jsx(Box, { children: _jsxs(Text, { dimColor: true, wrap: "truncate", children: [tokenUsage, " tokens"] }) }), !isBriefOnly && _jsx(TokenWarning, { tokenUsage: tokenUsage, model: mainLoopModel }), shouldShowAutoUpdater && _jsx(AutoUpdaterWrapper, { verbose: verbose, onAutoUpdaterResult: onAutoUpdaterResult, autoUpdaterResult: autoUpdaterResult, isUpdating: isAutoUpdating, onChangeIsUpdating: onChangeIsUpdating, showSuccessMessage: !isShowingCompactMessage }), feature('VOICE_MODE') ? voiceEnabled && voiceError && _jsx(Box, { children: _jsx(Text, { color: "error", wrap: "truncate", children: voiceError }) }) : null, _jsx(MemoryUsageIndicator, {}), _jsx(SandboxPromptFooterHint, {})] });
}
