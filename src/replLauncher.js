import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
export async function launchRepl(root, appProps, replProps, renderAndRun) {
    const { App } = await import('./components/App.js');
    const { REPL } = await import('./screens/REPL.js');
    await renderAndRun(root, _jsx(App, { ...appProps, children: _jsx(REPL, { ...replProps }) }));
}
