import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import { feature } from 'bun:bundle';
import { basename } from 'path';
import React, { useRef } from 'react';
import { useMinDisplayTime } from '../../hooks/useMinDisplayTime.js';
import { Ansi, Box, Text, useTheme } from '../../ink.js';
import { findToolByName } from '../../Tool.js';
import { getReplPrimitiveTools } from '../../tools/REPLTool/primitiveTools.js';
import { uniq } from '../../utils/array.js';
import { getToolUseIdsFromCollapsedGroup } from '../../utils/collapseReadSearch.js';
import { getDisplayPath } from '../../utils/file.js';
import { formatDuration, formatSecondsShort } from '../../utils/format.js';
import { isFullscreenEnvEnabled } from '../../utils/fullscreen.js';
import { CtrlOToExpand } from '../CtrlOToExpand.js';
import { useSelectedMessageBg } from '../messageActions.js';
import { PrBadge } from '../PrBadge.js';
import { ToolUseLoader } from '../ToolUseLoader.js';
/* eslint-disable @typescript-eslint/no-require-imports */
const teamMemCollapsed = feature('TEAMMEM') ? require('./teamMemCollapsed.js') : null;
/* eslint-enable @typescript-eslint/no-require-imports */
// Hold each ⤿ hint for a minimum duration so fast-completing tool calls
// (bash commands, file reads, search patterns) are actually readable instead
// of flickering past in a single frame.
const MIN_HINT_DISPLAY_MS = 700;
/** Render a single tool use in verbose mode */
function VerboseToolUse(t0) {
    const $ = _c(24);
    const { content, tools, lookups, inProgressToolUseIDs, shouldAnimate, theme } = t0;
    const bg = useSelectedMessageBg();
    let t1;
    let t2;
    if ($[0] !== bg || $[1] !== content.id || $[2] !== content.input || $[3] !== content.name || $[4] !== inProgressToolUseIDs || $[5] !== lookups || $[6] !== shouldAnimate || $[7] !== theme || $[8] !== tools) {
        t2 = Symbol.for("react.early_return_sentinel");
        bb0: {
            const tool = findToolByName(tools, content.name) ?? findToolByName(getReplPrimitiveTools(), content.name);
            if (!tool) {
                t2 = null;
                break bb0;
            }
            let t3;
            if ($[11] !== content.id || $[12] !== lookups.resolvedToolUseIDs) {
                t3 = lookups.resolvedToolUseIDs.has(content.id);
                $[11] = content.id;
                $[12] = lookups.resolvedToolUseIDs;
                $[13] = t3;
            }
            else {
                t3 = $[13];
            }
            const isResolved = t3;
            let t4;
            if ($[14] !== content.id || $[15] !== lookups.erroredToolUseIDs) {
                t4 = lookups.erroredToolUseIDs.has(content.id);
                $[14] = content.id;
                $[15] = lookups.erroredToolUseIDs;
                $[16] = t4;
            }
            else {
                t4 = $[16];
            }
            const isError = t4;
            let t5;
            if ($[17] !== content.id || $[18] !== inProgressToolUseIDs) {
                t5 = inProgressToolUseIDs.has(content.id);
                $[17] = content.id;
                $[18] = inProgressToolUseIDs;
                $[19] = t5;
            }
            else {
                t5 = $[19];
            }
            const isInProgress = t5;
            const resultMsg = lookups.toolResultByToolUseID.get(content.id);
            const rawToolResult = resultMsg?.type === "user" ? resultMsg.toolUseResult : undefined;
            const parsedOutput = tool.outputSchema?.safeParse(rawToolResult);
            const toolResult = parsedOutput?.success ? parsedOutput.data : undefined;
            const parsedInput = tool.inputSchema.safeParse(content.input);
            const input = parsedInput.success ? parsedInput.data : undefined;
            const userFacingName = tool.userFacingName(input);
            const toolUseMessage = input ? tool.renderToolUseMessage(input, {
                theme,
                verbose: true
            }) : null;
            const t6 = shouldAnimate && isInProgress;
            const t7 = !isResolved;
            let t8;
            if ($[20] !== isError || $[21] !== t6 || $[22] !== t7) {
                t8 = _jsx(ToolUseLoader, { shouldAnimate: t6, isUnresolved: t7, isError: isError });
                $[20] = isError;
                $[21] = t6;
                $[22] = t7;
                $[23] = t8;
            }
            else {
                t8 = $[23];
            }
            t1 = _jsxs(Box, { flexDirection: "column", marginTop: 1, backgroundColor: bg, children: [_jsxs(Box, { flexDirection: "row", children: [t8, _jsxs(Text, { children: [_jsx(Text, { bold: true, children: userFacingName }), toolUseMessage && _jsxs(Text, { children: ["(", toolUseMessage, ")"] })] }), input && tool.renderToolUseTag?.(input)] }), isResolved && !isError && toolResult !== undefined && _jsx(Box, { children: tool.renderToolResultMessage?.(toolResult, [], {
                            verbose: true,
                            tools,
                            theme
                        }) })] }, content.id);
        }
        $[0] = bg;
        $[1] = content.id;
        $[2] = content.input;
        $[3] = content.name;
        $[4] = inProgressToolUseIDs;
        $[5] = lookups;
        $[6] = shouldAnimate;
        $[7] = theme;
        $[8] = tools;
        $[9] = t1;
        $[10] = t2;
    }
    else {
        t1 = $[9];
        t2 = $[10];
    }
    if (t2 !== Symbol.for("react.early_return_sentinel")) {
        return t2;
    }
    return t1;
}
export function CollapsedReadSearchContent({ message, inProgressToolUseIDs, shouldAnimate, verbose, tools, lookups, isActiveGroup }) {
    const bg = useSelectedMessageBg();
    const { searchCount: rawSearchCount, readCount: rawReadCount, listCount: rawListCount, replCount, memorySearchCount, memoryReadCount, memoryWriteCount, messages: groupMessages } = message;
    const [theme] = useTheme();
    const toolUseIds = getToolUseIdsFromCollapsedGroup(message);
    const anyError = toolUseIds.some(id => lookups.erroredToolUseIDs.has(id));
    const hasMemoryOps = memorySearchCount > 0 || memoryReadCount > 0 || memoryWriteCount > 0;
    const hasTeamMemoryOps = feature('TEAMMEM') ? teamMemCollapsed.checkHasTeamMemOps(message) : false;
    // Track the max seen counts so they only ever increase. The debounce timer
    // causes extra re-renders at arbitrary times; during a brief "invisible window"
    // in the streaming executor the group count can dip, which causes jitter.
    const maxReadCountRef = useRef(0);
    const maxSearchCountRef = useRef(0);
    const maxListCountRef = useRef(0);
    const maxMcpCountRef = useRef(0);
    const maxBashCountRef = useRef(0);
    maxReadCountRef.current = Math.max(maxReadCountRef.current, rawReadCount);
    maxSearchCountRef.current = Math.max(maxSearchCountRef.current, rawSearchCount);
    maxListCountRef.current = Math.max(maxListCountRef.current, rawListCount);
    maxMcpCountRef.current = Math.max(maxMcpCountRef.current, message.mcpCallCount ?? 0);
    maxBashCountRef.current = Math.max(maxBashCountRef.current, message.bashCount ?? 0);
    const readCount = maxReadCountRef.current;
    const searchCount = maxSearchCountRef.current;
    const listCount = maxListCountRef.current;
    const mcpCallCount = maxMcpCountRef.current;
    // Subtract commands surfaced as "Committed …" / "Created PR …" so the
    // same command isn't counted twice. gitOpBashCount is read live (no max-ref
    // needed — it's 0 until results arrive, then only grows).
    const gitOpBashCount = message.gitOpBashCount ?? 0;
    const bashCount = isFullscreenEnvEnabled() ? Math.max(0, maxBashCountRef.current - gitOpBashCount) : 0;
    const hasNonMemoryOps = searchCount > 0 || readCount > 0 || listCount > 0 || replCount > 0 || mcpCallCount > 0 || bashCount > 0 || gitOpBashCount > 0;
    const readPaths = message.readFilePaths;
    const searchArgs = message.searchArgs;
    let incomingHint = message.latestDisplayHint;
    if (incomingHint === undefined) {
        const lastSearchRaw = searchArgs?.at(-1);
        const lastSearch = lastSearchRaw !== undefined ? `"${lastSearchRaw}"` : undefined;
        const lastRead = readPaths?.at(-1);
        incomingHint = lastRead !== undefined ? getDisplayPath(lastRead) : lastSearch;
    }
    // Active REPL calls emit repl_tool_call progress with the current inner
    // tool's name+input. Virtual messages don't arrive until REPL completes,
    // so this is the only source of a live hint during execution.
    if (isActiveGroup) {
        for (const id_0 of toolUseIds) {
            if (!inProgressToolUseIDs.has(id_0))
                continue;
            const latest = lookups.progressMessagesByToolUseID.get(id_0)?.at(-1)?.data;
            if (latest?.type === 'repl_tool_call' && latest.phase === 'start') {
                const input = latest.toolInput;
                incomingHint = input.file_path ?? (input.pattern ? `"${input.pattern}"` : undefined) ?? input.command ?? latest.toolName;
            }
        }
    }
    const displayedHint = useMinDisplayTime(incomingHint, MIN_HINT_DISPLAY_MS);
    // In verbose mode, render each tool use with its 1-line result summary
    if (verbose) {
        const toolUses = [];
        for (const msg of groupMessages) {
            if (msg.type === 'assistant') {
                toolUses.push(msg);
            }
            else if (msg.type === 'grouped_tool_use') {
                toolUses.push(...msg.messages);
            }
        }
        return _jsxs(Box, { flexDirection: "column", children: [toolUses.map(msg_0 => {
                    const content = msg_0.message.content[0];
                    if (content?.type !== 'tool_use')
                        return null;
                    return _jsx(VerboseToolUse, { content: content, tools: tools, lookups: lookups, inProgressToolUseIDs: inProgressToolUseIDs, shouldAnimate: shouldAnimate, theme: theme }, content.id);
                }), message.hookInfos && message.hookInfos.length > 0 && _jsxs(_Fragment, { children: [_jsxs(Text, { dimColor: true, children: ['  ⎿  ', "Ran ", message.hookCount, " PreToolUse", ' ', message.hookCount === 1 ? 'hook' : 'hooks', " (", formatSecondsShort(message.hookTotalMs ?? 0), ")"] }), message.hookInfos.map((info, idx) => _jsxs(Text, { dimColor: true, children: ['     ⎿ ', info.command, " (", formatSecondsShort(info.durationMs ?? 0), ")"] }, `hook-${idx}`))] }), message.relevantMemories?.map(m => _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsxs(Text, { dimColor: true, children: ['  ⎿  ', "Recalled ", basename(m.path)] }), _jsx(Box, { paddingLeft: 5, children: _jsx(Text, { children: _jsx(Ansi, { children: m.content }) }) })] }, m.path))] });
    }
    // Non-verbose mode: Show counts with blinking grey dot while active, green dot when finalized
    // Use present tense when active, past tense when finalized
    // Defensive: If all counts are 0, don't render the collapsed group
    // This shouldn't happen in normal operation, but handles edge cases
    if (!hasMemoryOps && !hasTeamMemoryOps && !hasNonMemoryOps) {
        return null;
    }
    // Find the slowest in-progress shell command in this group. BashTool yields
    // progress every second but the collapsed renderer never showed it — long
    // commands (npm install, tests) looked frozen. Shown after 2s so fast
    // commands stay clean; the ticking counter reassures that slow ones aren't stuck.
    let shellProgressSuffix = '';
    if (isFullscreenEnvEnabled() && isActiveGroup) {
        let elapsed;
        let lines = 0;
        for (const id_1 of toolUseIds) {
            if (!inProgressToolUseIDs.has(id_1))
                continue;
            const data = lookups.progressMessagesByToolUseID.get(id_1)?.at(-1)?.data;
            if (data?.type !== 'bash_progress' && data?.type !== 'powershell_progress') {
                continue;
            }
            if (elapsed === undefined || data.elapsedTimeSeconds > elapsed) {
                elapsed = data.elapsedTimeSeconds;
                lines = data.totalLines;
            }
        }
        if (elapsed !== undefined && elapsed >= 2) {
            const time = formatDuration(elapsed * 1000);
            shellProgressSuffix = lines > 0 ? ` (${time} · ${lines} ${lines === 1 ? 'line' : 'lines'})` : ` (${time})`;
        }
    }
    // Build non-memory parts first (search, read, repl, mcp, bash) — these render
    // before memory so the line reads "Ran 3 bash commands, recalled 1 memory".
    const nonMemParts = [];
    // Git operations lead the line — they're the load-bearing outcome.
    function pushPart(key, verb, body) {
        const isFirst = nonMemParts.length === 0;
        if (!isFirst)
            nonMemParts.push(_jsx(Text, { children: ", " }, `comma-${key}`));
        nonMemParts.push(_jsxs(Text, { children: [isFirst ? verb[0].toUpperCase() + verb.slice(1) : verb, " ", body] }, key));
    }
    if (isFullscreenEnvEnabled() && message.commits?.length) {
        const byKind = {
            committed: 'committed',
            amended: 'amended commit',
            'cherry-picked': 'cherry-picked'
        };
        for (const kind of ['committed', 'amended', 'cherry-picked']) {
            const shas = message.commits.filter(c => c.kind === kind).map(c_0 => c_0.sha);
            if (shas.length) {
                pushPart(kind, byKind[kind], _jsx(Text, { bold: true, children: shas.join(', ') }));
            }
        }
    }
    if (isFullscreenEnvEnabled() && message.pushes?.length) {
        const branches = uniq(message.pushes.map(p => p.branch));
        pushPart('push', 'pushed to', _jsx(Text, { bold: true, children: branches.join(', ') }));
    }
    if (isFullscreenEnvEnabled() && message.branches?.length) {
        const byAction = {
            merged: 'merged',
            rebased: 'rebased onto'
        };
        for (const b of message.branches) {
            pushPart(`br-${b.action}-${b.ref}`, byAction[b.action], _jsx(Text, { bold: true, children: b.ref }));
        }
    }
    if (isFullscreenEnvEnabled() && message.prs?.length) {
        const verbs = {
            created: 'created',
            edited: 'edited',
            merged: 'merged',
            commented: 'commented on',
            closed: 'closed',
            ready: 'marked ready'
        };
        for (const pr of message.prs) {
            pushPart(`pr-${pr.action}-${pr.number}`, verbs[pr.action], pr.url ? _jsx(PrBadge, { number: pr.number, url: pr.url, bold: true }) : _jsxs(Text, { bold: true, children: ["PR #", pr.number] }));
        }
    }
    if (searchCount > 0) {
        const isFirst_0 = nonMemParts.length === 0;
        const searchVerb = isActiveGroup ? isFirst_0 ? 'Searching for' : 'searching for' : isFirst_0 ? 'Searched for' : 'searched for';
        if (!isFirst_0) {
            nonMemParts.push(_jsx(Text, { children: ", " }, "comma-s"));
        }
        nonMemParts.push(_jsxs(Text, { children: [searchVerb, " ", _jsx(Text, { bold: true, children: searchCount }), ' ', searchCount === 1 ? 'pattern' : 'patterns'] }, "search"));
    }
    if (readCount > 0) {
        const isFirst_1 = nonMemParts.length === 0;
        const readVerb = isActiveGroup ? isFirst_1 ? 'Reading' : 'reading' : isFirst_1 ? 'Read' : 'read';
        if (!isFirst_1) {
            nonMemParts.push(_jsx(Text, { children: ", " }, "comma-r"));
        }
        nonMemParts.push(_jsxs(Text, { children: [readVerb, " ", _jsx(Text, { bold: true, children: readCount }), ' ', readCount === 1 ? 'file' : 'files'] }, "read"));
    }
    if (listCount > 0) {
        const isFirst_2 = nonMemParts.length === 0;
        const listVerb = isActiveGroup ? isFirst_2 ? 'Listing' : 'listing' : isFirst_2 ? 'Listed' : 'listed';
        if (!isFirst_2) {
            nonMemParts.push(_jsx(Text, { children: ", " }, "comma-l"));
        }
        nonMemParts.push(_jsxs(Text, { children: [listVerb, " ", _jsx(Text, { bold: true, children: listCount }), ' ', listCount === 1 ? 'directory' : 'directories'] }, "list"));
    }
    if (replCount > 0) {
        const replVerb = isActiveGroup ? "REPL'ing" : "REPL'd";
        if (nonMemParts.length > 0) {
            nonMemParts.push(_jsx(Text, { children: ", " }, "comma-repl"));
        }
        nonMemParts.push(_jsxs(Text, { children: [replVerb, " ", _jsx(Text, { bold: true, children: replCount }), ' ', replCount === 1 ? 'time' : 'times'] }, "repl"));
    }
    if (mcpCallCount > 0) {
        const serverLabel = message.mcpServerNames?.map(n => n.replace(/^claude\.ai /, '')).join(', ') || 'MCP';
        const isFirst_3 = nonMemParts.length === 0;
        const verb_0 = isActiveGroup ? isFirst_3 ? 'Querying' : 'querying' : isFirst_3 ? 'Queried' : 'queried';
        if (!isFirst_3) {
            nonMemParts.push(_jsx(Text, { children: ", " }, "comma-mcp"));
        }
        nonMemParts.push(_jsxs(Text, { children: [verb_0, " ", serverLabel, mcpCallCount > 1 && _jsxs(_Fragment, { children: [' ', _jsx(Text, { bold: true, children: mcpCallCount }), " times"] })] }, "mcp"));
    }
    if (isFullscreenEnvEnabled() && bashCount > 0) {
        const isFirst_4 = nonMemParts.length === 0;
        const verb_1 = isActiveGroup ? isFirst_4 ? 'Running' : 'running' : isFirst_4 ? 'Ran' : 'ran';
        if (!isFirst_4) {
            nonMemParts.push(_jsx(Text, { children: ", " }, "comma-bash"));
        }
        nonMemParts.push(_jsxs(Text, { children: [verb_1, " ", _jsx(Text, { bold: true, children: bashCount }), " bash", ' ', bashCount === 1 ? 'command' : 'commands'] }, "bash"));
    }
    // Build memory parts (auto-memory) — rendered after nonMemParts
    const hasPrecedingNonMem = nonMemParts.length > 0;
    const memParts = [];
    if (memoryReadCount > 0) {
        const isFirst_5 = !hasPrecedingNonMem && memParts.length === 0;
        const verb_2 = isActiveGroup ? isFirst_5 ? 'Recalling' : 'recalling' : isFirst_5 ? 'Recalled' : 'recalled';
        if (!isFirst_5) {
            memParts.push(_jsx(Text, { children: ", " }, "comma-mr"));
        }
        memParts.push(_jsxs(Text, { children: [verb_2, " ", _jsx(Text, { bold: true, children: memoryReadCount }), ' ', memoryReadCount === 1 ? 'memory' : 'memories'] }, "mem-read"));
    }
    if (memorySearchCount > 0) {
        const isFirst_6 = !hasPrecedingNonMem && memParts.length === 0;
        const verb_3 = isActiveGroup ? isFirst_6 ? 'Searching' : 'searching' : isFirst_6 ? 'Searched' : 'searched';
        if (!isFirst_6) {
            memParts.push(_jsx(Text, { children: ", " }, "comma-ms"));
        }
        memParts.push(_jsx(Text, { children: `${verb_3} memories` }, "mem-search"));
    }
    if (memoryWriteCount > 0) {
        const isFirst_7 = !hasPrecedingNonMem && memParts.length === 0;
        const verb_4 = isActiveGroup ? isFirst_7 ? 'Writing' : 'writing' : isFirst_7 ? 'Wrote' : 'wrote';
        if (!isFirst_7) {
            memParts.push(_jsx(Text, { children: ", " }, "comma-mw"));
        }
        memParts.push(_jsxs(Text, { children: [verb_4, " ", _jsx(Text, { bold: true, children: memoryWriteCount }), ' ', memoryWriteCount === 1 ? 'memory' : 'memories'] }, "mem-write"));
    }
    return _jsxs(Box, { flexDirection: "column", marginTop: 1, backgroundColor: bg, children: [_jsxs(Box, { flexDirection: "row", children: [isActiveGroup ? _jsx(ToolUseLoader, { shouldAnimate: true, isUnresolved: true, isError: anyError }) : _jsx(Box, { minWidth: 2 }), _jsxs(Text, { dimColor: !isActiveGroup, children: [nonMemParts, memParts, feature('TEAMMEM') ? teamMemCollapsed.TeamMemCountParts({
                                message,
                                isActiveGroup,
                                hasPrecedingParts: hasPrecedingNonMem || memParts.length > 0
                            }) : null, isActiveGroup && _jsx(Text, { children: "\u2026" }, "ellipsis"), " ", _jsx(CtrlOToExpand, {})] })] }), isActiveGroup && displayedHint !== undefined &&
                _jsxs(Box, { flexDirection: "row", children: [_jsx(Box, { width: 5, flexShrink: 0, children: _jsx(Text, { dimColor: true, children: '  ⎿  ' }) }), _jsx(Box, { flexDirection: "column", flexGrow: 1, children: displayedHint.split('\n').map((line, i, arr) => _jsxs(Text, { dimColor: true, children: [line, i === arr.length - 1 && shellProgressSuffix] }, `hint-${i}`)) })] }), message.hookTotalMs !== undefined && message.hookTotalMs > 0 && _jsxs(Text, { dimColor: true, children: ['  ⎿  ', "Ran ", message.hookCount, " PreToolUse", ' ', message.hookCount === 1 ? 'hook' : 'hooks', " (", formatSecondsShort(message.hookTotalMs), ")"] })] });
}
