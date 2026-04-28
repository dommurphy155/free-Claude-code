import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import { feature } from 'bun:bundle';
import { APIUserAbortError } from '@anthropic-ai/sdk';
import * as React from 'react';
import { Text } from '../ink.js';
import { consumeSpeculativeClassifierCheck, peekSpeculativeClassifierCheck } from '../tools/BashTool/bashPermissions.js';
import { BASH_TOOL_NAME } from '../tools/BashTool/toolName.js';
import { recordAutoModeDenial } from '../utils/autoModeDenials.js';
import { clearClassifierChecking, setClassifierApproval, setYoloClassifierApproval } from '../utils/classifierApprovals.js';
import { logForDebugging } from '../utils/debug.js';
import { AbortError } from '../utils/errors.js';
import { logError } from '../utils/log.js';
import { hasPermissionsToUseTool } from '../utils/permissions/permissions.js';
import { handleCoordinatorPermission } from './toolPermission/handlers/coordinatorHandler.js';
import { handleInteractivePermission } from './toolPermission/handlers/interactiveHandler.js';
import { handleSwarmWorkerPermission } from './toolPermission/handlers/swarmWorkerHandler.js';
import { createPermissionContext, createPermissionQueueOps } from './toolPermission/PermissionContext.js';
import { logPermissionDecision } from './toolPermission/permissionLogging.js';
function useCanUseTool(setToolUseConfirmQueue, setToolPermissionContext) {
    const $ = _c(3);
    let t0;
    if ($[0] !== setToolPermissionContext || $[1] !== setToolUseConfirmQueue) {
        t0 = async (tool, input, toolUseContext, assistantMessage, toolUseID, forceDecision) => new Promise(resolve => {
            const ctx = createPermissionContext(tool, input, toolUseContext, assistantMessage, toolUseID, setToolPermissionContext, createPermissionQueueOps(setToolUseConfirmQueue));
            if (ctx.resolveIfAborted(resolve)) {
                return;
            }
            const decisionPromise = forceDecision !== undefined ? Promise.resolve(forceDecision) : hasPermissionsToUseTool(tool, input, toolUseContext, assistantMessage, toolUseID);
            return decisionPromise.then(async (result) => {
                if (result.behavior === "allow") {
                    if (ctx.resolveIfAborted(resolve)) {
                        return;
                    }
                    if (feature("TRANSCRIPT_CLASSIFIER") && result.decisionReason?.type === "classifier" && result.decisionReason.classifier === "auto-mode") {
                        setYoloClassifierApproval(toolUseID, result.decisionReason.reason);
                    }
                    ctx.logDecision({
                        decision: "accept",
                        source: "config"
                    });
                    resolve(ctx.buildAllow(result.updatedInput ?? input, {
                        decisionReason: result.decisionReason
                    }));
                    return;
                }
                const appState = toolUseContext.getAppState();
                const description = await tool.description(input, {
                    isNonInteractiveSession: toolUseContext.options.isNonInteractiveSession,
                    toolPermissionContext: appState.toolPermissionContext,
                    tools: toolUseContext.options.tools
                });
                if (ctx.resolveIfAborted(resolve)) {
                    return;
                }
                switch (result.behavior) {
                    case "deny":
                        {
                            logPermissionDecision({
                                tool,
                                input,
                                toolUseContext,
                                messageId: ctx.messageId,
                                toolUseID
                            }, {
                                decision: "reject",
                                source: "config"
                            });
                            if (feature("TRANSCRIPT_CLASSIFIER") && result.decisionReason?.type === "classifier" && result.decisionReason.classifier === "auto-mode") {
                                recordAutoModeDenial({
                                    toolName: tool.name,
                                    display: description,
                                    reason: result.decisionReason.reason ?? "",
                                    timestamp: Date.now()
                                });
                                toolUseContext.addNotification?.({
                                    key: "auto-mode-denied",
                                    priority: "immediate",
                                    jsx: _jsxs(_Fragment, { children: [_jsxs(Text, { color: "error", children: [tool.userFacingName(input).toLowerCase(), " denied by auto mode"] }), _jsx(Text, { dimColor: true, children: " \u00B7 /permissions" })] })
                                });
                            }
                            resolve(result);
                            return;
                        }
                    case "ask":
                        {
                            if (appState.toolPermissionContext.awaitAutomatedChecksBeforeDialog) {
                                const coordinatorDecision = await handleCoordinatorPermission({
                                    ctx,
                                    ...(feature("BASH_CLASSIFIER") ? {
                                        pendingClassifierCheck: result.pendingClassifierCheck
                                    } : {}),
                                    updatedInput: result.updatedInput,
                                    suggestions: result.suggestions,
                                    permissionMode: appState.toolPermissionContext.mode
                                });
                                if (coordinatorDecision) {
                                    resolve(coordinatorDecision);
                                    return;
                                }
                            }
                            if (ctx.resolveIfAborted(resolve)) {
                                return;
                            }
                            const swarmDecision = await handleSwarmWorkerPermission({
                                ctx,
                                description,
                                ...(feature("BASH_CLASSIFIER") ? {
                                    pendingClassifierCheck: result.pendingClassifierCheck
                                } : {}),
                                updatedInput: result.updatedInput,
                                suggestions: result.suggestions
                            });
                            if (swarmDecision) {
                                resolve(swarmDecision);
                                return;
                            }
                            if (feature("BASH_CLASSIFIER") && result.pendingClassifierCheck && tool.name === BASH_TOOL_NAME && !appState.toolPermissionContext.awaitAutomatedChecksBeforeDialog) {
                                const speculativePromise = peekSpeculativeClassifierCheck(input.command);
                                if (speculativePromise) {
                                    const raceResult = await Promise.race([speculativePromise.then(_temp), new Promise(_temp2)]);
                                    if (ctx.resolveIfAborted(resolve)) {
                                        return;
                                    }
                                    if (raceResult.type === "result" && raceResult.result.matches && raceResult.result.confidence === "high" && feature("BASH_CLASSIFIER")) {
                                        consumeSpeculativeClassifierCheck(input.command);
                                        const matchedRule = raceResult.result.matchedDescription ?? undefined;
                                        if (matchedRule) {
                                            setClassifierApproval(toolUseID, matchedRule);
                                        }
                                        ctx.logDecision({
                                            decision: "accept",
                                            source: {
                                                type: "classifier"
                                            }
                                        });
                                        resolve(ctx.buildAllow(result.updatedInput ?? input, {
                                            decisionReason: {
                                                type: "classifier",
                                                classifier: "bash_allow",
                                                reason: `Allowed by prompt rule: "${raceResult.result.matchedDescription}"`
                                            }
                                        }));
                                        return;
                                    }
                                }
                            }
                            handleInteractivePermission({
                                ctx,
                                description,
                                result,
                                awaitAutomatedChecksBeforeDialog: appState.toolPermissionContext.awaitAutomatedChecksBeforeDialog,
                                bridgeCallbacks: feature("BRIDGE_MODE") ? appState.replBridgePermissionCallbacks : undefined,
                                channelCallbacks: feature("KAIROS") || feature("KAIROS_CHANNELS") ? appState.channelPermissionCallbacks : undefined
                            }, resolve);
                            return;
                        }
                }
            }).catch(error => {
                if (error instanceof AbortError || error instanceof APIUserAbortError) {
                    logForDebugging(`Permission check threw ${error.constructor.name} for tool=${tool.name}: ${error.message}`);
                    ctx.logCancelled();
                    resolve(ctx.cancelAndAbort(undefined, true));
                }
                else {
                    logError(error);
                    resolve(ctx.cancelAndAbort(undefined, true));
                }
            }).finally(() => {
                clearClassifierChecking(toolUseID);
            });
        });
        $[0] = setToolPermissionContext;
        $[1] = setToolUseConfirmQueue;
        $[2] = t0;
    }
    else {
        t0 = $[2];
    }
    return t0;
}
function _temp2(res) {
    return setTimeout(res, 2000, {
        type: "timeout"
    });
}
function _temp(r) {
    return {
        type: "result",
        result: r
    };
}
export default useCanUseTool;
