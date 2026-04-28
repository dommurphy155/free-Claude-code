/**
 * Interaction command handlers for Browser Pilot Daemon
 */
import * as actions from '../../cdp/actions';
import { logger } from '../../utils/logger';
/**
 * Helper: Get current URL from browser
 */
async function getCurrentUrl(browser) {
    try {
        const result = await browser.sendCommand('Runtime.evaluate', { expression: 'window.location.href', returnByValue: true });
        return result.result?.value || 'unknown';
    }
    catch {
        return 'unknown';
    }
}
/**
 * Helper: Execute action with automatic state tracking
 */
async function executeActionWithTracking(browser, actionFn) {
    // Capture state before action
    const urlBefore = await getCurrentUrl(browser);
    const pageChangeTracker = {
        urlBefore,
        urlAfter: null,
        navigationDetected: false,
        domChangeDetected: false,
        networkActive: false
    };
    try {
        // Execute action
        const result = await actionFn();
        // Capture state after action
        const urlAfter = await getCurrentUrl(browser);
        pageChangeTracker.urlAfter = urlAfter;
        pageChangeTracker.navigationDetected = urlBefore !== urlAfter;
        return { result, tracker: pageChangeTracker };
    }
    finally {
        // Cleanup if needed
    }
}
/**
 * Helper: Find selector with 3-stage fallback logic
 * Stage 1: Type-based search (with alias expansion)
 * Stage 2: Tag-based search
 * Stage 3: Map regeneration + retry (max 3 attempts)
 */
async function findSelectorWithRetry(context, params) {
    const { findSelector } = await import('../../cdp/map/query-map');
    const { SELECTOR_RETRY_CONFIG } = await import('../../cdp/actions/helpers');
    const { getOutputDir } = await import('../../cdp/config');
    const path = await import('path');
    const mapPath = path.join(getOutputDir(), SELECTOR_RETRY_CONFIG.MAP_FILENAME);
    logger.debug(`🔍 Smart Mode: querying map for text="${params.text}"`);
    let foundSelector = null;
    let attemptCount = 0;
    const maxAttempts = 3;
    const originalType = params.type;
    while (!foundSelector && attemptCount < maxAttempts) {
        attemptCount++;
        // Stage 1: Try with type (with alias expansion)
        if (params.type && !params.tag) {
            logger.debug(`[Attempt ${attemptCount}] Type-based search: "${params.type}"`);
            foundSelector = findSelector(mapPath, {
                text: params.text,
                index: params.index,
                type: params.type,
                viewportOnly: params.viewportOnly
            });
            if (foundSelector) {
                logger.debug(`✓ Found selector with type search: ${foundSelector}`);
                break;
            }
            // Stage 2: Fallback to tag-based search
            if (originalType) {
                const baseTag = originalType.split('-')[0];
                logger.debug(`[Attempt ${attemptCount}] Type failed, trying tag: "${baseTag}"`);
                foundSelector = findSelector(mapPath, {
                    text: params.text,
                    index: params.index,
                    tag: baseTag,
                    viewportOnly: params.viewportOnly
                });
                if (foundSelector) {
                    logger.debug(`✓ Found selector with tag search: ${foundSelector}`);
                    break;
                }
            }
        }
        else {
            // No type specified, just search
            foundSelector = findSelector(mapPath, {
                text: params.text,
                index: params.index,
                type: params.type,
                tag: params.tag,
                viewportOnly: params.viewportOnly
            });
            if (foundSelector) {
                logger.debug(`✓ Found selector: ${foundSelector}`);
                break;
            }
        }
        // Stage 3: Regenerate map and retry
        if (!foundSelector && context.mapManager && attemptCount < maxAttempts) {
            logger.warn(`[Attempt ${attemptCount}] Element not found, regenerating map...`);
            await context.mapManager.generateMap(context.browser, true);
            logger.debug('🔄 Map regenerated, retrying...');
        }
    }
    // Final check
    if (!foundSelector) {
        let errorMsg = `Element not found after ${attemptCount} attempt(s): "${params.text}"\n`;
        errorMsg += '\n💡 Troubleshooting:\n';
        errorMsg += `- Check text is exact: --text "${params.text}"\n`;
        if (params.type) {
            const baseTag = params.type.split('-')[0];
            errorMsg += `- Try tag search: --tag ${baseTag}\n`;
        }
        errorMsg += `- List available elements: node .browser-pilot/bp query --list-texts\n`;
        errorMsg += `- Remove filters: try searching without --type or --viewport-only\n`;
        logger.error(`❌ ${errorMsg}`);
        throw new Error(errorMsg);
    }
    return foundSelector;
}
/**
 * Handle click command with smart mode support
 */
export async function handleClick(context, params) {
    let selector = params.selector;
    // Smart Mode: if text provided, query map
    if (params.text && !selector) {
        selector = await findSelectorWithRetry(context, {
            text: params.text,
            index: params.index,
            type: params.type,
            tag: params.tag,
            viewportOnly: params.viewportOnly
        });
    }
    if (!selector) {
        throw new Error('No selector provided');
    }
    // Execute with tracking
    const { result, tracker } = await executeActionWithTracking(context.browser, () => actions.click(context.browser, selector));
    // Always regenerate map after click (DOM may have changed, URL may or may not change)
    logger.debug(`🔄 Regenerating map after click (URL: ${tracker.urlBefore} → ${tracker.urlAfter})`);
    if (context.mapManager) {
        await context.mapManager.generateMapSerially(context.browser, false);
    }
    return result;
}
/**
 * Handle fill command with smart mode support
 */
export async function handleFill(context, params) {
    let selector = params.selector;
    const value = params.value;
    // Smart Mode: if text provided, query map
    if (params.text && !selector) {
        selector = await findSelectorWithRetry(context, {
            text: params.text,
            index: params.index,
            type: params.type,
            tag: params.tag,
            viewportOnly: params.viewportOnly
        });
    }
    if (!selector) {
        throw new Error('No selector provided');
    }
    // Execute with tracking
    const { result, tracker } = await executeActionWithTracking(context.browser, () => actions.fill(context.browser, selector, value));
    // Always regenerate map after fill (DOM may have changed, URL may or may not change)
    logger.debug(`🔄 Regenerating map after fill (URL: ${tracker.urlBefore} → ${tracker.urlAfter})`);
    if (context.mapManager) {
        await context.mapManager.generateMapSerially(context.browser, false);
    }
    return result;
}
/**
 * Handle hover command
 */
export async function handleHover(context, params) {
    const selector = params.selector;
    return actions.hover(context.browser, selector);
}
/**
 * Handle press (keyboard key) command
 */
export async function handlePress(context, params) {
    const key = params.key;
    return actions.pressKey(context.browser, key);
}
/**
 * Handle type (text input) command
 */
export async function handleType(context, params) {
    const text = params.text;
    const delay = params.delay;
    return actions.typeText(context.browser, text, delay);
}
