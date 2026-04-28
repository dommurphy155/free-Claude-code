import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
export const call = async (onDone, context) => {
    const { DiffDialog } = await import('../../components/diff/DiffDialog.js');
    return _jsx(DiffDialog, { messages: context.messages, onDone: onDone });
};
