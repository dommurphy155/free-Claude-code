import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
// biome-ignore-all assist/source/organizeImports: ANT-ONLY import markers must not be reordered
import React, { useMemo } from 'react';
import { Ansi, Box, Text } from '../../ink.js';
import { useAppState } from '../../state/AppState.js';
import { getDisplayPath } from 'src/utils/file.js';
import { formatFileSize } from 'src/utils/format.js';
import { MessageResponse } from '../MessageResponse.js';
import { basename, sep } from 'path';
import { UserTextMessage } from './UserTextMessage.js';
import { DiagnosticsDisplay } from '../DiagnosticsDisplay.js';
import { getContentText } from 'src/utils/messages.js';
import { UserImageMessage } from './UserImageMessage.js';
import { toInkColor } from '../../utils/ink.js';
import { jsonParse } from '../../utils/slowOperations.js';
import { plural } from '../../utils/stringUtils.js';
import { isEnvTruthy } from '../../utils/envUtils.js';
import { isAgentSwarmsEnabled } from '../../utils/agentSwarmsEnabled.js';
import { tryRenderPlanApprovalMessage, formatTeammateMessageContent } from './PlanApprovalMessage.js';
import { BLACK_CIRCLE } from '../../constants/figures.js';
import { TeammateMessageContent } from './UserTeammateMessage.js';
import { isShutdownApproved } from '../../utils/teammateMailbox.js';
import { CtrlOToExpand } from '../CtrlOToExpand.js';
import { FilePathLink } from '../FilePathLink.js';
import { feature } from 'bun:bundle';
import { useSelectedMessageBg } from '../messageActions.js';
export function AttachmentMessage({ attachment, addMargin, verbose, isTranscriptMode }) {
    const bg = useSelectedMessageBg();
    // Hoisted to mount-time — per-message component, re-renders on every scroll.
    const isDemoEnv = feature('EXPERIMENTAL_SKILL_SEARCH') ?
        // biome-ignore lint/correctness/useHookAtTopLevel: feature() is a compile-time constant
        useMemo(() => isEnvTruthy(process.env.IS_DEMO), []) : false;
    // Handle teammate_mailbox BEFORE switch
    if (isAgentSwarmsEnabled() && attachment.type === 'teammate_mailbox') {
        // Filter out idle notifications BEFORE counting - they are hidden in the UI
        // so showing them in the count would be confusing ("2 messages in mailbox:" with nothing shown)
        const visibleMessages = attachment.messages.filter(msg => {
            if (isShutdownApproved(msg.text)) {
                return false;
            }
            try {
                const parsed = jsonParse(msg.text);
                return parsed?.type !== 'idle_notification' && parsed?.type !== 'teammate_terminated';
            }
            catch {
                return true; // Non-JSON messages are visible
            }
        });
        if (visibleMessages.length === 0) {
            return null;
        }
        return _jsx(Box, { flexDirection: "column", children: visibleMessages.map((msg_0, idx) => {
                // Try to parse as JSON for task_assignment messages
                let parsedMsg = null;
                try {
                    parsedMsg = jsonParse(msg_0.text);
                }
                catch {
                    // Not JSON, treat as plain text
                }
                if (parsedMsg?.type === 'task_assignment') {
                    return _jsxs(Box, { paddingLeft: 2, children: [_jsxs(Text, { children: [BLACK_CIRCLE, " "] }), _jsx(Text, { children: "Task assigned: " }), _jsxs(Text, { bold: true, children: ["#", parsedMsg.taskId] }), _jsxs(Text, { children: [" - ", parsedMsg.subject] }), _jsxs(Text, { dimColor: true, children: [" (from ", parsedMsg.assignedBy || msg_0.from, ")"] })] }, idx);
                }
                // Note: idle_notification messages already filtered out above
                // Try to render as plan approval message (request or response)
                const planApprovalElement = tryRenderPlanApprovalMessage(msg_0.text, msg_0.from);
                if (planApprovalElement) {
                    return _jsx(React.Fragment, { children: planApprovalElement }, idx);
                }
                // Plain text message - sender header with chevron, truncated content
                const inkColor = toInkColor(msg_0.color);
                const formattedContent = formatTeammateMessageContent(msg_0.text) ?? msg_0.text;
                return _jsx(TeammateMessageContent, { displayName: msg_0.from, inkColor: inkColor, content: formattedContent, summary: msg_0.summary, isTranscriptMode: isTranscriptMode }, idx);
            }) });
    }
    // skill_discovery rendered here (not in the switch) so the 'skill_discovery'
    // string literal stays inside a feature()-guarded block. A case label can't
    // be conditionally eliminated; an if-body can.
    if (feature('EXPERIMENTAL_SKILL_SEARCH')) {
        if (attachment.type === 'skill_discovery') {
            if (attachment.skills.length === 0)
                return null;
            // Ant users get shortIds inline so they can /skill-feedback while the
            // turn is still fresh. External users (when this un-gates) just see
            // names — shortId is undefined outside ant builds anyway.
            const names = attachment.skills.map(s => s.shortId ? `${s.name} [${s.shortId}]` : s.name).join(', ');
            const firstId = attachment.skills[0]?.shortId;
            const hint = "external" === 'ant' && !isDemoEnv && firstId ? ` · /skill-feedback ${firstId} 1=wrong 2=noisy 3=good [comment]` : '';
            return _jsxs(Line, { children: [_jsx(Text, { bold: true, children: attachment.skills.length }), " relevant", ' ', plural(attachment.skills.length, 'skill'), ": ", names, hint && _jsx(Text, { dimColor: true, children: hint })] });
        }
    }
    // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check -- teammate_mailbox/skill_discovery handled before switch
    switch (attachment.type) {
        case 'directory':
            return _jsxs(Line, { children: ["Listed directory ", _jsx(Text, { bold: true, children: attachment.displayPath + sep })] });
        case 'file':
        case 'already_read_file':
            if (attachment.content.type === 'notebook') {
                return _jsxs(Line, { children: ["Read ", _jsx(Text, { bold: true, children: attachment.displayPath }), " (", attachment.content.file.cells.length, " cells)"] });
            }
            if (attachment.content.type === 'file_unchanged') {
                return _jsxs(Line, { children: ["Read ", _jsx(Text, { bold: true, children: attachment.displayPath }), " (unchanged)"] });
            }
            return _jsxs(Line, { children: ["Read ", _jsx(Text, { bold: true, children: attachment.displayPath }), " (", attachment.content.type === 'text' ? `${attachment.content.file.numLines}${attachment.truncated ? '+' : ''} lines` : formatFileSize(attachment.content.file.originalSize), ")"] });
        case 'compact_file_reference':
            return _jsxs(Line, { children: ["Referenced file ", _jsx(Text, { bold: true, children: attachment.displayPath })] });
        case 'pdf_reference':
            return _jsxs(Line, { children: ["Referenced PDF ", _jsx(Text, { bold: true, children: attachment.displayPath }), " (", attachment.pageCount, " pages)"] });
        case 'selected_lines_in_ide':
            return _jsxs(Line, { children: ["\u29C9 Selected", ' ', _jsx(Text, { bold: true, children: attachment.lineEnd - attachment.lineStart + 1 }), ' ', "lines from ", _jsx(Text, { bold: true, children: attachment.displayPath }), " in", ' ', attachment.ideName] });
        case 'nested_memory':
            return _jsxs(Line, { children: ["Loaded ", _jsx(Text, { bold: true, children: attachment.displayPath })] });
        case 'relevant_memories':
            // Usually absorbed into a CollapsedReadSearchGroup (collapseReadSearch.ts)
            // so this only renders when the preceding tool was non-collapsible (Edit,
            // Write) and no group was open. Match CollapsedReadSearchContent's style:
            // 2-space gutter, dim text, count only — filenames/content in ctrl+o.
            return _jsxs(Box, { flexDirection: "column", marginTop: addMargin ? 1 : 0, backgroundColor: bg, children: [_jsxs(Box, { flexDirection: "row", children: [_jsx(Box, { minWidth: 2 }), _jsxs(Text, { dimColor: true, children: ["Recalled ", _jsx(Text, { bold: true, children: attachment.memories.length }), ' ', attachment.memories.length === 1 ? 'memory' : 'memories', !isTranscriptMode && _jsxs(_Fragment, { children: [' ', _jsx(CtrlOToExpand, {})] })] })] }), (verbose || isTranscriptMode) && attachment.memories.map(m => _jsxs(Box, { flexDirection: "column", children: [_jsx(MessageResponse, { children: _jsx(Text, { dimColor: true, children: _jsx(FilePathLink, { filePath: m.path, children: basename(m.path) }) }) }), isTranscriptMode && _jsx(Box, { paddingLeft: 5, children: _jsx(Text, { children: _jsx(Ansi, { children: m.content }) }) })] }, m.path))] });
        case 'dynamic_skill':
            {
                const skillCount = attachment.skillNames.length;
                return _jsxs(Line, { children: ["Loaded", ' ', _jsxs(Text, { bold: true, children: [skillCount, " ", plural(skillCount, 'skill')] }), ' ', "from ", _jsx(Text, { bold: true, children: attachment.displayPath })] });
            }
        case 'skill_listing':
            {
                if (attachment.isInitial) {
                    return null;
                }
                return _jsxs(Line, { children: [_jsx(Text, { bold: true, children: attachment.skillCount }), ' ', plural(attachment.skillCount, 'skill'), " available"] });
            }
        case 'agent_listing_delta':
            {
                if (attachment.isInitial || attachment.addedTypes.length === 0) {
                    return null;
                }
                const count = attachment.addedTypes.length;
                return _jsxs(Line, { children: [_jsx(Text, { bold: true, children: count }), " agent ", plural(count, 'type'), " available"] });
            }
        case 'queued_command':
            {
                const text = typeof attachment.prompt === 'string' ? attachment.prompt : getContentText(attachment.prompt) || '';
                const hasImages = attachment.imagePasteIds && attachment.imagePasteIds.length > 0;
                return _jsxs(Box, { flexDirection: "column", children: [_jsx(UserTextMessage, { addMargin: addMargin, param: {
                                text,
                                type: 'text'
                            }, verbose: verbose, isTranscriptMode: isTranscriptMode }), hasImages && attachment.imagePasteIds?.map(id => _jsx(UserImageMessage, { imageId: id }, id))] });
            }
        case 'plan_file_reference':
            return _jsxs(Line, { children: ["Plan file referenced (", getDisplayPath(attachment.planFilePath), ")"] });
        case 'invoked_skills':
            {
                if (attachment.skills.length === 0) {
                    return null;
                }
                const skillNames = attachment.skills.map(s_0 => s_0.name).join(', ');
                return _jsxs(Line, { children: ["Skills restored (", skillNames, ")"] });
            }
        case 'diagnostics':
            return _jsx(DiagnosticsDisplay, { attachment: attachment, verbose: verbose });
        case 'mcp_resource':
            return _jsxs(Line, { children: ["Read MCP resource ", _jsx(Text, { bold: true, children: attachment.name }), " from", ' ', attachment.server] });
        case 'command_permissions':
            // The skill success message is rendered by SkillTool's renderToolResultMessage,
            // so we don't render anything here to avoid duplicate messages.
            return null;
        case 'async_hook_response':
            {
                // SessionStart hook completions are only shown in verbose mode
                if (attachment.hookEvent === 'SessionStart' && !verbose) {
                    return null;
                }
                // Generally hide async hook completion messages unless in verbose mode
                if (!verbose && !isTranscriptMode) {
                    return null;
                }
                return _jsxs(Line, { children: ["Async hook ", _jsx(Text, { bold: true, children: attachment.hookEvent }), " completed"] });
            }
        case 'hook_blocking_error':
            {
                // Stop hooks are rendered as a summary in SystemStopHookSummaryMessage
                if (attachment.hookEvent === 'Stop' || attachment.hookEvent === 'SubagentStop') {
                    return null;
                }
                // Show stderr to the user so they can understand why the hook blocked
                const stderr = attachment.blockingError.blockingError.trim();
                return _jsxs(_Fragment, { children: [_jsxs(Line, { color: "error", children: [attachment.hookName, " hook returned blocking error"] }), stderr ? _jsx(Line, { color: "error", children: stderr }) : null] });
            }
        case 'hook_non_blocking_error':
            {
                // Stop hooks are rendered as a summary in SystemStopHookSummaryMessage
                if (attachment.hookEvent === 'Stop' || attachment.hookEvent === 'SubagentStop') {
                    return null;
                }
                // Full hook output is logged to debug log via hookEvents.ts
                return _jsxs(Line, { color: "error", children: [attachment.hookName, " hook error"] });
            }
        case 'hook_error_during_execution':
            // Stop hooks are rendered as a summary in SystemStopHookSummaryMessage
            if (attachment.hookEvent === 'Stop' || attachment.hookEvent === 'SubagentStop') {
                return null;
            }
            // Full hook output is logged to debug log via hookEvents.ts
            return _jsxs(Line, { children: [attachment.hookName, " hook warning"] });
        case 'hook_success':
            // Full hook output is logged to debug log via hookEvents.ts
            return null;
        case 'hook_stopped_continuation':
            // Stop hooks are rendered as a summary in SystemStopHookSummaryMessage
            if (attachment.hookEvent === 'Stop' || attachment.hookEvent === 'SubagentStop') {
                return null;
            }
            return _jsxs(Line, { color: "warning", children: [attachment.hookName, " hook stopped continuation: ", attachment.message] });
        case 'hook_system_message':
            return _jsxs(Line, { children: [attachment.hookName, " says: ", attachment.content] });
        case 'hook_permission_decision':
            {
                const action = attachment.decision === 'allow' ? 'Allowed' : 'Denied';
                return _jsxs(Line, { children: [action, " by ", _jsx(Text, { bold: true, children: attachment.hookEvent }), " hook"] });
            }
        case 'task_status':
            return _jsx(TaskStatusMessage, { attachment: attachment });
        case 'teammate_shutdown_batch':
            return _jsxs(Box, { flexDirection: "row", width: "100%", marginTop: 1, backgroundColor: bg, children: [_jsxs(Text, { dimColor: true, children: [BLACK_CIRCLE, " "] }), _jsxs(Text, { dimColor: true, children: [attachment.count, " ", plural(attachment.count, 'teammate'), " shut down gracefully"] })] });
        default:
            // Exhaustiveness: every type reaching here must be in NULL_RENDERING_TYPES.
            // If TS errors, a new Attachment type was added without a case above AND
            // without an entry in NULL_RENDERING_TYPES — decide: render something (add
            // a case) or render nothing (add to the array). Messages.tsx pre-filters
            // these so this branch is defense-in-depth for other render paths.
            //
            // skill_discovery and teammate_mailbox are handled BEFORE the switch in
            // runtime-gated blocks (feature() / isAgentSwarmsEnabled()) that TS can't
            // narrow through — excluded here via type union (compile-time only, no emit).
            attachment.type;
            return null;
    }
}
function TaskStatusMessage(t0) {
    const $ = _c(4);
    const { attachment } = t0;
    if (false && attachment.status === "killed") {
        return null;
    }
    if (isAgentSwarmsEnabled() && attachment.taskType === "in_process_teammate") {
        let t1;
        if ($[0] !== attachment) {
            t1 = _jsx(TeammateTaskStatus, { attachment: attachment });
            $[0] = attachment;
            $[1] = t1;
        }
        else {
            t1 = $[1];
        }
        return t1;
    }
    let t1;
    if ($[2] !== attachment) {
        t1 = _jsx(GenericTaskStatus, { attachment: attachment });
        $[2] = attachment;
        $[3] = t1;
    }
    else {
        t1 = $[3];
    }
    return t1;
}
function GenericTaskStatus(t0) {
    const $ = _c(9);
    const { attachment } = t0;
    const bg = useSelectedMessageBg();
    const statusText = attachment.status === "completed" ? "completed in background" : attachment.status === "killed" ? "stopped" : attachment.status === "running" ? "still running in background" : attachment.status;
    let t1;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = _jsxs(Text, { dimColor: true, children: [BLACK_CIRCLE, " "] });
        $[0] = t1;
    }
    else {
        t1 = $[0];
    }
    let t2;
    if ($[1] !== attachment.description) {
        t2 = _jsx(Text, { bold: true, children: attachment.description });
        $[1] = attachment.description;
        $[2] = t2;
    }
    else {
        t2 = $[2];
    }
    let t3;
    if ($[3] !== statusText || $[4] !== t2) {
        t3 = _jsxs(Text, { dimColor: true, children: ["Task \"", t2, "\" ", statusText] });
        $[3] = statusText;
        $[4] = t2;
        $[5] = t3;
    }
    else {
        t3 = $[5];
    }
    let t4;
    if ($[6] !== bg || $[7] !== t3) {
        t4 = _jsxs(Box, { flexDirection: "row", width: "100%", marginTop: 1, backgroundColor: bg, children: [t1, t3] });
        $[6] = bg;
        $[7] = t3;
        $[8] = t4;
    }
    else {
        t4 = $[8];
    }
    return t4;
}
function TeammateTaskStatus(t0) {
    const $ = _c(16);
    const { attachment } = t0;
    const bg = useSelectedMessageBg();
    let t1;
    if ($[0] !== attachment.taskId) {
        t1 = s => s.tasks[attachment.taskId];
        $[0] = attachment.taskId;
        $[1] = t1;
    }
    else {
        t1 = $[1];
    }
    const task = useAppState(t1);
    if (task?.type !== "in_process_teammate") {
        let t2;
        if ($[2] !== attachment) {
            t2 = _jsx(GenericTaskStatus, { attachment: attachment });
            $[2] = attachment;
            $[3] = t2;
        }
        else {
            t2 = $[3];
        }
        return t2;
    }
    let t2;
    if ($[4] !== task.identity.color) {
        t2 = toInkColor(task.identity.color);
        $[4] = task.identity.color;
        $[5] = t2;
    }
    else {
        t2 = $[5];
    }
    const agentColor = t2;
    const statusText = attachment.status === "completed" ? "shut down gracefully" : attachment.status;
    let t3;
    if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
        t3 = _jsxs(Text, { dimColor: true, children: [BLACK_CIRCLE, " "] });
        $[6] = t3;
    }
    else {
        t3 = $[6];
    }
    let t4;
    if ($[7] !== agentColor || $[8] !== task.identity.agentName) {
        t4 = _jsxs(Text, { color: agentColor, bold: true, dimColor: false, children: ["@", task.identity.agentName] });
        $[7] = agentColor;
        $[8] = task.identity.agentName;
        $[9] = t4;
    }
    else {
        t4 = $[9];
    }
    let t5;
    if ($[10] !== statusText || $[11] !== t4) {
        t5 = _jsxs(Text, { dimColor: true, children: ["Teammate", " ", t4, " ", statusText] });
        $[10] = statusText;
        $[11] = t4;
        $[12] = t5;
    }
    else {
        t5 = $[12];
    }
    let t6;
    if ($[13] !== bg || $[14] !== t5) {
        t6 = _jsxs(Box, { flexDirection: "row", width: "100%", marginTop: 1, backgroundColor: bg, children: [t3, t5] });
        $[13] = bg;
        $[14] = t5;
        $[15] = t6;
    }
    else {
        t6 = $[15];
    }
    return t6;
}
// We allow setting dimColor to false here to help work around the dim-bold bug.
// https://github.com/chalk/chalk/issues/290
function Line(t0) {
    const $ = _c(7);
    const { dimColor: t1, children, color } = t0;
    const dimColor = t1 === undefined ? true : t1;
    const bg = useSelectedMessageBg();
    let t2;
    if ($[0] !== children || $[1] !== color || $[2] !== dimColor) {
        t2 = _jsx(MessageResponse, { children: _jsx(Text, { color: color, dimColor: dimColor, wrap: "wrap", children: children }) });
        $[0] = children;
        $[1] = color;
        $[2] = dimColor;
        $[3] = t2;
    }
    else {
        t2 = $[3];
    }
    let t3;
    if ($[4] !== bg || $[5] !== t2) {
        t3 = _jsx(Box, { backgroundColor: bg, children: t2 });
        $[4] = bg;
        $[5] = t2;
        $[6] = t3;
    }
    else {
        t3 = $[6];
    }
    return t3;
}
