import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { extractTag } from 'src/utils/messages.js';
import { FallbackToolUseErrorMessage } from '../../components/FallbackToolUseErrorMessage.js';
import { FilePathLink } from '../../components/FilePathLink.js';
import { HighlightedCode } from '../../components/HighlightedCode.js';
import { MessageResponse } from '../../components/MessageResponse.js';
import { NotebookEditToolUseRejectedMessage } from '../../components/NotebookEditToolUseRejectedMessage.js';
import { Box, Text } from '../../ink.js';
import { getDisplayPath } from '../../utils/file.js';
export function getToolUseSummary(input) {
    if (!input?.notebook_path) {
        return null;
    }
    return getDisplayPath(input.notebook_path);
}
export function renderToolUseMessage({ notebook_path, cell_id, new_source, cell_type, edit_mode }, { verbose }) {
    if (!notebook_path || !new_source || !cell_type) {
        return null;
    }
    const displayPath = verbose ? notebook_path : getDisplayPath(notebook_path);
    if (verbose) {
        return _jsxs(_Fragment, { children: [_jsx(FilePathLink, { filePath: notebook_path, children: displayPath }), `@${cell_id}, content: ${new_source.slice(0, 30)}…, cell_type: ${cell_type}, edit_mode: ${edit_mode ?? 'replace'}`] });
    }
    return _jsxs(_Fragment, { children: [_jsx(FilePathLink, { filePath: notebook_path, children: displayPath }), `@${cell_id}`] });
}
export function renderToolUseRejectedMessage(input, { verbose }) {
    return _jsx(NotebookEditToolUseRejectedMessage, { notebook_path: input.notebook_path, cell_id: input.cell_id, new_source: input.new_source, cell_type: input.cell_type, edit_mode: input.edit_mode, verbose: verbose });
}
export function renderToolUseErrorMessage(result, { verbose }) {
    if (!verbose && typeof result === 'string' && extractTag(result, 'tool_use_error')) {
        return _jsx(MessageResponse, { children: _jsx(Text, { color: "error", children: "Error editing notebook" }) });
    }
    return _jsx(FallbackToolUseErrorMessage, { result: result, verbose: verbose });
}
export function renderToolResultMessage({ cell_id, new_source, error }) {
    if (error) {
        return _jsx(MessageResponse, { children: _jsx(Text, { color: "error", children: error }) });
    }
    return _jsx(MessageResponse, { children: _jsxs(Box, { flexDirection: "column", children: [_jsxs(Text, { children: ["Updated cell ", _jsx(Text, { bold: true, children: cell_id }), ":"] }), _jsx(Box, { marginLeft: 2, children: _jsx(HighlightedCode, { code: new_source, filePath: "notebook.py" }) })] }) });
}
