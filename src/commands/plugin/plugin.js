import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { PluginSettings } from './PluginSettings.js';
export async function call(onDone, _context, args) {
    return _jsx(PluginSettings, { onComplete: onDone, args: args });
}
