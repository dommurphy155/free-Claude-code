import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { MessageResponse } from '../../components/MessageResponse.js';
import { Text } from '../../ink.js';
import { truncate } from '../../utils/format.js';
// --- CronCreate -------------------------------------------------------------
export function renderCreateToolUseMessage(input) {
    return `${input.cron ?? ''}${input.prompt ? `: ${truncate(input.prompt, 60, true)}` : ''}`;
}
export function renderCreateResultMessage(output) {
    const modeLabel = output.autonomous ? ' [autonomous]' : '';
    return _jsx(MessageResponse, { children: _jsxs(Text, { children: ["Scheduled ", _jsx(Text, { bold: true, children: output.id }), ' ', _jsxs(Text, { dimColor: true, children: ["(", output.humanSchedule, ")", modeLabel] })] }) });
}
// --- CronDelete -------------------------------------------------------------
export function renderDeleteToolUseMessage(input) {
    return input.id ?? '';
}
export function renderDeleteResultMessage(output) {
    return _jsx(MessageResponse, { children: _jsxs(Text, { children: ["Cancelled ", _jsx(Text, { bold: true, children: output.id })] }) });
}
// --- CronList ---------------------------------------------------------------
export function renderListToolUseMessage() {
    return '';
}
export function renderListResultMessage(output) {
    if (output.jobs.length === 0) {
        return _jsx(MessageResponse, { children: _jsx(Text, { dimColor: true, children: "No scheduled jobs" }) });
    }
    return _jsx(MessageResponse, { children: output.jobs.map(j => _jsxs(Text, { children: [_jsx(Text, { bold: true, children: j.id }), " ", _jsxs(Text, { dimColor: true, children: [j.humanSchedule, j.autonomous ? ' [autonomous]' : ''] })] }, j.id)) });
}
