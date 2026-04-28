import { jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import figures from 'figures';
import * as React from 'react';
import { Box, Text } from '../../ink.js';
import { getPluginTrustMessage } from '../../utils/plugins/marketplaceHelpers.js';
export function PluginTrustWarning() {
    const $ = _c(3);
    let t0;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = getPluginTrustMessage();
        $[0] = t0;
    }
    else {
        t0 = $[0];
    }
    const customMessage = t0;
    let t1;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = _jsxs(Text, { color: "claude", children: [figures.warning, " "] });
        $[1] = t1;
    }
    else {
        t1 = $[1];
    }
    let t2;
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
        t2 = _jsxs(Box, { marginBottom: 1, children: [t1, _jsxs(Text, { dimColor: true, italic: true, children: ["Make sure you trust a plugin before installing, updating, or using it. Anthropic does not control what MCP servers, files, or other software are included in plugins and cannot verify that they will work as intended or that they won't change. See each plugin's homepage for more information.", customMessage ? ` ${customMessage}` : ""] })] });
        $[2] = t2;
    }
    else {
        t2 = $[2];
    }
    return t2;
}
