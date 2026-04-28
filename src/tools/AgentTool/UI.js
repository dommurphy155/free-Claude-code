import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import * as React from 'react';
import { ConfigurableShortcutHint } from 'src/components/ConfigurableShortcutHint.js';
import { CtrlOToExpand, SubAgentProvider } from 'src/components/CtrlOToExpand.js';
import { Byline } from 'src/components/design-system/Byline.js';
import { KeyboardShortcutHint } from 'src/components/design-system/KeyboardShortcutHint.js';
import { AgentProgressLine } from '../../components/AgentProgressLine.js';
import { FallbackToolUseErrorMessage } from '../../components/FallbackToolUseErrorMessage.js';
import { FallbackToolUseRejectedMessage } from '../../components/FallbackToolUseRejectedMessage.js';
import { Markdown } from '../../components/Markdown.js';
import { Message as MessageComponent } from '../../components/Message.js';
import { MessageResponse } from '../../components/MessageResponse.js';
import { ToolUseLoader } from '../../components/ToolUseLoader.js';
import { Box, Text } from '../../ink.js';
import { getDumpPromptsPath } from '../../services/api/dumpPrompts.js';
import { findToolByName } from '../../Tool.js';
import { count } from '../../utils/array.js';
import { getSearchOrReadFromContent, getSearchReadSummaryText } from '../../utils/collapseReadSearch.js';
import { getDisplayPath } from '../../utils/file.js';
import { formatDuration, formatNumber } from '../../utils/format.js';
import { buildSubagentLookups, createAssistantMessage, EMPTY_LOOKUPS } from '../../utils/messages.js';
import { getMainLoopModel, parseUserSpecifiedModel, renderModelName } from '../../utils/model/model.js';
import { inputSchema } from './AgentTool.js';
import { getAgentColor } from './agentColorManager.js';
import { GENERAL_PURPOSE_AGENT } from './built-in/generalPurposeAgent.js';
const MAX_PROGRESS_MESSAGES_TO_SHOW = 3;
/**
 * Guard: checks if progress data has a `message` field (agent_progress or
 * skill_progress).  Other progress types (e.g. bash_progress forwarded from
 * sub-agents) lack this field and must be skipped by UI helpers.
 */
function hasProgressMessage(data) {
    if (!('message' in data)) {
        return false;
    }
    const msg = data.message;
    return msg != null && typeof msg === 'object' && 'type' in msg;
}
/**
 * Check if a progress message is a search/read/REPL operation (tool use or result).
 * Returns { isSearch, isRead, isREPL } if it's a collapsible operation, null otherwise.
 *
 * For tool_result messages, uses the provided `toolUseByID` map to find the
 * corresponding tool_use block instead of relying on `normalizedMessages`.
 */
function getSearchOrReadInfo(progressMessage, tools, toolUseByID) {
    if (!hasProgressMessage(progressMessage.data)) {
        return null;
    }
    const message = progressMessage.data.message;
    // Check tool_use (assistant message)
    if (message.type === 'assistant') {
        return getSearchOrReadFromContent(message.message.content[0], tools);
    }
    // Check tool_result (user message) - find corresponding tool use from the map
    if (message.type === 'user') {
        const content = message.message.content[0];
        if (content?.type === 'tool_result') {
            const toolUse = toolUseByID.get(content.tool_use_id);
            if (toolUse) {
                return getSearchOrReadFromContent(toolUse, tools);
            }
        }
    }
    return null;
}
/**
 * Process progress messages to group consecutive search/read operations into summaries.
 * For ants only - returns original messages for non-ants.
 * @param isAgentRunning - If true, the last group is always marked as active (in progress)
 */
