import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import figures from 'figures';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useTerminalSize } from '../../../hooks/useTerminalSize.js';
import { Box, Text } from '../../../ink.js';
import { useKeybinding, useKeybindings } from '../../../keybindings/useKeybinding.js';
import { useAppState } from '../../../state/AppState.js';
import { getExternalEditor } from '../../../utils/editor.js';
import { toIDEDisplayName } from '../../../utils/ide.js';
import { editPromptInEditor } from '../../../utils/promptEditor.js';
import { Divider } from '../../design-system/Divider.js';
import TextInput from '../../TextInput.js';
import { PermissionRequestTitle } from '../PermissionRequestTitle.js';
import { PreviewBox } from './PreviewBox.js';
import { QuestionNavigationBar } from './QuestionNavigationBar.js';
/**
 * A side-by-side question view for questions with preview content.
 * Displays a vertical option list on the left with a preview panel on the right.
 */
export function PreviewQuestionView({ question, questions, currentQuestionIndex, answers, questionStates, hideSubmitTab = false, minContentHeight, minContentWidth, onUpdateQuestionState, onAnswer, onTextInputFocus, onCancel, onTabPrev, onTabNext, onRespondToClaude, onFinishPlanInterview }) {
    const isInPlanMode = useAppState(s => s.toolPermissionContext.mode) === 'plan';
    const [isFooterFocused, setIsFooterFocused] = useState(false);
    const [footerIndex, setFooterIndex] = useState(0);
    const [isInNotesInput, setIsInNotesInput] = useState(false);
    const [cursorOffset, setCursorOffset] = useState(0);
    const editor = getExternalEditor();
    const editorName = editor ? toIDEDisplayName(editor) : null;
    const questionText = question.question;
    const questionState = questionStates[questionText];
    // Only real options — no "Other" for preview questions
    const allOptions = question.options;
    // Track which option is focused (for preview display)
    const [focusedIndex, setFocusedIndex] = useState(0);
    // Reset focusedIndex when navigating to a different question
    const prevQuestionText = useRef(questionText);
    if (prevQuestionText.current !== questionText) {
        prevQuestionText.current = questionText;
        const selected = questionState?.selectedValue;
        const idx = selected ? allOptions.findIndex(opt => opt.label === selected) : -1;
        setFocusedIndex(idx >= 0 ? idx : 0);
    }
    const focusedOption = allOptions[focusedIndex];
    const selectedValue = questionState?.selectedValue;
    const notesValue = questionState?.textInputValue || '';
    const handleSelectOption = useCallback((index) => {
        const option = allOptions[index];
        if (!option)
            return;
        setFocusedIndex(index);
        onUpdateQuestionState(questionText, {
            selectedValue: option.label
        }, false);
        onAnswer(questionText, option.label);
    }, [allOptions, questionText, onUpdateQuestionState, onAnswer]);
    const handleNavigate = useCallback((direction) => {
        if (isInNotesInput)
            return;
        let newIndex;
        if (typeof direction === 'number') {
            newIndex = direction;
        }
        else if (direction === 'up') {
            newIndex = focusedIndex > 0 ? focusedIndex - 1 : focusedIndex;
        }
        else {
            newIndex = focusedIndex < allOptions.length - 1 ? focusedIndex + 1 : focusedIndex;
        }
        if (newIndex >= 0 && newIndex < allOptions.length) {
            setFocusedIndex(newIndex);
        }
    }, [focusedIndex, allOptions.length, isInNotesInput]);
    // Handle ctrl+g to open external editor for notes
    useKeybinding('chat:externalEditor', async () => {
        const currentValue = questionState?.textInputValue || '';
        const result = await editPromptInEditor(currentValue);
        if (result.content !== null && result.content !== currentValue) {
            onUpdateQuestionState(questionText, {
                textInputValue: result.content
            }, false);
        }
    }, {
        context: 'Chat',
        isActive: isInNotesInput && !!editor
    });
    // Handle left/right arrow and tab for question navigation.
    // This must be in the child component (not just the parent) because child useInput
    // handlers register first on the event emitter and fire before parent handlers.
    // Without this, the parent's useKeybindings may not fire reliably depending on
    // listener ordering in the event emitter.
    useKeybindings({
        'tabs:previous': () => onTabPrev?.(),
        'tabs:next': () => onTabNext?.()
    }, {
        context: 'Tabs',
        isActive: !isInNotesInput && !isFooterFocused
    });
    // Re-submit the answer (plain label) when exiting notes input.
    // Notes are stored in questionStates and collected at submit time via annotations.
    const handleNotesExit = useCallback(() => {
        setIsInNotesInput(false);
        onTextInputFocus(false);
        if (selectedValue) {
            onAnswer(questionText, selectedValue);
        }
    }, [selectedValue, questionText, onAnswer, onTextInputFocus]);
    const handleDownFromPreview = useCallback(() => {
        setIsFooterFocused(true);
    }, []);
    const handleUpFromFooter = useCallback(() => {
        setIsFooterFocused(false);
    }, []);
    // Handle keyboard input for option/footer/notes navigation.
    // Always active — the handler routes internally based on isFooterFocused/isInNotesInput.
    const handleKeyDown = useCallback((e) => {
        if (isFooterFocused) {
            if (e.key === 'up' || e.ctrl && e.key === 'p') {
                e.preventDefault();
                if (footerIndex === 0) {
                    handleUpFromFooter();
                }
                else {
                    setFooterIndex(0);
                }
                return;
            }
            if (e.key === 'down' || e.ctrl && e.key === 'n') {
                e.preventDefault();
                if (isInPlanMode && footerIndex === 0) {
                    setFooterIndex(1);
                }
                return;
            }
            if (e.key === 'return') {
                e.preventDefault();
                if (footerIndex === 0) {
                    onRespondToClaude();
                }
                else {
                    onFinishPlanInterview();
                }
                return;
            }
            if (e.key === 'escape') {
                e.preventDefault();
                onCancel();
            }
            return;
        }
        if (isInNotesInput) {
            // In notes input mode, handle escape to exit back to option navigation
            if (e.key === 'escape') {
                e.preventDefault();
                handleNotesExit();
            }
            return;
        }
        // Handle option navigation (vertical)
        if (e.key === 'up' || e.ctrl && e.key === 'p') {
            e.preventDefault();
            if (focusedIndex > 0) {
                handleNavigate('up');
            }
        }
        else if (e.key === 'down' || e.ctrl && e.key === 'n') {
            e.preventDefault();
            if (focusedIndex === allOptions.length - 1) {
                // At bottom of options, go to footer
                handleDownFromPreview();
            }
            else {
                handleNavigate('down');
            }
        }
        else if (e.key === 'return') {
            e.preventDefault();
            handleSelectOption(focusedIndex);
        }
        else if (e.key === 'n' && !e.ctrl && !e.meta) {
            // Press 'n' to focus the notes input
            e.preventDefault();
            setIsInNotesInput(true);
            onTextInputFocus(true);
        }
        else if (e.key === 'escape') {
            e.preventDefault();
            onCancel();
        }
        else if (e.key.length === 1 && e.key >= '1' && e.key <= '9') {
            e.preventDefault();
            const idx_0 = parseInt(e.key, 10) - 1;
            if (idx_0 < allOptions.length) {
                handleNavigate(idx_0);
            }
        }
    }, [isFooterFocused, footerIndex, isInPlanMode, isInNotesInput, focusedIndex, allOptions.length, handleUpFromFooter, handleDownFromPreview, handleNavigate, handleSelectOption, handleNotesExit, onRespondToClaude, onFinishPlanInterview, onCancel, onTextInputFocus]);
    const previewContent = focusedOption?.preview || null;
    // The right panel's available width is terminal minus the left panel and gap.
    const LEFT_PANEL_WIDTH = 30;
    const GAP = 4;
    const { columns } = useTerminalSize();
    const previewMaxWidth = columns - LEFT_PANEL_WIDTH - GAP;
    // Lines used within the content area that aren't preview content:
    // 1: marginTop on side-by-side box
    // 2: PreviewBox borders (top + bottom)
    // 2: notes section (marginTop=1 + text)
    // 2: footer section (marginTop=1 + divider)
    // 1: "Chat about this" line
    // 1: plan mode line (may or may not show)
    // 2: help text (marginTop=1 + text)
    const PREVIEW_OVERHEAD = 11;
    // Compute the max lines available for preview content from the parent's
    // height budget to prevent terminal overflow. We do NOT pad shorter options
    // to match the tallest — the outer box's minHeight handles cross-question
    // layout consistency, and within-question shifts are acceptable.
    const previewMaxLines = useMemo(() => {
        return minContentHeight ? Math.max(1, minContentHeight - PREVIEW_OVERHEAD) : undefined;
    }, [minContentHeight]);
    return _jsxs(Box, { flexDirection: "column", marginTop: 1, tabIndex: 0, autoFocus: true, onKeyDown: handleKeyDown, children: [_jsx(Divider, { color: "inactive" }), _jsxs(Box, { flexDirection: "column", paddingTop: 0, children: [_jsx(QuestionNavigationBar, { questions: questions, currentQuestionIndex: currentQuestionIndex, answers: answers, hideSubmitTab: hideSubmitTab }), _jsx(PermissionRequestTitle, { title: question.question, color: 'text' }), _jsxs(Box, { flexDirection: "column", minHeight: minContentHeight, children: [_jsxs(Box, { marginTop: 1, flexDirection: "row", gap: 4, children: [_jsx(Box, { flexDirection: "column", width: 30, children: allOptions.map((option_0, index_0) => {
                                            const isFocused = focusedIndex === index_0;
                                            const isSelected = selectedValue === option_0.label;
                                            return _jsxs(Box, { flexDirection: "row", children: [isFocused ? _jsx(Text, { color: "suggestion", children: figures.pointer }) : _jsx(Text, { children: " " }), _jsxs(Text, { dimColor: true, children: [" ", index_0 + 1, "."] }), _jsxs(Text, { color: isSelected ? 'success' : isFocused ? 'suggestion' : undefined, bold: isFocused, children: [' ', option_0.label] }), isSelected && _jsxs(Text, { color: "success", children: [" ", figures.tick] })] }, option_0.label);
                                        }) }), _jsxs(Box, { flexDirection: "column", flexGrow: 1, children: [_jsx(PreviewBox, { content: previewContent || 'No preview available', maxLines: previewMaxLines, minWidth: minContentWidth, maxWidth: previewMaxWidth }), _jsxs(Box, { marginTop: 1, flexDirection: "row", gap: 1, children: [_jsx(Text, { color: "suggestion", children: "Notes:" }), isInNotesInput ? _jsx(TextInput, { value: notesValue, placeholder: "Add notes on this design\u2026", onChange: value => {
                                                            onUpdateQuestionState(questionText, {
                                                                textInputValue: value
                                                            }, false);
                                                        }, onSubmit: handleNotesExit, onExit: handleNotesExit, focus: true, showCursor: true, columns: 60, cursorOffset: cursorOffset, onChangeCursorOffset: setCursorOffset }) : _jsx(Text, { dimColor: true, italic: true, children: notesValue || 'press n to add notes' })] })] })] }), _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Divider, { color: "inactive" }), _jsxs(Box, { flexDirection: "row", gap: 1, children: [isFooterFocused && footerIndex === 0 ? _jsx(Text, { color: "suggestion", children: figures.pointer }) : _jsx(Text, { children: " " }), _jsx(Text, { color: isFooterFocused && footerIndex === 0 ? 'suggestion' : undefined, children: "Chat about this" })] }), isInPlanMode && _jsxs(Box, { flexDirection: "row", gap: 1, children: [isFooterFocused && footerIndex === 1 ? _jsx(Text, { color: "suggestion", children: figures.pointer }) : _jsx(Text, { children: " " }), _jsx(Text, { color: isFooterFocused && footerIndex === 1 ? 'suggestion' : undefined, children: "Skip interview and plan immediately" })] })] }), _jsx(Box, { marginTop: 1, children: _jsxs(Text, { color: "inactive", dimColor: true, children: ["Enter to select \u00B7 ", figures.arrowUp, "/", figures.arrowDown, " to navigate \u00B7 n to add notes", questions.length > 1 && _jsx(_Fragment, { children: " \u00B7 Tab to switch questions" }), isInNotesInput && editorName && _jsxs(_Fragment, { children: [" \u00B7 ctrl+g to edit in ", editorName] }), ' ', "\u00B7 Esc to cancel"] }) })] })] })] });
}
