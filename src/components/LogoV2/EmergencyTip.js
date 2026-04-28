import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { useEffect, useMemo } from 'react';
import { Box, Text } from 'src/ink.js';
import { getDynamicConfig_CACHED_MAY_BE_STALE } from 'src/services/analytics/growthbook.js';
import { getGlobalConfig, saveGlobalConfig } from 'src/utils/config.js';
const CONFIG_NAME = 'tengu-top-of-feed-tip';
export function EmergencyTip() {
    const tip = useMemo(getTipOfFeed, []);
    // Memoize to prevent re-reads after we save - we want the value at mount time
    const lastShownTip = useMemo(() => getGlobalConfig().lastShownEmergencyTip, []);
    // Only show if this is a new/different tip
    const shouldShow = tip.tip && tip.tip !== lastShownTip;
    // Save the tip we're showing so we don't show it again
    useEffect(() => {
        if (shouldShow) {
            saveGlobalConfig(current => {
                if (current.lastShownEmergencyTip === tip.tip)
                    return current;
                return {
                    ...current,
                    lastShownEmergencyTip: tip.tip
                };
            });
        }
    }, [shouldShow, tip.tip]);
    if (!shouldShow) {
        return null;
    }
    return _jsx(Box, { paddingLeft: 2, flexDirection: "column", children: _jsx(Text, { ...tip.color === 'warning' ? {
                color: 'warning'
            } : tip.color === 'error' ? {
                color: 'error'
            } : {
                dimColor: true
            }, children: tip.tip }) });
}
const DEFAULT_TIP = {
    tip: '',
    color: 'dim'
};
/**
 * Get the tip of the feed from dynamic config with caching
 * Returns cached value immediately, updates in background
 */
function getTipOfFeed() {
    return getDynamicConfig_CACHED_MAY_BE_STALE(CONFIG_NAME, DEFAULT_TIP);
}
