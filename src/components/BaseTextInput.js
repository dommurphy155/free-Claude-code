import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import React from 'react';
import { renderPlaceholder } from '../hooks/renderPlaceholder.js';
import { usePasteHandler } from '../hooks/usePasteHandler.js';
import { useDeclaredCursor } from '../ink/hooks/use-declared-cursor.js';
import { Ansi, Box, Text, useInput } from '../ink.js';
import { HighlightedInput } from './PromptInput/ShimmeredInput.js';
/**
 * A base component for text inputs that handles rendering and basic input
 */
export function BaseTextInput(t0) {
    const $ = _c(14);
    const { inputState, children, terminalFocus, invert, hidePlaceholderText, ...props } = t0;
    const { onInput, renderedValue, cursorLine, cursorColumn } = inputState;
    const t1 = Boolean(props.focus && props.showCursor && terminalFocus);
    let t2;
    if ($[0] !== cursorColumn || $[1] !== cursorLine || $[2] !== t1) {
        t2 = {
            line: cursorLine,
            column: cursorColumn,
            active: t1
        };
        $[0] = cursorColumn;
        $[1] = cursorLine;
        $[2] = t1;
        $[3] = t2;
    }
    else {
        t2 = $[3];
    }
    const cursorRef = useDeclaredCursor(t2);
    const { wrappedOnInput, isPasting: t3 } = usePasteHandler({
        onPaste: props.onPaste,
        onInput: (input, key) => {
            if (isPasting && key.return) {
                return;
            }
            onInput(input, key);
        },
        onImagePaste: props.onImagePaste
    });
    const isPasting = t3;
    const { onIsPastingChange } = props;
    React.useEffect(() => {
        if (onIsPastingChange) {
            onIsPastingChange(isPasting);
        }
    }, [isPasting, onIsPastingChange]);
    const { showPlaceholder, renderedPlaceholder } = renderPlaceholder({
        placeholder: props.placeholder,
        value: props.value,
        showCursor: props.showCursor,
        focus: props.focus,
        terminalFocus,
        invert,
        hidePlaceholderText
    });
    useInput(wrappedOnInput, {
        isActive: props.focus
    });
    const commandWithoutArgs = props.value && props.value.trim().indexOf(" ") === -1 || props.value && props.value.endsWith(" ");
    const showArgumentHint = Boolean(props.argumentHint && props.value && commandWithoutArgs && props.value.startsWith("/"));
    const cursorFiltered = props.showCursor && props.highlights ? props.highlights.filter(h => h.dimColor || props.cursorOffset < h.start || props.cursorOffset >= h.end) : props.highlights;
    const { viewportCharOffset, viewportCharEnd } = inputState;
    const filteredHighlights = cursorFiltered && viewportCharOffset > 0 ? cursorFiltered.filter(h_0 => h_0.end > viewportCharOffset && h_0.start < viewportCharEnd).map(h_1 => ({
        ...h_1,
        start: Math.max(0, h_1.start - viewportCharOffset),
        end: h_1.end - viewportCharOffset
    })) : cursorFiltered;
    const hasHighlights = filteredHighlights && filteredHighlights.length > 0;
    if (hasHighlights) {
        return _jsxs(Box, { ref: cursorRef, children: [_jsx(HighlightedInput, { text: renderedValue, highlights: filteredHighlights }), showArgumentHint && _jsxs(Text, { dimColor: true, children: [props.value?.endsWith(" ") ? "" : " ", props.argumentHint] }), children] });
    }
    const T0 = Box;
    const T1 = Text;
    const t4 = "truncate-end";
    const t5 = showPlaceholder && props.placeholderElement ? props.placeholderElement : showPlaceholder && renderedPlaceholder ? _jsx(Ansi, { children: renderedPlaceholder }) : _jsx(Ansi, { children: renderedValue });
    const t6 = showArgumentHint && _jsxs(Text, { dimColor: true, children: [props.value?.endsWith(" ") ? "" : " ", props.argumentHint] });
    let t7;
    if ($[4] !== T1 || $[5] !== children || $[6] !== props || $[7] !== t5 || $[8] !== t6) {
        t7 = _jsxs(T1, { wrap: t4, dimColor: props.dimColor, children: [t5, t6, children] });
        $[4] = T1;
        $[5] = children;
        $[6] = props;
        $[7] = t5;
        $[8] = t6;
        $[9] = t7;
    }
    else {
        t7 = $[9];
    }
    let t8;
    if ($[10] !== T0 || $[11] !== cursorRef || $[12] !== t7) {
        t8 = _jsx(T0, { ref: cursorRef, children: t7 });
        $[10] = T0;
        $[11] = cursorRef;
        $[12] = t7;
        $[13] = t8;
    }
    else {
        t8 = $[13];
    }
    return t8;
}
