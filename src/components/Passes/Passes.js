import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { TEARDROP_ASTERISK } from '../../constants/figures.js';
import { useExitOnCtrlCDWithKeybindings } from '../../hooks/useExitOnCtrlCDWithKeybindings.js';
import { setClipboard } from '../../ink/termio/osc.js';
// eslint-disable-next-line custom-rules/prefer-use-keybindings -- enter to copy link
import { Box, Link, Text, useInput } from '../../ink.js';
import { useKeybinding } from '../../keybindings/useKeybinding.js';
import { logEvent } from '../../services/analytics/index.js';
import { fetchReferralRedemptions, formatCreditAmount, getCachedOrFetchPassesEligibility } from '../../services/api/referral.js';
import { count } from '../../utils/array.js';
import { logError } from '../../utils/log.js';
import { Pane } from '../design-system/Pane.js';
export function Passes({ onDone }) {
    const [loading, setLoading] = useState(true);
    const [passStatuses, setPassStatuses] = useState([]);
    const [isAvailable, setIsAvailable] = useState(false);
    const [referralLink, setReferralLink] = useState(null);
    const [referrerReward, setReferrerReward] = useState(undefined);
    const exitState = useExitOnCtrlCDWithKeybindings(() => onDone('Guest passes dialog dismissed', {
        display: 'system'
    }));
    const handleCancel = useCallback(() => {
        onDone('Guest passes dialog dismissed', {
            display: 'system'
        });
    }, [onDone]);
    useKeybinding('confirm:no', handleCancel, {
        context: 'Confirmation'
    });
    useInput((_input, key) => {
        if (key.return && referralLink) {
            void setClipboard(referralLink).then(raw => {
                if (raw)
                    process.stdout.write(raw);
                logEvent('tengu_guest_passes_link_copied', {});
                onDone(`Referral link copied to clipboard!`);
            });
        }
    });
    useEffect(() => {
        async function loadPassesData() {
            try {
                // Check eligibility first (uses cache if available)
                const eligibilityData = await getCachedOrFetchPassesEligibility();
                if (!eligibilityData || !eligibilityData.eligible) {
                    setIsAvailable(false);
                    setLoading(false);
                    return;
                }
                setIsAvailable(true);
                // Store the referral link if available
                if (eligibilityData.referral_code_details?.referral_link) {
                    setReferralLink(eligibilityData.referral_code_details.referral_link);
                }
                // Store referrer reward info for v1 campaign messaging
                setReferrerReward(eligibilityData.referrer_reward);
                // Use the campaign returned from eligibility for redemptions
                const campaign = eligibilityData.referral_code_details?.campaign ?? 'claude_code_guest_pass';
                // Fetch redemptions data
                let redemptionsData;
                try {
                    redemptionsData = await fetchReferralRedemptions(campaign);
                }
                catch (err_0) {
                    logError(err_0);
                    setIsAvailable(false);
                    setLoading(false);
                    return;
                }
                // Build pass statuses array
                const redemptions = redemptionsData.redemptions || [];
                const maxRedemptions = redemptionsData.limit || 3;
                const statuses = [];
                for (let i = 0; i < maxRedemptions; i++) {
                    const redemption = redemptions[i];
                    statuses.push({
                        passNumber: i + 1,
                        isAvailable: !redemption
                    });
                }
                setPassStatuses(statuses);
                setLoading(false);
            }
            catch (err) {
                // For any error, just show passes as not available
                logError(err);
                setIsAvailable(false);
                setLoading(false);
            }
        }
        void loadPassesData();
    }, []);
    if (loading) {
        return _jsx(Pane, { children: _jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { dimColor: true, children: "Loading guest pass information\u2026" }), _jsx(Text, { dimColor: true, italic: true, children: exitState.pending ? _jsxs(_Fragment, { children: ["Press ", exitState.keyName, " again to exit"] }) : _jsx(_Fragment, { children: "Esc to cancel" }) })] }) });
    }
    if (!isAvailable) {
        return _jsx(Pane, { children: _jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { children: "Guest passes are not currently available." }), _jsx(Text, { dimColor: true, italic: true, children: exitState.pending ? _jsxs(_Fragment, { children: ["Press ", exitState.keyName, " again to exit"] }) : _jsx(_Fragment, { children: "Esc to cancel" }) })] }) });
    }
    const availableCount = count(passStatuses, p => p.isAvailable);
    // Sort passes: available first, then redeemed
    const sortedPasses = [...passStatuses].sort((a, b) => +b.isAvailable - +a.isAvailable);
    // ASCII art for tickets
    const renderTicket = (pass) => {
        const isRedeemed = !pass.isAvailable;
        if (isRedeemed) {
            // Grayed out redeemed ticket with slashes
            return _jsxs(Box, { flexDirection: "column", marginRight: 1, children: [_jsx(Text, { dimColor: true, children: '┌─────────╱' }), _jsx(Text, { dimColor: true, children: ` ) CC ${TEARDROP_ASTERISK} ┊╱` }), _jsx(Text, { dimColor: true, children: '└───────╱' })] }, pass.passNumber);
        }
        return _jsxs(Box, { flexDirection: "column", marginRight: 1, children: [_jsx(Text, { children: '┌──────────┐' }), _jsxs(Text, { children: [' ) CC ', _jsx(Text, { color: "claude", children: TEARDROP_ASTERISK }), ' ┊ ( '] }), _jsx(Text, { children: '└──────────┘' })] }, pass.passNumber);
    };
    return _jsx(Pane, { children: _jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsxs(Text, { color: "permission", children: ["Guest passes \u00B7 ", availableCount, " left"] }), _jsx(Box, { flexDirection: "row", marginLeft: 2, children: sortedPasses.slice(0, 3).map(pass_0 => renderTicket(pass_0)) }), referralLink && _jsx(Box, { marginLeft: 2, children: _jsx(Text, { children: referralLink }) }), _jsx(Box, { flexDirection: "column", marginLeft: 2, children: _jsxs(Text, { dimColor: true, children: [referrerReward ? `Share a free week of Claude Code with friends. If they love it and subscribe, you'll get ${formatCreditAmount(referrerReward)} of extra usage to keep building. ` : 'Share a free week of Claude Code with friends. ', _jsx(Link, { url: referrerReward ? 'https://support.claude.com/en/articles/13456702-claude-code-guest-passes' : 'https://support.claude.com/en/articles/12875061-claude-code-guest-passes', children: "Terms apply." })] }) }), _jsx(Box, { children: _jsx(Text, { dimColor: true, italic: true, children: exitState.pending ? _jsxs(_Fragment, { children: ["Press ", exitState.keyName, " again to exit"] }) : _jsx(_Fragment, { children: "Enter to copy link \u00B7 Esc to cancel" }) }) })] }) });
}
