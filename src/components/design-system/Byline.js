import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import React, { Children, isValidElement } from 'react';
import { Text } from '../../ink.js';
/**
 * Joins children with a middot separator (" · ") for inline metadata display.
 *
 * Named after the publishing term "byline" - the line of metadata typically
 * shown below a title (e.g., "John Doe · 5 min read · Mar 12").
 *
 * Automatically filters out null/undefined/false children and only renders
 * separators between valid elements.
 *
 * @example
 * // Basic usage: "Enter to confirm · Esc to cancel"
 * <Text dimColor>
 *   <Byline>
 *     <KeyboardShortcutHint shortcut="Enter" action="confirm" />
 *     <KeyboardShortcutHint shortcut="Esc" action="cancel" />
 *   </Byline>
 * </Text>
 *
 * @example
 * // With conditional children: "Esc to cancel" (only one item shown)
 * <Text dimColor>
 *   <Byline>
 *     {showEnter && <KeyboardShortcutHint shortcut="Enter" action="confirm" />}
 *     <KeyboardShortcutHint shortcut="Esc" action="cancel" />
 *   </Byline>
 * </Text>
 *
 */
export function Byline(t0) {
    const $ = _c(5);
    const { children } = t0;
    let t1;
    let t2;
    if ($[0] !== children) {
        t2 = Symbol.for("react.early_return_sentinel");
        bb0: {
            const validChildren = Children.toArray(children);
            if (validChildren.length === 0) {
                t2 = null;
                break bb0;
            }
            t1 = validChildren.map(_temp);
        }
        $[0] = children;
        $[1] = t1;
        $[2] = t2;
    }
    else {
        t1 = $[1];
        t2 = $[2];
    }
    if (t2 !== Symbol.for("react.early_return_sentinel")) {
        return t2;
    }
    let t3;
    if ($[3] !== t1) {
        t3 = _jsx(_Fragment, { children: t1 });
        $[3] = t1;
        $[4] = t3;
    }
    else {
        t3 = $[4];
    }
    return t3;
}
function _temp(child, index) {
    return _jsxs(React.Fragment, { children: [index > 0 && _jsx(Text, { dimColor: true, children: " \u00B7 " }), child] }, isValidElement(child) ? child.key ?? index : index);
}
