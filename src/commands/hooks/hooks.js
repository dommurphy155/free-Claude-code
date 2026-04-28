import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { HooksConfigMenu } from '../../components/hooks/HooksConfigMenu.js';
import { logEvent } from '../../services/analytics/index.js';
import { getTools } from '../../tools.js';
export const call = async (onDone, context) => {
    logEvent('tengu_hooks_command', {});
    const appState = context.getAppState();
    const permissionContext = appState.toolPermissionContext;
    const toolNames = getTools(permissionContext).map(tool => tool.name);
    return _jsx(HooksConfigMenu, { toolNames: toolNames, onExit: onDone });
};
