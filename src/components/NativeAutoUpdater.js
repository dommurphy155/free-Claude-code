import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { logEvent } from 'src/services/analytics/index.js';
import { logForDebugging } from 'src/utils/debug.js';
import { logError } from 'src/utils/log.js';
import { useInterval } from 'usehooks-ts';
import { useUpdateNotification } from '../hooks/useUpdateNotification.js';
import { Box, Text } from '../ink.js';
import { getMaxVersion, getMaxVersionMessage } from '../utils/autoUpdater.js';
import { isAutoUpdaterDisabled } from '../utils/config.js';
import { installLatest } from '../utils/nativeInstaller/index.js';
import { gt } from '../utils/semver.js';
import { getInitialSettings } from '../utils/settings/settings.js';
/**
 * Categorize error messages for analytics
 */
function getErrorType(errorMessage) {
    if (errorMessage.includes('timeout')) {
        return 'timeout';
    }
    if (errorMessage.includes('Checksum mismatch')) {
        return 'checksum_mismatch';
    }
    if (errorMessage.includes('ENOENT') || errorMessage.includes('not found')) {
        return 'not_found';
    }
    if (errorMessage.includes('EACCES') || errorMessage.includes('permission')) {
        return 'permission_denied';
    }
    if (errorMessage.includes('ENOSPC')) {
        return 'disk_full';
    }
    if (errorMessage.includes('npm')) {
        return 'npm_error';
    }
    if (errorMessage.includes('network') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ENOTFOUND')) {
        return 'network_error';
    }
    return 'unknown';
}
export function NativeAutoUpdater({ isUpdating, onChangeIsUpdating, onAutoUpdaterResult, autoUpdaterResult, showSuccessMessage, verbose }) {
    const [versions, setVersions] = useState({});
    const [maxVersionIssue, setMaxVersionIssue] = useState(null);
    const updateSemver = useUpdateNotification(autoUpdaterResult?.version);
    const channel = getInitialSettings()?.autoUpdatesChannel ?? 'latest';
    // Track latest isUpdating value in a ref so the memoized checkForUpdates
    // callback always sees the current value without changing callback identity
    // (which would re-trigger the initial-check useEffect below and cause
    // repeated downloads on remount — the upstream trigger for #22413).
    const isUpdatingRef = useRef(isUpdating);
    isUpdatingRef.current = isUpdating;
    const checkForUpdates = React.useCallback(async () => {
        if (isUpdatingRef.current) {
            return;
        }
        if ("production" === 'test' || "production" === 'development') {
            logForDebugging('NativeAutoUpdater: Skipping update check in test/dev environment');
            return;
        }
        if (isAutoUpdaterDisabled()) {
            return;
        }
        onChangeIsUpdating(true);
        const startTime = Date.now();
        // Log the start of an auto-update check for funnel analysis
        logEvent('tengu_native_auto_updater_start', {});
        try {
            // Check if current version is above the max allowed version
            const maxVersion = await getMaxVersion();
            if (maxVersion && gt(MACRO.VERSION, maxVersion)) {
                const msg = await getMaxVersionMessage();
                setMaxVersionIssue(msg ?? 'affects your version');
            }
            const result = await installLatest(channel);
            const currentVersion = MACRO.VERSION;
            const latencyMs = Date.now() - startTime;
            // Handle lock contention gracefully - just return without treating as error
            if (result.lockFailed) {
                logEvent('tengu_native_auto_updater_lock_contention', {
                    latency_ms: latencyMs
                });
                return; // Silently skip this update check, will try again later
            }
            // Update versions for display
            setVersions({
                current: currentVersion,
                latest: result.latestVersion
            });
            if (result.wasUpdated) {
                logEvent('tengu_native_auto_updater_success', {
                    latency_ms: latencyMs
                });
                onAutoUpdaterResult({
                    version: result.latestVersion,
                    status: 'success'
                });
            }
            else {
                // Already up to date
                logEvent('tengu_native_auto_updater_up_to_date', {
                    latency_ms: latencyMs
                });
            }
        }
        catch (error) {
            const latencyMs = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : String(error);
            logError(error);
            const errorType = getErrorType(errorMessage);
            logEvent('tengu_native_auto_updater_fail', {
                latency_ms: latencyMs,
                error_timeout: errorType === 'timeout',
                error_checksum: errorType === 'checksum_mismatch',
                error_not_found: errorType === 'not_found',
                error_permission: errorType === 'permission_denied',
                error_disk_full: errorType === 'disk_full',
                error_npm: errorType === 'npm_error',
                error_network: errorType === 'network_error'
            });
            onAutoUpdaterResult({
                version: null,
                status: 'install_failed'
            });
        }
        finally {
            onChangeIsUpdating(false);
        }
        // isUpdating intentionally omitted from deps; we read isUpdatingRef
        // instead so the guard is always current without changing callback
        // identity (which would re-trigger the initial-check useEffect below).
        // eslint-disable-next-line react-hooks/exhaustive-deps
        // biome-ignore lint/correctness/useExhaustiveDependencies: isUpdating read via ref
    }, [onAutoUpdaterResult, channel]);
    // Initial check
    useEffect(() => {
        void checkForUpdates();
    }, [checkForUpdates]);
    // Check every 30 minutes
    useInterval(checkForUpdates, 30 * 60 * 1000);
    const hasUpdateResult = !!autoUpdaterResult?.version;
    const hasVersionInfo = !!versions.current && !!versions.latest;
    // Show the component when:
    // - warning banner needed (above max version), or
    // - there's an update result to display (success/error), or
    // - actively checking and we have version info to show
    const shouldRender = !!maxVersionIssue || hasUpdateResult || isUpdating && hasVersionInfo;
    if (!shouldRender) {
        return null;
    }
    return _jsxs(Box, { flexDirection: "row", gap: 1, children: [verbose && _jsxs(Text, { dimColor: true, wrap: "truncate", children: ["current: ", versions.current, " \u00B7 ", channel, ": ", versions.latest] }), isUpdating ? _jsx(Box, { children: _jsx(Text, { dimColor: true, wrap: "truncate", children: "Checking for updates" }) }) : autoUpdaterResult?.status === 'success' && showSuccessMessage && updateSemver && _jsx(Text, { color: "success", wrap: "truncate", children: "\u2713 Update installed \u00B7 Restart to update" }), autoUpdaterResult?.status === 'install_failed' && _jsxs(Text, { color: "error", wrap: "truncate", children: ["\u2717 Auto-update failed \u00B7 Try ", _jsx(Text, { bold: true, children: "/status" })] }), maxVersionIssue && "external" === 'ant' && _jsxs(Text, { color: "warning", children: ["\u26A0 Known issue: ", maxVersionIssue, " \u00B7 Run", ' ', _jsx(Text, { bold: true, children: "claude rollback --safe" }), " to downgrade"] })] });
}
