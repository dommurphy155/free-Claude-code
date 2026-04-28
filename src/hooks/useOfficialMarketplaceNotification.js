import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { Text } from '../ink.js';
import { logForDebugging } from '../utils/debug.js';
import { checkAndInstallOfficialMarketplace } from '../utils/plugins/officialMarketplaceStartupCheck.js';
import { useStartupNotification } from './notifs/useStartupNotification.js';
/**
 * Hook that handles official marketplace auto-installation and shows
 * notifications for success/failure in the bottom right of the REPL.
 */
export function useOfficialMarketplaceNotification() {
    useStartupNotification(_temp);
}
async function _temp() {
    const result = await checkAndInstallOfficialMarketplace();
    const notifs = [];
    if (result.configSaveFailed) {
        logForDebugging("Showing marketplace config save failure notification");
        notifs.push({
            key: "marketplace-config-save-failed",
            jsx: _jsx(Text, { color: "error", children: "Failed to save marketplace retry info \u00B7 Check ~/.claude.json permissions" }),
            priority: "immediate",
            timeoutMs: 10000
        });
    }
    if (result.installed) {
        logForDebugging("Showing marketplace installation success notification");
        notifs.push({
            key: "marketplace-installed",
            jsx: _jsx(Text, { color: "success", children: "\u2713 Anthropic marketplace installed \u00B7 /plugin to see available plugins" }),
            priority: "immediate",
            timeoutMs: 7000
        });
    }
    else {
        if (result.skipped && result.reason === "unknown") {
            logForDebugging("Showing marketplace installation failure notification");
            notifs.push({
                key: "marketplace-install-failed",
                jsx: _jsx(Text, { color: "warning", children: "Failed to install Anthropic marketplace \u00B7 Will retry on next startup" }),
                priority: "immediate",
                timeoutMs: 8000
            });
        }
    }
    return notifs;
}
