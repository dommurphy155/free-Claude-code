import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { Stats } from '../../components/Stats.js';
export const call = async (onDone) => {
    return _jsx(Stats, { onClose: onDone });
};
