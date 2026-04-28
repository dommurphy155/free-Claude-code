import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import figures from 'figures';
import * as React from 'react';
import { Box, Text } from 'src/ink.js';
import { AGENT_COLOR_TO_THEME_COLOR, AGENT_COLORS } from 'src/tools/AgentTool/agentColorManager.js';
import { getTeammateColor } from 'src/utils/teammate.js';
import { isAgentSwarmsEnabled } from '../../utils/agentSwarmsEnabled.js';
/**
 * Gets the theme color key for the teammate's assigned color.
 * Returns undefined if not a teammate or if the color is invalid.
 */
function getTeammateThemeColor() {
    if (!isAgentSwarmsEnabled()) {
        return undefined;
    }
    const colorName = getTeammateColor();
    if (!colorName) {
        return undefined;
    }
    if (AGENT_COLORS.includes(colorName)) {
        return AGENT_COLOR_TO_THEME_COLOR[colorName];
    }
    return undefined;
}
/**
 * Renders the prompt character (❯).
 * Teammate color overrides the default color when set.
 */
function PromptChar(t0) {
    const $ = _c(3);
    const { isLoading, themeColor } = t0;
    const teammateColor = themeColor;
    const color = teammateColor ?? (false ? "subtle" : undefined);
    let t1;
    if ($[0] !== color || $[1] !== isLoading) {
        t1 = _jsxs(Text, { color: color, dimColor: isLoading, children: [figures.pointer, "\u00A0"] });
        $[0] = color;
        $[1] = isLoading;
        $[2] = t1;
    }
    else {
        t1 = $[2];
    }
    return t1;
}
export function PromptInputModeIndicator(t0) {
    const $ = _c(6);
    const { mode, isLoading, viewingAgentName, viewingAgentColor } = t0;
    let t1;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = getTeammateThemeColor();
        $[0] = t1;
    }
    else {
        t1 = $[0];
    }
    const teammateColor = t1;
    const viewedTeammateThemeColor = viewingAgentColor ? AGENT_COLOR_TO_THEME_COLOR[viewingAgentColor] : undefined;
    let t2;
    if ($[1] !== isLoading || $[2] !== mode || $[3] !== viewedTeammateThemeColor || $[4] !== viewingAgentName) {
        t2 = _jsx(Box, { alignItems: "flex-start", alignSelf: "flex-start", flexWrap: "nowrap", justifyContent: "flex-start", children: viewingAgentName ? _jsx(PromptChar, { isLoading: isLoading, themeColor: viewedTeammateThemeColor }) : mode === "bash" ? _jsx(Text, { color: "bashBorder", dimColor: isLoading, children: "!\u00A0" }) : _jsx(PromptChar, { isLoading: isLoading, themeColor: isAgentSwarmsEnabled() ? teammateColor : undefined }) });
        $[1] = isLoading;
        $[2] = mode;
        $[3] = viewedTeammateThemeColor;
        $[4] = viewingAgentName;
        $[5] = t2;
    }
    else {
        t2 = $[5];
    }
    return t2;
}
