import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { HelpV2 } from '../../components/HelpV2/HelpV2.js';
export const call = async (onDone, { options: { commands } }) => {
    return _jsx(HelpV2, { commands: commands, onClose: onDone });
};
