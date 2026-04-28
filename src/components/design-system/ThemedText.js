import { jsx as _jsx } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import React, { useContext } from 'react';
import Text from '../../ink/components/Text.js';
import { getTheme } from '../../utils/theme.js';
import { useTheme } from './ThemeProvider.js';
/** Colors uncolored ThemedText in the subtree. Precedence: explicit `color` >
 *  this > dimColor. Crosses Box boundaries (Ink's style cascade doesn't). */
export const TextHoverColorContext = React.createContext(undefined);
/**
 * Resolves a color value that may be a theme key to a raw Color.
 */
function resolveColor(color, theme) {
    if (!color)
        return undefined;
    // Check if it's a raw color (starts with rgb(, #, ansi256(, or ansi:)
    if (color.startsWith('rgb(') || color.startsWith('#') || color.startsWith('ansi256(') || color.startsWith('ansi:')) {
        return color;
    }
    // It's a theme key - resolve it
    return theme[color];
}
/**
 * Theme-aware Text component that resolves theme color keys to raw colors.
 * This wraps the base Text component with theme resolution.
 */
export default function ThemedText(t0) {
    const $ = _c(10);
    const { color, backgroundColor, dimColor: t1, bold: t2, italic: t3, underline: t4, strikethrough: t5, inverse: t6, wrap: t7, children } = t0;
    const dimColor = t1 === undefined ? false : t1;
    const bold = t2 === undefined ? false : t2;
    const italic = t3 === undefined ? false : t3;
    const underline = t4 === undefined ? false : t4;
    const strikethrough = t5 === undefined ? false : t5;
    const inverse = t6 === undefined ? false : t6;
    const wrap = t7 === undefined ? "wrap" : t7;
    const [themeName] = useTheme();
    const theme = getTheme(themeName);
    const hoverColor = useContext(TextHoverColorContext);
    const resolvedColor = !color && hoverColor ? resolveColor(hoverColor, theme) : dimColor ? theme.inactive : resolveColor(color, theme);
    const resolvedBackgroundColor = backgroundColor ? theme[backgroundColor] : undefined;
    let t8;
    if ($[0] !== bold || $[1] !== children || $[2] !== inverse || $[3] !== italic || $[4] !== resolvedBackgroundColor || $[5] !== resolvedColor || $[6] !== strikethrough || $[7] !== underline || $[8] !== wrap) {
        t8 = _jsx(Text, { color: resolvedColor, backgroundColor: resolvedBackgroundColor, bold: bold, italic: italic, underline: underline, strikethrough: strikethrough, inverse: inverse, wrap: wrap, children: children });
        $[0] = bold;
        $[1] = children;
        $[2] = inverse;
        $[3] = italic;
        $[4] = resolvedBackgroundColor;
        $[5] = resolvedColor;
        $[6] = strikethrough;
        $[7] = underline;
        $[8] = wrap;
        $[9] = t8;
    }
    else {
        t8 = $[9];
    }
    return t8;
}
