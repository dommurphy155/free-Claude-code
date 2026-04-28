import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { logEvent } from 'src/services/analytics/index.js';
import { KeyboardShortcutHint } from '../../components/design-system/KeyboardShortcutHint.js';
import { Spinner } from '../../components/Spinner.js';
import TextInput from '../../components/TextInput.js';
import { useTerminalSize } from '../../hooks/useTerminalSize.js';
import { setClipboard } from '../../ink/termio/osc.js';
import { Box, Link, Text } from '../../ink.js';
import { OAuthService } from '../../services/oauth/index.js';
import { saveOAuthTokensIfNeeded } from '../../utils/auth.js';
import { logError } from '../../utils/log.js';
const PASTE_HERE_MSG = 'Paste code here if prompted > ';
export function OAuthFlowStep({ onSuccess, onCancel }) {
    const [oauthStatus, setOAuthStatus] = useState({
        state: 'starting'
    });
    const [oauthService] = useState(() => new OAuthService());
    const [pastedCode, setPastedCode] = useState('');
    const [cursorOffset, setCursorOffset] = useState(0);
    const [showPastePrompt, setShowPastePrompt] = useState(false);
    const [urlCopied, setUrlCopied] = useState(false);
    const timersRef = useRef(new Set());
    // Separate ref so startOAuth's timer clear doesn't cancel the urlCopied reset
    const urlCopiedTimerRef = useRef(undefined);
    const terminalSize = useTerminalSize();
    const textInputColumns = Math.max(50, terminalSize.columns - PASTE_HERE_MSG.length - 4);
    function handleKeyDown(e) {
        if (oauthStatus.state !== 'error')
            return;
        e.preventDefault();
        if (e.key === 'return' && oauthStatus.toRetry) {
            setPastedCode('');
            setCursorOffset(0);
            setOAuthStatus({
                state: 'about_to_retry',
                nextState: oauthStatus.toRetry
            });
        }
        else {
            onCancel();
        }
    }
    async function handleSubmitCode(value, url) {
        try {
            // Expecting format "authorizationCode#state" from the authorization callback URL
            const [authorizationCode, state] = value.split('#');
            if (!authorizationCode || !state) {
                setOAuthStatus({
                    state: 'error',
                    message: 'Invalid code. Please make sure the full code was copied',
                    toRetry: {
                        state: 'waiting_for_login',
                        url
                    }
                });
                return;
            }
            // Track which path the user is taking (manual code entry)
            logEvent('tengu_oauth_manual_entry', {});
            oauthService.handleManualAuthCodeInput({
                authorizationCode,
                state
            });
        }
        catch (err) {
            logError(err);
            setOAuthStatus({
                state: 'error',
                message: err.message,
                toRetry: {
                    state: 'waiting_for_login',
                    url
                }
            });
        }
    }
    const startOAuth = useCallback(async () => {
        // Clear any existing timers when starting new OAuth flow
        timersRef.current.forEach(timer => clearTimeout(timer));
        timersRef.current.clear();
        try {
            const result = await oauthService.startOAuthFlow(async (url_0) => {
                setOAuthStatus({
                    state: 'waiting_for_login',
                    url: url_0
                });
                const timer_0 = setTimeout(setShowPastePrompt, 3000, true);
                timersRef.current.add(timer_0);
            }, {
                loginWithClaudeAi: true,
                // Always use Claude AI for subscription tokens
                inferenceOnly: true,
                expiresIn: 365 * 24 * 60 * 60 // 1 year
            });
            // Show processing state
            setOAuthStatus({
                state: 'processing'
            });
            // OAuthFlowStep creates inference-only tokens for GitHub Actions, not a
            // replacement login. Use saveOAuthTokensIfNeeded directly to avoid
            // performLogout which would destroy the user's existing auth session.
            saveOAuthTokensIfNeeded(result);
            // For OAuth flow, the access token can be used as an API key
            const timer1 = setTimeout((setOAuthStatus_0, accessToken, onSuccess_0, timersRef_0) => {
                setOAuthStatus_0({
                    state: 'success',
                    token: accessToken
                });
                // Auto-continue after brief delay to show success
                const timer2 = setTimeout(onSuccess_0, 1000, accessToken);
                timersRef_0.current.add(timer2);
            }, 100, setOAuthStatus, result.accessToken, onSuccess, timersRef);
            timersRef.current.add(timer1);
        }
        catch (err_0) {
            const errorMessage = err_0.message;
            setOAuthStatus({
                state: 'error',
                message: errorMessage,
                toRetry: {
                    state: 'starting'
                } // Allow retry by starting fresh OAuth flow
            });
            logError(err_0);
            logEvent('tengu_oauth_error', {
                error: errorMessage
            });
        }
    }, [oauthService, onSuccess]);
    useEffect(() => {
        if (oauthStatus.state === 'starting') {
            void startOAuth();
        }
    }, [oauthStatus.state, startOAuth]);
    // Retry logic
    useEffect(() => {
        if (oauthStatus.state === 'about_to_retry') {
            const timer_1 = setTimeout((nextState, setShowPastePrompt_0, setOAuthStatus_1) => {
                // Only show paste prompt when retrying to waiting_for_login
                setShowPastePrompt_0(nextState.state === 'waiting_for_login');
                setOAuthStatus_1(nextState);
            }, 500, oauthStatus.nextState, setShowPastePrompt, setOAuthStatus);
            timersRef.current.add(timer_1);
        }
    }, [oauthStatus]);
    useEffect(() => {
        if (pastedCode === 'c' && oauthStatus.state === 'waiting_for_login' && showPastePrompt && !urlCopied) {
            void setClipboard(oauthStatus.url).then(raw => {
                if (raw)
                    process.stdout.write(raw);
                setUrlCopied(true);
                clearTimeout(urlCopiedTimerRef.current);
                urlCopiedTimerRef.current = setTimeout(setUrlCopied, 2000, false);
            });
            setPastedCode('');
        }
    }, [pastedCode, oauthStatus, showPastePrompt, urlCopied]);
    // Cleanup OAuth service and timers when component unmounts
    useEffect(() => {
        const timers = timersRef.current;
        return () => {
            oauthService.cleanup();
            // Clear all timers
            timers.forEach(timer_2 => clearTimeout(timer_2));
            timers.clear();
            clearTimeout(urlCopiedTimerRef.current);
        };
    }, [oauthService]);
    // Helper function to render the appropriate status message
    function renderStatusMessage() {
        switch (oauthStatus.state) {
            case 'starting':
                return _jsxs(Box, { children: [_jsx(Spinner, {}), _jsx(Text, { children: "Starting authentication\u2026" })] });
            case 'waiting_for_login':
                return _jsxs(Box, { flexDirection: "column", gap: 1, children: [!showPastePrompt && _jsxs(Box, { children: [_jsx(Spinner, {}), _jsx(Text, { children: "Opening browser to sign in with your Claude account\u2026" })] }), showPastePrompt && _jsxs(Box, { children: [_jsx(Text, { children: PASTE_HERE_MSG }), _jsx(TextInput, { value: pastedCode, onChange: setPastedCode, onSubmit: (value_0) => handleSubmitCode(value_0, oauthStatus.url), cursorOffset: cursorOffset, onChangeCursorOffset: setCursorOffset, columns: textInputColumns })] })] });
            case 'processing':
                return _jsxs(Box, { children: [_jsx(Spinner, {}), _jsx(Text, { children: "Processing authentication\u2026" })] });
            case 'success':
                return _jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { color: "success", children: "\u2713 Authentication token created successfully!" }), _jsx(Text, { dimColor: true, children: "Using token for GitHub Actions setup\u2026" })] });
            case 'error':
                return _jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsxs(Text, { color: "error", children: ["OAuth error: ", oauthStatus.message] }), oauthStatus.toRetry ? _jsx(Text, { dimColor: true, children: "Press Enter to try again, or any other key to cancel" }) : _jsx(Text, { dimColor: true, children: "Press any key to return to API key selection" })] });
            case 'about_to_retry':
                return _jsx(Box, { flexDirection: "column", gap: 1, children: _jsx(Text, { color: "permission", children: "Retrying\u2026" }) });
            default:
                return null;
        }
    }
    return _jsxs(Box, { flexDirection: "column", gap: 1, tabIndex: 0, autoFocus: true, onKeyDown: handleKeyDown, children: [oauthStatus.state === 'starting' && _jsxs(Box, { flexDirection: "column", gap: 1, paddingBottom: 1, children: [_jsx(Text, { bold: true, children: "Create Authentication Token" }), _jsx(Text, { dimColor: true, children: "Creating a long-lived token for GitHub Actions" })] }), oauthStatus.state !== 'success' && oauthStatus.state !== 'starting' && oauthStatus.state !== 'processing' && _jsxs(Box, { flexDirection: "column", gap: 1, paddingBottom: 1, children: [_jsx(Text, { bold: true, children: "Create Authentication Token" }), _jsx(Text, { dimColor: true, children: "Creating a long-lived token for GitHub Actions" })] }, "header"), oauthStatus.state === 'waiting_for_login' && showPastePrompt && _jsxs(Box, { flexDirection: "column", gap: 1, paddingBottom: 1, children: [_jsxs(Box, { paddingX: 1, children: [_jsxs(Text, { dimColor: true, children: ["Browser didn't open? Use the url below to sign in", ' '] }), urlCopied ? _jsx(Text, { color: "success", children: "(Copied!)" }) : _jsx(Text, { dimColor: true, children: _jsx(KeyboardShortcutHint, { shortcut: "c", action: "copy", parens: true }) })] }), _jsx(Link, { url: oauthStatus.url, children: _jsx(Text, { dimColor: true, children: oauthStatus.url }) })] }, "urlToCopy"), _jsx(Box, { paddingLeft: 1, flexDirection: "column", gap: 1, children: renderStatusMessage() })] });
}
