import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import * as React from 'react';
import { stringWidth } from '../../ink/stringWidth.js';
import { Box, Text } from '../../ink.js';
import { truncate } from '../../utils/format.js';
export function calculateFeedWidth(config) {
    const { title, lines, footer, emptyMessage, customContent } = config;
    let maxWidth = stringWidth(title);
    if (customContent !== undefined) {
        maxWidth = Math.max(maxWidth, customContent.width);
    }
    else if (lines.length === 0 && emptyMessage) {
        maxWidth = Math.max(maxWidth, stringWidth(emptyMessage));
    }
    else {
        const gap = '  ';
        const maxTimestampWidth = Math.max(0, ...lines.map(line => line.timestamp ? stringWidth(line.timestamp) : 0));
        for (const line of lines) {
            const timestampWidth = maxTimestampWidth > 0 ? maxTimestampWidth : 0;
            const lineWidth = stringWidth(line.text) + (timestampWidth > 0 ? timestampWidth + gap.length : 0);
            maxWidth = Math.max(maxWidth, lineWidth);
        }
    }
    if (footer) {
        maxWidth = Math.max(maxWidth, stringWidth(footer));
    }
    return maxWidth;
}
export function Feed(t0) {
    const $ = _c(15);
    const { config, actualWidth } = t0;
    const { title, lines, footer, emptyMessage, customContent } = config;
    let t1;
    if ($[0] !== lines) {
        t1 = Math.max(0, ...lines.map(_temp));
        $[0] = lines;
        $[1] = t1;
    }
    else {
        t1 = $[1];
    }
    const maxTimestampWidth = t1;
    let t2;
    if ($[2] !== title) {
        t2 = _jsx(Text, { bold: true, color: "claude", children: title });
        $[2] = title;
        $[3] = t2;
    }
    else {
        t2 = $[3];
    }
    let t3;
    if ($[4] !== actualWidth || $[5] !== customContent || $[6] !== emptyMessage || $[7] !== footer || $[8] !== lines || $[9] !== maxTimestampWidth) {
        t3 = customContent ? _jsxs(_Fragment, { children: [customContent.content, footer && _jsx(Text, { dimColor: true, italic: true, children: truncate(footer, actualWidth) })] }) : lines.length === 0 && emptyMessage ? _jsx(Text, { dimColor: true, children: truncate(emptyMessage, actualWidth) }) : _jsxs(_Fragment, { children: [lines.map((line_0, index) => {
                    const textWidth = Math.max(10, actualWidth - (maxTimestampWidth > 0 ? maxTimestampWidth + 2 : 0));
                    return _jsxs(Text, { children: [maxTimestampWidth > 0 && _jsxs(_Fragment, { children: [_jsx(Text, { dimColor: true, children: (line_0.timestamp || "").padEnd(maxTimestampWidth) }), "  "] }), _jsx(Text, { children: truncate(line_0.text, textWidth) })] }, index);
                }), footer && _jsx(Text, { dimColor: true, italic: true, children: truncate(footer, actualWidth) })] });
        $[4] = actualWidth;
        $[5] = customContent;
        $[6] = emptyMessage;
        $[7] = footer;
        $[8] = lines;
        $[9] = maxTimestampWidth;
        $[10] = t3;
    }
    else {
        t3 = $[10];
    }
    let t4;
    if ($[11] !== actualWidth || $[12] !== t2 || $[13] !== t3) {
        t4 = _jsxs(Box, { flexDirection: "column", width: actualWidth, children: [t2, t3] });
        $[11] = actualWidth;
        $[12] = t2;
        $[13] = t3;
        $[14] = t4;
    }
    else {
        t4 = $[14];
    }
    return t4;
}
function _temp(line) {
    return line.timestamp ? stringWidth(line.timestamp) : 0;
}
