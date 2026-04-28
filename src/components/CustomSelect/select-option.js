import { jsx as _jsx } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import React from 'react';
import { ListItem } from '../design-system/ListItem.js';
export function SelectOption(t0) {
    const $ = _c(8);
    const { isFocused, isSelected, children, description, shouldShowDownArrow, shouldShowUpArrow, declareCursor } = t0;
    let t1;
    if ($[0] !== children || $[1] !== declareCursor || $[2] !== description || $[3] !== isFocused || $[4] !== isSelected || $[5] !== shouldShowDownArrow || $[6] !== shouldShowUpArrow) {
        t1 = _jsx(ListItem, { isFocused: isFocused, isSelected: isSelected, description: description, showScrollDown: shouldShowDownArrow, showScrollUp: shouldShowUpArrow, styled: false, declareCursor: declareCursor, children: children });
        $[0] = children;
        $[1] = declareCursor;
        $[2] = description;
        $[3] = isFocused;
        $[4] = isSelected;
        $[5] = shouldShowDownArrow;
        $[6] = shouldShowUpArrow;
        $[7] = t1;
    }
    else {
        t1 = $[7];
    }
    return t1;
}
