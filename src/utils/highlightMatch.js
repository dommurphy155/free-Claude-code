import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from 'react';
import { Text } from '../ink.js';
/**
 * Inverse-highlight every occurrence of `query` in `text` (case-insensitive).
 * Used by search dialogs to show where the query matched in result rows
 * and preview panes.
 */
export function highlightMatch(text, query) {
    if (!query)
        return text;
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    const parts = [];
    let offset = 0;
    let idx = textLower.indexOf(queryLower, offset);
    if (idx === -1)
        return text;
    while (idx !== -1) {
        if (idx > offset)
            parts.push(text.slice(offset, idx));
        parts.push(_jsx(Text, { inverse: true, children: text.slice(idx, idx + query.length) }, idx));
        offset = idx + query.length;
        idx = textLower.indexOf(queryLower, offset);
    }
    if (offset < text.length)
        parts.push(text.slice(offset));
    return _jsx(_Fragment, { children: parts });
}
