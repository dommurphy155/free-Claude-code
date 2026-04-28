import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { Doctor } from '../../screens/Doctor.js';
export const call = (onDone, _context, _args) => {
    return Promise.resolve(_jsx(Doctor, { onDone: onDone }));
};
