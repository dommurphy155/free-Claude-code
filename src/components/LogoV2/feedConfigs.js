import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import figures from 'figures';
import { homedir } from 'os';
import * as React from 'react';
import { Box, Text } from '../../ink.js';
import { formatCreditAmount, getCachedReferrerReward } from '../../services/api/referral.js';
import { getCwd } from '../../utils/cwd.js';
import { formatRelativeTimeAgo } from '../../utils/format.js';
export function createRecentActivityFeed(activities) {
    const lines = activities.map(log => {
        const time = formatRelativeTimeAgo(log.modified);
        const description = log.summary && log.summary !== 'No prompt' ? log.summary : log.firstPrompt;
        return {
            text: description || '',
            timestamp: time
        };
    });
    return {
        title: 'Recent activity',
        lines,
        footer: lines.length > 0 ? '/resume for more' : undefined,
        emptyMessage: 'No recent activity'
    };
}
export function createWhatsNewFeed(releaseNotes) {
    const lines = releaseNotes.map(note => {
        if ("external" === 'ant') {
            const match = note.match(/^(\d+\s+\w+\s+ago)\s+(.+)$/);
            if (match) {
                return {
                    timestamp: match[1],
                    text: match[2] || ''
                };
            }
        }
        return {
            text: note
        };
    });
    const emptyMessage = "external" === 'ant' ? 'Unable to fetch latest claude-cli-internal commits' : 'Check the Claude Code changelog for updates';
    return {
        title: "external" === 'ant' ? "What's new [ANT-ONLY: Latest CC commits]" : "What's new",
        lines,
        footer: lines.length > 0 ? '/release-notes for more' : undefined,
        emptyMessage
    };
}
export function createProjectOnboardingFeed(steps) {
    const enabledSteps = steps.filter(({ isEnabled }) => isEnabled).sort((a, b) => Number(a.isComplete) - Number(b.isComplete));
    const lines = enabledSteps.map(({ text, isComplete }) => {
        const checkmark = isComplete ? `${figures.tick} ` : '';
        return {
            text: `${checkmark}${text}`
        };
    });
    const warningText = getCwd() === homedir() ? 'Note: You have launched claude in your home directory. For the best experience, launch it in a project directory instead.' : undefined;
    if (warningText) {
        lines.push({
            text: warningText
        });
    }
    return {
        title: 'Tips for getting started',
        lines
    };
}
export function createGuestPassesFeed() {
    const reward = getCachedReferrerReward();
    const subtitle = reward ? `Share Claude Code and earn ${formatCreditAmount(reward)} of extra usage` : 'Share Claude Code with friends';
    return {
        title: '3 guest passes',
        lines: [],
        customContent: {
            content: _jsxs(_Fragment, { children: [_jsx(Box, { marginY: 1, children: _jsx(Text, { color: "claude", children: "[\u273B] [\u273B] [\u273B]" }) }), _jsx(Text, { dimColor: true, children: subtitle })] }),
            width: 48
        },
        footer: '/passes'
    };
}
