import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { BackgroundTasksDialog } from '../../components/tasks/BackgroundTasksDialog.js';
export async function call(onDone, context) {
    return _jsx(BackgroundTasksDialog, { toolUseContext: context, onDone: onDone });
}
