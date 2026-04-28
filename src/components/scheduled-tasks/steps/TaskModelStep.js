import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { WizardDialogLayout } from '../../wizard/index.js';
import { useWizard } from '../../wizard/useWizard.js';
import { ModelSelector } from '../../agents/ModelSelector.js';
export function TaskModelStep() {
    const { goNext, goBack, updateWizardData, wizardData } = useWizard();
    return (_jsx(WizardDialogLayout, { subtitle: "Model", children: _jsx(ModelSelector, { initialModel: wizardData.model, onComplete: (model) => {
                updateWizardData({ model });
                goNext();
            }, onCancel: goBack }) }));
}
