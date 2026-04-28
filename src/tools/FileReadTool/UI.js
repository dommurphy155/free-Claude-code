import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { extractTag } from 'src/utils/messages.js';
import { FallbackToolUseErrorMessage } from '../../components/FallbackToolUseErrorMessage.js';
import { FilePathLink } from '../../components/FilePathLink.js';
import { MessageResponse } from '../../components/MessageResponse.js';
import { Text } from '../../ink.js';
import { FILE_NOT_FOUND_CWD_NOTE, getDisplayPath } from '../../utils/file.js';
import { formatFileSize } from '../../utils/format.js';
import { getPlansDirectory } from '../../utils/plans.js';
import { getTaskOutputDir } from '../../utils/task/diskOutput.js';
/**
 * Check if a file path is an agent output file and extract the task ID.
 * Agent output files follow the pattern: {projectTempDir}/tasks/{taskId}.output
 */
function getAgentOutputTaskId(filePath) {
    const prefix = `${getTaskOutputDir()}/`;
    const suffix = '.output';
    if (filePath.startsWith(prefix) && filePath.endsWith(suffix)) {
        const taskId = filePath.slice(prefix.length, -suffix.length);
        // Validate it looks like a task ID (alphanumeric, reasonable length)
        if (taskId.length > 0 && taskId.length <= 20 && /^[a-zA-Z0-9_-]+$/.test(taskId)) {
            return taskId;
        }
    }
    return null;
}
export function renderToolUseMessage({ file_path, offset, limit, pages }, { verbose }) {
    if (!file_path) {
        return null;
    }
    // For agent output files, return empty string so no parentheses are shown
    // The task ID is displayed separately by AssistantToolUseMessage
    if (getAgentOutputTaskId(file_path)) {
        return '';
    }
    const displayPath = verbose ? file_path : getDisplayPath(file_path);
    if (pages) {
        return _jsxs(_Fragment, { children: [_jsx(FilePathLink, { filePath: file_path, children: displayPath }), ` · pages ${pages}`] });
    }
    if (verbose && (offset || limit)) {
        const startLine = offset ?? 1;
        const lineRange = limit ? `lines ${startLine}-${startLine + limit - 1}` : `from line ${startLine}`;
        return _jsxs(_Fragment, { children: [_jsx(FilePathLink, { filePath: file_path, children: displayPath }), ` · ${lineRange}`] });
    }
    return _jsx(FilePathLink, { filePath: file_path, children: displayPath });
}
export function renderToolUseTag({ file_path }) {
    const agentTaskId = file_path ? getAgentOutputTaskId(file_path) : null;
    // Show agent task ID for Read tool when reading agent output
    if (!agentTaskId) {
        return null;
    }
    return _jsxs(Text, { dimColor: true, children: [" ", agentTaskId] });
}
export function renderToolResultMessage(output) {
    // TODO: Render recursively
    switch (output.type) {
        case 'image':
            {
                const { originalSize } = output.file;
                const formattedSize = formatFileSize(originalSize);
                return _jsx(MessageResponse, { height: 1, children: _jsxs(Text, { children: ["Read image (", formattedSize, ")"] }) });
            }
        case 'notebook':
            {
                const { cells } = output.file;
                if (!cells || cells.length < 1) {
                    return _jsx(Text, { color: "error", children: "No cells found in notebook" });
                }
                return _jsx(MessageResponse, { height: 1, children: _jsxs(Text, { children: ["Read ", _jsx(Text, { bold: true, children: cells.length }), " cells"] }) });
            }
        case 'pdf':
            {
                const { originalSize } = output.file;
                const formattedSize = formatFileSize(originalSize);
                return _jsx(MessageResponse, { height: 1, children: _jsxs(Text, { children: ["Read PDF (", formattedSize, ")"] }) });
            }
        case 'parts':
            {
                return _jsx(MessageResponse, { height: 1, children: _jsxs(Text, { children: ["Read ", _jsx(Text, { bold: true, children: output.file.count }), ' ', output.file.count === 1 ? 'page' : 'pages', " (", formatFileSize(output.file.originalSize), ")"] }) });
            }
        case 'text':
            {
                const { numLines } = output.file;
                return _jsx(MessageResponse, { height: 1, children: _jsxs(Text, { children: ["Read ", _jsx(Text, { bold: true, children: numLines }), ' ', numLines === 1 ? 'line' : 'lines'] }) });
            }
        case 'file_unchanged':
            {
                return _jsx(MessageResponse, { height: 1, children: _jsx(Text, { dimColor: true, children: "Unchanged since last read" }) });
            }
    }
}
export function renderToolUseErrorMessage(result, { verbose }) {
    if (!verbose && typeof result === 'string') {
        // FileReadTool throws from call() so errors lack <tool_use_error> wrapping —
        // check the raw string directly for the cwd note marker.
        if (result.includes(FILE_NOT_FOUND_CWD_NOTE)) {
            return _jsx(MessageResponse, { children: _jsx(Text, { color: "error", children: "File not found" }) });
        }
        if (extractTag(result, 'tool_use_error')) {
            return _jsx(MessageResponse, { children: _jsx(Text, { color: "error", children: "Error reading file" }) });
        }
    }
    return _jsx(FallbackToolUseErrorMessage, { result: result, verbose: verbose });
}
export function userFacingName(input) {
    if (input?.file_path?.startsWith(getPlansDirectory())) {
        return 'Reading Plan';
    }
    if (input?.file_path && getAgentOutputTaskId(input.file_path)) {
        return 'Read agent output';
    }
    return 'Read';
}
export function getToolUseSummary(input) {
    if (!input?.file_path) {
        return null;
    }
    // For agent output files, just show the task ID
    const agentTaskId = getAgentOutputTaskId(input.file_path);
    if (agentTaskId) {
        return agentTaskId;
    }
    return getDisplayPath(input.file_path);
}
