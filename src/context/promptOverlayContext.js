import { jsx as _jsx } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
/**
 * Portal for content that floats above the prompt so it escapes
 * FullscreenLayout's bottom-slot `overflowY:hidden` clip.
 *
 * The clip is load-bearing (CC-668: tall pastes squash the ScrollBox
 * without it), but floating overlays use `position:absolute
 * bottom="100%"` to float above the prompt — and Ink's clip stack
 * intersects ALL descendants, so they were clipped to ~1 row.
 *
 * Two channels:
 * - `useSetPromptOverlay` — slash-command suggestion data (structured,
 *   written by PromptInputFooter)
 * - `useSetPromptOverlayDialog` — arbitrary dialog node (e.g.
 *   AutoModeOptInDialog, written by PromptInput)
 *
 * FullscreenLayout reads both and renders them outside the clipped slot.
 *
 * Split into data/setter context pairs so writers never re-render on
 * their own writes — the setter contexts are stable.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
const DataContext = createContext(null);
const SetContext = createContext(null);
const DialogContext = createContext(null);
const SetDialogContext = createContext(null);
export function PromptOverlayProvider(t0) {
    const $ = _c(6);
    const { children } = t0;
    const [data, setData] = useState(null);
    const [dialog, setDialog] = useState(null);
    let t1;
    if ($[0] !== children || $[1] !== dialog) {
        t1 = _jsx(DialogContext.Provider, { value: dialog, children: children });
        $[0] = children;
        $[1] = dialog;
        $[2] = t1;
    }
    else {
        t1 = $[2];
    }
    let t2;
    if ($[3] !== data || $[4] !== t1) {
        t2 = _jsx(SetContext.Provider, { value: setData, children: _jsx(SetDialogContext.Provider, { value: setDialog, children: _jsx(DataContext.Provider, { value: data, children: t1 }) }) });
        $[3] = data;
        $[4] = t1;
        $[5] = t2;
    }
    else {
        t2 = $[5];
    }
    return t2;
}
export function usePromptOverlay() {
    return useContext(DataContext);
}
export function usePromptOverlayDialog() {
    return useContext(DialogContext);
}
/**
 * Register suggestion data for the floating overlay. Clears on unmount.
 * No-op outside the provider (non-fullscreen renders inline instead).
 */
export function useSetPromptOverlay(data) {
    const $ = _c(4);
    const set = useContext(SetContext);
    let t0;
    let t1;
    if ($[0] !== data || $[1] !== set) {
        t0 = () => {
            if (!set) {
                return;
            }
            set(data);
            return () => set(null);
        };
        t1 = [set, data];
        $[0] = data;
        $[1] = set;
        $[2] = t0;
        $[3] = t1;
    }
    else {
        t0 = $[2];
        t1 = $[3];
    }
    useEffect(t0, t1);
}
/**
 * Register a dialog node to float above the prompt. Clears on unmount.
 * No-op outside the provider (non-fullscreen renders inline instead).
 */
export function useSetPromptOverlayDialog(node) {
    const $ = _c(4);
    const set = useContext(SetDialogContext);
    let t0;
    let t1;
    if ($[0] !== node || $[1] !== set) {
        t0 = () => {
            if (!set) {
                return;
            }
            set(node);
            return () => set(null);
        };
        t1 = [set, node];
        $[0] = node;
        $[1] = set;
        $[2] = t0;
        $[3] = t1;
    }
    else {
        t0 = $[2];
        t1 = $[3];
    }
    useEffect(t0, t1);
}
