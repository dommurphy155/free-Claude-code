import { jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { getOauthProfileFromApiKey } from 'src/services/oauth/getOauthProfile.js';
import { isClaudeAISubscriber } from 'src/utils/auth.js';
import { Text } from '../../ink.js';
import { logEvent } from '../../services/analytics/index.js';
import { getGlobalConfig, saveGlobalConfig } from '../../utils/config.js';
import { useStartupNotification } from './useStartupNotification.js';
const MAX_SHOW_COUNT = 3;
/**
 * Hook to check if the user has a subscription on Console but isn't logged into it.
 */
export function useCanSwitchToExistingSubscription() {
    useStartupNotification(_temp2);
}
/**
 * Checks if the user has a subscription but is not currently logged into it.
 * This helps inform users they should run /login to access their subscription.
 */
async function _temp2() {
    if ((getGlobalConfig().subscriptionNoticeCount ?? 0) >= MAX_SHOW_COUNT) {
        return null;
    }
    const subscriptionType = await getExistingClaudeSubscription();
    if (subscriptionType === null) {
        return null;
    }
    saveGlobalConfig(_temp);
    logEvent("tengu_switch_to_subscription_notice_shown", {});
    return {
        key: "switch-to-subscription",
        jsx: _jsxs(Text, { color: "suggestion", children: ["Use your existing Claude ", subscriptionType, " plan with Claude Code", _jsxs(Text, { color: "text", dimColor: true, children: [" ", "\u00B7 /login to activate"] })] }),
        priority: "low"
    };
}
function _temp(current) {
    return {
        ...current,
        subscriptionNoticeCount: (current.subscriptionNoticeCount ?? 0) + 1
    };
}
async function getExistingClaudeSubscription() {
    // If already using subscription auth, there is nothing to switch to
    if (isClaudeAISubscriber()) {
        return null;
    }
    const profile = await getOauthProfileFromApiKey();
    if (!profile) {
        return null;
    }
    if (profile.account.has_claude_max) {
        return 'Max';
    }
    if (profile.account.has_claude_pro) {
        return 'Pro';
    }
    return null;
}
