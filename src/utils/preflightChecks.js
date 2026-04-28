import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { logEvent } from 'src/services/analytics/index.js';
import { Spinner } from '../components/Spinner.js';
import { getOauthConfig } from '../constants/oauth.js';
import { useTimeout } from '../hooks/useTimeout.js';
import { Box, Text } from '../ink.js';
import { getSSLErrorHint } from '../services/api/errorUtils.js';
import { getUserAgent } from './http.js';
import { logError } from './log.js';
async function checkEndpoints() {
    try {
        const oauthConfig = getOauthConfig();
        const tokenUrl = new URL(oauthConfig.TOKEN_URL);
        const endpoints = [`${oauthConfig.BASE_API_URL}/api/hello`, `${tokenUrl.origin}/v1/oauth/hello`];
        const checkEndpoint = async (url) => {
            try {
                const response = await axios.get(url, {
                    headers: {
                        'User-Agent': getUserAgent()
                    }
                });
                if (response.status !== 200) {
                    const hostname = new URL(url).hostname;
                    return {
                        success: false,
                        error: `Failed to connect to ${hostname}: Status ${response.status}`
                    };
                }
                return {
                    success: true
                };
            }
            catch (error) {
                const hostname = new URL(url).hostname;
                const sslHint = getSSLErrorHint(error);
                return {
                    success: false,
                    error: `Failed to connect to ${hostname}: ${error instanceof Error ? error.code || error.message : String(error)}`,
                    sslHint: sslHint ?? undefined
                };
            }
        };
        const results = await Promise.all(endpoints.map(checkEndpoint));
        const failedResult = results.find(result => !result.success);
        if (failedResult) {
            // Log failure to Statsig
            logEvent('tengu_preflight_check_failed', {
                isConnectivityError: false,
                hasErrorMessage: !!failedResult.error,
                isSSLError: !!failedResult.sslHint
            });
        }
        return failedResult || {
            success: true
        };
    }
    catch (error) {
        logError(error);
        // Log to Statsig
        logEvent('tengu_preflight_check_failed', {
            isConnectivityError: true
        });
        return {
            success: false,
            error: `Connectivity check error: ${error instanceof Error ? error.code || error.message : String(error)}`
        };
    }
}
export function PreflightStep(t0) {
    const $ = _c(12);
    const { onSuccess } = t0;
    const [result, setResult] = useState(null);
    const [isChecking, setIsChecking] = useState(true);
    const showSpinner = useTimeout(1000) && isChecking;
    let t1;
    let t2;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = () => {
            const run = async function run() {
                const checkResult = await checkEndpoints();
                setResult(checkResult);
                setIsChecking(false);
            };
            run();
        };
        t2 = [];
        $[0] = t1;
        $[1] = t2;
    }
    else {
        t1 = $[0];
        t2 = $[1];
    }
    useEffect(t1, t2);
    let t3;
    let t4;
    if ($[2] !== onSuccess || $[3] !== result) {
        t3 = () => {
            if (result?.success) {
                onSuccess();
            }
            else {
                if (result && !result.success) {
                    const timer = setTimeout(_temp, 100);
                    return () => clearTimeout(timer);
                }
            }
        };
        t4 = [result, onSuccess];
        $[2] = onSuccess;
        $[3] = result;
        $[4] = t3;
        $[5] = t4;
    }
    else {
        t3 = $[4];
        t4 = $[5];
    }
    useEffect(t3, t4);
    let t5;
    if ($[6] !== isChecking || $[7] !== result || $[8] !== showSpinner) {
        t5 = isChecking && showSpinner ? _jsxs(Box, { paddingLeft: 1, children: [_jsx(Spinner, {}), _jsx(Text, { children: "Checking connectivity..." })] }) : !result?.success && !isChecking && _jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { color: "error", children: "Unable to connect to Anthropic services" }), _jsx(Text, { color: "error", children: result?.error }), result?.sslHint ? _jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { children: result.sslHint }), _jsx(Text, { color: "suggestion", children: "See https://code.claude.com/docs/en/network-config" })] }) : _jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { children: "Please check your internet connection and network settings." }), _jsxs(Text, { children: ["Note: Claude Code might not be available in your country. Check supported countries at", " ", _jsx(Text, { color: "suggestion", children: "https://anthropic.com/supported-countries" })] })] })] });
        $[6] = isChecking;
        $[7] = result;
        $[8] = showSpinner;
        $[9] = t5;
    }
    else {
        t5 = $[9];
    }
    let t6;
    if ($[10] !== t5) {
        t6 = _jsx(Box, { flexDirection: "column", gap: 1, paddingLeft: 1, children: t5 });
        $[10] = t5;
        $[11] = t6;
    }
    else {
        t6 = $[11];
    }
    return t6;
}
function _temp() {
    return process.exit(1);
}
