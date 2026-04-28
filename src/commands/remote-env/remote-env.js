import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { RemoteEnvironmentDialog } from '../../components/RemoteEnvironmentDialog.js';
export async function call(onDone) {
    return _jsx(RemoteEnvironmentDialog, { onDone: onDone });
}
