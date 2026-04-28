import { jsx as _jsx } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import React, { createContext, useContext } from 'react';
const FpsMetricsContext = createContext(undefined);
export function FpsMetricsProvider(t0) {
    const $ = _c(3);
    const { getFpsMetrics, children } = t0;
    let t1;
    if ($[0] !== children || $[1] !== getFpsMetrics) {
        t1 = _jsx(FpsMetricsContext.Provider, { value: getFpsMetrics, children: children });
        $[0] = children;
        $[1] = getFpsMetrics;
        $[2] = t1;
    }
    else {
        t1 = $[2];
    }
    return t1;
}
export function useFpsMetrics() {
    return useContext(FpsMetricsContext);
}
