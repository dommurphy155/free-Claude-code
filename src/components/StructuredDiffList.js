import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { Box, NoSelect, Text } from '../ink.js';
import { intersperse } from '../utils/array.js';
import { StructuredDiff } from './StructuredDiff.js';
/** Renders a list of diff hunks with ellipsis separators between them. */
export function StructuredDiffList({ hunks, dim, width, filePath, firstLine, fileContent }) {
    return intersperse(hunks.map(hunk => _jsx(Box, { flexDirection: "column", children: _jsx(StructuredDiff, { patch: hunk, dim: dim, width: width, filePath: filePath, firstLine: firstLine, fileContent: fileContent }) }, hunk.newStart)), i => _jsx(NoSelect, { fromLeftEdge: true, children: _jsx(Text, { dimColor: true, children: "..." }) }, `ellipsis-${i}`));
}
