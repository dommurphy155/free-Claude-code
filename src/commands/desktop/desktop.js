import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { DesktopHandoff } from '../../components/DesktopHandoff.js';
export async function call(onDone) {
    return _jsx(DesktopHandoff, { onDone: onDone });
}
