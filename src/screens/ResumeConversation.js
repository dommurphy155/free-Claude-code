import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import { feature } from 'bun:bundle';
import { dirname } from 'path';
import React from 'react';
import { useTerminalSize } from 'src/hooks/useTerminalSize.js';
import { getOriginalCwd, switchSession } from '../bootstrap/state.js';
import { LogSelector } from '../components/LogSelector.js';
import { Spinner } from '../components/Spinner.js';
import { restoreCostStateForSession } from '../cost-tracker.js';
import { setClipboard } from '../ink/termio/osc.js';
import { Box, Text } from '../ink.js';
import { useKeybinding } from '../keybindings/useKeybinding.js';
import { logEvent } from '../services/analytics/index.js';
import { useAppState, useSetAppState } from '../state/AppState.js';
import { asSessionId } from '../types/ids.js';
import { agenticSessionSearch } from '../utils/agenticSessionSearch.js';
import { renameRecordingForSession } from '../utils/asciicast.js';
import { updateSessionName } from '../utils/concurrentSessions.js';
import { loadConversationForResume } from '../utils/conversationRecovery.js';
import { checkCrossProjectResume } from '../utils/crossProjectResume.js';
import { logError } from '../utils/log.js';
import { createSystemMessage } from '../utils/messages.js';
import { computeStandaloneAgentContext, restoreAgentFromSession, restoreWorktreeForResume } from '../utils/sessionRestore.js';
import { adoptResumedSessionFile, enrichLogs, isCustomTitleEnabled, loadAllProjectsMessageLogsProgressive, loadSameRepoMessageLogsProgressive, recordContentReplacement, resetSessionFilePointer, restoreSessionMetadata } from '../utils/sessionStorage.js';
import { REPL } from './REPL.js';
function parsePrIdentifier(value) {
    const directNumber = parseInt(value, 10);
    if (!isNaN(directNumber) && directNumber > 0) {
        return directNumber;
    }
    const urlMatch = value.match(/github\.com\/[^/]+\/[^/]+\/pull\/(\d+)/);
    if (urlMatch?.[1]) {
        return parseInt(urlMatch[1], 10);
    }
    return null;
}
export function ResumeConversation({ commands, worktreePaths, initialTools, mcpClients, dynamicMcpConfig, debug, mainThreadAgentDefinition, autoConnectIdeFlag, strictMcpConfig = false, systemPrompt, appendSystemPrompt, initialSearchQuery, disableSlashCommands = false, forkSession, taskListId, filterByPr, thinkingConfig, onTurnComplete }) {
    const { rows } = useTerminalSize();
    const agentDefinitions = useAppState(s => s.agentDefinitions);
    const setAppState = useSetAppState();
    const [logs, setLogs] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [resuming, setResuming] = React.useState(false);
    const [showAllProjects, setShowAllProjects] = React.useState(false);
    const [resumeData, setResumeData] = React.useState(null);
    const [crossProjectCommand, setCrossProjectCommand] = React.useState(null);
    const sessionLogResultRef = React.useRef(null);
    // Mirror of logs.length so loadMoreLogs can compute value indices outside
    // the setLogs updater (keeping it pure per React's contract).
    const logCountRef = React.useRef(0);
    const filteredLogs = React.useMemo(() => {
        let result = logs.filter(l => !l.isSidechain);
        if (filterByPr !== undefined) {
            if (filterByPr === true) {
                result = result.filter(l_0 => l_0.prNumber !== undefined);
            }
            else if (typeof filterByPr === 'number') {
                result = result.filter(l_1 => l_1.prNumber === filterByPr);
            }
            else if (typeof filterByPr === 'string') {
                const prNumber = parsePrIdentifier(filterByPr);
                if (prNumber !== null) {
                    result = result.filter(l_2 => l_2.prNumber === prNumber);
                }
            }
        }
        return result;
    }, [logs, filterByPr]);
    const isResumeWithRenameEnabled = isCustomTitleEnabled();
    React.useEffect(() => {
        loadSameRepoMessageLogsProgressive(worktreePaths).then(result_0 => {
            sessionLogResultRef.current = result_0;
            logCountRef.current = result_0.logs.length;
            setLogs(result_0.logs);
            setLoading(false);
        }).catch(error => {
            logError(error);
            setLoading(false);
        });
    }, [worktreePaths]);
    const loadMoreLogs = React.useCallback((count) => {
        const ref = sessionLogResultRef.current;
        if (!ref || ref.nextIndex >= ref.allStatLogs.length)
            return;
        void enrichLogs(ref.allStatLogs, ref.nextIndex, count).then(result_1 => {
            ref.nextIndex = result_1.nextIndex;
            if (result_1.logs.length > 0) {
                // enrichLogs returns fresh unshared objects — safe to mutate in place.
                // Offset comes from logCountRef so the setLogs updater stays pure.
                const offset = logCountRef.current;
                result_1.logs.forEach((log, i) => {
                    log.value = offset + i;
                });
                setLogs(prev => prev.concat(result_1.logs));
                logCountRef.current += result_1.logs.length;
            }
            else if (ref.nextIndex < ref.allStatLogs.length) {
                loadMoreLogs(count);
            }
        });
    }, []);
    const loadLogs = React.useCallback((allProjects) => {
        setLoading(true);
        const promise = allProjects ? loadAllProjectsMessageLogsProgressive() : loadSameRepoMessageLogsProgressive(worktreePaths);
        promise.then(result_2 => {
            sessionLogResultRef.current = result_2;
            logCountRef.current = result_2.logs.length;
            setLogs(result_2.logs);
        }).catch(error_0 => {
            logError(error_0);
        }).finally(() => {
            setLoading(false);
        });
    }, [worktreePaths]);
    const handleToggleAllProjects = React.useCallback(() => {
        const newValue = !showAllProjects;
        setShowAllProjects(newValue);
        loadLogs(newValue);
    }, [showAllProjects, loadLogs]);
    function onCancel() {
        // eslint-disable-next-line custom-rules/no-process-exit
        process.exit(1);
    }
    async function onSelect(log_0) {
        setResuming(true);
        const resumeStart = performance.now();
        const crossProjectCheck = checkCrossProjectResume(log_0, showAllProjects, worktreePaths);
        if (crossProjectCheck.isCrossProject) {
            if (!crossProjectCheck.isSameRepoWorktree) {
                const raw = await setClipboard(crossProjectCheck.command);
                if (raw)
                    process.stdout.write(raw);
                setCrossProjectCommand(crossProjectCheck.command);
                return;
            }
        }
        try {
            const result_3 = await loadConversationForResume(log_0, undefined);
            if (!result_3) {
                throw new Error('Failed to load conversation');
            }
            if (feature('COORDINATOR_MODE')) {
                /* eslint-disable @typescript-eslint/no-require-imports */
                const coordinatorModule = require('../coordinator/coordinatorMode.js');
                /* eslint-enable @typescript-eslint/no-require-imports */
                const warning = coordinatorModule.matchSessionMode(result_3.mode);
                if (warning) {
                    /* eslint-disable @typescript-eslint/no-require-imports */
                    const { getAgentDefinitionsWithOverrides, getActiveAgentsFromList } = require('../tools/AgentTool/loadAgentsDir.js');
                    /* eslint-enable @typescript-eslint/no-require-imports */
                    getAgentDefinitionsWithOverrides.cache.clear?.();
                    const freshAgentDefs = await getAgentDefinitionsWithOverrides(getOriginalCwd());
                    setAppState(prev_0 => ({
                        ...prev_0,
                        agentDefinitions: {
                            ...freshAgentDefs,
                            allAgents: freshAgentDefs.allAgents,
                            activeAgents: getActiveAgentsFromList(freshAgentDefs.allAgents)
                        }
                    }));
                    result_3.messages.push(createSystemMessage(warning, 'warning'));
                }
            }
            if (result_3.sessionId && !forkSession) {
                switchSession(asSessionId(result_3.sessionId), log_0.fullPath ? dirname(log_0.fullPath) : null);
                await renameRecordingForSession();
                await resetSessionFilePointer();
                restoreCostStateForSession(result_3.sessionId);
            }
            else if (forkSession && result_3.contentReplacements?.length) {
                await recordContentReplacement(result_3.contentReplacements);
            }
            const { agentDefinition: resolvedAgentDef } = restoreAgentFromSession(result_3.agentSetting, mainThreadAgentDefinition, agentDefinitions);
            setAppState(prev_1 => ({
                ...prev_1,
                agent: resolvedAgentDef?.agentType
            }));
            if (feature('COORDINATOR_MODE')) {
                /* eslint-disable @typescript-eslint/no-require-imports */
                const { saveMode } = require('../utils/sessionStorage.js');
                const { isCoordinatorMode } = require('../coordinator/coordinatorMode.js');
                /* eslint-enable @typescript-eslint/no-require-imports */
                saveMode(isCoordinatorMode() ? 'coordinator' : 'normal');
            }
            const standaloneAgentContext = computeStandaloneAgentContext(result_3.agentName, result_3.agentColor);
            if (standaloneAgentContext) {
                setAppState(prev_2 => ({
                    ...prev_2,
                    standaloneAgentContext
                }));
            }
            void updateSessionName(result_3.agentName);
            restoreSessionMetadata(forkSession ? {
                ...result_3,
                worktreeSession: undefined
            } : result_3);
            if (!forkSession) {
                restoreWorktreeForResume(result_3.worktreeSession);
                if (result_3.sessionId) {
                    adoptResumedSessionFile();
                }
            }
            if (feature('CONTEXT_COLLAPSE')) {
                /* eslint-disable @typescript-eslint/no-require-imports */
                ;
                require('../services/contextCollapse/persist.js').restoreFromEntries(result_3.contextCollapseCommits ?? [], result_3.contextCollapseSnapshot);
                /* eslint-enable @typescript-eslint/no-require-imports */
            }
            logEvent('tengu_session_resumed', {
                entrypoint: 'picker',
                success: true,
                resume_duration_ms: Math.round(performance.now() - resumeStart)
            });
            setLogs([]);
            setResumeData({
                messages: result_3.messages,
                fileHistorySnapshots: result_3.fileHistorySnapshots,
                contentReplacements: result_3.contentReplacements,
                agentName: result_3.agentName,
                agentColor: (result_3.agentColor === 'default' ? undefined : result_3.agentColor),
                mainThreadAgentDefinition: resolvedAgentDef
            });
        }
        catch (e) {
            logEvent('tengu_session_resumed', {
                entrypoint: 'picker',
                success: false
            });
            logError(e);
            throw e;
        }
    }
    if (crossProjectCommand) {
        return _jsx(CrossProjectMessage, { command: crossProjectCommand });
    }
    if (resumeData) {
        return _jsx(REPL, { debug: debug, commands: commands, initialTools: initialTools, initialMessages: resumeData.messages, initialFileHistorySnapshots: resumeData.fileHistorySnapshots, initialContentReplacements: resumeData.contentReplacements, initialAgentName: resumeData.agentName, initialAgentColor: resumeData.agentColor, mcpClients: mcpClients, dynamicMcpConfig: dynamicMcpConfig, strictMcpConfig: strictMcpConfig, systemPrompt: systemPrompt, appendSystemPrompt: appendSystemPrompt, mainThreadAgentDefinition: resumeData.mainThreadAgentDefinition, autoConnectIdeFlag: autoConnectIdeFlag, disableSlashCommands: disableSlashCommands, taskListId: taskListId, thinkingConfig: thinkingConfig, onTurnComplete: onTurnComplete });
    }
    if (loading) {
        return _jsxs(Box, { children: [_jsx(Spinner, {}), _jsx(Text, { children: " Loading conversations\u2026" })] });
    }
    if (resuming) {
        return _jsxs(Box, { children: [_jsx(Spinner, {}), _jsx(Text, { children: " Resuming conversation\u2026" })] });
    }
    if (filteredLogs.length === 0) {
        return _jsx(NoConversationsMessage, {});
    }
    return _jsx(LogSelector, { logs: filteredLogs, maxHeight: rows, onCancel: onCancel, onSelect: onSelect, onLogsChanged: isResumeWithRenameEnabled ? () => loadLogs(showAllProjects) : undefined, onLoadMore: loadMoreLogs, initialSearchQuery: initialSearchQuery, showAllProjects: showAllProjects, onToggleAllProjects: handleToggleAllProjects, onAgenticSearch: agenticSessionSearch });
}
function NoConversationsMessage() {
    const $ = _c(2);
    let t0;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = {
            context: "Global"
        };
        $[0] = t0;
    }
    else {
        t0 = $[0];
    }
    useKeybinding("app:interrupt", _temp, t0);
    let t1;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = _jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { children: "No conversations found to resume." }), _jsx(Text, { dimColor: true, children: "Press Ctrl+C to exit and start a new conversation." })] });
        $[1] = t1;
    }
    else {
        t1 = $[1];
    }
    return t1;
}
function _temp() {
    process.exit(1);
}
function CrossProjectMessage(t0) {
    const $ = _c(8);
    const { command } = t0;
    let t1;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = [];
        $[0] = t1;
    }
    else {
        t1 = $[0];
    }
    React.useEffect(_temp3, t1);
    let t2;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        t2 = _jsx(Text, { children: "This conversation is from a different directory." });
        $[1] = t2;
    }
    else {
        t2 = $[1];
    }
    let t3;
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
        t3 = _jsx(Text, { children: "To resume, run:" });
        $[2] = t3;
    }
    else {
        t3 = $[2];
    }
    let t4;
    if ($[3] !== command) {
        t4 = _jsxs(Box, { flexDirection: "column", children: [t3, _jsxs(Text, { children: [" ", command] })] });
        $[3] = command;
        $[4] = t4;
    }
    else {
        t4 = $[4];
    }
    let t5;
    if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
        t5 = _jsx(Text, { dimColor: true, children: "(Command copied to clipboard)" });
        $[5] = t5;
    }
    else {
        t5 = $[5];
    }
    let t6;
    if ($[6] !== t4) {
        t6 = _jsxs(Box, { flexDirection: "column", gap: 1, children: [t2, t4, t5] });
        $[6] = t4;
        $[7] = t6;
    }
    else {
        t6 = $[7];
    }
    return t6;
}
function _temp3() {
    const timeout = setTimeout(_temp2, 100);
    return () => clearTimeout(timeout);
}
function _temp2() {
    process.exit(0);
}
