import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Text, useTheme } from '../../../ink.js';
import { useKeybinding } from '../../../keybindings/useKeybinding.js';
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../../../services/analytics/growthbook.js';
import { logEvent } from '../../../services/analytics/index.js';
import { sanitizeToolNameForAnalytics } from '../../../services/analytics/metadata.js';
import { getDestructiveCommandWarning } from '../../../tools/PowerShellTool/destructiveCommandWarning.js';
import { PowerShellTool } from '../../../tools/PowerShellTool/PowerShellTool.js';
import { isAllowlistedCommand } from '../../../tools/PowerShellTool/readOnlyValidation.js';
import { getCompoundCommandPrefixesStatic } from '../../../utils/powershell/staticPrefix.js';
import { Select } from '../../CustomSelect/select.js';
import { usePermissionRequestLogging } from '../hooks.js';
import { PermissionDecisionDebugInfo } from '../PermissionDecisionDebugInfo.js';
import { PermissionDialog } from '../PermissionDialog.js';
import { PermissionExplainerContent, usePermissionExplainerUI } from '../PermissionExplanation.js';
import { PermissionRuleExplanation } from '../PermissionRuleExplanation.js';
import { useShellPermissionFeedback } from '../useShellPermissionFeedback.js';
import { logUnaryPermissionEvent } from '../utils.js';
import { powershellToolUseOptions } from './powershellToolUseOptions.js';
export function PowerShellPermissionRequest(props) {
    const { toolUseConfirm, toolUseContext, onDone, onReject, workerBadge } = props;
    const { command, description } = PowerShellTool.inputSchema.parse(toolUseConfirm.input);
    const [theme] = useTheme();
    const explainerState = usePermissionExplainerUI({
        toolName: toolUseConfirm.tool.name,
        toolInput: toolUseConfirm.input,
        toolDescription: toolUseConfirm.description,
        messages: toolUseContext.messages
    });
    const { yesInputMode, noInputMode, yesFeedbackModeEntered, noFeedbackModeEntered, acceptFeedback, rejectFeedback, setAcceptFeedback, setRejectFeedback, focusedOption, handleInputModeToggle, handleReject, handleFocus } = useShellPermissionFeedback({
        toolUseConfirm,
        onDone,
        onReject,
        explainerVisible: explainerState.visible
    });
    const destructiveWarning = getFeatureValue_CACHED_MAY_BE_STALE('tengu_destructive_command_warning', false) ? getDestructiveCommandWarning(command) : null;
    const [showPermissionDebug, setShowPermissionDebug] = useState(false);
    // Editable prefix — compute static prefix locally (no LLM call).
    // Initialize synchronously to the raw command for single-line commands so
    // the editable input renders immediately, then refine to the extracted prefix
    // once the AST parser resolves. Multiline commands (`# comment\n...`,
    // foreach loops) get undefined → powershellToolUseOptions:64 hides the
    // "don't ask again" option — those literals are one-time-use (settings
    // corpus shows 14 multiline rules, zero match twice). For compound commands,
    // computes a prefix per subcommand, excluding subcommands that are already
    // auto-allowed (read-only).
    const [editablePrefix, setEditablePrefix] = useState(command.includes('\n') ? undefined : command);
    const hasUserEditedPrefix = useRef(false);
    useEffect(() => {
        let cancelled = false;
        // Filter receives ParsedCommandElement — isAllowlistedCommand works from
        // element.name/nameType/args directly. isReadOnlyCommand(text) would need
        // to reparse (pwsh.exe spawn per subcommand) and returns false without the
        // full parsed AST, making the filter a no-op.
        getCompoundCommandPrefixesStatic(command, element => isAllowlistedCommand(element, element.text)).then(prefixes => {
            if (cancelled || hasUserEditedPrefix.current)
                return;
            if (prefixes.length > 0) {
                setEditablePrefix(`${prefixes[0]}:*`);
            }
        }).catch(() => { });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [command]);
    const onEditablePrefixChange = useCallback((value) => {
        hasUserEditedPrefix.current = true;
        setEditablePrefix(value);
    }, []);
    const unaryEvent = useMemo(() => ({
        completion_type: 'tool_use_single',
        language_name: 'none'
    }), []);
    usePermissionRequestLogging(toolUseConfirm, unaryEvent);
    const options = useMemo(() => powershellToolUseOptions({
        suggestions: toolUseConfirm.permissionResult.behavior === 'ask' ? toolUseConfirm.permissionResult.suggestions : undefined,
        onRejectFeedbackChange: setRejectFeedback,
        onAcceptFeedbackChange: setAcceptFeedback,
        yesInputMode,
        noInputMode,
        editablePrefix,
        onEditablePrefixChange
    }), [toolUseConfirm, yesInputMode, noInputMode, editablePrefix, onEditablePrefixChange]);
    // Toggle permission debug info with keybinding
    const handleToggleDebug = useCallback(() => {
        setShowPermissionDebug(prev => !prev);
    }, []);
    useKeybinding('permission:toggleDebug', handleToggleDebug, {
        context: 'Confirmation'
    });
    function onSelect(value) {
        // Map options to numeric values for analytics (strings not allowed in logEvent)
        const optionIndex = {
            yes: 1,
            'yes-apply-suggestions': 2,
            'yes-prefix-edited': 2,
            no: 3
        };
        logEvent('tengu_permission_request_option_selected', {
            option_index: optionIndex[value],
            explainer_visible: explainerState.visible
        });
        const toolNameForAnalytics = sanitizeToolNameForAnalytics(toolUseConfirm.tool.name);
        if (value === 'yes-prefix-edited') {
            const trimmedPrefix = (editablePrefix ?? '').trim();
            logUnaryPermissionEvent('tool_use_single', toolUseConfirm, 'accept');
            if (!trimmedPrefix) {
                toolUseConfirm.onAllow(toolUseConfirm.input, []);
            }
            else {
                const prefixUpdates = [{
                        type: 'addRules',
                        rules: [{
                                toolName: PowerShellTool.name,
                                ruleContent: trimmedPrefix
                            }],
                        behavior: 'allow',
                        destination: 'localSettings'
                    }];
                toolUseConfirm.onAllow(toolUseConfirm.input, prefixUpdates);
            }
            onDone();
            return;
        }
        switch (value) {
            case 'yes':
                {
                    const trimmedFeedback = acceptFeedback.trim();
                    logUnaryPermissionEvent('tool_use_single', toolUseConfirm, 'accept');
                    // Log accept submission with feedback context
                    logEvent('tengu_accept_submitted', {
                        toolName: toolNameForAnalytics,
                        isMcp: toolUseConfirm.tool.isMcp ?? false,
                        has_instructions: !!trimmedFeedback,
                        instructions_length: trimmedFeedback.length,
                        entered_feedback_mode: yesFeedbackModeEntered
                    });
                    toolUseConfirm.onAllow(toolUseConfirm.input, [], trimmedFeedback || undefined);
                    onDone();
                    break;
                }
            case 'yes-apply-suggestions':
                {
                    logUnaryPermissionEvent('tool_use_single', toolUseConfirm, 'accept');
                    // Extract suggestions if present (works for both 'ask' and 'passthrough' behaviors)
                    const permissionUpdates = 'suggestions' in toolUseConfirm.permissionResult ? toolUseConfirm.permissionResult.suggestions || [] : [];
                    toolUseConfirm.onAllow(toolUseConfirm.input, permissionUpdates);
                    onDone();
                    break;
                }
            case 'no':
                {
                    const trimmedFeedback = rejectFeedback.trim();
                    // Log reject submission with feedback context
                    logEvent('tengu_reject_submitted', {
                        toolName: toolNameForAnalytics,
                        isMcp: toolUseConfirm.tool.isMcp ?? false,
                        has_instructions: !!trimmedFeedback,
                        instructions_length: trimmedFeedback.length,
                        entered_feedback_mode: noFeedbackModeEntered
                    });
                    // Process rejection (with or without feedback)
                    handleReject(trimmedFeedback || undefined);
                    break;
                }
        }
    }
    return _jsxs(PermissionDialog, { workerBadge: workerBadge, title: "PowerShell command", children: [_jsxs(Box, { flexDirection: "column", paddingX: 2, paddingY: 1, children: [_jsx(Text, { dimColor: explainerState.visible, children: PowerShellTool.renderToolUseMessage({
                            command,
                            description
                        }, {
                            theme,
                            verbose: true
                        } // always show the full command
                        ) }), !explainerState.visible && _jsx(Text, { dimColor: true, children: toolUseConfirm.description }), _jsx(PermissionExplainerContent, { visible: explainerState.visible, promise: explainerState.promise })] }), showPermissionDebug ? _jsxs(_Fragment, { children: [_jsx(PermissionDecisionDebugInfo, { permissionResult: toolUseConfirm.permissionResult, toolName: "PowerShell" }), toolUseContext.options.debug && _jsx(Box, { justifyContent: "flex-end", marginTop: 1, children: _jsx(Text, { dimColor: true, children: "Ctrl-D to hide debug info" }) })] }) : _jsxs(_Fragment, { children: [_jsxs(Box, { flexDirection: "column", children: [_jsx(PermissionRuleExplanation, { permissionResult: toolUseConfirm.permissionResult, toolType: "command" }), destructiveWarning && _jsx(Box, { marginBottom: 1, children: _jsx(Text, { color: "warning", children: destructiveWarning }) }), _jsx(Text, { children: "Do you want to proceed?" }), _jsx(Select, { options: options, inlineDescriptions: true, onChange: onSelect, onCancel: () => handleReject(), onFocus: handleFocus, onInputModeToggle: handleInputModeToggle })] }), _jsxs(Box, { justifyContent: "space-between", marginTop: 1, children: [_jsxs(Text, { dimColor: true, children: ["Esc to cancel", (focusedOption === 'yes' && !yesInputMode || focusedOption === 'no' && !noInputMode) && ' · Tab to amend', explainerState.enabled && ` · ctrl+e to ${explainerState.visible ? 'hide' : 'explain'}`] }), toolUseContext.options.debug && _jsx(Text, { dimColor: true, children: "Ctrl+d to show debug info" })] })] })] });
}
