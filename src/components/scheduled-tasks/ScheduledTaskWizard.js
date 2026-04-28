import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { WizardProvider } from '../wizard/index.js';
import { NameStep } from './steps/NameStep.js';
import { TaskDescriptionStep } from './steps/TaskDescriptionStep.js';
import { TaskPromptStep } from './steps/TaskPromptStep.js';
import { TaskModelStep } from './steps/TaskModelStep.js';
import { PermissionStep } from './steps/PermissionStep.js';
import { FolderStep } from './steps/FolderStep.js';
import { ScheduleStep } from './steps/ScheduleStep.js';
import { TaskConfirmStep } from './steps/TaskConfirmStep.js';
export function ScheduledTaskWizard({ mode, initialData = {}, onComplete, onCancel, }) {
    const steps = [
        NameStep,
        TaskDescriptionStep,
        TaskPromptStep,
        TaskModelStep,
        PermissionStep,
        FolderStep,
        ScheduleStep,
        TaskConfirmStep,
    ];
    const title = mode === 'create' ? 'New scheduled task' : 'Edit scheduled task';
    return (_jsx(WizardProvider, { steps: steps, initialData: initialData, onComplete: onComplete, onCancel: onCancel, title: title, showStepCounter: true }));
}
