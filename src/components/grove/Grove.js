import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import React, { useEffect, useState } from 'react';
import { logEvent } from 'src/services/analytics/index.js';
import { Box, Link, Text, useInput } from '../../ink.js';
import { calculateShouldShowGrove, getGroveNoticeConfig, getGroveSettings, markGroveNoticeViewed, updateGroveSettings } from '../../services/api/grove.js';
import { Select } from '../CustomSelect/index.js';
import { Byline } from '../design-system/Byline.js';
import { Dialog } from '../design-system/Dialog.js';
import { KeyboardShortcutHint } from '../design-system/KeyboardShortcutHint.js';
const NEW_TERMS_ASCII = ` _____________
 |          \\  \\
 | NEW TERMS \\__\\
 |              |
 |  ----------  |
 |  ----------  |
 |  ----------  |
 |  ----------  |
 |  ----------  |
 |              |
 |______________|`;
function GracePeriodContentBody() {
    const $ = _c(9);
    let t0;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = _jsxs(Text, { children: ["An update to our Consumer Terms and Privacy Policy will take effect on", " ", _jsx(Text, { bold: true, children: "October 8, 2025" }), ". You can accept the updated terms today."] });
        $[0] = t0;
    }
    else {
        t0 = $[0];
    }
    let t1;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = _jsx(Text, { children: "What's changing?" });
        $[1] = t1;
    }
    else {
        t1 = $[1];
    }
    let t2;
    let t3;
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
        t2 = _jsx(Text, { children: "\u00B7 " });
        t3 = _jsx(Text, { bold: true, children: "You can help improve Claude " });
        $[2] = t2;
        $[3] = t3;
    }
    else {
        t2 = $[2];
        t3 = $[3];
    }
    let t4;
    if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
        t4 = _jsx(Box, { paddingLeft: 1, children: _jsxs(Text, { children: [t2, t3, _jsxs(Text, { children: ["\u2014 Allow the use of your chats and coding sessions to train and improve Anthropic AI models. Change anytime in your Privacy Settings (", _jsx(Link, { url: "https://claude.ai/settings/data-privacy-controls" }), ")."] })] }) });
        $[4] = t4;
    }
    else {
        t4 = $[4];
    }
    let t5;
    if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
        t5 = _jsxs(Box, { flexDirection: "column", children: [t1, t4, _jsx(Box, { paddingLeft: 1, children: _jsxs(Text, { children: [_jsx(Text, { children: "\u00B7 " }), _jsx(Text, { bold: true, children: "Updates to data retention " }), _jsx(Text, { children: "\u2014 To help us improve our AI models and safety protections, we're extending data retention to 5 years." })] }) })] });
        $[5] = t5;
    }
    else {
        t5 = $[5];
    }
    let t6;
    if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
        t6 = _jsx(Link, { url: "https://www.anthropic.com/news/updates-to-our-consumer-terms" });
        $[6] = t6;
    }
    else {
        t6 = $[6];
    }
    let t7;
    if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
        t7 = _jsx(Link, { url: "https://anthropic.com/legal/terms" });
        $[7] = t7;
    }
    else {
        t7 = $[7];
    }
    let t8;
    if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
        t8 = _jsxs(_Fragment, { children: [t0, t5, _jsxs(Text, { children: ["Learn more (", t6, ") or read the updated Consumer Terms (", t7, ") and Privacy Policy (", _jsx(Link, { url: "https://anthropic.com/legal/privacy" }), ")"] })] });
        $[8] = t8;
    }
    else {
        t8 = $[8];
    }
    return t8;
}
function PostGracePeriodContentBody() {
    const $ = _c(7);
    let t0;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = _jsx(Text, { children: "We've updated our Consumer Terms and Privacy Policy." });
        $[0] = t0;
    }
    else {
        t0 = $[0];
    }
    let t1;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = _jsx(Text, { children: "What's changing?" });
        $[1] = t1;
    }
    else {
        t1 = $[1];
    }
    let t2;
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
        t2 = _jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { bold: true, children: "Help improve Claude" }), _jsx(Text, { children: "Allow the use of your chats and coding sessions to train and improve Anthropic AI models. You can change this anytime in Privacy Settings" }), _jsx(Link, { url: "https://claude.ai/settings/data-privacy-controls" })] });
        $[2] = t2;
    }
    else {
        t2 = $[2];
    }
    let t3;
    if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
        t3 = _jsxs(Box, { flexDirection: "column", gap: 1, children: [t1, t2, _jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { bold: true, children: "How this affects data retention" }), _jsx(Text, { children: "Turning ON the improve Claude setting extends data retention from 30 days to 5 years. Turning it OFF keeps the default 30-day data retention. Delete data anytime." })] })] });
        $[3] = t3;
    }
    else {
        t3 = $[3];
    }
    let t4;
    if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
        t4 = _jsx(Link, { url: "https://www.anthropic.com/news/updates-to-our-consumer-terms" });
        $[4] = t4;
    }
    else {
        t4 = $[4];
    }
    let t5;
    if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
        t5 = _jsx(Link, { url: "https://anthropic.com/legal/terms" });
        $[5] = t5;
    }
    else {
        t5 = $[5];
    }
    let t6;
    if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
        t6 = _jsxs(_Fragment, { children: [t0, t3, _jsxs(Text, { children: ["Learn more (", t4, ") or read the updated Consumer Terms (", t5, ") and Privacy Policy (", _jsx(Link, { url: "https://anthropic.com/legal/privacy" }), ")"] })] });
        $[6] = t6;
    }
    else {
        t6 = $[6];
    }
    return t6;
}
export function GroveDialog(t0) {
    const $ = _c(34);
    const { showIfAlreadyViewed, location, onDone } = t0;
    const [shouldShowDialog, setShouldShowDialog] = useState(null);
    const [groveConfig, setGroveConfig] = useState(null);
    let t1;
    let t2;
    if ($[0] !== location || $[1] !== onDone || $[2] !== showIfAlreadyViewed) {
        t1 = () => {
            const checkGroveSettings = async function checkGroveSettings() {
                const [settingsResult, configResult] = await Promise.all([getGroveSettings(), getGroveNoticeConfig()]);
                const config = configResult.success ? configResult.data : null;
                setGroveConfig(config);
                const shouldShow = calculateShouldShowGrove(settingsResult, configResult, showIfAlreadyViewed);
                setShouldShowDialog(shouldShow);
                if (!shouldShow) {
                    onDone("skip_rendering");
                    return;
                }
                markGroveNoticeViewed();
                logEvent("tengu_grove_policy_viewed", {
                    location: location,
                    dismissable: config?.notice_is_grace_period
                });
            };
            checkGroveSettings();
        };
        t2 = [showIfAlreadyViewed, location, onDone];
        $[0] = location;
        $[1] = onDone;
        $[2] = showIfAlreadyViewed;
        $[3] = t1;
        $[4] = t2;
    }
    else {
        t1 = $[3];
        t2 = $[4];
    }
    useEffect(t1, t2);
    if (shouldShowDialog === null) {
        return null;
    }
    if (!shouldShowDialog) {
        return null;
    }
    let t3;
    if ($[5] !== groveConfig?.notice_is_grace_period || $[6] !== onDone) {
        t3 = async function onChange(value) {
            bb21: switch (value) {
                case "accept_opt_in":
                    {
                        await updateGroveSettings(true);
                        logEvent("tengu_grove_policy_submitted", {
                            state: true,
                            dismissable: groveConfig?.notice_is_grace_period
                        });
                        break bb21;
                    }
                case "accept_opt_out":
                    {
                        await updateGroveSettings(false);
                        logEvent("tengu_grove_policy_submitted", {
                            state: false,
                            dismissable: groveConfig?.notice_is_grace_period
                        });
                        break bb21;
                    }
                case "defer":
                    {
                        logEvent("tengu_grove_policy_dismissed", {
                            state: true
                        });
                        break bb21;
                    }
                case "escape":
                    {
                        logEvent("tengu_grove_policy_escaped", {});
                    }
            }
            onDone(value);
        };
        $[5] = groveConfig?.notice_is_grace_period;
        $[6] = onDone;
        $[7] = t3;
    }
    else {
        t3 = $[7];
    }
    const onChange = t3;
    let t4;
    if ($[8] !== groveConfig?.domain_excluded) {
        t4 = groveConfig?.domain_excluded ? [{
                label: "Accept terms \xB7 Help improve Claude: OFF (for emails with your domain)",
                value: "accept_opt_out"
            }] : [{
                label: "Accept terms \xB7 Help improve Claude: ON",
                value: "accept_opt_in"
            }, {
                label: "Accept terms \xB7 Help improve Claude: OFF",
                value: "accept_opt_out"
            }];
        $[8] = groveConfig?.domain_excluded;
        $[9] = t4;
    }
    else {
        t4 = $[9];
    }
    const acceptOptions = t4;
    let t5;
    if ($[10] !== groveConfig?.notice_is_grace_period || $[11] !== onChange) {
        t5 = function handleCancel() {
            if (groveConfig?.notice_is_grace_period) {
                onChange("defer");
                return;
            }
            onChange("escape");
        };
        $[10] = groveConfig?.notice_is_grace_period;
        $[11] = onChange;
        $[12] = t5;
    }
    else {
        t5 = $[12];
    }
    const handleCancel = t5;
    let t6;
    if ($[13] !== groveConfig?.notice_is_grace_period) {
        t6 = _jsx(Box, { flexDirection: "column", gap: 1, flexGrow: 1, children: groveConfig?.notice_is_grace_period ? _jsx(GracePeriodContentBody, {}) : _jsx(PostGracePeriodContentBody, {}) });
        $[13] = groveConfig?.notice_is_grace_period;
        $[14] = t6;
    }
    else {
        t6 = $[14];
    }
    let t7;
    if ($[15] === Symbol.for("react.memo_cache_sentinel")) {
        t7 = _jsx(Box, { flexShrink: 0, children: _jsx(Text, { color: "professionalBlue", children: NEW_TERMS_ASCII }) });
        $[15] = t7;
    }
    else {
        t7 = $[15];
    }
    let t8;
    if ($[16] !== t6) {
        t8 = _jsxs(Box, { flexDirection: "row", children: [t6, t7] });
        $[16] = t6;
        $[17] = t8;
    }
    else {
        t8 = $[17];
    }
    let t9;
    if ($[18] === Symbol.for("react.memo_cache_sentinel")) {
        t9 = _jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { bold: true, children: "Please select how you'd like to continue" }), _jsx(Text, { children: "Your choice takes effect immediately upon confirmation." })] });
        $[18] = t9;
    }
    else {
        t9 = $[18];
    }
    let t10;
    if ($[19] !== groveConfig?.notice_is_grace_period) {
        t10 = groveConfig?.notice_is_grace_period ? [{
                label: "Not now",
                value: "defer"
            }] : [];
        $[19] = groveConfig?.notice_is_grace_period;
        $[20] = t10;
    }
    else {
        t10 = $[20];
    }
    let t11;
    if ($[21] !== acceptOptions || $[22] !== t10) {
        t11 = [...acceptOptions, ...t10];
        $[21] = acceptOptions;
        $[22] = t10;
        $[23] = t11;
    }
    else {
        t11 = $[23];
    }
    let t12;
    if ($[24] !== onChange) {
        t12 = value_0 => onChange(value_0);
        $[24] = onChange;
        $[25] = t12;
    }
    else {
        t12 = $[25];
    }
    let t13;
    if ($[26] !== handleCancel || $[27] !== t11 || $[28] !== t12) {
        t13 = _jsxs(Box, { flexDirection: "column", gap: 1, children: [t9, _jsx(Select, { options: t11, onChange: t12, onCancel: handleCancel })] });
        $[26] = handleCancel;
        $[27] = t11;
        $[28] = t12;
        $[29] = t13;
    }
    else {
        t13 = $[29];
    }
    let t14;
    if ($[30] !== handleCancel || $[31] !== t13 || $[32] !== t8) {
        t14 = _jsxs(Dialog, { title: "Updates to Consumer Terms and Policies", color: "professionalBlue", onCancel: handleCancel, inputGuide: _temp, children: [t8, t13] });
        $[30] = handleCancel;
        $[31] = t13;
        $[32] = t8;
        $[33] = t14;
    }
    else {
        t14 = $[33];
    }
    return t14;
}
function _temp(exitState) {
    return exitState.pending ? _jsxs(Text, { children: ["Press ", exitState.keyName, " again to exit"] }) : _jsxs(Byline, { children: [_jsx(KeyboardShortcutHint, { shortcut: "Enter", action: "confirm" }), _jsx(KeyboardShortcutHint, { shortcut: "Esc", action: "cancel" })] });
}
export function PrivacySettingsDialog(t0) {
    const $ = _c(17);
    const { settings, domainExcluded, onDone } = t0;
    const [groveEnabled, setGroveEnabled] = useState(settings.grove_enabled);
    let t1;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = [];
        $[0] = t1;
    }
    else {
        t1 = $[0];
    }
    React.useEffect(_temp2, t1);
    let t2;
    if ($[1] !== domainExcluded || $[2] !== groveEnabled) {
        t2 = async (input, key) => {
            if (!domainExcluded && (key.tab || key.return || input === " ")) {
                const newValue = !groveEnabled;
                setGroveEnabled(newValue);
                await updateGroveSettings(newValue);
            }
        };
        $[1] = domainExcluded;
        $[2] = groveEnabled;
        $[3] = t2;
    }
    else {
        t2 = $[3];
    }
    useInput(t2);
    let t3;
    if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
        t3 = _jsx(Text, { color: "error", children: "false" });
        $[4] = t3;
    }
    else {
        t3 = $[4];
    }
    let valueComponent = t3;
    if (domainExcluded) {
        let t4;
        if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
            t4 = _jsx(Text, { color: "error", children: "false (for emails with your domain)" });
            $[5] = t4;
        }
        else {
            t4 = $[5];
        }
        valueComponent = t4;
    }
    else {
        if (groveEnabled) {
            let t4;
            if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
                t4 = _jsx(Text, { color: "success", children: "true" });
                $[6] = t4;
            }
            else {
                t4 = $[6];
            }
            valueComponent = t4;
        }
    }
    let t4;
    if ($[7] !== domainExcluded) {
        t4 = exitState => exitState.pending ? _jsxs(Text, { children: ["Press ", exitState.keyName, " again to exit"] }) : domainExcluded ? _jsx(KeyboardShortcutHint, { shortcut: "Esc", action: "cancel" }) : _jsxs(Byline, { children: [_jsx(KeyboardShortcutHint, { shortcut: "Enter/Tab/Space", action: "toggle" }), _jsx(KeyboardShortcutHint, { shortcut: "Esc", action: "cancel" })] });
        $[7] = domainExcluded;
        $[8] = t4;
    }
    else {
        t4 = $[8];
    }
    let t5;
    if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
        t5 = _jsxs(Text, { children: ["Review and manage your privacy settings at", " ", _jsx(Link, { url: "https://claude.ai/settings/data-privacy-controls" })] });
        $[9] = t5;
    }
    else {
        t5 = $[9];
    }
    let t6;
    if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
        t6 = _jsx(Box, { width: 44, children: _jsx(Text, { bold: true, children: "Help improve Claude" }) });
        $[10] = t6;
    }
    else {
        t6 = $[10];
    }
    let t7;
    if ($[11] !== valueComponent) {
        t7 = _jsxs(Box, { children: [t6, _jsx(Box, { children: valueComponent })] });
        $[11] = valueComponent;
        $[12] = t7;
    }
    else {
        t7 = $[12];
    }
    let t8;
    if ($[13] !== onDone || $[14] !== t4 || $[15] !== t7) {
        t8 = _jsxs(Dialog, { title: "Data Privacy", color: "professionalBlue", onCancel: onDone, inputGuide: t4, children: [t5, t7] });
        $[13] = onDone;
        $[14] = t4;
        $[15] = t7;
        $[16] = t8;
    }
    else {
        t8 = $[16];
    }
    return t8;
}
function _temp2() {
    logEvent("tengu_grove_privacy_settings_viewed", {});
}