function processProgressMessages(messages, tools, isAgentRunning) {
    // Only process for ants
    if ("external" !== 'ant') {
        return messages.filter((m) => hasProgressMessage(m.data) && m.data.message.type !== 'user').map(m => ({
            type: 'original',
            message: m
        }));
    }
    const result = [];
    let currentGroup = null;
    function flushGroup(isActive) {
        if (currentGroup && (currentGroup.searchCount > 0 || currentGroup.readCount > 0 || currentGroup.replCount > 0)) {
            result.push({
                type: 'summary',
                searchCount: currentGroup.searchCount,
                readCount: currentGroup.readCount,
                replCount: currentGroup.replCount,
                uuid: `summary-${currentGroup.startUuid}`,
                isActive
            });
        }
        currentGroup = null;
    }
    const agentMessages = messages.filter((m) => hasProgressMessage(m.data));
    // Build tool_use lookup incrementally as we iterate
    const toolUseByID = new Map();
    for (const msg of agentMessages) {
        // Track tool_use blocks as we see them
        if (msg.data.message.type === 'assistant') {
            for (const c of msg.data.message.message.content) {
                if (c.type === 'tool_use') {
                    toolUseByID.set(c.id, c);
                }
            }
        }
        const info = getSearchOrReadInfo(msg, tools, toolUseByID);
        if (info && (info.isSearch || info.isRead || info.isREPL)) {
            // This is a search/read/REPL operation - add to current group
            if (!currentGroup) {
                currentGroup = {
                    searchCount: 0,
                    readCount: 0,
                    replCount: 0,
                    startUuid: msg.uuid
                };
            }
            // Only count tool_result messages (not tool_use) to avoid double counting
            if (msg.data.message.type === 'user') {
                if (info.isSearch) {
                    currentGroup.searchCount++;
                }
                else if (info.isREPL) {
                    currentGroup.replCount++;
                }
                else if (info.isRead) {
                    currentGroup.readCount++;
                }
            }
        }
        else {
            // Non-search/read/REPL message - flush current group (completed) and add this message
            flushGroup(false);
            // Skip user tool_result messages — subagent progress messages lack
            // toolUseResult, so UserToolSuccessMessage returns null and the
            // height=1 Box in renderToolUseProgressMessage shows as a blank line.
            if (msg.data.message.type !== 'user') {
                result.push({
                    type: 'original',
                    message: msg
                });
            }
        }
    }
    // Flush any remaining group - it's active if the agent is still running
    flushGroup(isAgentRunning);
    return result;
}
const ESTIMATED_LINES_PER_TOOL = 9;
const TERMINAL_BUFFER_LINES = 7;
export function AgentPromptDisplay(t0) {
    const $ = _c(3);
    const { prompt, dim: t1 } = t0;
    t1 === undefined ? false : t1;
    let t2;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t2 = _jsx(Text, { color: "success", bold: true, children: "Prompt:" });
        $[0] = t2;
    }
    else {
        t2 = $[0];
    }
    let t3;
    if ($[1] !== prompt) {
        t3 = _jsxs(Box, { flexDirection: "column", children: [t2, _jsx(Box, { paddingLeft: 2, children: _jsx(Markdown, { children: prompt }) })] });
        $[1] = prompt;
        $[2] = t3;
    }
    else {
        t3 = $[2];
    }
    return t3;
}
export function AgentResponseDisplay(t0) {
    const $ = _c(5);
    const { content } = t0;
    let t1;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = _jsx(Text, { color: "success", bold: true, children: "Response:" });
        $[0] = t1;
    }
    else {
        t1 = $[0];
    }
    let t2;
    if ($[1] !== content) {
        t2 = content.map(_temp);
        $[1] = content;
        $[2] = t2;
    }
    else {
        t2 = $[2];
    }
    let t3;
    if ($[3] !== t2) {
        t3 = _jsxs(Box, { flexDirection: "column", children: [t1, t2] });
        $[3] = t2;
        $[4] = t3;
    }
    else {
        t3 = $[4];
    }
    return t3;
}
function _temp(block, index) {
    return _jsx(Box, { paddingLeft: 2, marginTop: index === 0 ? 0 : 1, children: _jsx(Markdown, { children: block.text }) }, index);
}
function VerboseAgentTranscript(t0) {
    const $ = _c(15);
    const { progressMessages, tools, verbose } = t0;
    let t1;
    if ($[0] !== progressMessages) {
        t1 = buildSubagentLookups(progressMessages.filter(_temp2).map(_temp3));
        $[0] = progressMessages;
        $[1] = t1;
    }
    else {
        t1 = $[1];
    }
    const { lookups: agentLookups, inProgressToolUseIDs } = t1;
    let t2;
    if ($[2] !== agentLookups || $[3] !== inProgressToolUseIDs || $[4] !== progressMessages || $[5] !== tools || $[6] !== verbose) {
        const filteredMessages = progressMessages.filter(_temp4);
        let t3;
        if ($[8] !== agentLookups || $[9] !== inProgressToolUseIDs || $[10] !== tools || $[11] !== verbose) {
            t3 = progressMessage => _jsx(MessageResponse, { height: 1, children: _jsx(MessageComponent, { message: progressMessage.data.message, lookups: agentLookups, addMargin: false, tools: tools, commands: [], verbose: verbose, inProgressToolUseIDs: inProgressToolUseIDs, progressMessagesForMessage: [], shouldAnimate: false, shouldShowDot: false, isTranscriptMode: false, isStatic: true }) }, progressMessage.uuid);
            $[8] = agentLookups;
            $[9] = inProgressToolUseIDs;
            $[10] = tools;
            $[11] = verbose;
            $[12] = t3;
        }
        else {
            t3 = $[12];
        }
        t2 = filteredMessages.map(t3);
        $[2] = agentLookups;
        $[3] = inProgressToolUseIDs;
        $[4] = progressMessages;
        $[5] = tools;
        $[6] = verbose;
        $[7] = t2;
    }
    else {
        t2 = $[7];
    }
    let t3;
    if ($[13] !== t2) {
        t3 = _jsx(_Fragment, { children: t2 });
        $[13] = t2;
        $[14] = t3;
    }
    else {
        t3 = $[14];
    }
    return t3;
}
function _temp4(pm_1) {
    if (!hasProgressMessage(pm_1.data)) {
        return false;
    }
    const msg = pm_1.data.message;
    if (msg.type === "user" && msg.toolUseResult === undefined) {
        return false;
    }
    return true;
}
function _temp3(pm_0) {
    return pm_0.data;
}
function _temp2(pm) {
    return hasProgressMessage(pm.data);
}
export function renderToolResultMessage(data, progressMessagesForMessage, { tools, verbose, theme, isTranscriptMode = false }) {
    // Remote-launched agents (ant-only) use a private output type not in the
    // public schema. Narrow via the internal discriminant.
    const internal = data;
    if (internal.status === 'remote_launched') {
        return _jsx(Box, { flexDirection: "column", children: _jsx(MessageResponse, { height: 1, children: _jsxs(Text, { children: ["Remote agent launched", ' ', _jsxs(Text, { dimColor: true, children: ["\u00B7 ", internal.taskId, " \u00B7 ", internal.sessionUrl] })] }) }) });
    }
    if (data.status === 'async_launched') {
        const { prompt } = data;
        return _jsxs(Box, { flexDirection: "column", children: [_jsx(MessageResponse, { height: 1, children: _jsxs(Text, { children: ["Backgrounded agent", !isTranscriptMode && _jsxs(Text, { dimColor: true, children: [' (', _jsxs(Byline, { children: [_jsx(KeyboardShortcutHint, { shortcut: "\u2193", action: "manage" }), prompt && _jsx(ConfigurableShortcutHint, { action: "app:toggleTranscript", context: "Global", fallback: "ctrl+o", description: "expand" })] }), ')'] })] }) }), isTranscriptMode && prompt && _jsx(MessageResponse, { children: _jsx(AgentPromptDisplay, { prompt: prompt, theme: theme }) })] });
    }
    if (data.status !== 'completed') {
        return null;
    }
    const { agentId, totalDurationMs, totalToolUseCount, totalTokens, usage, content, prompt } = data;
    const result = [totalToolUseCount === 1 ? '1 tool use' : `${totalToolUseCount} tool uses`, formatNumber(totalTokens) + ' tokens', formatDuration(totalDurationMs)];
    const completionMessage = `Done (${result.join(' · ')})`;
    const finalAssistantMessage = createAssistantMessage({
        content: completionMessage,
        usage: {
            ...usage,
            inference_geo: null,
            iterations: null,
            speed: null
        }
    });
    return _jsxs(Box, { flexDirection: "column", children: ["external" === 'ant' && _jsx(MessageResponse, { children: _jsxs(Text, { color: "warning", children: ["[ANT-ONLY] API calls: ", getDisplayPath(getDumpPromptsPath(agentId))] }) }), isTranscriptMode && prompt && _jsx(MessageResponse, { children: _jsx(AgentPromptDisplay, { prompt: prompt, theme: theme }) }), isTranscriptMode ? _jsx(SubAgentProvider, { children: _jsx(VerboseAgentTranscript, { progressMessages: progressMessagesForMessage, tools: tools, verbose: verbose }) }) : null, isTranscriptMode && content && content.length > 0 && _jsx(MessageResponse, { children: _jsx(AgentResponseDisplay, { content: content, theme: theme }) }), _jsx(MessageResponse, { height: 1, children: _jsx(MessageComponent, { message: finalAssistantMessage, lookups: EMPTY_LOOKUPS, addMargin: false, tools: tools, commands: [], verbose: verbose, inProgressToolUseIDs: new Set(), progressMessagesForMessage: [], shouldAnimate: false, shouldShowDot: false, isTranscriptMode: false, isStatic: true }) }), !isTranscriptMode && _jsxs(Text, { dimColor: true, children: ['  ', _jsx(CtrlOToExpand, {})] })] });
}
export function renderToolUseMessage({ description, prompt }) {
    if (!description || !prompt) {
        return null;
    }
    return description;
}
export function renderToolUseTag(input) {
    const tags = [];
    if (input.model) {
        const mainModel = getMainLoopModel();
        const agentModel = parseUserSpecifiedModel(input.model);
        if (agentModel !== mainModel) {
            tags.push(_jsx(Box, { flexWrap: "nowrap", marginLeft: 1, children: _jsx(Text, { dimColor: true, children: renderModelName(agentModel) }) }, "model"));
        }
    }
    if (tags.length === 0) {
        return null;
    }
    return _jsx(_Fragment, { children: tags });
}
const INITIALIZING_TEXT = 'Initializing…';
export function renderToolUseProgressMessage(progressMessages, { tools, verbose, terminalSize, inProgressToolCallCount, isTranscriptMode = false }) {
    if (!progressMessages.length) {
        return _jsx(MessageResponse, { height: 1, children: _jsx(Text, { dimColor: true, children: INITIALIZING_TEXT }) });
    }
    // Checks to see if we should show a super condensed progress message summary.
    // This prevents flickers when the terminal size is too small to render all the dynamic content
    const toolToolRenderLinesEstimate = (inProgressToolCallCount ?? 1) * ESTIMATED_LINES_PER_TOOL + TERMINAL_BUFFER_LINES;
    const shouldUseCondensedMode = !isTranscriptMode && terminalSize && terminalSize.rows && terminalSize.rows < toolToolRenderLinesEstimate;
    const getProgressStats = () => {
        const toolUseCount = count(progressMessages, msg => {
            if (!hasProgressMessage(msg.data)) {
                return false;
            }
            const message = msg.data.message;
            return message.message.content.some(content => content.type === 'tool_use');
        });
        const latestAssistant = progressMessages.findLast((msg) => hasProgressMessage(msg.data) && msg.data.message.type === 'assistant');
        let tokens = null;
        if (latestAssistant?.data.message.type === 'assistant') {
            const usage = latestAssistant.data.message.message.usage;
            tokens = (usage.cache_creation_input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0) + usage.input_tokens + usage.output_tokens;
        }
        return {
            toolUseCount,
            tokens
        };
    };
    if (shouldUseCondensedMode) {
        const { toolUseCount, tokens } = getProgressStats();
        return _jsx(MessageResponse, { height: 1, children: _jsxs(Text, { dimColor: true, children: ["In progress\u2026 \u00B7 ", _jsx(Text, { bold: true, children: toolUseCount }), " tool", ' ', toolUseCount === 1 ? 'use' : 'uses', tokens && ` · ${formatNumber(tokens)} tokens`, " \u00B7", ' ', _jsx(ConfigurableShortcutHint, { action: "app:toggleTranscript", context: "Global", fallback: "ctrl+o", description: "expand", parens: true })] }) });
    }
    // Process messages to group consecutive search/read operations into summaries (ants only)
    // isAgentRunning=true since this is the progress view while the agent is still running
    const processedMessages = processProgressMessages(progressMessages, tools, true);
    // For display, take the last few processed messages
    const displayedMessages = isTranscriptMode ? processedMessages : processedMessages.slice(-MAX_PROGRESS_MESSAGES_TO_SHOW);
    // Count hidden tool uses specifically (not all messages) to match the
    // final "Done (N tool uses)" count. Each tool use generates multiple
    // progress messages (tool_use + tool_result + text), so counting all
    // hidden messages inflates the number shown to the user.
    const hiddenMessages = isTranscriptMode ? [] : processedMessages.slice(0, Math.max(0, processedMessages.length - MAX_PROGRESS_MESSAGES_TO_SHOW));
    const hiddenToolUseCount = count(hiddenMessages, m => {
        if (m.type === 'summary') {
            return m.searchCount + m.readCount + m.replCount > 0;
        }
        const data = m.message.data;
        if (!hasProgressMessage(data)) {
            return false;
        }
        return data.message.message.content.some(content => content.type === 'tool_use');
    });
    const firstData = progressMessages[0]?.data;
    const prompt = firstData && hasProgressMessage(firstData) ? firstData.prompt : undefined;
    // After grouping, displayedMessages can be empty when the only progress so
    // far is an assistant tool_use for a search/read op (grouped but not yet
    // counted, since counts increment on tool_result). Fall back to the
    // initializing text so MessageResponse doesn't render a bare ⎿.
    if (displayedMessages.length === 0 && !(isTranscriptMode && prompt)) {
        return _jsx(MessageResponse, { height: 1, children: _jsx(Text, { dimColor: true, children: INITIALIZING_TEXT }) });
    }
    const { lookups: subagentLookups, inProgressToolUseIDs: collapsedInProgressIDs } = buildSubagentLookups(progressMessages.filter((pm) => hasProgressMessage(pm.data)).map(pm => pm.data));
    return _jsx(MessageResponse, { children: _jsxs(Box, { flexDirection: "column", children: [_jsxs(SubAgentProvider, { children: [isTranscriptMode && prompt && _jsx(Box, { marginBottom: 1, children: _jsx(AgentPromptDisplay, { prompt: prompt }) }), displayedMessages.map(processed => {
                            if (processed.type === 'summary') {
                                // Render summary for grouped search/read/REPL operations using shared formatting
                                const summaryText = getSearchReadSummaryText(processed.searchCount, processed.readCount, processed.isActive, processed.replCount);
                                return _jsx(Box, { height: 1, overflow: "hidden", children: _jsx(Text, { dimColor: true, children: summaryText }) }, processed.uuid);
                            }
                            // Render original message without height=1 wrapper so null
                            // content (tool not found, renderToolUseMessage returns null)
                            // doesn't leave a blank line. Tool call headers are single-line
                            // anyway so truncation isn't needed.
                            return _jsx(MessageComponent, { message: processed.message.data.message, lookups: subagentLookups, addMargin: false, tools: tools, commands: [], verbose: verbose, inProgressToolUseIDs: collapsedInProgressIDs, progressMessagesForMessage: [], shouldAnimate: false, shouldShowDot: false, style: "condensed", isTranscriptMode: false, isStatic: true }, processed.message.uuid);
                        })] }), hiddenToolUseCount > 0 && _jsxs(Text, { dimColor: true, children: ["+", hiddenToolUseCount, " more tool", ' ', hiddenToolUseCount === 1 ? 'use' : 'uses', " ", _jsx(CtrlOToExpand, {})] })] }) });
}
export function renderToolUseRejectedMessage(_input, { progressMessagesForMessage, tools, verbose, isTranscriptMode }) {
    // Get agentId from progress messages if available (agent was running before rejection)
    const firstData = progressMessagesForMessage[0]?.data;
    const agentId = firstData && hasProgressMessage(firstData) ? firstData.agentId : undefined;
    return _jsxs(_Fragment, { children: ["external" === 'ant' && agentId && _jsx(MessageResponse, { children: _jsxs(Text, { color: "warning", children: ["[ANT-ONLY] API calls: ", getDisplayPath(getDumpPromptsPath(agentId))] }) }), renderToolUseProgressMessage(progressMessagesForMessage, {
                tools,
                verbose,
                isTranscriptMode
            }), _jsx(FallbackToolUseRejectedMessage, {})] });
}
export function renderToolUseErrorMessage(result, { progressMessagesForMessage, tools, verbose, isTranscriptMode }) {
    return _jsxs(_Fragment, { children: [renderToolUseProgressMessage(progressMessagesForMessage, {
                tools,
                verbose,
                isTranscriptMode
            }), _jsx(FallbackToolUseErrorMessage, { result: result, verbose: verbose })] });
}
function calculateAgentStats(progressMessages) {
    const toolUseCount = count(progressMessages, msg => {
        if (!hasProgressMessage(msg.data)) {
            return false;
        }
        const message = msg.data.message;
        return message.type === 'user' && message.message.content.some(content => content.type === 'tool_result');
    });
    const latestAssistant = progressMessages.findLast((msg) => hasProgressMessage(msg.data) && msg.data.message.type === 'assistant');
    let tokens = null;
    if (latestAssistant?.data.message.type === 'assistant') {
        const usage = latestAssistant.data.message.message.usage;
        tokens = (usage.cache_creation_input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0) + usage.input_tokens + usage.output_tokens;
    }
    return {
        toolUseCount,
        tokens
    };
}
export function renderGroupedAgentToolUse(toolUses, options) {
    const { shouldAnimate, tools } = options;
    // Calculate stats for each agent
    const agentStats = toolUses.map(({ param, isResolved, isError, progressMessages, result }) => {
        const stats = calculateAgentStats(progressMessages);
        const lastToolInfo = extractLastToolInfo(progressMessages, tools);
        const parsedInput = inputSchema().safeParse(param.input);
        // teammate_spawned is not part of the exported Output type (cast through unknown
        // for dead code elimination), so check via string comparison on the raw value
        const isTeammateSpawn = result?.output?.status === 'teammate_spawned';
        // For teammate spawns, show @name with type in parens and description as status
        let agentType;
        let description;
        let color;
        let descriptionColor;
        let taskDescription;
        if (isTeammateSpawn && parsedInput.success && parsedInput.data.name) {
            agentType = `@${parsedInput.data.name}`;
            const subagentType = parsedInput.data.subagent_type;
            description = isCustomSubagentType(subagentType) ? subagentType : undefined;
            taskDescription = parsedInput.data.description;
            // Use the custom agent definition's color on the type, not the name
            descriptionColor = isCustomSubagentType(subagentType) ? getAgentColor(subagentType) : undefined;
        }
        else {
            agentType = parsedInput.success ? userFacingName(parsedInput.data) : 'Agent';
            description = parsedInput.success ? parsedInput.data.description : undefined;
            color = parsedInput.success ? userFacingNameBackgroundColor(parsedInput.data) : undefined;
            taskDescription = undefined;
        }
        // Check if this was launched as a background agent OR backgrounded mid-execution
        const launchedAsAsync = parsedInput.success && 'run_in_background' in parsedInput.data && parsedInput.data.run_in_background === true;
        const outputStatus = result?.output?.status;
        const backgroundedMidExecution = outputStatus === 'async_launched' || outputStatus === 'remote_launched';
        const isAsync = launchedAsAsync || backgroundedMidExecution || isTeammateSpawn;
        const name = parsedInput.success ? parsedInput.data.name : undefined;
        return {
            id: param.id,
            agentType,
            description,
            toolUseCount: stats.toolUseCount,
            tokens: stats.tokens,
            isResolved,
            isError,
            isAsync,
            color,
            descriptionColor,
            lastToolInfo,
            taskDescription,
            name
        };
    });
    const anyUnresolved = toolUses.some(t => !t.isResolved);
    const anyError = toolUses.some(t => t.isError);
    const allComplete = !anyUnresolved;
    // Check if all agents are the same type
    const allSameType = agentStats.length > 0 && agentStats.every(stat => stat.agentType === agentStats[0]?.agentType);
    const commonType = allSameType && agentStats[0]?.agentType !== 'Agent' ? agentStats[0]?.agentType : null;
    // Check if all resolved agents are async (background)
    const allAsync = agentStats.every(stat => stat.isAsync);
    return _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsxs(Box, { flexDirection: "row", children: [_jsx(ToolUseLoader, { shouldAnimate: shouldAnimate && anyUnresolved, isUnresolved: anyUnresolved, isError: anyError }), _jsxs(Text, { children: [allComplete ? allAsync ? _jsxs(_Fragment, { children: [_jsx(Text, { bold: true, children: toolUses.length }), " background agents launched", ' ', _jsx(Text, { dimColor: true, children: _jsx(KeyboardShortcutHint, { shortcut: "\u2193", action: "manage", parens: true }) })] }) : _jsxs(_Fragment, { children: [_jsx(Text, { bold: true, children: toolUses.length }), ' ', commonType ? `${commonType} agents` : 'agents', " finished"] }) : _jsxs(_Fragment, { children: ["Running ", _jsx(Text, { bold: true, children: toolUses.length }), ' ', commonType ? `${commonType} agents` : 'agents', "\u2026"] }), ' '] }), !allAsync && _jsx(CtrlOToExpand, {})] }), agentStats.map((stat, index) => _jsx(AgentProgressLine, { agentType: stat.agentType, description: stat.description, descriptionColor: stat.descriptionColor, taskDescription: stat.taskDescription, toolUseCount: stat.toolUseCount, tokens: stat.tokens, color: stat.color, isLast: index === agentStats.length - 1, isResolved: stat.isResolved, isError: stat.isError, isAsync: stat.isAsync, shouldAnimate: shouldAnimate, lastToolInfo: stat.lastToolInfo, hideType: allSameType, name: stat.name }, stat.id))] });
}
export function userFacingName(input) {
    if (input?.subagent_type && input.subagent_type !== GENERAL_PURPOSE_AGENT.agentType) {
        // Display "worker" agents as "Agent" for cleaner UI
        if (input.subagent_type === 'worker') {
            return 'Agent';
        }
        return input.subagent_type;
    }
    return 'Agent';
}
export function userFacingNameBackgroundColor(input) {
    if (!input?.subagent_type) {
        return undefined;
    }
    // Get the color for this agent
    return getAgentColor(input.subagent_type);
}
export function extractLastToolInfo(progressMessages, tools) {
    // Build tool_use lookup from all progress messages (needed for reverse iteration)
    const toolUseByID = new Map();
    for (const pm of progressMessages) {
        if (!hasProgressMessage(pm.data)) {
            continue;
        }
        if (pm.data.message.type === 'assistant') {
            for (const c of pm.data.message.message.content) {
                if (c.type === 'tool_use') {
                    toolUseByID.set(c.id, c);
                }
            }
        }
    }
    // Count trailing consecutive search/read operations from the end
    let searchCount = 0;
    let readCount = 0;
    for (let i = progressMessages.length - 1; i >= 0; i--) {
        const msg = progressMessages[i];
        if (!hasProgressMessage(msg.data)) {
            continue;
        }
        const info = getSearchOrReadInfo(msg, tools, toolUseByID);
        if (info && (info.isSearch || info.isRead)) {
            // Only count tool_result messages to avoid double counting
            if (msg.data.message.type === 'user') {
                if (info.isSearch) {
                    searchCount++;
                }
                else if (info.isRead) {
                    readCount++;
                }
            }
        }
        else {
            break;
        }
    }
    if (searchCount + readCount >= 2) {
        return getSearchReadSummaryText(searchCount, readCount, true);
    }
    // Find the last tool_result message
    const lastToolResult = progressMessages.findLast((msg) => {
        if (!hasProgressMessage(msg.data)) {
            return false;
        }
        const message = msg.data.message;
        return message.type === 'user' && message.message.content.some(c => c.type === 'tool_result');
    });
    if (lastToolResult?.data.message.type === 'user') {
        const toolResultBlock = lastToolResult.data.message.message.content.find(c => c.type === 'tool_result');
        if (toolResultBlock?.type === 'tool_result') {
            // Look up the corresponding tool_use — already indexed above
            const toolUseBlock = toolUseByID.get(toolResultBlock.tool_use_id);
            if (toolUseBlock) {
                const tool = findToolByName(tools, toolUseBlock.name);
                if (!tool) {
                    return toolUseBlock.name; // Fallback to raw name
                }
                const input = toolUseBlock.input;
                const parsedInput = tool.inputSchema.safeParse(input);
                // Get user-facing tool name
                const userFacingToolName = tool.userFacingName(parsedInput.success ? parsedInput.data : undefined);
                // Try to get summary from the tool itself
                if (tool.getToolUseSummary) {
                    const summary = tool.getToolUseSummary(parsedInput.success ? parsedInput.data : undefined);
                    if (summary) {
                        return `${userFacingToolName}: ${summary}`;
                    }
                }
                // Default: just show user-facing tool name
                return userFacingToolName;
            }
        }
    }
    return null;
}
function isCustomSubagentType(subagentType) {
    return !!subagentType && subagentType !== GENERAL_PURPOSE_AGENT.agentType && subagentType !== 'worker';
}
