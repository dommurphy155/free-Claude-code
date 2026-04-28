import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
// biome-ignore-all assist/source/organizeImports: ANT-ONLY import markers must not be reordered
import { Box, Text } from '../ink.js';
import * as React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { computeGlimmerIndex, computeShimmerSegments, SHIMMER_INTERVAL_MS } from '../bridge/bridgeStatusUtil.js';
import { feature } from 'bun:bundle';
import { getKairosActive, getUserMsgOptIn } from '../bootstrap/state.js';
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../services/analytics/growthbook.js';
import { isEnvTruthy } from '../utils/envUtils.js';
import { count } from '../utils/array.js';
import sample from 'lodash-es/sample.js';
import { formatDuration, formatNumber } from '../utils/format.js';
import { activityManager } from '../utils/activityManager.js';
import { getSpinnerVerbs } from '../constants/spinnerVerbs.js';
import { MessageResponse } from './MessageResponse.js';
import { TaskListV2 } from './TaskListV2.js';
import { useTasksV2 } from '../hooks/useTasksV2.js';
import { useAppState } from '../state/AppState.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { stringWidth } from '../ink/stringWidth.js';
import { getDefaultCharacters } from './Spinner/index.js';
import { SpinnerAnimationRow } from './Spinner/SpinnerAnimationRow.js';
import { useSettings } from '../hooks/useSettings.js';
import { isInProcessTeammateTask } from '../tasks/InProcessTeammateTask/types.js';
import { isBackgroundTask } from '../tasks/types.js';
import { getAllInProcessTeammateTasks } from '../tasks/InProcessTeammateTask/InProcessTeammateTask.js';
import { getEffortSuffix } from '../utils/effort.js';
import { getMainLoopModel } from '../utils/model/model.js';
import { getViewedTeammateTask } from '../state/selectors.js';
import { TEARDROP_ASTERISK } from '../constants/figures.js';
import figures from 'figures';
import { getCurrentTurnTokenBudget, getTurnOutputTokens } from '../bootstrap/state.js';
import { TeammateSpinnerTree } from './Spinner/TeammateSpinnerTree.js';
import { useAnimationFrame } from '../ink.js';
import { getGlobalConfig } from '../utils/config.js';
const DEFAULT_CHARACTERS = getDefaultCharacters();
const SPINNER_FRAMES = [...DEFAULT_CHARACTERS, ...[...DEFAULT_CHARACTERS].reverse()];
// Thin wrapper: branches on isBriefOnly so the two variants have independent
// hook call chains. Without this split, toggling /brief mid-render would
// violate Rules of Hooks (the inner variant calls ~10 more hooks).
export function SpinnerWithVerb(props) {
    const isBriefOnly = useAppState(s => s.isBriefOnly);
    // REPL overrides isBriefOnly→false when viewing a teammate transcript
    // (see isBriefOnly={viewedTeammateTask ? false : isBriefOnly}). That
    // prop isn't threaded here, so replicate the gate from the store —
    // teammate view needs the real spinner (which shows teammate status).
    const viewingAgentTaskId = useAppState(s_0 => s_0.viewingAgentTaskId);
    // Hoisted to mount-time — this component re-renders at animation framerate.
    const briefEnvEnabled = feature('KAIROS') || feature('KAIROS_BRIEF') ?
        // biome-ignore lint/correctness/useHookAtTopLevel: feature() is a compile-time constant
        useMemo(() => isEnvTruthy(process.env.CLAUDE_CODE_BRIEF), []) : false;
    // Runtime gate mirrors isBriefEnabled() but inlined — importing from
    // BriefTool.ts would leak tool-name strings into external builds. Single
    // spinner instance → hooks stay unconditional (two subs, negligible).
    if ((feature('KAIROS') || feature('KAIROS_BRIEF')) && (getKairosActive() || getUserMsgOptIn() && (briefEnvEnabled || getFeatureValue_CACHED_MAY_BE_STALE('tengu_kairos_brief', false))) && isBriefOnly && !viewingAgentTaskId) {
        return _jsx(BriefSpinner, { mode: props.mode, overrideMessage: props.overrideMessage });
    }
    return _jsx(SpinnerWithVerbInner, { ...props });
}
function SpinnerWithVerbInner({ mode, loadingStartTimeRef, totalPausedMsRef, pauseStartTimeRef, spinnerTip, responseLengthRef, overrideColor, overrideShimmerColor, overrideMessage, spinnerSuffix, verbose, hasActiveTools = false, leaderIsIdle = false }) {
    const settings = useSettings();
    const reducedMotion = settings.prefersReducedMotion ?? false;
    // NOTE: useAnimationFrame(50) lives in SpinnerAnimationRow, not here.
    // This component only re-renders when props or app state change —
    // it is no longer on the 50ms clock. All `time`-derived values
    // (frame, glimmer, stalled intensity, token counter, thinking shimmer,
    // elapsed-time timer) are computed inside the child.
    const tasks = useAppState(s => s.tasks);
    const viewingAgentTaskId = useAppState(s_0 => s_0.viewingAgentTaskId);
    const expandedView = useAppState(s_1 => s_1.expandedView);
    const showExpandedTodos = expandedView === 'tasks';
    const showSpinnerTree = expandedView === 'teammates';
    const selectedIPAgentIndex = useAppState(s_2 => s_2.selectedIPAgentIndex);
    const viewSelectionMode = useAppState(s_3 => s_3.viewSelectionMode);
    // Get foregrounded teammate (if viewing a teammate's transcript)
    const foregroundedTeammate = viewingAgentTaskId ? getViewedTeammateTask({
        viewingAgentTaskId,
        tasks
    }) : undefined;
    const { columns } = useTerminalSize();
    const tasksV2 = useTasksV2();
    // Track thinking status: 'thinking' | number (duration in ms) | null
    // Shows each state for minimum 2s to avoid UI jank
    const [thinkingStatus, setThinkingStatus] = useState(null);
    const thinkingStartRef = useRef(null);
    useEffect(() => {
        let showDurationTimer = null;
        let clearStatusTimer = null;
        if (mode === 'thinking') {
            // Started thinking
            if (thinkingStartRef.current === null) {
                thinkingStartRef.current = Date.now();
                setThinkingStatus('thinking');
            }
        }
        else if (thinkingStartRef.current !== null) {
            // Stopped thinking - calculate duration and ensure 2s minimum display
            const duration = Date.now() - thinkingStartRef.current;
            const elapsed = Date.now() - thinkingStartRef.current;
            const remainingThinkingTime = Math.max(0, 2000 - elapsed);
            thinkingStartRef.current = null;
            // Show "thinking..." for remaining time if < 2s elapsed, then show duration
            const showDuration = () => {
                setThinkingStatus(duration);
                // Clear after 2s
                clearStatusTimer = setTimeout(setThinkingStatus, 2000, null);
            };
            if (remainingThinkingTime > 0) {
                showDurationTimer = setTimeout(showDuration, remainingThinkingTime);
            }
            else {
                showDuration();
            }
        }
        return () => {
            if (showDurationTimer)
                clearTimeout(showDurationTimer);
            if (clearStatusTimer)
                clearTimeout(clearStatusTimer);
        };
    }, [mode]);
    // Find the current in-progress task and next pending task
    const currentTodo = tasksV2?.find(task => task.status !== 'pending' && task.status !== 'completed');
    const nextTask = findNextPendingTask(tasksV2);
    // Use useState with initializer to pick a random verb once on mount
    const [randomVerb] = useState(() => sample(getSpinnerVerbs()));
    // Leader's own verb (always the leader's, regardless of who is foregrounded)
    const leaderVerb = overrideMessage ?? currentTodo?.activeForm ?? currentTodo?.subject ?? randomVerb;
    const effectiveVerb = foregroundedTeammate && !foregroundedTeammate.isIdle ? foregroundedTeammate.spinnerVerb ?? randomVerb : leaderVerb;
    const message = effectiveVerb + '…';
    // Track CLI activity when spinner is active
    useEffect(() => {
        const operationId = 'spinner-' + mode;
        activityManager.startCLIActivity(operationId);
        return () => {
            activityManager.endCLIActivity(operationId);
        };
    }, [mode]);
    const effortValue = useAppState(s_4 => s_4.effortValue);
    const effortSuffix = getEffortSuffix(getMainLoopModel(), effortValue);
    // Check if any running in-process teammates exist (needed for both modes)
    const runningTeammates = getAllInProcessTeammateTasks(tasks).filter(t => t.status === 'running');
    const hasRunningTeammates = runningTeammates.length > 0;
    const allIdle = hasRunningTeammates && runningTeammates.every(t_0 => t_0.isIdle);
    // Gather aggregate token stats from all running swarm teammates
    // In spinner-tree mode, skip aggregation (teammates have their own lines in the tree)
    let teammateTokens = 0;
    if (!showSpinnerTree) {
        for (const task_0 of Object.values(tasks)) {
            if (isInProcessTeammateTask(task_0) && task_0.status === 'running') {
                if (task_0.progress?.tokenCount) {
                    teammateTokens += task_0.progress.tokenCount;
                }
            }
        }
    }
    // Stale read of the refs for showBtwTip below — we're off the 50ms clock
    // so this only updates when props/app state change, which is sufficient for
    // a coarse 30s threshold.
    const elapsedSnapshot = pauseStartTimeRef.current !== null ? pauseStartTimeRef.current - loadingStartTimeRef.current - totalPausedMsRef.current : Date.now() - loadingStartTimeRef.current - totalPausedMsRef.current;
    // Leader token count for TeammateSpinnerTree — read raw (non-animated) from
    // the ref. The tree is only shown when teammates are running; teammate
    // progress updates to s.tasks trigger re-renders that keep this fresh.
    const leaderTokenCount = Math.round(responseLengthRef.current / 4);
    const defaultColor = 'claude';
    const defaultShimmerColor = 'claudeShimmer';
    const messageColor = overrideColor ?? defaultColor;
    const shimmerColor = overrideShimmerColor ?? defaultShimmerColor;
    // Compute TTFT string here (off the 50ms animation clock) and pass to
    // SpinnerAnimationRow so it folds into the `(thought for Ns · ...)` status
    // line instead of taking a separate row. apiMetricsRef is a ref so this
    // doesn't trigger re-renders; we pick up updates on the parent's ~25x/turn
    // re-render cadence, same as the old ApiMetricsLine did.
    let ttftText = null;
    if ("external" === 'ant' && apiMetricsRef?.current && apiMetricsRef.current.length > 0) {
        ttftText = computeTtftText(apiMetricsRef.current);
    }
    // When leader is idle but teammates are running (and we're viewing the leader),
    // show a static dim idle display instead of the animated spinner — otherwise
    // useStalledAnimation detects no new tokens after 3s and turns the spinner red.
    if (leaderIsIdle && hasRunningTeammates && !foregroundedTeammate) {
        return _jsxs(Box, { flexDirection: "column", width: "100%", alignItems: "flex-start", children: [_jsx(Box, { flexDirection: "row", flexWrap: "wrap", marginTop: 1, width: "100%", children: _jsxs(Text, { dimColor: true, children: [TEARDROP_ASTERISK, " Idle", !allIdle && ' · teammates running'] }) }), showSpinnerTree && _jsx(TeammateSpinnerTree, { selectedIndex: selectedIPAgentIndex, isInSelectionMode: viewSelectionMode === 'selecting-agent', allIdle: allIdle, leaderTokenCount: leaderTokenCount, leaderIdleText: "Idle" })] });
    }
    // When viewing an idle teammate, show static idle display instead of animated spinner
    if (foregroundedTeammate?.isIdle) {
        const idleText = allIdle ? `${TEARDROP_ASTERISK} Worked for ${formatDuration(Date.now() - foregroundedTeammate.startTime)}` : `${TEARDROP_ASTERISK} Idle`;
        return _jsxs(Box, { flexDirection: "column", width: "100%", alignItems: "flex-start", children: [_jsx(Box, { flexDirection: "row", flexWrap: "wrap", marginTop: 1, width: "100%", children: _jsx(Text, { dimColor: true, children: idleText }) }), showSpinnerTree && hasRunningTeammates && _jsx(TeammateSpinnerTree, { selectedIndex: selectedIPAgentIndex, isInSelectionMode: viewSelectionMode === 'selecting-agent', allIdle: allIdle, leaderVerb: leaderIsIdle ? undefined : leaderVerb, leaderIdleText: leaderIsIdle ? 'Idle' : undefined, leaderTokenCount: leaderTokenCount })] });
    }
    // Time-based tip overrides: coarse thresholds so a stale ref read (we're
    // off the 50ms clock) is fine. Other triggers (mode change, setMessages)
    // cause re-renders that refresh this in practice.
    let contextTipsActive = false;
    const tipsEnabled = settings.spinnerTipsEnabled !== false;
    const showClearTip = tipsEnabled && elapsedSnapshot > 1_800_000;
    const showBtwTip = tipsEnabled && elapsedSnapshot > 30_000 && !getGlobalConfig().btwUseCount;
    const effectiveTip = contextTipsActive ? undefined : showClearTip && !nextTask ? 'Use /clear to start fresh when switching topics and free up context' : showBtwTip && !nextTask ? "Use /btw to ask a quick side question without interrupting Claude's current work" : spinnerTip;
    // Budget text (ant-only) — shown above the tip line
    let budgetText = null;
    if (feature('TOKEN_BUDGET')) {
        const budget = getCurrentTurnTokenBudget();
        if (budget !== null && budget > 0) {
            const tokens = getTurnOutputTokens();
            if (tokens >= budget) {
                budgetText = `Target: ${formatNumber(tokens)} used (${formatNumber(budget)} min ${figures.tick})`;
            }
            else {
                const pct = Math.round(tokens / budget * 100);
                const remaining = budget - tokens;
                const rate = elapsedSnapshot > 5000 && tokens >= 2000 ? tokens / elapsedSnapshot : 0;
                const eta = rate > 0 ? ` \u00B7 ~${formatDuration(remaining / rate, {
                    mostSignificantOnly: true
                })}` : '';
                budgetText = `Target: ${formatNumber(tokens)} / ${formatNumber(budget)} (${pct}%)${eta}`;
            }
        }
    }
    return _jsxs(Box, { flexDirection: "column", width: "100%", alignItems: "flex-start", children: [_jsx(SpinnerAnimationRow, { mode: mode, reducedMotion: reducedMotion, hasActiveTools: hasActiveTools, responseLengthRef: responseLengthRef, message: message, messageColor: messageColor, shimmerColor: shimmerColor, overrideColor: overrideColor, loadingStartTimeRef: loadingStartTimeRef, totalPausedMsRef: totalPausedMsRef, pauseStartTimeRef: pauseStartTimeRef, spinnerSuffix: spinnerSuffix, verbose: verbose, columns: columns, hasRunningTeammates: hasRunningTeammates, teammateTokens: teammateTokens, foregroundedTeammate: foregroundedTeammate, leaderIsIdle: leaderIsIdle, thinkingStatus: thinkingStatus, effortSuffix: effortSuffix }), showSpinnerTree && hasRunningTeammates ? _jsx(TeammateSpinnerTree, { selectedIndex: selectedIPAgentIndex, isInSelectionMode: viewSelectionMode === 'selecting-agent', allIdle: allIdle, leaderVerb: leaderIsIdle ? undefined : leaderVerb, leaderIdleText: leaderIsIdle ? 'Idle' : undefined, leaderTokenCount: leaderTokenCount }) : showExpandedTodos && tasksV2 && tasksV2.length > 0 ? _jsx(Box, { width: "100%", flexDirection: "column", children: _jsx(MessageResponse, { children: _jsx(TaskListV2, { tasks: tasksV2 }) }) }) : nextTask || effectiveTip || budgetText ?
                _jsxs(Box, { width: "100%", flexDirection: "column", children: [budgetText && _jsx(MessageResponse, { children: _jsx(Text, { dimColor: true, children: budgetText }) }), (nextTask || effectiveTip) && _jsx(MessageResponse, { children: _jsx(Text, { dimColor: true, children: nextTask ? `Next: ${nextTask.subject}` : `Tip: ${effectiveTip}` }) })] }) : null] });
}
function BriefSpinner(t0) {
    const $ = _c(31);
    const { mode, overrideMessage } = t0;
    const settings = useSettings();
    const reducedMotion = settings.prefersReducedMotion ?? false;
    const [randomVerb] = useState(_temp4);
    const verb = overrideMessage ?? randomVerb;
    const connStatus = useAppState(_temp5);
    let t1;
    let t2;
    if ($[0] !== mode) {
        t1 = () => {
            const operationId = "spinner-" + mode;
            activityManager.startCLIActivity(operationId);
            return () => {
                activityManager.endCLIActivity(operationId);
            };
        };
        t2 = [mode];
        $[0] = mode;
        $[1] = t1;
        $[2] = t2;
    }
    else {
        t1 = $[1];
        t2 = $[2];
    }
    useEffect(t1, t2);
    const [, time] = useAnimationFrame(reducedMotion ? null : 120);
    const runningCount = useAppState(_temp6);
    const showConnWarning = connStatus === "reconnecting" || connStatus === "disconnected";
    const connText = connStatus === "reconnecting" ? "Reconnecting" : "Disconnected";
    const dotFrame = Math.floor(time / 300) % 3;
    let t3;
    if ($[3] !== dotFrame || $[4] !== reducedMotion) {
        t3 = reducedMotion ? "\u2026  " : ".".repeat(dotFrame + 1).padEnd(3);
        $[3] = dotFrame;
        $[4] = reducedMotion;
        $[5] = t3;
    }
    else {
        t3 = $[5];
    }
    const dots = t3;
    let t4;
    if ($[6] !== verb) {
        t4 = stringWidth(verb);
        $[6] = verb;
        $[7] = t4;
    }
    else {
        t4 = $[7];
    }
    const verbWidth = t4;
    let t5;
    if ($[8] !== reducedMotion || $[9] !== showConnWarning || $[10] !== time || $[11] !== verb || $[12] !== verbWidth) {
        const glimmerIndex = reducedMotion || showConnWarning ? -100 : computeGlimmerIndex(Math.floor(time / SHIMMER_INTERVAL_MS), verbWidth);
        t5 = computeShimmerSegments(verb, glimmerIndex);
        $[8] = reducedMotion;
        $[9] = showConnWarning;
        $[10] = time;
        $[11] = verb;
        $[12] = verbWidth;
        $[13] = t5;
    }
    else {
        t5 = $[13];
    }
    const { before, shimmer, after } = t5;
    const { columns } = useTerminalSize();
    const rightText = runningCount > 0 ? `${runningCount} in background` : "";
    let t6;
    if ($[14] !== connText || $[15] !== showConnWarning || $[16] !== verbWidth) {
        t6 = showConnWarning ? stringWidth(connText) : verbWidth;
        $[14] = connText;
        $[15] = showConnWarning;
        $[16] = verbWidth;
        $[17] = t6;
    }
    else {
        t6 = $[17];
    }
    const leftWidth = t6 + 3;
    const pad = Math.max(1, columns - 2 - leftWidth - stringWidth(rightText));
    let t7;
    if ($[18] !== after || $[19] !== before || $[20] !== connText || $[21] !== dots || $[22] !== shimmer || $[23] !== showConnWarning) {
        t7 = showConnWarning ? _jsx(Text, { color: "error", children: connText + dots }) : _jsxs(_Fragment, { children: [before ? _jsx(Text, { dimColor: true, children: before }) : null, shimmer ? _jsx(Text, { children: shimmer }) : null, after ? _jsx(Text, { dimColor: true, children: after }) : null, _jsx(Text, { dimColor: true, children: dots })] });
        $[18] = after;
        $[19] = before;
        $[20] = connText;
        $[21] = dots;
        $[22] = shimmer;
        $[23] = showConnWarning;
        $[24] = t7;
    }
    else {
        t7 = $[24];
    }
    let t8;
    if ($[25] !== pad || $[26] !== rightText) {
        t8 = rightText ? _jsxs(_Fragment, { children: [_jsx(Text, { children: " ".repeat(pad) }), _jsx(Text, { color: "subtle", children: rightText })] }) : null;
        $[25] = pad;
        $[26] = rightText;
        $[27] = t8;
    }
    else {
        t8 = $[27];
    }
    let t9;
    if ($[28] !== t7 || $[29] !== t8) {
        t9 = _jsxs(Box, { flexDirection: "row", width: "100%", marginTop: 1, paddingLeft: 2, children: [t7, t8] });
        $[28] = t7;
        $[29] = t8;
        $[30] = t9;
    }
    else {
        t9 = $[30];
    }
    return t9;
}
// Idle placeholder for brief mode. Same 2-row [blank, content] footprint
// as BriefSpinner so the input bar never jumps when toggling between
// working/idle/disconnected. See BriefSpinner's comment for the
// Notifications overlay coupling.
function _temp6(s_0) {
    return count(Object.values(s_0.tasks), isBackgroundTask) + s_0.remoteBackgroundTaskCount;
}
function _temp5(s) {
    return s.remoteConnectionStatus;
}
function _temp4() {
    return sample(getSpinnerVerbs()) ?? "Working";
}
export function BriefIdleStatus() {
    const $ = _c(9);
    const connStatus = useAppState(_temp7);
    const runningCount = useAppState(_temp8);
    const { columns } = useTerminalSize();
    const showConnWarning = connStatus === "reconnecting" || connStatus === "disconnected";
    const connText = connStatus === "reconnecting" ? "Reconnecting\u2026" : "Disconnected";
    const leftText = showConnWarning ? connText : "";
    const rightText = runningCount > 0 ? `${runningCount} in background` : "";
    if (!leftText && !rightText) {
        let t0;
        if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
            t0 = _jsx(Box, { height: 2 });
            $[0] = t0;
        }
        else {
            t0 = $[0];
        }
        return t0;
    }
    const pad = Math.max(1, columns - 2 - stringWidth(leftText) - stringWidth(rightText));
    let t0;
    if ($[1] !== leftText) {
        t0 = leftText ? _jsx(Text, { color: "error", children: leftText }) : null;
        $[1] = leftText;
        $[2] = t0;
    }
    else {
        t0 = $[2];
    }
    let t1;
    if ($[3] !== pad || $[4] !== rightText) {
        t1 = rightText ? _jsxs(_Fragment, { children: [_jsx(Text, { children: " ".repeat(pad) }), _jsx(Text, { color: "subtle", children: rightText })] }) : null;
        $[3] = pad;
        $[4] = rightText;
        $[5] = t1;
    }
    else {
        t1 = $[5];
    }
    let t2;
    if ($[6] !== t0 || $[7] !== t1) {
        t2 = _jsx(Box, { marginTop: 1, paddingLeft: 2, children: _jsxs(Text, { children: [t0, t1] }) });
        $[6] = t0;
        $[7] = t1;
        $[8] = t2;
    }
    else {
        t2 = $[8];
    }
    return t2;
}
function _temp8(s_0) {
    return count(Object.values(s_0.tasks), isBackgroundTask) + s_0.remoteBackgroundTaskCount;
}
function _temp7(s) {
    return s.remoteConnectionStatus;
}
export function Spinner() {
    const $ = _c(8);
    const settings = useSettings();
    const reducedMotion = settings.prefersReducedMotion ?? false;
    const [ref, time] = useAnimationFrame(reducedMotion ? null : 120);
    if (reducedMotion) {
        let t0;
        if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
            t0 = _jsx(Text, { color: "text", children: "\u25CF" });
            $[0] = t0;
        }
        else {
            t0 = $[0];
        }
        let t1;
        if ($[1] !== ref) {
            t1 = _jsx(Box, { ref: ref, flexWrap: "wrap", height: 1, width: 2, children: t0 });
            $[1] = ref;
            $[2] = t1;
        }
        else {
            t1 = $[2];
        }
        return t1;
    }
    const frame = Math.floor(time / 120) % SPINNER_FRAMES.length;
    const t0 = SPINNER_FRAMES[frame];
    let t1;
    if ($[3] !== t0) {
        t1 = _jsx(Text, { color: "text", children: t0 });
        $[3] = t0;
        $[4] = t1;
    }
    else {
        t1 = $[4];
    }
    let t2;
    if ($[5] !== ref || $[6] !== t1) {
        t2 = _jsx(Box, { ref: ref, flexWrap: "wrap", height: 1, width: 2, children: t1 });
        $[5] = ref;
        $[6] = t1;
        $[7] = t2;
    }
    else {
        t2 = $[7];
    }
    return t2;
}
function findNextPendingTask(tasks) {
    if (!tasks) {
        return undefined;
    }
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    if (pendingTasks.length === 0) {
        return undefined;
    }
    const unresolvedIds = new Set(tasks.filter(t => t.status !== 'completed').map(t => t.id));
    return pendingTasks.find(t => !t.blockedBy.some(id => unresolvedIds.has(id))) ?? pendingTasks[0];
}
