import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import { feature } from 'bun:bundle';
import figures from 'figures';
import React, { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { isCoordinatorMode } from 'src/coordinator/coordinatorMode.js';
import { useTerminalSize } from 'src/hooks/useTerminalSize.js';
import { useAppState, useSetAppState } from 'src/state/AppState.js';
import { enterTeammateView, exitTeammateView } from 'src/state/teammateViewHelpers.js';
import { DreamTask } from 'src/tasks/DreamTask/DreamTask.js';
import { InProcessTeammateTask } from 'src/tasks/InProcessTeammateTask/InProcessTeammateTask.js';
import { LocalAgentTask } from 'src/tasks/LocalAgentTask/LocalAgentTask.js';
import { LocalShellTask } from 'src/tasks/LocalShellTask/LocalShellTask.js';
import { RemoteAgentTask } from 'src/tasks/RemoteAgentTask/RemoteAgentTask.js';
import { isBackgroundTask } from 'src/tasks/types.js';
import { intersperse } from 'src/utils/array.js';
import { TEAM_LEAD_NAME } from 'src/utils/swarm/constants.js';
import { stopUltraplan } from '../../commands/ultraplan.js';
import { useRegisterOverlay } from '../../context/overlayContext.js';
import { Box, Text } from '../../ink.js';
import { useKeybindings } from '../../keybindings/useKeybinding.js';
import { useShortcutDisplay } from '../../keybindings/useShortcutDisplay.js';
import { count } from '../../utils/array.js';
import { Byline } from '../design-system/Byline.js';
import { Dialog } from '../design-system/Dialog.js';
import { KeyboardShortcutHint } from '../design-system/KeyboardShortcutHint.js';
import { AsyncAgentDetailDialog } from './AsyncAgentDetailDialog.js';
import { BackgroundTask as BackgroundTaskComponent } from './BackgroundTask.js';
import { DreamDetailDialog } from './DreamDetailDialog.js';
import { InProcessTeammateDetailDialog } from './InProcessTeammateDetailDialog.js';
import { RemoteSessionDetailDialog } from './RemoteSessionDetailDialog.js';
import { ShellDetailDialog } from './ShellDetailDialog.js';
// WORKFLOW_SCRIPTS is ant-only (build_flags.yaml). Static imports would leak
// ~1.3K lines into external builds. Gate with feature() + require so the
// bundler can dead-code-eliminate the branch.
/* eslint-disable @typescript-eslint/no-require-imports */
const WorkflowDetailDialog = feature('WORKFLOW_SCRIPTS') ? require('./WorkflowDetailDialog.js').WorkflowDetailDialog : null;
const workflowTaskModule = feature('WORKFLOW_SCRIPTS') ? require('src/tasks/LocalWorkflowTask/LocalWorkflowTask.js') : null;
const killWorkflowTask = workflowTaskModule?.killWorkflowTask ?? null;
const skipWorkflowAgent = workflowTaskModule?.skipWorkflowAgent ?? null;
const retryWorkflowAgent = workflowTaskModule?.retryWorkflowAgent ?? null;
// Relative path, not `src/...` path-mapping — Bun's DCE can statically
// resolve + eliminate `./` requires, but path-mapped strings stay opaque
// and survive as dead literals in the bundle. Matches tasks.ts pattern.
const monitorMcpModule = feature('MONITOR_TOOL') ? require('../../tasks/MonitorMcpTask/MonitorMcpTask.js') : null;
const killMonitorMcp = monitorMcpModule?.killMonitorMcp ?? null;
const MonitorMcpDetailDialog = feature('MONITOR_TOOL') ? require('./MonitorMcpDetailDialog.js').MonitorMcpDetailDialog : null;
/* eslint-enable @typescript-eslint/no-require-imports */
// Helper to get filtered background tasks (excludes foregrounded local_agent)
function getSelectableBackgroundTasks(tasks, foregroundedTaskId) {
    const backgroundTasks = Object.values(tasks ?? {}).filter(isBackgroundTask);
    return backgroundTasks.filter(task => !(task.type === 'local_agent' && task.id === foregroundedTaskId));
}
export function BackgroundTasksDialog({ onDone, toolUseContext, initialDetailTaskId }) {
    const tasks = useAppState(s => s.tasks);
    const foregroundedTaskId = useAppState(s_0 => s_0.foregroundedTaskId);
    const showSpinnerTree = useAppState(s_1 => s_1.expandedView) === 'teammates';
    const setAppState = useSetAppState();
    const killAgentsShortcut = useShortcutDisplay('chat:killAgents', 'Chat', 'ctrl+x ctrl+k');
    const typedTasks = tasks;
    // Track if we skipped list view on mount (for back button behavior)
    const skippedListOnMount = useRef(false);
    // Compute initial view state - skip list if caller provided a specific task,
    // or if there's exactly one task
    const [viewState, setViewState] = useState(() => {
        if (initialDetailTaskId) {
            skippedListOnMount.current = true;
            return {
                mode: 'detail',
                itemId: initialDetailTaskId
            };
        }
        const allItems = getSelectableBackgroundTasks(typedTasks, foregroundedTaskId);
        if (allItems.length === 1) {
            skippedListOnMount.current = true;
            return {
                mode: 'detail',
                itemId: allItems[0].id
            };
        }
        return {
            mode: 'list'
        };
    });
    const [selectedIndex, setSelectedIndex] = useState(0);
    // Register as modal overlay so parent Chat keybindings (up/down for history)
    // are deactivated while this dialog is open
    useRegisterOverlay('background-tasks-dialog');
    // Memoize the sorted and categorized items together to ensure stable references
    const { bashTasks, remoteSessions, agentTasks, teammateTasks, workflowTasks, mcpMonitors, dreamTasks: dreamTasks_0, allSelectableItems } = useMemo(() => {
        // Filter to only show running/pending background tasks, matching the status bar count
        const backgroundTasks = Object.values(typedTasks ?? {}).filter(isBackgroundTask);
        const allItems_0 = backgroundTasks.map(toListItem);
        const sorted = allItems_0.sort((a, b) => {
            const aStatus = a.status;
            const bStatus = b.status;
            if (aStatus === 'running' && bStatus !== 'running')
                return -1;
            if (aStatus !== 'running' && bStatus === 'running')
                return 1;
            const aTime = 'task' in a ? a.task.startTime : 0;
            const bTime = 'task' in b ? b.task.startTime : 0;
            return bTime - aTime;
        });
        const bash = sorted.filter(item => item.type === 'local_bash');
        const remote = sorted.filter(item_0 => item_0.type === 'remote_agent');
        // Exclude foregrounded task - it's being viewed in the main UI, not a background task
        const agent = sorted.filter(item_1 => item_1.type === 'local_agent' && item_1.id !== foregroundedTaskId);
        const workflows = sorted.filter(item_2 => item_2.type === 'local_workflow');
        const monitorMcp = sorted.filter(item_3 => item_3.type === 'monitor_mcp');
        const dreamTasks = sorted.filter(item_4 => item_4.type === 'dream');
        // In spinner-tree mode, exclude teammates from the dialog (they appear in the tree)
        const teammates = showSpinnerTree ? [] : sorted.filter(item_5 => item_5.type === 'in_process_teammate');
        // Add leader entry when there are teammates, so users can foreground back to leader
        const leaderItem = teammates.length > 0 ? [{
                id: '__leader__',
                type: 'leader',
                label: `@${TEAM_LEAD_NAME}`,
                status: 'running'
            }] : [];
        return {
            bashTasks: bash,
            remoteSessions: remote,
            agentTasks: agent,
            workflowTasks: workflows,
            mcpMonitors: monitorMcp,
            dreamTasks,
            teammateTasks: [...leaderItem, ...teammates],
            // Order MUST match JSX render order (teammates \u2192 bash \u2192 monitorMcp \u2192
            // remote \u2192 agent \u2192 workflows \u2192 dream) so \u2193/\u2191 navigation moves the cursor
            // visually downward.
            allSelectableItems: [...leaderItem, ...teammates, ...bash, ...monitorMcp, ...remote, ...agent, ...workflows, ...dreamTasks]
        };
    }, [typedTasks, foregroundedTaskId, showSpinnerTree]);
    const currentSelection = allSelectableItems[selectedIndex] ?? null;
    // Use configurable keybindings for standard navigation and confirm/cancel.
    // confirm:no is handled by Dialog's onCancel prop.
    useKeybindings({
        'confirm:previous': () => setSelectedIndex(prev => Math.max(0, prev - 1)),
        'confirm:next': () => setSelectedIndex(prev_0 => Math.min(allSelectableItems.length - 1, prev_0 + 1)),
        'confirm:yes': () => {
            const current = allSelectableItems[selectedIndex];
            if (current) {
                if (current.type === 'leader') {
                    exitTeammateView(setAppState);
                    onDone('Viewing leader', {
                        display: 'system'
                    });
                }
                else {
                    setViewState({
                        mode: 'detail',
                        itemId: current.id
                    });
                }
            }
        }
    }, {
        context: 'Confirmation',
        isActive: viewState.mode === 'list'
    });
    // Component-specific shortcuts (x=stop, f=foreground, right=zoom) shown in UI.
    // These are task-type and status dependent, not standard dialog keybindings.
    const handleKeyDown = (e) => {
        // Only handle input when in list mode
        if (viewState.mode !== 'list')
            return;
        if (e.key === 'left') {
            e.preventDefault();
            onDone('Background tasks dialog dismissed', {
                display: 'system'
            });
            return;
        }
        // Compute current selection at the time of the key press
        const currentSelection_0 = allSelectableItems[selectedIndex];
        if (!currentSelection_0)
            return; // everything below requires a selection
        if (e.key === 'x') {
            e.preventDefault();
            if (currentSelection_0.type === 'local_bash' && currentSelection_0.status === 'running') {
                void killShellTask(currentSelection_0.id);
            }
            else if (currentSelection_0.type === 'local_agent' && currentSelection_0.status === 'running') {
                void killAgentTask(currentSelection_0.id);
            }
            else if (currentSelection_0.type === 'in_process_teammate' && currentSelection_0.status === 'running') {
                void killTeammateTask(currentSelection_0.id);
            }
            else if (currentSelection_0.type === 'local_workflow' && currentSelection_0.status === 'running' && killWorkflowTask) {
                killWorkflowTask(currentSelection_0.id, setAppState);
            }
            else if (currentSelection_0.type === 'monitor_mcp' && currentSelection_0.status === 'running' && killMonitorMcp) {
                killMonitorMcp(currentSelection_0.id, setAppState);
            }
            else if (currentSelection_0.type === 'dream' && currentSelection_0.status === 'running') {
                void killDreamTask(currentSelection_0.id);
            }
            else if (currentSelection_0.type === 'remote_agent' && currentSelection_0.status === 'running') {
                if (currentSelection_0.task.isUltraplan) {
                    void stopUltraplan(currentSelection_0.id, currentSelection_0.task.sessionId, setAppState);
                }
                else {
                    void killRemoteAgentTask(currentSelection_0.id);
                }
            }
        }
        if (e.key === 'f') {
            if (currentSelection_0.type === 'in_process_teammate' && currentSelection_0.status === 'running') {
                e.preventDefault();
                enterTeammateView(currentSelection_0.id, setAppState);
                onDone('Viewing teammate', {
                    display: 'system'
                });
            }
            else if (currentSelection_0.type === 'leader') {
                e.preventDefault();
                exitTeammateView(setAppState);
                onDone('Viewing leader', {
                    display: 'system'
                });
            }
        }
    };
    async function killShellTask(taskId) {
        await LocalShellTask.kill(taskId, setAppState);
    }
    async function killAgentTask(taskId_0) {
        await LocalAgentTask.kill(taskId_0, setAppState);
    }
    async function killTeammateTask(taskId_1) {
        await InProcessTeammateTask.kill(taskId_1, setAppState);
    }
    async function killDreamTask(taskId_2) {
        await DreamTask.kill(taskId_2, setAppState);
    }
    async function killRemoteAgentTask(taskId_3) {
        await RemoteAgentTask.kill(taskId_3, setAppState);
    }
    // Wrap onDone in useEffectEvent to get a stable reference that always calls
    // the current onDone callback without causing the effect to re-fire.
    const onDoneEvent = useEffectEvent(onDone);
    useEffect(() => {
        if (viewState.mode !== 'list') {
            const task = (typedTasks ?? {})[viewState.itemId];
            // Workflow tasks get a grace: their detail view stays open through
            // completion so the user sees the final state before eviction.
            if (!task || task.type !== 'local_workflow' && !isBackgroundTask(task)) {
                // Task was removed or is no longer a background task (e.g. killed).
                // If we skipped the list on mount, close the dialog entirely.
                if (skippedListOnMount.current) {
                    onDoneEvent('Background tasks dialog dismissed', {
                        display: 'system'
                    });
                }
                else {
                    setViewState({
                        mode: 'list'
                    });
                }
            }
        }
        const totalItems = allSelectableItems.length;
        if (selectedIndex >= totalItems && totalItems > 0) {
            setSelectedIndex(totalItems - 1);
        }
    }, [viewState, typedTasks, selectedIndex, allSelectableItems, onDoneEvent]);
    // Helper to go back to list view (or close dialog if we skipped list on
    // mount AND there's still only ≤1 item). Checking current count prevents
    // the stale-state trap: if you opened with 1 task (auto-skipped to detail),
    // then a second task started, 'back' should show the list — not close.
    const goBackToList = () => {
        if (skippedListOnMount.current && allSelectableItems.length <= 1) {
            onDone('Background tasks dialog dismissed', {
                display: 'system'
            });
        }
        else {
            skippedListOnMount.current = false;
            setViewState({
                mode: 'list'
            });
        }
    };
    // If an item is selected, show the appropriate view
    if (viewState.mode !== 'list' && typedTasks) {
        const task_0 = typedTasks[viewState.itemId];
        if (!task_0) {
            return null;
        }
        // Detail mode - show appropriate detail dialog
        switch (task_0.type) {
            case 'local_bash':
                return _jsx(ShellDetailDialog, { shell: task_0, onDone: onDone, onKillShell: () => void killShellTask(task_0.id), onBack: goBackToList }, `shell-${task_0.id}`);
            case 'local_agent':
                return _jsx(AsyncAgentDetailDialog, { agent: task_0, onDone: onDone, onKillAgent: () => void killAgentTask(task_0.id), onBack: goBackToList }, `agent-${task_0.id}`);
            case 'remote_agent':
                return _jsx(RemoteSessionDetailDialog, { session: task_0, onDone: onDone, toolUseContext: toolUseContext, onBack: goBackToList, onKill: task_0.status !== 'running' ? undefined : task_0.isUltraplan ? () => void stopUltraplan(task_0.id, task_0.sessionId, setAppState) : () => void killRemoteAgentTask(task_0.id) }, `session-${task_0.id}`);
            case 'in_process_teammate':
                return _jsx(InProcessTeammateDetailDialog, { teammate: task_0, onDone: onDone, onKill: task_0.status === 'running' ? () => void killTeammateTask(task_0.id) : undefined, onBack: goBackToList, onForeground: task_0.status === 'running' ? () => {
                        enterTeammateView(task_0.id, setAppState);
                        onDone('Viewing teammate', {
                            display: 'system'
                        });
                    } : undefined }, `teammate-${task_0.id}`);
            case 'local_workflow':
                if (!WorkflowDetailDialog)
                    return null;
                return _jsx(WorkflowDetailDialog, { workflow: task_0, onDone: onDone, onKill: task_0.status === 'running' && killWorkflowTask ? () => killWorkflowTask(task_0.id, setAppState) : undefined, onSkipAgent: task_0.status === 'running' && skipWorkflowAgent ? agentId => skipWorkflowAgent(task_0.id, agentId, setAppState) : undefined, onRetryAgent: task_0.status === 'running' && retryWorkflowAgent ? agentId_0 => retryWorkflowAgent(task_0.id, agentId_0, setAppState) : undefined, onBack: goBackToList }, `workflow-${task_0.id}`);
            case 'monitor_mcp':
                if (!MonitorMcpDetailDialog)
                    return null;
                return _jsx(MonitorMcpDetailDialog, { task: task_0, onKill: task_0.status === 'running' && killMonitorMcp ? () => killMonitorMcp(task_0.id, setAppState) : undefined, onBack: goBackToList }, `monitor-mcp-${task_0.id}`);
            case 'dream':
                return _jsx(DreamDetailDialog, { task: task_0, onDone: () => onDone('Background tasks dialog dismissed', {
                        display: 'system'
                    }), onBack: goBackToList, onKill: task_0.status === 'running' ? () => void killDreamTask(task_0.id) : undefined }, `dream-${task_0.id}`);
        }
    }
    const runningBashCount = count(bashTasks, _ => _.status === 'running');
    const runningAgentCount = count(remoteSessions, __0 => __0.status === 'running' || __0.status === 'pending') + count(agentTasks, __1 => __1.status === 'running');
    const runningTeammateCount = count(teammateTasks, __2 => __2.status === 'running');
    const subtitle = intersperse([...(runningTeammateCount > 0 ? [_jsxs(Text, { children: [runningTeammateCount, ' ', runningTeammateCount !== 1 ? 'agents' : 'agent'] }, "teammates")] : []), ...(runningBashCount > 0 ? [_jsxs(Text, { children: [runningBashCount, ' ', runningBashCount !== 1 ? 'active shells' : 'active shell'] }, "shells")] : []), ...(runningAgentCount > 0 ? [_jsxs(Text, { children: [runningAgentCount, ' ', runningAgentCount !== 1 ? 'active agents' : 'active agent'] }, "agents")] : [])], index => _jsx(Text, { children: " \u00B7 " }, `separator-${index}`));
    const actions = [_jsx(KeyboardShortcutHint, { shortcut: "\u2191/\u2193", action: "select" }, "upDown"), _jsx(KeyboardShortcutHint, { shortcut: "Enter", action: "view" }, "enter"), ...(currentSelection?.type === 'in_process_teammate' && currentSelection.status === 'running' ? [_jsx(KeyboardShortcutHint, { shortcut: "f", action: "foreground" }, "foreground")] : []), ...((currentSelection?.type === 'local_bash' || currentSelection?.type === 'local_agent' || currentSelection?.type === 'in_process_teammate' || currentSelection?.type === 'local_workflow' || currentSelection?.type === 'monitor_mcp' || currentSelection?.type === 'dream' || currentSelection?.type === 'remote_agent') && currentSelection.status === 'running' ? [_jsx(KeyboardShortcutHint, { shortcut: "x", action: "stop" }, "kill")] : []), ...(agentTasks.some(t => t.status === 'running') ? [_jsx(KeyboardShortcutHint, { shortcut: killAgentsShortcut, action: "stop all agents" }, "kill-all")] : []), _jsx(KeyboardShortcutHint, { shortcut: "\u2190/Esc", action: "close" }, "esc")];
    const handleCancel = () => onDone('Background tasks dialog dismissed', {
        display: 'system'
    });
    function renderInputGuide(exitState) {
        if (exitState.pending) {
            return _jsxs(Text, { children: ["Press ", exitState.keyName, " again to exit"] });
        }
        return _jsx(Byline, { children: actions });
    }
    return _jsx(Box, { flexDirection: "column", tabIndex: 0, autoFocus: true, onKeyDown: handleKeyDown, children: _jsx(Dialog, { title: "Background tasks", subtitle: _jsx(_Fragment, { children: subtitle }), onCancel: handleCancel, color: "background", inputGuide: renderInputGuide, children: allSelectableItems.length === 0 ? _jsx(Text, { dimColor: true, children: "No tasks currently running" }) : _jsxs(Box, { flexDirection: "column", children: [teammateTasks.length > 0 && _jsxs(Box, { flexDirection: "column", children: [(bashTasks.length > 0 || remoteSessions.length > 0 || agentTasks.length > 0) && _jsxs(Text, { dimColor: true, children: [_jsxs(Text, { bold: true, children: ['  ', "Agents"] }), " (", count(teammateTasks, i => i.type !== 'leader'), ")"] }), _jsx(Box, { flexDirection: "column", children: _jsx(TeammateTaskGroups, { teammateTasks: teammateTasks, currentSelectionId: currentSelection?.id }) })] }), bashTasks.length > 0 && _jsxs(Box, { flexDirection: "column", marginTop: teammateTasks.length > 0 ? 1 : 0, children: [(teammateTasks.length > 0 || remoteSessions.length > 0 || agentTasks.length > 0) && _jsxs(Text, { dimColor: true, children: [_jsxs(Text, { bold: true, children: ['  ', "Shells"] }), " (", bashTasks.length, ")"] }), _jsx(Box, { flexDirection: "column", children: bashTasks.map(item_6 => _jsx(Item, { item: item_6, isSelected: item_6.id === currentSelection?.id }, item_6.id)) })] }), mcpMonitors.length > 0 && _jsxs(Box, { flexDirection: "column", marginTop: teammateTasks.length > 0 || bashTasks.length > 0 ? 1 : 0, children: [_jsxs(Text, { dimColor: true, children: [_jsxs(Text, { bold: true, children: ['  ', "Monitors"] }), " (", mcpMonitors.length, ")"] }), _jsx(Box, { flexDirection: "column", children: mcpMonitors.map(item_7 => _jsx(Item, { item: item_7, isSelected: item_7.id === currentSelection?.id }, item_7.id)) })] }), remoteSessions.length > 0 && _jsxs(Box, { flexDirection: "column", marginTop: teammateTasks.length > 0 || bashTasks.length > 0 || mcpMonitors.length > 0 ? 1 : 0, children: [_jsxs(Text, { dimColor: true, children: [_jsxs(Text, { bold: true, children: ['  ', "Remote agents"] }), " (", remoteSessions.length, ")"] }), _jsx(Box, { flexDirection: "column", children: remoteSessions.map(item_8 => _jsx(Item, { item: item_8, isSelected: item_8.id === currentSelection?.id }, item_8.id)) })] }), agentTasks.length > 0 && _jsxs(Box, { flexDirection: "column", marginTop: teammateTasks.length > 0 || bashTasks.length > 0 || mcpMonitors.length > 0 || remoteSessions.length > 0 ? 1 : 0, children: [_jsxs(Text, { dimColor: true, children: [_jsxs(Text, { bold: true, children: ['  ', "Local agents"] }), " (", agentTasks.length, ")"] }), _jsx(Box, { flexDirection: "column", children: agentTasks.map(item_9 => _jsx(Item, { item: item_9, isSelected: item_9.id === currentSelection?.id }, item_9.id)) })] }), workflowTasks.length > 0 && _jsxs(Box, { flexDirection: "column", marginTop: teammateTasks.length > 0 || bashTasks.length > 0 || mcpMonitors.length > 0 || remoteSessions.length > 0 || agentTasks.length > 0 ? 1 : 0, children: [_jsxs(Text, { dimColor: true, children: [_jsxs(Text, { bold: true, children: ['  ', "Workflows"] }), " (", workflowTasks.length, ")"] }), _jsx(Box, { flexDirection: "column", children: workflowTasks.map(item_10 => _jsx(Item, { item: item_10, isSelected: item_10.id === currentSelection?.id }, item_10.id)) })] }), dreamTasks_0.length > 0 && _jsx(Box, { flexDirection: "column", marginTop: teammateTasks.length > 0 || bashTasks.length > 0 || mcpMonitors.length > 0 || remoteSessions.length > 0 || agentTasks.length > 0 || workflowTasks.length > 0 ? 1 : 0, children: _jsx(Box, { flexDirection: "column", children: dreamTasks_0.map(item_11 => _jsx(Item, { item: item_11, isSelected: item_11.id === currentSelection?.id }, item_11.id)) }) })] }) }) });
}
function toListItem(task) {
    switch (task.type) {
        case 'local_bash':
            return {
                id: task.id,
                type: 'local_bash',
                label: task.kind === 'monitor' ? task.description : task.command,
                status: task.status,
                task
            };
        case 'remote_agent':
            return {
                id: task.id,
                type: 'remote_agent',
                label: task.title,
                status: task.status,
                task
            };
        case 'local_agent':
            return {
                id: task.id,
                type: 'local_agent',
                label: task.description,
                status: task.status,
                task
            };
        case 'in_process_teammate':
            return {
                id: task.id,
                type: 'in_process_teammate',
                label: `@${task.identity.agentName}`,
                status: task.status,
                task
            };
        case 'local_workflow':
            return {
                id: task.id,
                type: 'local_workflow',
                label: task.summary ?? task.description,
                status: task.status,
                task
            };
        case 'monitor_mcp':
            return {
                id: task.id,
                type: 'monitor_mcp',
                label: task.description,
                status: task.status,
                task
            };
        case 'dream':
            return {
                id: task.id,
                type: 'dream',
                label: task.description,
                status: task.status,
                task
            };
    }
}
function Item(t0) {
    const $ = _c(14);
    const { item, isSelected } = t0;
    const { columns } = useTerminalSize();
    const maxActivityWidth = Math.max(30, columns - 26);
    let t1;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = isCoordinatorMode();
        $[0] = t1;
    }
    else {
        t1 = $[0];
    }
    const useGreyPointer = t1;
    const t2 = useGreyPointer && isSelected;
    const t3 = isSelected ? figures.pointer + " " : "  ";
    let t4;
    if ($[1] !== t2 || $[2] !== t3) {
        t4 = _jsx(Text, { dimColor: t2, children: t3 });
        $[1] = t2;
        $[2] = t3;
        $[3] = t4;
    }
    else {
        t4 = $[3];
    }
    const t5 = isSelected && !useGreyPointer ? "suggestion" : undefined;
    let t6;
    if ($[4] !== item.task || $[5] !== item.type || $[6] !== maxActivityWidth) {
        t6 = item.type === "leader" ? _jsxs(Text, { children: ["@", TEAM_LEAD_NAME] }) : _jsx(BackgroundTaskComponent, { task: item.task, maxActivityWidth: maxActivityWidth });
        $[4] = item.task;
        $[5] = item.type;
        $[6] = maxActivityWidth;
        $[7] = t6;
    }
    else {
        t6 = $[7];
    }
    let t7;
    if ($[8] !== t5 || $[9] !== t6) {
        t7 = _jsx(Text, { color: t5, children: t6 });
        $[8] = t5;
        $[9] = t6;
        $[10] = t7;
    }
    else {
        t7 = $[10];
    }
    let t8;
    if ($[11] !== t4 || $[12] !== t7) {
        t8 = _jsxs(Box, { flexDirection: "row", children: [t4, t7] });
        $[11] = t4;
        $[12] = t7;
        $[13] = t8;
    }
    else {
        t8 = $[13];
    }
    return t8;
}
function TeammateTaskGroups(t0) {
    const $ = _c(3);
    const { teammateTasks, currentSelectionId } = t0;
    let t1;
    if ($[0] !== currentSelectionId || $[1] !== teammateTasks) {
        const leaderItems = teammateTasks.filter(_temp);
        const teammateItems = teammateTasks.filter(_temp2);
        const teams = new Map();
        for (const item of teammateItems) {
            const teamName = item.task.identity.teamName;
            const group = teams.get(teamName);
            if (group) {
                group.push(item);
            }
            else {
                teams.set(teamName, [item]);
            }
        }
        const teamEntries = [...teams.entries()];
        t1 = _jsx(_Fragment, { children: teamEntries.map(t2 => {
                const [teamName_0, items] = t2;
                const memberCount = items.length + leaderItems.length;
                return _jsxs(Box, { flexDirection: "column", children: [_jsxs(Text, { dimColor: true, children: ["  ", "Team: ", teamName_0, " (", memberCount, ")"] }), leaderItems.map(item_0 => _jsx(Item, { item: item_0, isSelected: item_0.id === currentSelectionId }, `${item_0.id}-${teamName_0}`)), items.map(item_1 => _jsx(Item, { item: item_1, isSelected: item_1.id === currentSelectionId }, item_1.id))] }, teamName_0);
            }) });
        $[0] = currentSelectionId;
        $[1] = teammateTasks;
        $[2] = t1;
    }
    else {
        t1 = $[2];
    }
    return t1;
}
function _temp2(i_0) {
    return i_0.type === "in_process_teammate";
}
function _temp(i) {
    return i.type === "leader";
}
