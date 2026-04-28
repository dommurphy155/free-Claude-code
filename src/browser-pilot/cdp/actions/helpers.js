/**
 * Helper functions for Browser Pilot actions.
 */
import { resolve, dirname } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { getOutputDir } from '../config';
import { waitForNetworkIdle } from './wait';
import { logger } from '../../utils/logger';
import { TIMING, FS } from '../../constants';
/**
 * Constants for error checking and timing
 */
const RECENT_MESSAGE_TIMEOUT_MS = TIMING.RECENT_MESSAGE_WINDOW;
const NAVIGATION_WAIT_DELAY_MS = TIMING.NETWORK_IDLE_TIMEOUT;
/**
 * Constants for selector retry logic
 */
export const SELECTOR_RETRY_CONFIG = {
    MAX_ATTEMPTS: 3,
    MAP_FILENAME: FS.INTERACTION_MAP_FILE,
    MAP_FOLDER: FS.OUTPUT_DIR
};
/**
 * Default action options
 */
export const DEFAULT_OPTIONS = {
    verbose: true,
    logLevel: 'all',
    waitForNavigation: false
};
/**
 * Helper: Merge user options with defaults
 */
export function mergeOptions(options) {
    return {
        verbose: options?.verbose ?? DEFAULT_OPTIONS.verbose,
        logLevel: options?.logLevel ?? DEFAULT_OPTIONS.logLevel,
        waitForNavigation: options?.waitForNavigation ?? DEFAULT_OPTIONS.waitForNavigation
    };
}
/**
 * Helper: Sleep for specified milliseconds.
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Helper: Check browser console and network for errors and warnings after an action.
 * @param browser - ChromeBrowser instance
 * @param logLevel - Log level ('all', 'errors-only', 'none')
 */
export function checkErrors(browser, logLevel = 'all') {
    if (logLevel === 'none') {
        return; // Skip logging
    }
    const messages = browser.getConsoleMessages();
    const networkErrors = browser.getNetworkErrors();
    // Filter for errors and warnings from recent messages
    const recentMessages = messages.filter(msg => {
        const age = Date.now() - msg.timestamp;
        return age < RECENT_MESSAGE_TIMEOUT_MS;
    });
    const recentNetworkErrors = networkErrors.filter(err => {
        const age = Date.now() - err.timestamp;
        return age < RECENT_MESSAGE_TIMEOUT_MS;
    });
    const consoleErrors = recentMessages.filter(msg => msg.level === 'error');
    const consoleWarnings = recentMessages.filter(msg => msg.level === 'warning');
    // Console Errors
    if (consoleErrors.length > 0) {
        logger.error(`\n❌ ${consoleErrors.length} console error(s) detected:`);
        consoleErrors.forEach((err, idx) => {
            logger.error(`   ${idx + 1}. ${err.text}`);
            if (err.url) {
                logger.error(`      at ${err.url}:${err.lineNumber || 0}`);
            }
        });
    }
    // Console Warnings (only if logLevel is 'all')
    if (logLevel === 'all' && consoleWarnings.length > 0) {
        logger.warn(`\n⚠️  ${consoleWarnings.length} console warning(s) detected:`);
        consoleWarnings.forEach((warn, idx) => {
            logger.warn(`   ${idx + 1}. ${warn.text}`);
        });
    }
    // Network Errors
    if (recentNetworkErrors.length > 0) {
        logger.error(`\n🌐 ${recentNetworkErrors.length} network error(s) detected:`);
        recentNetworkErrors.forEach((err, idx) => {
            logger.error(`   ${idx + 1}. ${err.url}`);
            logger.error(`      ${err.errorText}`);
            if (err.statusCode) {
                logger.error(`      Status: ${err.statusCode}`);
            }
        });
    }
}
/**
 * @deprecated Use checkErrors instead
 */
export function checkConsoleErrors(browser) {
    checkErrors(browser, 'all');
}
/**
 * Helper: Wait for action completion (navigation + errors check).
 * Reduces code duplication across click, fill, and other interactive actions.
 */
export async function waitForActionComplete(browser, opts) {
    if (opts.waitForNavigation) {
        if (opts.verbose)
            logger.info(`⏳ Waiting for page navigation...`);
        await waitForNetworkIdle(browser, TIMING.ACTION_DELAY_NAVIGATION, 0, { verbose: false });
        await sleep(NAVIGATION_WAIT_DELAY_MS); // Additional delay for errors to surface
    }
    checkErrors(browser, opts.logLevel);
}
/**
 * Helper: Log action error with consistent formatting
 * @param context - Error context (e.g., 'Get viewport failed')
 * @param error - Error object
 * @param verbose - Whether to log the error
 */
export function logActionError(context, error, verbose) {
    if (!verbose)
        return;
    logger.error(`❌ ${context}`);
    if (error instanceof Error) {
        logger.error(`   Error: ${error.message}`);
    }
    else {
        logger.error(`   Error: ${String(error)}`);
    }
}
/**
 * Helper: Ensure output path (convert relative to .browser-pilot/).
 * Security: Prevents path traversal attacks and rejects absolute paths.
 * Uses getOutputDir() from config to get project-specific output directory.
 */
export function ensureOutputPath(path) {
    // Reject absolute paths
    if (resolve(path) === path) {
        throw new Error('Absolute paths are not allowed. Use relative paths only.');
    }
    // Get output directory from project config (auto-creates .browser-pilot/)
    const outputDir = getOutputDir();
    const absolutePath = resolve(outputDir, path);
    // Prevent path traversal attacks
    if (!absolutePath.startsWith(outputDir)) {
        throw new Error('Path traversal detected. Files must be within .browser-pilot directory.');
    }
    // Ensure subdirectory exists (if path includes subdirectories)
    const dir = dirname(absolutePath);
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
    return absolutePath;
}
