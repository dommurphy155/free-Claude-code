import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { feature } from 'bun:bundle';
import figures from 'figures';
import * as React from 'react';
import { SentryErrorBoundary } from 'src/components/SentryErrorBoundary.js';
import { Box, Text, useTheme } from '../../../ink.js';
import { useAppState } from '../../../state/AppState.js';
import { filterToolProgressMessages } from '../../../Tool.js';
import { deleteClassifierApproval, getClassifierApproval, getYoloClassifierApproval } from '../../../utils/classifierApprovals.js';
import { MessageResponse } from '../../MessageResponse.js';
import { HookProgressMessage } from '../HookProgressMessage.js';
export function UserToolSuccessMessage({ message, lookups, toolUseID, progressMessagesForMessage, style, tool, tools, verbose, width, isTranscriptMode }) {
    const [theme] = useTheme();
    // Hook stays inside feature() ternary so external builds don't pay a
    // per-scrollback-message store subscription — same pattern as
    // UserPromptMessage.tsx.
    const isBriefOnly = feature('KAIROS') || feature('KAIROS_BRIEF') ?
        // biome-ignore lint/correctness/useHookAtTopLevel: feature() is a compile-time constant
        useAppState(s => s.isBriefOnly) : false;
    // Capture classifier approval once on mount, then delete from Map to prevent linear growth.
    // useState lazy initializer ensures the value persists across re-renders.
    const [classifierRule] = React.useState(() => getClassifierApproval(toolUseID));
    const [yoloReason] = React.useState(() => getYoloClassifierApproval(toolUseID));
    React.useEffect(() => {
        deleteClassifierApproval(toolUseID);
    }, [toolUseID]);
    if (!message.toolUseResult || !tool) {
        return null;
    }
    // Resumed transcripts deserialize toolUseResult via raw JSON.parse with no
    // validation (parseJSONL). A partial/corrupt/old-format result crashes
    // renderToolResultMessage on first field access (anthropics/claude-code#39817).
    // Validate against outputSchema before rendering — mirrors CollapsedReadSearchContent.
    const parsedOutput = tool.outputSchema?.safeParse(message.toolUseResult);
    if (parsedOutput && !parsedOutput.success) {
        return null;
    }
    const toolResult = parsedOutput?.data ?? message.toolUseResult;
    const renderedMessage = tool.renderToolResultMessage?.(toolResult, filterToolProgressMessages(progressMessagesForMessage), {
        style,
        theme,
        tools,
        verbose,
        isTranscriptMode,
        isBriefOnly,
        input: lookups.toolUseByToolUseID.get(toolUseID)?.input
    }) ?? null;
    // Don't render anything if the tool result message is null
    if (renderedMessage === null) {
        return null;
    }
    // Tools that return '' from userFacingName opt out of tool chrome and
    // render like plain assistant text. Skip the tool-result width constraint
    // so MarkdownTable's SAFETY_MARGIN=4 (tuned for the assistant-text 2-col
    // dot gutter) holds — otherwise tables wrap their box-drawing chars.
    const rendersAsAssistantText = tool.userFacingName(undefined) === '';
    return _jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { flexDirection: "column", width: rendersAsAssistantText ? undefined : width, children: [renderedMessage, feature('BASH_CLASSIFIER') ? classifierRule && _jsx(MessageResponse, { height: 1, children: _jsxs(Text, { dimColor: true, children: [_jsx(Text, { color: "success", children: figures.tick }), ' Auto-approved \u00b7 matched ', `"${classifierRule}"`] }) }) : null, feature('TRANSCRIPT_CLASSIFIER') ? yoloReason && _jsx(MessageResponse, { height: 1, children: _jsx(Text, { dimColor: true, children: "Allowed by auto mode classifier" }) }) : null] }), _jsx(SentryErrorBoundary, { children: _jsx(HookProgressMessage, { hookEvent: "PostToolUse", lookups: lookups, toolUseID: toolUseID, verbose: verbose, isTranscriptMode: isTranscriptMode }) })] });
}
