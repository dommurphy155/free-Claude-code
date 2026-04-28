import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import figures from 'figures';
import React, { useMemo, useState } from 'react';
import { DIAMOND_FILLED, DIAMOND_OPEN } from '../../constants/figures.js';
import { useElapsedTime } from '../../hooks/useElapsedTime.js';
import { Box, Link, Text } from '../../ink.js';
import { getRemoteTaskSessionUrl } from '../../tasks/RemoteAgentTask/RemoteAgentTask.js';
import { AGENT_TOOL_NAME, LEGACY_AGENT_TOOL_NAME } from '../../tools/AgentTool/constants.js';
import { ASK_USER_QUESTION_TOOL_NAME } from '../../tools/AskUserQuestionTool/prompt.js';
import { EXIT_PLAN_MODE_V2_TOOL_NAME } from '../../tools/ExitPlanModeTool/constants.js';
import { openBrowser } from '../../utils/browser.js';
import { errorMessage } from '../../utils/errors.js';
import { formatDuration, truncateToWidth } from '../../utils/format.js';
import { toInternalMessages } from '../../utils/messages/mappers.js';
import { EMPTY_LOOKUPS, normalizeMessages } from '../../utils/messages.js';
import { plural } from '../../utils/stringUtils.js';
import { teleportResumeCodeSession } from '../../utils/teleport.js';
import { Select } from '../CustomSelect/select.js';
import { Byline } from '../design-system/Byline.js';
import { Dialog } from '../design-system/Dialog.js';
import { KeyboardShortcutHint } from '../design-system/KeyboardShortcutHint.js';
import { Message } from '../Message.js';
import { formatReviewStageCounts, RemoteSessionProgress } from './RemoteSessionProgress.js';
// Compact one-line summary: tool name + first meaningful string arg.
// Lighter than tool.renderToolUseMessage (no registry lookup / schema parse).
// Collapses whitespace so multi-line inputs (e.g. Bash command text)
// render on one line.
export function formatToolUseSummary(name, input) {
    // plan_ready phase is only reached via ExitPlanMode tool
    if (name === EXIT_PLAN_MODE_V2_TOOL_NAME) {
        return 'Review the plan in Claude Code on the web';
    }
    if (!input || typeof input !== 'object')
        return name;
    // AskUserQuestion: show the question text as a CTA, not the tool name.
    // Input shape is {questions: [{question, header, options}]}.
    if (name === ASK_USER_QUESTION_TOOL_NAME && 'questions' in input) {
        const qs = input.questions;
        if (Array.isArray(qs) && qs[0] && typeof qs[0] === 'object') {
            // Prefer question (full text) over header (max-12-char tag). header
            // is a required schema field so checking it first would make the
            // question fallback dead code.
            const q = 'question' in qs[0] && typeof qs[0].question === 'string' && qs[0].question ? qs[0].question : 'header' in qs[0] && typeof qs[0].header === 'string' ? qs[0].header : null;
            if (q) {
                const oneLine = q.replace(/\s+/g, ' ').trim();
                return `Answer in browser: ${truncateToWidth(oneLine, 50)}`;
            }
        }
    }
    for (const v of Object.values(input)) {
        if (typeof v === 'string' && v.trim()) {
            const oneLine = v.replace(/\s+/g, ' ').trim();
            return `${name} ${truncateToWidth(oneLine, 60)}`;
        }
    }
    return name;
}
const PHASE_LABEL = {
    needs_input: 'input required',
    plan_ready: 'ready'
};
const AGENT_VERB = {
    needs_input: 'waiting',
    plan_ready: 'done'
};
function UltraplanSessionDetail(t0) {
    const $ = _c(70);
    const { session, onDone, onBack, onKill } = t0;
    const running = session.status === "running" || session.status === "pending";
    const phase = session.ultraplanPhase;
    const statusText = running ? phase ? PHASE_LABEL[phase] : "running" : session.status;
    const elapsedTime = useElapsedTime(session.startTime, running, 1000, 0, session.endTime);
    let spawns = 0;
    let calls = 0;
    let lastBlock = null;
    for (const msg of session.log) {
        if (msg.type !== "assistant") {
            continue;
        }
        for (const block of msg.message.content) {
            if (block.type !== "tool_use") {
                continue;
            }
            calls++;
            lastBlock = block;
            if (block.name === AGENT_TOOL_NAME || block.name === LEGACY_AGENT_TOOL_NAME) {
                spawns++;
            }
        }
    }
    const t1 = 1 + spawns;
    let t2;
    if ($[0] !== lastBlock) {
        t2 = lastBlock ? formatToolUseSummary(lastBlock.name, lastBlock.input) : null;
        $[0] = lastBlock;
        $[1] = t2;
    }
    else {
        t2 = $[1];
    }
    let t3;
    if ($[2] !== calls || $[3] !== t1 || $[4] !== t2) {
        t3 = {
            agentsWorking: t1,
            toolCalls: calls,
            lastToolCall: t2
        };
        $[2] = calls;
        $[3] = t1;
        $[4] = t2;
        $[5] = t3;
    }
    else {
        t3 = $[5];
    }
    const { agentsWorking, toolCalls, lastToolCall } = t3;
    let t4;
    if ($[6] !== session.sessionId) {
        t4 = getRemoteTaskSessionUrl(session.sessionId);
        $[6] = session.sessionId;
        $[7] = t4;
    }
    else {
        t4 = $[7];
    }
    const sessionUrl = t4;
    let t5;
    if ($[8] !== onBack || $[9] !== onDone) {
        t5 = onBack ?? (() => onDone("Remote session details dismissed", {
            display: "system"
        }));
        $[8] = onBack;
        $[9] = onDone;
        $[10] = t5;
    }
    else {
        t5 = $[10];
    }
    const goBackOrClose = t5;
    const [confirmingStop, setConfirmingStop] = useState(false);
    if (confirmingStop) {
        let t6;
        if ($[11] === Symbol.for("react.memo_cache_sentinel")) {
            t6 = () => setConfirmingStop(false);
            $[11] = t6;
        }
        else {
            t6 = $[11];
        }
        let t7;
        if ($[12] === Symbol.for("react.memo_cache_sentinel")) {
            t7 = _jsx(Text, { dimColor: true, children: "This will terminate the Claude Code on the web session." });
            $[12] = t7;
        }
        else {
            t7 = $[12];
        }
        let t8;
        if ($[13] === Symbol.for("react.memo_cache_sentinel")) {
            t8 = {
                label: "Terminate session",
                value: "stop"
            };
            $[13] = t8;
        }
        else {
            t8 = $[13];
        }
        let t9;
        if ($[14] === Symbol.for("react.memo_cache_sentinel")) {
            t9 = [t8, {
                    label: "Back",
                    value: "back"
                }];
            $[14] = t9;
        }
        else {
            t9 = $[14];
        }
        let t10;
        if ($[15] !== goBackOrClose || $[16] !== onKill) {
            t10 = _jsx(Dialog, { title: "Stop ultraplan?", onCancel: t6, color: "background", children: _jsxs(Box, { flexDirection: "column", gap: 1, children: [t7, _jsx(Select, { options: t9, onChange: v => {
                                if (v === "stop") {
                                    onKill?.();
                                    goBackOrClose();
                                }
                                else {
                                    setConfirmingStop(false);
                                }
                            } })] }) });
            $[15] = goBackOrClose;
            $[16] = onKill;
            $[17] = t10;
        }
        else {
            t10 = $[17];
        }
        return t10;
    }
    const t6 = phase === "plan_ready" ? DIAMOND_FILLED : DIAMOND_OPEN;
    let t7;
    if ($[18] !== t6) {
        t7 = _jsxs(Text, { color: "background", children: [t6, " "] });
        $[18] = t6;
        $[19] = t7;
    }
    else {
        t7 = $[19];
    }
    let t8;
    if ($[20] === Symbol.for("react.memo_cache_sentinel")) {
        t8 = _jsx(Text, { bold: true, children: "ultraplan" });
        $[20] = t8;
    }
    else {
        t8 = $[20];
    }
    let t9;
    if ($[21] !== elapsedTime || $[22] !== statusText) {
        t9 = _jsxs(Text, { dimColor: true, children: [" \xB7 ", elapsedTime, " \xB7 ", statusText] });
        $[21] = elapsedTime;
        $[22] = statusText;
        $[23] = t9;
    }
    else {
        t9 = $[23];
    }
    let t10;
    if ($[24] !== t7 || $[25] !== t9) {
        t10 = _jsxs(Text, { children: [t7, t8, t9] });
        $[24] = t7;
        $[25] = t9;
        $[26] = t10;
    }
    else {
        t10 = $[26];
    }
    let t11;
    if ($[27] !== phase) {
        t11 = phase === "plan_ready" && _jsxs(Text, { color: "success", children: [figures.tick, " "] });
        $[27] = phase;
        $[28] = t11;
    }
    else {
        t11 = $[28];
    }
    let t12;
    if ($[29] !== agentsWorking) {
        t12 = plural(agentsWorking, "agent");
        $[29] = agentsWorking;
        $[30] = t12;
    }
    else {
        t12 = $[30];
    }
    const t13 = phase ? AGENT_VERB[phase] : "working";
    let t14;
    if ($[31] !== toolCalls) {
        t14 = plural(toolCalls, "call");
        $[31] = toolCalls;
        $[32] = t14;
    }
    else {
        t14 = $[32];
    }
    let t15;
    if ($[33] !== agentsWorking || $[34] !== t11 || $[35] !== t12 || $[36] !== t13 || $[37] !== t14 || $[38] !== toolCalls) {
        t15 = _jsxs(Text, { children: [t11, agentsWorking, " ", t12, " ", t13, " \u00B7 ", toolCalls, " tool", " ", t14] });
        $[33] = agentsWorking;
        $[34] = t11;
        $[35] = t12;
        $[36] = t13;
        $[37] = t14;
        $[38] = toolCalls;
        $[39] = t15;
    }
    else {
        t15 = $[39];
    }
    let t16;
    if ($[40] !== lastToolCall) {
        t16 = lastToolCall && _jsx(Text, { dimColor: true, children: lastToolCall });
        $[40] = lastToolCall;
        $[41] = t16;
    }
    else {
        t16 = $[41];
    }
    let t17;
    if ($[42] !== sessionUrl) {
        t17 = _jsx(Text, { dimColor: true, children: sessionUrl });
        $[42] = sessionUrl;
        $[43] = t17;
    }
    else {
        t17 = $[43];
    }
    let t18;
    if ($[44] !== sessionUrl || $[45] !== t17) {
        t18 = _jsx(Link, { url: sessionUrl, children: t17 });
        $[44] = sessionUrl;
        $[45] = t17;
        $[46] = t18;
    }
    else {
        t18 = $[46];
    }
    let t19;
    if ($[47] === Symbol.for("react.memo_cache_sentinel")) {
        t19 = {
            label: "Review in Claude Code on the web",
            value: "open"
        };
        $[47] = t19;
    }
    else {
        t19 = $[47];
    }
    let t20;
    if ($[48] !== onKill || $[49] !== running) {
        t20 = onKill && running ? [{
                label: "Stop ultraplan",
                value: "stop"
            }] : [];
        $[48] = onKill;
        $[49] = running;
        $[50] = t20;
    }
    else {
        t20 = $[50];
    }
    let t21;
    if ($[51] === Symbol.for("react.memo_cache_sentinel")) {
        t21 = {
            label: "Back",
            value: "back"
        };
        $[51] = t21;
    }
    else {
        t21 = $[51];
    }
    let t22;
    if ($[52] !== t20) {
        t22 = [t19, ...t20, t21];
        $[52] = t20;
        $[53] = t22;
    }
    else {
        t22 = $[53];
    }
    let t23;
    if ($[54] !== goBackOrClose || $[55] !== onDone || $[56] !== sessionUrl) {
        t23 = v_0 => {
            switch (v_0) {
                case "open":
                    {
                        openBrowser(sessionUrl);
                        onDone();
                        return;
                    }
                case "stop":
                    {
                        setConfirmingStop(true);
                        return;
                    }
                case "back":
                    {
                        goBackOrClose();
                        return;
                    }
            }
        };
        $[54] = goBackOrClose;
        $[55] = onDone;
        $[56] = sessionUrl;
        $[57] = t23;
    }
    else {
        t23 = $[57];
    }
    let t24;
    if ($[58] !== t22 || $[59] !== t23) {
        t24 = _jsx(Select, { options: t22, onChange: t23 });
        $[58] = t22;
        $[59] = t23;
        $[60] = t24;
    }
    else {
        t24 = $[60];
    }
    let t25;
    if ($[61] !== t15 || $[62] !== t16 || $[63] !== t18 || $[64] !== t24) {
        t25 = _jsxs(Box, { flexDirection: "column", gap: 1, children: [t15, t16, t18, t24] });
        $[61] = t15;
        $[62] = t16;
        $[63] = t18;
        $[64] = t24;
        $[65] = t25;
    }
    else {
        t25 = $[65];
    }
    let t26;
    if ($[66] !== goBackOrClose || $[67] !== t10 || $[68] !== t25) {
        t26 = _jsx(Dialog, { title: t10, onCancel: goBackOrClose, color: "background", children: t25 });
        $[66] = goBackOrClose;
        $[67] = t10;
        $[68] = t25;
        $[69] = t26;
    }
    else {
        t26 = $[69];
    }
    return t26;
}
const STAGES = ['finding', 'verifying', 'synthesizing'];
const STAGE_LABELS = {
    finding: 'Find',
    verifying: 'Verify',
    synthesizing: 'Dedupe'
};
// Setup → Find → Verify → Dedupe pipeline. Current stage in cloud teal,
// rest dim. When completed, all stages dim with a trailing green ✓. The
// "Setup" label shows before the orchestrator writes its first progress
// snapshot (container boot + repo clone), so the 0-found display doesn't
// look like a hung finder.
function StagePipeline(t0) {
    const $ = _c(15);
    const { stage, completed, hasProgress } = t0;
    let t1;
    if ($[0] !== stage) {
        t1 = stage ? STAGES.indexOf(stage) : -1;
        $[0] = stage;
        $[1] = t1;
    }
    else {
        t1 = $[1];
    }
    const currentIdx = t1;
    const inSetup = !completed && !hasProgress;
    let t2;
    if ($[2] !== inSetup) {
        t2 = inSetup ? _jsx(Text, { color: "background", children: "Setup" }) : _jsx(Text, { dimColor: true, children: "Setup" });
        $[2] = inSetup;
        $[3] = t2;
    }
    else {
        t2 = $[3];
    }
    let t3;
    if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
        t3 = _jsx(Text, { dimColor: true, children: " \u2192 " });
        $[4] = t3;
    }
    else {
        t3 = $[4];
    }
    let t4;
    if ($[5] !== completed || $[6] !== currentIdx || $[7] !== inSetup) {
        t4 = STAGES.map((s, i) => {
            const isCurrent = !completed && !inSetup && i === currentIdx;
            return _jsxs(React.Fragment, { children: [i > 0 && _jsx(Text, { dimColor: true, children: " \u2192 " }), isCurrent ? _jsx(Text, { color: "background", children: STAGE_LABELS[s] }) : _jsx(Text, { dimColor: true, children: STAGE_LABELS[s] })] }, s);
        });
        $[5] = completed;
        $[6] = currentIdx;
        $[7] = inSetup;
        $[8] = t4;
    }
    else {
        t4 = $[8];
    }
    let t5;
    if ($[9] !== completed) {
        t5 = completed && _jsx(Text, { color: "success", children: " \u2713" });
        $[9] = completed;
        $[10] = t5;
    }
    else {
        t5 = $[10];
    }
    let t6;
    if ($[11] !== t2 || $[12] !== t4 || $[13] !== t5) {
        t6 = _jsxs(Text, { children: [t2, t3, t4, t5] });
        $[11] = t2;
        $[12] = t4;
        $[13] = t5;
        $[14] = t6;
    }
    else {
        t6 = $[14];
    }
    return t6;
}
// Stage-appropriate counts line. Running-state formatting delegates to
// formatReviewStageCounts (shared with the pill) so the two views can't
// drift; completed state is dialog-specific (findings summary).
function reviewCountsLine(session) {
    const p = session.reviewProgress;
    // No progress data — the orchestrator never wrote a snapshot. Don't
    // claim "0 findings" when completed; we just don't know.
    if (!p)
        return session.status === 'completed' ? 'done' : 'setting up';
    const verified = p.bugsVerified;
    const refuted = p.bugsRefuted ?? 0;
    if (session.status === 'completed') {
        const parts = [`${verified} ${plural(verified, 'finding')}`];
        if (refuted > 0)
            parts.push(`${refuted} refuted`);
        return parts.join(' · ');
    }
    return formatReviewStageCounts(p.stage, p.bugsFound, verified, refuted);
}
function ReviewSessionDetail(t0) {
    const $ = _c(56);
    const { session, onDone, onBack, onKill } = t0;
    const completed = session.status === "completed";
    const running = session.status === "running" || session.status === "pending";
    const [confirmingStop, setConfirmingStop] = useState(false);
    const elapsedTime = useElapsedTime(session.startTime, running, 1000, 0, session.endTime);
    let t1;
    if ($[0] !== onDone) {
        t1 = () => onDone("Remote session details dismissed", {
            display: "system"
        });
        $[0] = onDone;
        $[1] = t1;
    }
    else {
        t1 = $[1];
    }
    const handleClose = t1;
    const goBackOrClose = onBack ?? handleClose;
    let t2;
    if ($[2] !== session.sessionId) {
        t2 = getRemoteTaskSessionUrl(session.sessionId);
        $[2] = session.sessionId;
        $[3] = t2;
    }
    else {
        t2 = $[3];
    }
    const sessionUrl = t2;
    const statusLabel = completed ? "ready" : running ? "running" : session.status;
    if (confirmingStop) {
        let t3;
        if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
            t3 = () => setConfirmingStop(false);
            $[4] = t3;
        }
        else {
            t3 = $[4];
        }
        let t4;
        if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
            t4 = _jsx(Text, { dimColor: true, children: "This archives the remote session and stops local tracking. The review will not complete and any findings so far are discarded." });
            $[5] = t4;
        }
        else {
            t4 = $[5];
        }
        let t5;
        if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
            t5 = {
                label: "Stop ultrareview",
                value: "stop"
            };
            $[6] = t5;
        }
        else {
            t5 = $[6];
        }
        let t6;
        if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
            t6 = [t5, {
                    label: "Back",
                    value: "back"
                }];
            $[7] = t6;
        }
        else {
            t6 = $[7];
        }
        let t7;
        if ($[8] !== goBackOrClose || $[9] !== onKill) {
            t7 = _jsx(Dialog, { title: "Stop ultrareview?", onCancel: t3, color: "background", children: _jsxs(Box, { flexDirection: "column", gap: 1, children: [t4, _jsx(Select, { options: t6, onChange: v => {
                                if (v === "stop") {
                                    onKill?.();
                                    goBackOrClose();
                                }
                                else {
                                    setConfirmingStop(false);
                                }
                            } })] }) });
            $[8] = goBackOrClose;
            $[9] = onKill;
            $[10] = t7;
        }
        else {
            t7 = $[10];
        }
        return t7;
    }
    let t3;
    if ($[11] !== completed || $[12] !== onKill || $[13] !== running) {
        t3 = completed ? [{
                label: "Open in Claude Code on the web",
                value: "open"
            }, {
                label: "Dismiss",
                value: "dismiss"
            }] : [{
                label: "Open in Claude Code on the web",
                value: "open"
            }, ...(onKill && running ? [{
                    label: "Stop ultrareview",
                    value: "stop"
                }] : []), {
                label: "Back",
                value: "back"
            }];
        $[11] = completed;
        $[12] = onKill;
        $[13] = running;
        $[14] = t3;
    }
    else {
        t3 = $[14];
    }
    const options = t3;
    let t4;
    if ($[15] !== goBackOrClose || $[16] !== handleClose || $[17] !== onDone || $[18] !== sessionUrl) {
        t4 = action => {
            bb45: switch (action) {
                case "open":
                    {
                        openBrowser(sessionUrl);
                        onDone();
                        break bb45;
                    }
                case "stop":
                    {
                        setConfirmingStop(true);
                        break bb45;
                    }
                case "back":
                    {
                        goBackOrClose();
                        break bb45;
                    }
                case "dismiss":
                    {
                        handleClose();
                    }
            }
        };
        $[15] = goBackOrClose;
        $[16] = handleClose;
        $[17] = onDone;
        $[18] = sessionUrl;
        $[19] = t4;
    }
    else {
        t4 = $[19];
    }
    const handleSelect = t4;
    const t5 = completed ? DIAMOND_FILLED : DIAMOND_OPEN;
    let t6;
    if ($[20] !== t5) {
        t6 = _jsxs(Text, { color: "background", children: [t5, " "] });
        $[20] = t5;
        $[21] = t6;
    }
    else {
        t6 = $[21];
    }
    let t7;
    if ($[22] === Symbol.for("react.memo_cache_sentinel")) {
        t7 = _jsx(Text, { bold: true, children: "ultrareview" });
        $[22] = t7;
    }
    else {
        t7 = $[22];
    }
    let t8;
    if ($[23] !== elapsedTime || $[24] !== statusLabel) {
        t8 = _jsxs(Text, { dimColor: true, children: [" \xB7 ", elapsedTime, " \xB7 ", statusLabel] });
        $[23] = elapsedTime;
        $[24] = statusLabel;
        $[25] = t8;
    }
    else {
        t8 = $[25];
    }
    let t9;
    if ($[26] !== t6 || $[27] !== t8) {
        t9 = _jsxs(Text, { children: [t6, t7, t8] });
        $[26] = t6;
        $[27] = t8;
        $[28] = t9;
    }
    else {
        t9 = $[28];
    }
    const t10 = session.reviewProgress?.stage;
    const t11 = !!session.reviewProgress;
    let t12;
    if ($[29] !== completed || $[30] !== t10 || $[31] !== t11) {
        t12 = _jsx(StagePipeline, { stage: t10, completed: completed, hasProgress: t11 });
        $[29] = completed;
        $[30] = t10;
        $[31] = t11;
        $[32] = t12;
    }
    else {
        t12 = $[32];
    }
    let t13;
    if ($[33] !== session) {
        t13 = reviewCountsLine(session);
        $[33] = session;
        $[34] = t13;
    }
    else {
        t13 = $[34];
    }
    let t14;
    if ($[35] !== t13) {
        t14 = _jsx(Text, { children: t13 });
        $[35] = t13;
        $[36] = t14;
    }
    else {
        t14 = $[36];
    }
    let t15;
    if ($[37] !== sessionUrl) {
        t15 = _jsx(Text, { dimColor: true, children: sessionUrl });
        $[37] = sessionUrl;
        $[38] = t15;
    }
    else {
        t15 = $[38];
    }
    let t16;
    if ($[39] !== sessionUrl || $[40] !== t15) {
        t16 = _jsx(Link, { url: sessionUrl, children: t15 });
        $[39] = sessionUrl;
        $[40] = t15;
        $[41] = t16;
    }
    else {
        t16 = $[41];
    }
    let t17;
    if ($[42] !== t14 || $[43] !== t16) {
        t17 = _jsxs(Box, { flexDirection: "column", children: [t14, t16] });
        $[42] = t14;
        $[43] = t16;
        $[44] = t17;
    }
    else {
        t17 = $[44];
    }
    let t18;
    if ($[45] !== handleSelect || $[46] !== options) {
        t18 = _jsx(Select, { options: options, onChange: handleSelect });
        $[45] = handleSelect;
        $[46] = options;
        $[47] = t18;
    }
    else {
        t18 = $[47];
    }
    let t19;
    if ($[48] !== t12 || $[49] !== t17 || $[50] !== t18) {
        t19 = _jsxs(Box, { flexDirection: "column", gap: 1, children: [t12, t17, t18] });
        $[48] = t12;
        $[49] = t17;
        $[50] = t18;
        $[51] = t19;
    }
    else {
        t19 = $[51];
    }
    let t20;
    if ($[52] !== goBackOrClose || $[53] !== t19 || $[54] !== t9) {
        t20 = _jsx(Dialog, { title: t9, onCancel: goBackOrClose, color: "background", inputGuide: _temp, children: t19 });
        $[52] = goBackOrClose;
        $[53] = t19;
        $[54] = t9;
        $[55] = t20;
    }
    else {
        t20 = $[55];
    }
    return t20;
}
function _temp(exitState) {
    return exitState.pending ? _jsxs(Text, { children: ["Press ", exitState.keyName, " again to exit"] }) : _jsxs(Byline, { children: [_jsx(KeyboardShortcutHint, { shortcut: "Enter", action: "select" }), _jsx(KeyboardShortcutHint, { shortcut: "Esc", action: "go back" })] });
}
export function RemoteSessionDetailDialog({ session, toolUseContext, onDone, onBack, onKill }) {
    const [isTeleporting, setIsTeleporting] = useState(false);
    const [teleportError, setTeleportError] = useState(null);
    // Get last few messages from remote session for display.
    // Scan all messages (not just the last 3 raw entries) because the tail of
    // the log is often thinking-only blocks that normalise to 'progress' type.
    // Placed before the early returns so hook call order is stable (Rules of Hooks).
    // Ultraplan/review sessions never read this — skip the normalize work for them.
    const lastMessages = useMemo(() => {
        if (session.isUltraplan || session.isRemoteReview)
            return [];
        return normalizeMessages(toInternalMessages(session.log)).filter(_ => _.type !== 'progress').slice(-3);
    }, [session]);
    if (session.isUltraplan) {
        return _jsx(UltraplanSessionDetail, { session: session, onDone: onDone, onBack: onBack, onKill: onKill });
    }
    // Review sessions get the stage-pipeline view; everything else keeps the
    // generic label/value + recent-messages dialog below.
    if (session.isRemoteReview) {
        return _jsx(ReviewSessionDetail, { session: session, onDone: onDone, onBack: onBack, onKill: onKill });
    }
    const handleClose = () => onDone('Remote session details dismissed', {
        display: 'system'
    });
    // Component-specific shortcuts shown in UI hints (t=teleport, space=dismiss,
    // left=back). These are state-dependent actions, not standard dialog keybindings.
    const handleKeyDown = (e) => {
        if (e.key === ' ') {
            e.preventDefault();
            onDone('Remote session details dismissed', {
                display: 'system'
            });
        }
        else if (e.key === 'left' && onBack) {
            e.preventDefault();
            onBack();
        }
        else if (e.key === 't' && !isTeleporting) {
            e.preventDefault();
            void handleTeleport();
        }
        else if (e.key === 'return') {
            e.preventDefault();
            handleClose();
        }
    };
    // Handle teleporting to remote session
    async function handleTeleport() {
        setIsTeleporting(true);
        setTeleportError(null);
        try {
            await teleportResumeCodeSession(session.sessionId);
        }
        catch (err) {
            setTeleportError(errorMessage(err));
        }
        finally {
            setIsTeleporting(false);
        }
    }
    // Truncate title if too long (for display purposes)
    const displayTitle = truncateToWidth(session.title, 50);
    // Map TaskStatus to display status (handle 'pending')
    const displayStatus = session.status === 'pending' ? 'starting' : session.status;
    return _jsx(Box, { flexDirection: "column", tabIndex: 0, autoFocus: true, onKeyDown: handleKeyDown, children: _jsxs(Dialog, { title: "Remote session details", onCancel: handleClose, color: "background", inputGuide: exitState => exitState.pending ? _jsxs(Text, { children: ["Press ", exitState.keyName, " again to exit"] }) : _jsxs(Byline, { children: [onBack && _jsx(KeyboardShortcutHint, { shortcut: "\u2190", action: "go back" }), _jsx(KeyboardShortcutHint, { shortcut: "Esc/Enter/Space", action: "close" }), !isTeleporting && _jsx(KeyboardShortcutHint, { shortcut: "t", action: "teleport" })] }), children: [_jsxs(Box, { flexDirection: "column", children: [_jsxs(Text, { children: [_jsx(Text, { bold: true, children: "Status" }), ":", ' ', displayStatus === 'running' || displayStatus === 'starting' ? _jsx(Text, { color: "background", children: displayStatus }) : displayStatus === 'completed' ? _jsx(Text, { color: "success", children: displayStatus }) : _jsx(Text, { color: "error", children: displayStatus })] }), _jsxs(Text, { children: [_jsx(Text, { bold: true, children: "Runtime" }), ":", ' ', formatDuration((session.endTime ?? Date.now()) - session.startTime)] }), _jsxs(Text, { wrap: "truncate-end", children: [_jsx(Text, { bold: true, children: "Title" }), ": ", displayTitle] }), _jsxs(Text, { children: [_jsx(Text, { bold: true, children: "Progress" }), ":", ' ', _jsx(RemoteSessionProgress, { session: session })] }), _jsxs(Text, { children: [_jsx(Text, { bold: true, children: "Session URL" }), ":", ' ', _jsx(Link, { url: getRemoteTaskSessionUrl(session.sessionId), children: _jsx(Text, { dimColor: true, children: getRemoteTaskSessionUrl(session.sessionId) }) })] })] }), session.log.length > 0 && _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsxs(Text, { children: [_jsx(Text, { bold: true, children: "Recent messages" }), ":"] }), _jsx(Box, { flexDirection: "column", height: 10, overflowY: "hidden", children: lastMessages.map((msg, i) => _jsx(Message, { message: msg, lookups: EMPTY_LOOKUPS, addMargin: i > 0, tools: toolUseContext.options.tools, commands: toolUseContext.options.commands, verbose: toolUseContext.options.verbose, inProgressToolUseIDs: new Set(), progressMessagesForMessage: [], shouldAnimate: false, shouldShowDot: false, style: "condensed", isTranscriptMode: false, isStatic: true }, i)) }), _jsx(Box, { marginTop: 1, children: _jsxs(Text, { dimColor: true, italic: true, children: ["Showing last ", lastMessages.length, " of ", session.log.length, ' ', "messages"] }) })] }), teleportError && _jsx(Box, { marginTop: 1, children: _jsxs(Text, { color: "error", children: ["Teleport failed: ", teleportError] }) }), isTeleporting && _jsx(Text, { color: "background", children: "Teleporting to session\u2026" })] }) });
}
