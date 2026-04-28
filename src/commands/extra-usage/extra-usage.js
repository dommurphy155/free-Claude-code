import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { Login } from '../login/login.js';
import { runExtraUsage } from './extra-usage-core.js';
export async function call(onDone, context) {
    const result = await runExtraUsage();
    if (result.type === 'message') {
        onDone(result.value);
        return null;
    }
    return _jsx(Login, { startingMessage: 'Starting new login following /extra-usage. Exit with Ctrl-C to use existing account.', onDone: success => {
            context.onChangeAPIKey();
            onDone(success ? 'Login successful' : 'Login interrupted');
        } });
}
