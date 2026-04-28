import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { Settings } from '../../components/Settings/Settings.js';
export async function call(onDone, context) {
    return _jsx(Settings, { onClose: onDone, context: context, defaultTab: "Status" });
}
