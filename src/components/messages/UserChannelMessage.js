import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import * as React from 'react';
import { CHANNEL_ARROW } from '../../constants/figures.js';
import { CHANNEL_TAG } from '../../constants/xml.js';
import { Box, Text } from '../../ink.js';
import { truncateToWidth } from '../../utils/format.js';
// <channel source="..." user="..." chat_id="...">content</channel>
// source is always first (wrapChannelMessage writes it), user is optional.
const CHANNEL_RE = new RegExp(`<${CHANNEL_TAG}\\s+source="([^"]+)"([^>]*)>\\n?([\\s\\S]*?)\\n?</${CHANNEL_TAG}>`);
const USER_ATTR_RE = /\buser="([^"]+)"/;
// Plugin-provided servers get names like plugin:slack-channel:slack via
// addPluginScopeToServers — show just the leaf. Matches the suffix-match
// logic in isServerInChannels.
function displayServerName(name) {
    const i = name.lastIndexOf(':');
    return i === -1 ? name : name.slice(i + 1);
}
const TRUNCATE_AT = 60;
export function UserChannelMessage(t0) {
    const $ = _c(29);
    const { addMargin, param: t1 } = t0;
    const { text } = t1;
    let T0;
    let T1;
    let T2;
    let t2;
    let t3;
    let t4;
    let t5;
    let t6;
    let t7;
    let truncated;
    let user;
    if ($[0] !== addMargin || $[1] !== text) {
        t7 = Symbol.for("react.early_return_sentinel");
        bb0: {
            const m = CHANNEL_RE.exec(text);
            if (!m) {
                t7 = null;
                break bb0;
            }
            const [, source, attrs, content] = m;
            user = USER_ATTR_RE.exec(attrs ?? "")?.[1];
            const body = (content ?? "").trim().replace(/\s+/g, " ");
            truncated = truncateToWidth(body, TRUNCATE_AT);
            T2 = Box;
            t6 = addMargin ? 1 : 0;
            T1 = Text;
            if ($[13] === Symbol.for("react.memo_cache_sentinel")) {
                t4 = _jsx(Text, { color: "suggestion", children: CHANNEL_ARROW });
                $[13] = t4;
            }
            else {
                t4 = $[13];
            }
            t5 = " ";
            T0 = Text;
            t2 = true;
            t3 = displayServerName(source ?? "");
        }
        $[0] = addMargin;
        $[1] = text;
        $[2] = T0;
        $[3] = T1;
        $[4] = T2;
        $[5] = t2;
        $[6] = t3;
        $[7] = t4;
        $[8] = t5;
        $[9] = t6;
        $[10] = t7;
        $[11] = truncated;
        $[12] = user;
    }
    else {
        T0 = $[2];
        T1 = $[3];
        T2 = $[4];
        t2 = $[5];
        t3 = $[6];
        t4 = $[7];
        t5 = $[8];
        t6 = $[9];
        t7 = $[10];
        truncated = $[11];
        user = $[12];
    }
    if (t7 !== Symbol.for("react.early_return_sentinel")) {
        return t7;
    }
    const t8 = user ? ` \u00b7 ${user}` : "";
    let t9;
    if ($[14] !== T0 || $[15] !== t2 || $[16] !== t3 || $[17] !== t8) {
        t9 = _jsxs(T0, { dimColor: t2, children: [t3, t8, ":"] });
        $[14] = T0;
        $[15] = t2;
        $[16] = t3;
        $[17] = t8;
        $[18] = t9;
    }
    else {
        t9 = $[18];
    }
    let t10;
    if ($[19] !== T1 || $[20] !== t4 || $[21] !== t5 || $[22] !== t9 || $[23] !== truncated) {
        t10 = _jsxs(T1, { children: [t4, t5, t9, " ", truncated] });
        $[19] = T1;
        $[20] = t4;
        $[21] = t5;
        $[22] = t9;
        $[23] = truncated;
        $[24] = t10;
    }
    else {
        t10 = $[24];
    }
    let t11;
    if ($[25] !== T2 || $[26] !== t10 || $[27] !== t6) {
        t11 = _jsx(T2, { marginTop: t6, children: t10 });
        $[25] = T2;
        $[26] = t10;
        $[27] = t6;
        $[28] = t11;
    }
    else {
        t11 = $[28];
    }
    return t11;
}
