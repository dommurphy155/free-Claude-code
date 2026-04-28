import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import figures from 'figures';
import * as React from 'react';
import { TEAMMATE_MESSAGE_TAG } from '../../constants/xml.js';
import { Ansi, Box, Text } from '../../ink.js';
import { toInkColor } from '../../utils/ink.js';
import { jsonParse } from '../../utils/slowOperations.js';
import { isShutdownApproved } from '../../utils/teammateMailbox.js';
import { MessageResponse } from '../MessageResponse.js';
import { tryRenderPlanApprovalMessage } from './PlanApprovalMessage.js';
import { tryRenderShutdownMessage } from './ShutdownMessage.js';
import { tryRenderTaskAssignmentMessage } from './TaskAssignmentMessage.js';
const TEAMMATE_MSG_REGEX = new RegExp(`<${TEAMMATE_MESSAGE_TAG}\\s+teammate_id="([^"]+)"(?:\\s+color="([^"]+)")?(?:\\s+summary="([^"]+)")?>\\n?([\\s\\S]*?)\\n?<\\/${TEAMMATE_MESSAGE_TAG}>`, 'g');
/**
 * Parse all teammate messages from XML format:
 * <teammate-message teammate_id="alice" color="red" summary="Brief update">message content</teammate-message>
 * Supports multiple messages in a single text block.
 */
function parseTeammateMessages(text) {
    const messages = [];
    // Use matchAll to find all matches (this is a RegExp method, not child_process)
    for (const match of text.matchAll(TEAMMATE_MSG_REGEX)) {
        if (match[1] && match[4]) {
            messages.push({
                teammateId: match[1],
                color: match[2],
                // may be undefined
                summary: match[3],
                // may be undefined
                content: match[4].trim()
            });
        }
    }
    return messages;
}
function getDisplayName(teammateId) {
    if (teammateId === 'leader') {
        return 'leader';
    }
    return teammateId;
}
export function UserTeammateMessage({ addMargin, param: { text }, isTranscriptMode }) {
    const messages = parseTeammateMessages(text).filter(msg => {
        // Pre-filter shutdown lifecycle messages to avoid empty wrapper
        // Box elements creating blank lines between model turns
        if (isShutdownApproved(msg.content)) {
            return false;
        }
        try {
            const parsed = jsonParse(msg.content);
            if (parsed?.type === 'teammate_terminated')
                return false;
        }
        catch {
            // Not JSON, keep the message
        }
        return true;
    });
    if (messages.length === 0) {
        return null;
    }
    return _jsx(Box, { flexDirection: "column", marginTop: addMargin ? 1 : 0, width: "100%", children: messages.map((msg_0, index) => {
            const inkColor = toInkColor(msg_0.color);
            const displayName = getDisplayName(msg_0.teammateId);
            // Try to render as plan approval message (request or response)
            const planApprovalElement = tryRenderPlanApprovalMessage(msg_0.content, displayName);
            if (planApprovalElement) {
                return _jsx(React.Fragment, { children: planApprovalElement }, index);
            }
            // Try to render as shutdown message (request or rejected)
            const shutdownElement = tryRenderShutdownMessage(msg_0.content);
            if (shutdownElement) {
                return _jsx(React.Fragment, { children: shutdownElement }, index);
            }
            // Try to render as task assignment message
            const taskAssignmentElement = tryRenderTaskAssignmentMessage(msg_0.content);
            if (taskAssignmentElement) {
                return _jsx(React.Fragment, { children: taskAssignmentElement }, index);
            }
            // Try to parse as structured JSON message
            let parsedIdleNotification = null;
            try {
                parsedIdleNotification = jsonParse(msg_0.content);
            }
            catch {
                // Not JSON
            }
            // Hide idle notifications - they are processed silently
            if (parsedIdleNotification?.type === 'idle_notification') {
                return null;
            }
            // Task completed notification - show which task was completed
            if (parsedIdleNotification?.type === 'task_completed') {
                const taskCompleted = parsedIdleNotification;
                return _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { color: inkColor, children: `@${displayName}${figures.pointer}` }), _jsxs(MessageResponse, { children: [_jsx(Text, { color: "success", children: "\u2713" }), _jsxs(Text, { children: [' ', "Completed task #", taskCompleted.taskId, taskCompleted.taskSubject && _jsxs(Text, { dimColor: true, children: [" (", taskCompleted.taskSubject, ")"] })] })] })] }, index);
            }
            // Default: plain text message (truncated)
            return _jsx(TeammateMessageContent, { displayName: displayName, inkColor: inkColor, content: msg_0.content, summary: msg_0.summary, isTranscriptMode: isTranscriptMode }, index);
        }) });
}
export function TeammateMessageContent(t0) {
    const $ = _c(14);
    const { displayName, inkColor, content, summary, isTranscriptMode } = t0;
    const t1 = `@${displayName}${figures.pointer}`;
    let t2;
    if ($[0] !== inkColor || $[1] !== t1) {
        t2 = _jsx(Text, { color: inkColor, children: t1 });
        $[0] = inkColor;
        $[1] = t1;
        $[2] = t2;
    }
    else {
        t2 = $[2];
    }
    let t3;
    if ($[3] !== summary) {
        t3 = summary && _jsxs(Text, { children: [" ", summary] });
        $[3] = summary;
        $[4] = t3;
    }
    else {
        t3 = $[4];
    }
    let t4;
    if ($[5] !== t2 || $[6] !== t3) {
        t4 = _jsxs(Box, { children: [t2, t3] });
        $[5] = t2;
        $[6] = t3;
        $[7] = t4;
    }
    else {
        t4 = $[7];
    }
    let t5;
    if ($[8] !== content || $[9] !== isTranscriptMode) {
        t5 = isTranscriptMode && _jsx(Box, { paddingLeft: 2, children: _jsx(Text, { children: _jsx(Ansi, { children: content }) }) });
        $[8] = content;
        $[9] = isTranscriptMode;
        $[10] = t5;
    }
    else {
        t5 = $[10];
    }
    let t6;
    if ($[11] !== t4 || $[12] !== t5) {
        t6 = _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [t4, t5] });
        $[11] = t4;
        $[12] = t5;
        $[13] = t6;
    }
    else {
        t6 = $[13];
    }
    return t6;
}
