import { jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Text } from '../../ink.js';
import { findToolByName } from '../../Tool.js';
export function renderToolActivity(activity, tools, theme) {
    const tool = findToolByName(tools, activity.toolName);
    if (!tool) {
        return activity.toolName;
    }
    try {
        const parsed = tool.inputSchema.safeParse(activity.input);
        const parsedInput = parsed.success ? parsed.data : {};
        const userFacingName = tool.userFacingName(parsedInput);
        if (!userFacingName) {
            return activity.toolName;
        }
        const toolArgs = tool.renderToolUseMessage(parsedInput, {
            theme,
            verbose: false
        });
        if (toolArgs) {
            return _jsxs(Text, { children: [userFacingName, "(", toolArgs, ")"] });
        }
        return userFacingName;
    }
    catch {
        return activity.toolName;
    }
}
