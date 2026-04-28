import { jsx as _jsx } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import React from 'react';
import { FpsMetricsProvider } from '../context/fpsMetrics.js';
import { StatsProvider } from '../context/stats.js';
import { AppStateProvider } from '../state/AppState.js';
import { onChangeAppState } from '../state/onChangeAppState.js';
/**
 * Top-level wrapper for interactive sessions.
 * Provides FPS metrics, stats context, and app state to the component tree.
 */
export function App(t0) {
    const $ = _c(9);
    const { getFpsMetrics, stats, initialState, children } = t0;
    let t1;
    if ($[0] !== children || $[1] !== initialState) {
        t1 = _jsx(AppStateProvider, { initialState: initialState, onChangeAppState: onChangeAppState, children: children });
        $[0] = children;
        $[1] = initialState;
        $[2] = t1;
    }
    else {
        t1 = $[2];
    }
    let t2;
    if ($[3] !== stats || $[4] !== t1) {
        t2 = _jsx(StatsProvider, { store: stats, children: t1 });
        $[3] = stats;
        $[4] = t1;
        $[5] = t2;
    }
    else {
        t2 = $[5];
    }
    let t3;
    if ($[6] !== getFpsMetrics || $[7] !== t2) {
        t3 = _jsx(FpsMetricsProvider, { getFpsMetrics: getFpsMetrics, children: t2 });
        $[6] = getFpsMetrics;
        $[7] = t2;
        $[8] = t3;
    }
    else {
        t3 = $[8];
    }
    return t3;
}
