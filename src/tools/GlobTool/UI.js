import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { MessageResponse } from 'src/components/MessageResponse.js';
import { extractTag } from 'src/utils/messages.js';
import { FallbackToolUseErrorMessage } from '../../components/FallbackToolUseErrorMessage.js';
import { TOOL_SUMMARY_MAX_LENGTH } from '../../constants/toolLimits.js';
import { Text } from '../../ink.js';
import { FILE_NOT_FOUND_CWD_NOTE, getDisplayPath } from '../../utils/file.js';
import { truncate } from '../../utils/format.js';
import { GrepTool } from '../GrepTool/GrepTool.js';
export function userFacingName() {
    return 'Search';
}
export function renderToolUseMessage({ pattern, path }, { verbose }) {
    if (!pattern) {
        return null;
    }
    if (!path) {
        return `pattern: "${pattern}"`;
    }
    return `pattern: "${pattern}", path: "${verbose ? path : getDisplayPath(path)}"`;
}
export function renderToolUseErrorMessage(result, { verbose }) {
    if (!verbose && typeof result === 'string' && extractTag(result, 'tool_use_error')) {
        const errorMessage = extractTag(result, 'tool_use_error');
        if (errorMessage?.includes(FILE_NOT_FOUND_CWD_NOTE)) {
            return _jsx(MessageResponse, { children: _jsx(Text, { color: "error", children: "File not found" }) });
        }
        return _jsx(MessageResponse, { children: _jsx(Text, { color: "error", children: "Error searching files" }) });
    }
    return _jsx(FallbackToolUseErrorMessage, { result: result, verbose: verbose });
}
// Note: GlobTool reuses GrepTool's renderToolResultMessage
export const renderToolResultMessage = GrepTool.renderToolResultMessage;
export function getToolUseSummary(input) {
    if (!input?.pattern) {
        return null;
    }
    return truncate(input.pattern, TOOL_SUMMARY_MAX_LENGTH);
}
