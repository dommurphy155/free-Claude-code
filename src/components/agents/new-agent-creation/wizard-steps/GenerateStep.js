import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { APIUserAbortError } from '@anthropic-ai/sdk';
import React, { useCallback, useRef, useState } from 'react';
import { useMainLoopModel } from '../../../../hooks/useMainLoopModel.js';
import { Box, Text } from '../../../../ink.js';
import { useKeybinding } from '../../../../keybindings/useKeybinding.js';
import { createAbortController } from '../../../../utils/abortController.js';
import { editPromptInEditor } from '../../../../utils/promptEditor.js';
import { ConfigurableShortcutHint } from '../../../ConfigurableShortcutHint.js';
import { Byline } from '../../../design-system/Byline.js';
import { Spinner } from '../../../Spinner.js';
import TextInput from '../../../TextInput.js';
import { useWizard } from '../../../wizard/index.js';
import { WizardDialogLayout } from '../../../wizard/WizardDialogLayout.js';
import { generateAgent } from '../../generateAgent.js';
export function GenerateStep() {
    const { updateWizardData, goBack, goToStep, wizardData } = useWizard();
    const [prompt, setPrompt] = useState(wizardData.generationPrompt || '');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [cursorOffset, setCursorOffset] = useState(prompt.length);
    const model = useMainLoopModel();
    const abortControllerRef = useRef(null);
    // Cancel generation when escape pressed during generation
    const handleCancelGeneration = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setIsGenerating(false);
            setError('Generation cancelled');
        }
    }, []);
    // Use Settings context so 'n' key doesn't cancel (allows typing 'n' in prompt input)
    useKeybinding('confirm:no', handleCancelGeneration, {
        context: 'Settings',
        isActive: isGenerating
    });
    const handleExternalEditor = useCallback(async () => {
        const result = await editPromptInEditor(prompt);
        if (result.content !== null) {
            setPrompt(result.content);
            setCursorOffset(result.content.length);
        }
    }, [prompt]);
    useKeybinding('chat:externalEditor', handleExternalEditor, {
        context: 'Chat',
        isActive: !isGenerating
    });
    // Go back when escape pressed while not generating
    const handleGoBack = useCallback(() => {
        updateWizardData({
            generationPrompt: '',
            agentType: '',
            systemPrompt: '',
            whenToUse: '',
            generatedAgent: undefined,
            wasGenerated: false
        });
        setPrompt('');
        setError(null);
        goBack();
    }, [updateWizardData, goBack]);
    // Use Settings context so 'n' key doesn't cancel (allows typing 'n' in prompt input)
    useKeybinding('confirm:no', handleGoBack, {
        context: 'Settings',
        isActive: !isGenerating
    });
    const handleGenerate = async () => {
        const trimmedPrompt = prompt.trim();
        if (!trimmedPrompt) {
            setError('Please describe what the agent should do');
            return;
        }
        setError(null);
        setIsGenerating(true);
        updateWizardData({
            generationPrompt: trimmedPrompt,
            isGenerating: true
        });
        // Create abort controller for this generation
        const controller = createAbortController();
        abortControllerRef.current = controller;
        try {
            const generated = await generateAgent(trimmedPrompt, model, [], controller.signal);
            updateWizardData({
                agentType: generated.identifier,
                whenToUse: generated.whenToUse,
                systemPrompt: generated.systemPrompt,
                generatedAgent: generated,
                isGenerating: false,
                wasGenerated: true
            });
            // Skip directly to ToolsStep (index 6) - matching original flow
            goToStep(6);
        }
        catch (err) {
            // Don't show error if it was cancelled (already set in escape handler)
            if (err instanceof APIUserAbortError) {
                // User cancelled - no error to show
            }
            else if (err instanceof Error && !err.message.includes('No assistant message found')) {
                setError(err.message || 'Failed to generate agent');
            }
            updateWizardData({
                isGenerating: false
            });
        }
        finally {
            setIsGenerating(false);
            abortControllerRef.current = null;
        }
    };
    const subtitle = 'Describe what this agent should do and when it should be used (be comprehensive for best results)';
    if (isGenerating) {
        return _jsx(WizardDialogLayout, { subtitle: subtitle, footerText: _jsx(ConfigurableShortcutHint, { action: "confirm:no", context: "Settings", fallback: "Esc", description: "cancel" }), children: _jsxs(Box, { flexDirection: "row", alignItems: "center", children: [_jsx(Spinner, {}), _jsx(Text, { color: "suggestion", children: " Generating agent from description..." })] }) });
    }
    return _jsx(WizardDialogLayout, { subtitle: subtitle, footerText: _jsxs(Byline, { children: [_jsx(ConfigurableShortcutHint, { action: "confirm:yes", context: "Confirmation", fallback: "Enter", description: "submit" }), _jsx(ConfigurableShortcutHint, { action: "chat:externalEditor", context: "Chat", fallback: "ctrl+g", description: "open in editor" }), _jsx(ConfigurableShortcutHint, { action: "confirm:no", context: "Settings", fallback: "Esc", description: "go back" })] }), children: _jsxs(Box, { flexDirection: "column", children: [error && _jsx(Box, { marginBottom: 1, children: _jsx(Text, { color: "error", children: error }) }), _jsx(TextInput, { value: prompt, onChange: setPrompt, onSubmit: handleGenerate, placeholder: "e.g., Help me write unit tests for my code...", columns: 80, cursorOffset: cursorOffset, onChangeCursorOffset: setCursorOffset, focus: true, showCursor: true })] }) });
}
