import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { MessageResponse } from '../../components/MessageResponse.js';
import { OutputLine } from '../../components/shell/OutputLine.js';
import { Box, Text } from '../../ink.js';
import { jsonStringify } from '../../utils/slowOperations.js';
export function renderToolUseMessage(input) {
    if (!input.uri || !input.server) {
        return null;
    }
    return `Read resource "${input.uri}" from server "${input.server}"`;
}
export function userFacingName() {
    return 'readMcpResource';
}
export function renderToolResultMessage(output, _progressMessagesForMessage, { verbose }) {
    if (!output || !output.contents || output.contents.length === 0) {
        return _jsx(Box, { justifyContent: "space-between", overflowX: "hidden", width: "100%", children: _jsx(MessageResponse, { height: 1, children: _jsx(Text, { dimColor: true, children: "(No content)" }) }) });
    }
    // Format as JSON for better readability
    // eslint-disable-next-line no-restricted-syntax -- human-facing UI, not tool_result
    const formattedOutput = jsonStringify(output, null, 2);
    return _jsx(OutputLine, { content: formattedOutput, verbose: verbose });
}
