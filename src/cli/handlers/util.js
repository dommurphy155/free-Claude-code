import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
/**
 * Miscellaneous subcommand handlers — extracted from main.tsx for lazy loading.
 * setup-token, doctor, install
 */
/* eslint-disable custom-rules/no-process-exit -- CLI subcommand handlers intentionally exit */
import { cwd } from 'process';
import React from 'react';
import { WelcomeV2 } from '../../components/LogoV2/WelcomeV2.js';
import { useManagePlugins } from '../../hooks/useManagePlugins.js';
import { Box, Text } from '../../ink.js';
import { KeybindingSetup } from '../../keybindings/KeybindingProviderSetup.js';
import { logEvent } from '../../services/analytics/index.js';
import { MCPConnectionManager } from '../../services/mcp/MCPConnectionManager.js';
import { AppStateProvider } from '../../state/AppState.js';
import { onChangeAppState } from '../../state/onChangeAppState.js';
import { isAnthropicAuthEnabled } from '../../utils/auth.js';
export async function setupTokenHandler(root) {
    logEvent('tengu_setup_token_command', {});
    const showAuthWarning = !isAnthropicAuthEnabled();
    const { ConsoleOAuthFlow } = await import('../../components/ConsoleOAuthFlow.js');
    await new Promise(resolve => {
        root.render(_jsx(AppStateProvider, { onChangeAppState: onChangeAppState, children: _jsx(KeybindingSetup, { children: _jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(WelcomeV2, {}), showAuthWarning && _jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: "warning", children: "Warning: You already have authentication configured via environment variable or API key helper." }), _jsx(Text, { color: "warning", children: "The setup-token command will create a new OAuth token which you can use instead." })] }), _jsx(ConsoleOAuthFlow, { onDone: () => {
                                void resolve();
                            }, mode: "setup-token", startingMessage: "This will guide you through long-lived (1-year) auth token setup for your Claude account. Claude subscription required." })] }) }) }));
    });
    root.unmount();
    process.exit(0);
}
// DoctorWithPlugins wrapper + doctor handler
const DoctorLazy = React.lazy(() => import('../../screens/Doctor.js').then(m => ({
    default: m.Doctor
})));
function DoctorWithPlugins(t0) {
    const $ = _c(2);
    const { onDone } = t0;
    useManagePlugins();
    let t1;
    if ($[0] !== onDone) {
        t1 = _jsx(React.Suspense, { fallback: null, children: _jsx(DoctorLazy, { onDone: onDone }) });
        $[0] = onDone;
        $[1] = t1;
    }
    else {
        t1 = $[1];
    }
    return t1;
}
export async function doctorHandler(root) {
    logEvent('tengu_doctor_command', {});
    await new Promise(resolve => {
        root.render(_jsx(AppStateProvider, { children: _jsx(KeybindingSetup, { children: _jsx(MCPConnectionManager, { dynamicMcpConfig: undefined, isStrictMcpConfig: false, children: _jsx(DoctorWithPlugins, { onDone: () => {
                            void resolve();
                        } }) }) }) }));
    });
    root.unmount();
    process.exit(0);
}
// install handler
export async function installHandler(target, options) {
    const { setup } = await import('../../setup.js');
    await setup(cwd(), 'default', false, false, undefined, false);
    const { install } = await import('../../commands/install.js');
    await new Promise(resolve => {
        const args = [];
        if (target)
            args.push(target);
        if (options.force)
            args.push('--force');
        void install.call(result => {
            void resolve();
            process.exit(result.includes('failed') ? 1 : 0);
        }, {}, args);
    });
}
