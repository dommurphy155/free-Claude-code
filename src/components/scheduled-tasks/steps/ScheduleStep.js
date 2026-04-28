import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { Box, Text } from '../../../ink.js';
import { useKeybinding } from '../../../hooks/useKeybinding.js';
import { Select } from '../../CustomSelect/select.js';
import TextInput from '../../TextInput.js';
import { WizardDialogLayout } from '../../wizard/index.js';
import { useWizard } from '../../wizard/useWizard.js';
import { FREQUENCY_OPTIONS, frequencyToCron, } from '../../../utils/cronFrequency.js';
export function ScheduleStep() {
    const { goNext, goBack, updateWizardData, wizardData } = useWizard();
    const [frequency, setFrequency] = useState(wizardData.frequency ?? 'daily');
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [time, setTime] = useState(wizardData.scheduledTime ?? '09:00');
    useKeybinding('confirm:no', goBack, { context: 'Settings' });
    const needsTime = frequency === 'daily' || frequency === 'weekdays' || frequency === 'weekly';
    const handleFrequencySelect = (value) => {
        const freq = value;
        setFrequency(freq);
        if (freq === 'manual' || freq === 'hourly') {
            // No time needed
            const cron = frequencyToCron(freq);
            updateWizardData({
                frequency: freq,
                scheduledTime: undefined,
                cron: cron || undefined,
            });
            goNext();
        }
        else {
            // Show time picker for daily/weekdays/weekly
            setShowTimePicker(true);
        }
    };
    const handleTimeSubmit = () => {
        // Validate time format HH:MM
        if (!/^\d{1,2}:\d{2}$/.test(time))
            return;
        const cron = frequencyToCron(frequency, time);
        updateWizardData({
            frequency,
            scheduledTime: time,
            cron: cron || undefined,
        });
        goNext();
    };
    if (showTimePicker && needsTime) {
        return (_jsx(WizardDialogLayout, { subtitle: "Schedule time", children: _jsxs(Box, { flexDirection: "column", children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { dimColor: true, children: "Enter the time for this task (24-hour format, e.g. 09:00):" }) }), _jsx(TextInput, { value: time, onChange: setTime, onSubmit: handleTimeSubmit, placeholder: "09:00" }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, children: "Scheduled tasks use a randomized delay of several minutes for server performance." }) })] }) }));
    }
    return (_jsx(WizardDialogLayout, { subtitle: "Frequency", children: _jsxs(Box, { flexDirection: "column", children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { dimColor: true, children: "How often should this task run?" }) }), _jsx(Select, { options: FREQUENCY_OPTIONS, defaultValue: frequency, onChange: handleFrequencySelect, onCancel: goBack })] }) }));
}
