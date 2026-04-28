import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { Markdown } from 'src/components/Markdown.js';
import { MessageResponse } from 'src/components/MessageResponse.js';
import { RejectedPlanMessage } from 'src/components/messages/UserToolResultMessage/RejectedPlanMessage.js';
import { BLACK_CIRCLE } from 'src/constants/figures.js';
import { getModeColor } from 'src/utils/permissions/PermissionMode.js';
import { Box, Text } from '../../ink.js';
import { getDisplayPath } from '../../utils/file.js';
import { getPlan } from '../../utils/plans.js';
export function renderToolUseMessage() {
    return null;
}
export function renderToolResultMessage(output, _progressMessagesForMessage, { theme: _theme }) {
    const { plan, filePath } = output;
    const isEmpty = !plan || plan.trim() === '';
    const displayPath = filePath ? getDisplayPath(filePath) : '';
    const awaitingLeaderApproval = output.awaitingLeaderApproval;
    // Simplified message for empty plans
    if (isEmpty) {
        return _jsx(Box, { flexDirection: "column", marginTop: 1, children: _jsxs(Box, { flexDirection: "row", children: [_jsx(Text, { color: getModeColor('plan'), children: BLACK_CIRCLE }), _jsx(Text, { children: " Exited plan mode" })] }) });
    }
    // When awaiting leader approval, show a different message
    if (awaitingLeaderApproval) {
        return _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsxs(Box, { flexDirection: "row", children: [_jsx(Text, { color: getModeColor('plan'), children: BLACK_CIRCLE }), _jsx(Text, { children: " Plan submitted for team lead approval" })] }), _jsx(MessageResponse, { children: _jsxs(Box, { flexDirection: "column", children: [filePath && _jsxs(Text, { dimColor: true, children: ["Plan file: ", displayPath] }), _jsx(Text, { dimColor: true, children: "Waiting for team lead to review and approve..." })] }) })] });
    }
    return _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsxs(Box, { flexDirection: "row", children: [_jsx(Text, { color: getModeColor('plan'), children: BLACK_CIRCLE }), _jsx(Text, { children: " User approved Claude's plan" })] }), _jsx(MessageResponse, { children: _jsxs(Box, { flexDirection: "column", children: [filePath && _jsxs(Text, { dimColor: true, children: ["Plan saved to: ", displayPath, " \u00B7 /plan to edit"] }), _jsx(Markdown, { children: plan })] }) })] });
}
export function renderToolUseRejectedMessage({ plan }, { theme: _theme }) {
    const planContent = plan ?? getPlan() ?? 'No plan found';
    return _jsx(Box, { flexDirection: "column", children: _jsx(RejectedPlanMessage, { plan: planContent }) });
}
