import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { execa } from 'execa';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { Select } from '../../components/CustomSelect/index.js';
import { Dialog } from '../../components/design-system/Dialog.js';
import { LoadingState } from '../../components/design-system/LoadingState.js';
import { Box, Text } from '../../ink.js';
import { logEvent } from '../../services/analytics/index.js';
import { openBrowser } from '../../utils/browser.js';
import { getGhAuthStatus } from '../../utils/github/ghAuthStatus.js';
import { createDefaultEnvironment, getCodeWebUrl, importGithubToken, isSignedIn, RedactedGithubToken } from './api.js';
async function checkLoginState() {
    if (!(await isSignedIn())) {
        return {
            status: 'not_signed_in'
        };
    }
    const ghStatus = await getGhAuthStatus();
    if (ghStatus === 'not_installed') {
        return {
            status: 'gh_not_installed'
        };
    }
    if (ghStatus === 'not_authenticated') {
        return {
            status: 'gh_not_authenticated'
        };
    }
    // ghStatus === 'authenticated'. getGhAuthStatus spawns with stdout:'ignore'
    // (telemetry-safe); spawn once more with stdout:'pipe' to read the token.
    const { stdout } = await execa('gh', ['auth', 'token'], {
        stdout: 'pipe',
        stderr: 'ignore',
        timeout: 5000,
        reject: false
    });
    const trimmed = stdout.trim();
    if (!trimmed) {
        return {
            status: 'gh_not_authenticated'
        };
    }
    return {
        status: 'has_gh_token',
        token: new RedactedGithubToken(trimmed)
    };
}
function errorMessage(err, codeUrl) {
    switch (err.kind) {
        case 'not_signed_in':
            return `Login failed. Please visit ${codeUrl} and login using the GitHub App`;
        case 'invalid_token':
            return 'GitHub rejected that token. Run `gh auth login` and try again.';
        case 'server':
            return `Server error (${err.status}). Try again in a moment.`;
        case 'network':
            return "Couldn't reach the server. Check your connection.";
    }
}
function Web({ onDone }) {
    const [step, setStep] = useState({
        name: 'checking'
    });
    useEffect(() => {
        logEvent('tengu_remote_setup_started', {});
        void checkLoginState().then(async (result) => {
            switch (result.status) {
                case 'not_signed_in':
                    logEvent('tengu_remote_setup_result', {
                        result: 'not_signed_in'
                    });
                    onDone('Not signed in to Claude. Run /login first.');
                    return;
                case 'gh_not_installed':
                case 'gh_not_authenticated':
                    {
                        const url = `${getCodeWebUrl()}/onboarding?step=alt-auth`;
                        await openBrowser(url);
                        logEvent('tengu_remote_setup_result', {
                            result: result.status
                        });
                        onDone(result.status === 'gh_not_installed' ? `GitHub CLI not found. Install it via https://cli.github.com/, then run \`gh auth login\`, or connect GitHub on the web: ${url}` : `GitHub CLI not authenticated. Run \`gh auth login\` and try again, or connect GitHub on the web: ${url}`);
                        return;
                    }
                case 'has_gh_token':
                    setStep({
                        name: 'confirm',
                        token: result.token
                    });
            }
        });
        // onDone is stable across renders; intentionally not in deps.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const handleCancel = () => {
        logEvent('tengu_remote_setup_result', {
            result: 'cancelled'
        });
        onDone();
    };
    const handleConfirm = async (token) => {
        setStep({
            name: 'uploading'
        });
        const result = await importGithubToken(token);
        if (!result.ok) {
            logEvent('tengu_remote_setup_result', {
                result: 'import_failed',
                error_kind: result.error.kind
            });
            onDone(errorMessage(result.error, getCodeWebUrl()));
            return;
        }
        // Token import succeeded. Environment creation is best-effort — if it
        // fails, the web state machine routes to env-setup on landing, which is
        // one extra click but still better than the OAuth dance.
        await createDefaultEnvironment();
        const url = getCodeWebUrl();
        await openBrowser(url);
        logEvent('tengu_remote_setup_result', {
            result: 'success'
        });
        onDone(`Connected as ${result.result.github_username}. Opened ${url}`);
    };
    if (step.name === 'checking') {
        return _jsx(LoadingState, { message: "Checking login status\u2026" });
    }
    if (step.name === 'uploading') {
        return _jsx(LoadingState, { message: "Connecting GitHub to Claude\u2026" });
    }
    const token = step.token;
    return _jsxs(Dialog, { title: "Connect Claude on the web to GitHub?", onCancel: handleCancel, hideInputGuide: true, children: [_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { children: "Claude on the web requires connecting to your GitHub account to clone and push code on your behalf." }), _jsx(Text, { dimColor: true, children: "Your local credentials are used to authenticate with GitHub" })] }), _jsx(Select, { options: [{
                        label: 'Continue',
                        value: 'send'
                    }, {
                        label: 'Cancel',
                        value: 'cancel'
                    }], onChange: value => {
                    if (value === 'send') {
                        void handleConfirm(token);
                    }
                    else {
                        handleCancel();
                    }
                }, onCancel: handleCancel })] });
}
export async function call(onDone) {
    return _jsx(Web, { onDone: onDone });
}
