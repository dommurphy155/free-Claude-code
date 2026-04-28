import { jsx as _jsx } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import { feature } from 'bun:bundle';
import * as React from 'react';
import { useSettings } from '../../hooks/useSettings.js';
import { Box, Text, useAnimationFrame } from '../../ink.js';
import { interpolateColor, toRGBColor } from '../Spinner/utils.js';
// Processing shimmer colors: dim gray to lighter gray (matches ThinkingShimmerText)
const PROCESSING_DIM = {
    r: 153,
    g: 153,
    b: 153
};
const PROCESSING_BRIGHT = {
    r: 185,
    g: 185,
    b: 185
};
const PULSE_PERIOD_S = 2; // 2 second period for all pulsing animations
export function VoiceIndicator(props) {
    const $ = _c(2);
    if (!feature("VOICE_MODE")) {
        return null;
    }
    let t0;
    if ($[0] !== props) {
        t0 = _jsx(VoiceIndicatorImpl, { ...props });
        $[0] = props;
        $[1] = t0;
    }
    else {
        t0 = $[1];
    }
    return t0;
}
function VoiceIndicatorImpl(t0) {
    const $ = _c(2);
    const { voiceState } = t0;
    switch (voiceState) {
        case "recording":
            {
                let t1;
                if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
                    t1 = _jsx(Text, { dimColor: true, children: "listening\u2026" });
                    $[0] = t1;
                }
                else {
                    t1 = $[0];
                }
                return t1;
            }
        case "processing":
            {
                let t1;
                if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
                    t1 = _jsx(ProcessingShimmer, {});
                    $[1] = t1;
                }
                else {
                    t1 = $[1];
                }
                return t1;
            }
        case "idle":
            {
                return null;
            }
    }
}
// Static — the warmup window (~120ms between space #2 and activation)
// is too brief for a 1s-period shimmer to register, and a 50ms animation
// timer here runs concurrently with auto-repeat spaces arriving every
// 30-80ms, compounding re-renders during an already-busy window.
export function VoiceWarmupHint() {
    const $ = _c(1);
    if (!feature("VOICE_MODE")) {
        return null;
    }
    let t0;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = _jsx(Text, { dimColor: true, children: "keep holding\u2026" });
        $[0] = t0;
    }
    else {
        t0 = $[0];
    }
    return t0;
}
function ProcessingShimmer() {
    const $ = _c(8);
    const settings = useSettings();
    const reducedMotion = settings.prefersReducedMotion ?? false;
    const [ref, time] = useAnimationFrame(reducedMotion ? null : 50);
    if (reducedMotion) {
        let t0;
        if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
            t0 = _jsx(Text, { color: "warning", children: "Voice: processing\u2026" });
            $[0] = t0;
        }
        else {
            t0 = $[0];
        }
        return t0;
    }
    const elapsedSec = time / 1000;
    const opacity = (Math.sin(elapsedSec * Math.PI * 2 / PULSE_PERIOD_S) + 1) / 2;
    let t0;
    if ($[1] !== opacity) {
        t0 = toRGBColor(interpolateColor(PROCESSING_DIM, PROCESSING_BRIGHT, opacity));
        $[1] = opacity;
        $[2] = t0;
    }
    else {
        t0 = $[2];
    }
    const color = t0;
    let t1;
    if ($[3] !== color) {
        t1 = _jsx(Text, { color: color, children: "Voice: processing\u2026" });
        $[3] = color;
        $[4] = t1;
    }
    else {
        t1 = $[4];
    }
    let t2;
    if ($[5] !== ref || $[6] !== t1) {
        t2 = _jsx(Box, { ref: ref, children: t1 });
        $[5] = ref;
        $[6] = t1;
        $[7] = t2;
    }
    else {
        t2 = $[7];
    }
    return t2;
}
