import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Thin launchers for one-off dialog JSX sites in main.tsx.
 * Each launcher dynamically imports its component and wires the `done` callback
 * identically to the original inline call site. Zero behavior change.
 *
 * Part of the main.tsx React/JSX extraction effort. See sibling PRs
 * perf/extract-interactive-helpers and perf/launch-repl.
 */
import React from 'react';
import { renderAndRun, showSetupDialog } from './interactiveHelpers.js';
import { KeybindingSetup } from './keybindings/KeybindingProviderSetup.js';
/**
 * Site ~3173: SnapshotUpdateDialog (agent memory snapshot update prompt).
 * Original callback wiring: onComplete={done}, onCancel={() => done('keep')}.
 */
export async function launchSnapshotUpdateDialog(root, props) {
    const { SnapshotUpdateDialog } = await import('./components/agents/SnapshotUpdateDialog.js');
    return showSetupDialog(root, done => _jsx(SnapshotUpdateDialog, { agentType: props.agentType, scope: props.scope, snapshotTimestamp: props.snapshotTimestamp, onComplete: done, onCancel: () => done('keep') }));
}
/**
 * Site ~3250: InvalidSettingsDialog (settings validation errors).
 * Original callback wiring: onContinue={done}, onExit passed through from caller.
 */
export async function launchInvalidSettingsDialog(root, props) {
    const { InvalidSettingsDialog } = await import('./components/InvalidSettingsDialog.js');
    return showSetupDialog(root, done => _jsx(InvalidSettingsDialog, { settingsErrors: props.settingsErrors, onContinue: done, onExit: props.onExit }));
}
/**
 * Site ~4229: AssistantSessionChooser (pick a bridge session to attach to).
 * Original callback wiring: onSelect={id => done(id)}, onCancel={() => done(null)}.
 */
export async function launchAssistantSessionChooser(root, props) {
    const { AssistantSessionChooser } = await import('./assistant/AssistantSessionChooser.js');
    return showSetupDialog(root, done => _jsx(AssistantSessionChooser, { sessions: props.sessions, onSelect: id => done(id), onCancel: () => done(null) }));
}
/**
 * `claude assistant` found zero sessions — show the same install wizard
 * as `/assistant` when daemon.json is empty. Resolves to the installed dir on
 * success, null on cancel. Rejects on install failure so the caller can
 * distinguish errors from user cancellation.
 */
export async function launchAssistantInstallWizard(root) {
    const { NewInstallWizard, computeDefaultInstallDir } = await import('./commands/assistant/assistant.js');
    const defaultDir = await computeDefaultInstallDir();
    let rejectWithError;
    const errorPromise = new Promise((_, reject) => {
        rejectWithError = reject;
    });
    const resultPromise = showSetupDialog(root, done => _jsx(NewInstallWizard, { defaultDir: defaultDir, onInstalled: dir => done(dir), onCancel: () => done(null), onError: message => rejectWithError(new Error(`Installation failed: ${message}`)) }));
    return Promise.race([resultPromise, errorPromise]);
}
/**
 * Site ~4549: TeleportResumeWrapper (interactive teleport session picker).
 * Original callback wiring: onComplete={done}, onCancel={() => done(null)}, source="cliArg".
 */
export async function launchTeleportResumeWrapper(root) {
    const { TeleportResumeWrapper } = await import('./components/TeleportResumeWrapper.js');
    return showSetupDialog(root, done => _jsx(TeleportResumeWrapper, { onComplete: done, onCancel: () => done(null), source: "cliArg" }));
}
/**
 * Site ~4597: TeleportRepoMismatchDialog (pick a local checkout of the target repo).
 * Original callback wiring: onSelectPath={done}, onCancel={() => done(null)}.
 */
export async function launchTeleportRepoMismatchDialog(root, props) {
    const { TeleportRepoMismatchDialog } = await import('./components/TeleportRepoMismatchDialog.js');
    return showSetupDialog(root, done => _jsx(TeleportRepoMismatchDialog, { targetRepo: props.targetRepo, initialPaths: props.initialPaths, onSelectPath: done, onCancel: () => done(null) }));
}
/**
 * Site ~4903: ResumeConversation mount (interactive session picker).
 * Uses renderAndRun, NOT showSetupDialog. Wraps in <App><KeybindingSetup>.
 * Preserves original Promise.all parallelism between getWorktreePaths and imports.
 */
export async function launchResumeChooser(root, appProps, worktreePathsPromise, resumeProps) {
    const [worktreePaths, { ResumeConversation }, { App }] = await Promise.all([worktreePathsPromise, import('./screens/ResumeConversation.js'), import('./components/App.js')]);
    await renderAndRun(root, _jsx(App, { getFpsMetrics: appProps.getFpsMetrics, stats: appProps.stats, initialState: appProps.initialState, children: _jsx(KeybindingSetup, { children: _jsx(ResumeConversation, { ...resumeProps, worktreePaths: worktreePaths }) }) }));
}
