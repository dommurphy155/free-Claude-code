import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { Passes } from '../../components/Passes/Passes.js';
import { logEvent } from '../../services/analytics/index.js';
import { getCachedRemainingPasses } from '../../services/api/referral.js';
import { getGlobalConfig, saveGlobalConfig } from '../../utils/config.js';
export async function call(onDone) {
    // Mark that user has visited /passes so we stop showing the upsell
    const config = getGlobalConfig();
    const isFirstVisit = !config.hasVisitedPasses;
    if (isFirstVisit) {
        const remaining = getCachedRemainingPasses();
        saveGlobalConfig(current => ({
            ...current,
            hasVisitedPasses: true,
            passesLastSeenRemaining: remaining ?? current.passesLastSeenRemaining
        }));
    }
    logEvent('tengu_guest_passes_visited', {
        is_first_visit: isFirstVisit
    });
    return _jsx(Passes, { onDone: onDone });
}
