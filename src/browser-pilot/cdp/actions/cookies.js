/**
 * Cookie management actions for Browser Pilot.
 */
import { mergeOptions } from './helpers';
import { logger } from '../../utils/logger';
/**
 * Get all cookies.
 */
export async function getCookies(browser, options) {
    const opts = mergeOptions(options);
    if (opts.verbose)
        logger.info('🍪 Getting cookies...');
    const result = await browser.sendCommand('Network.getCookies');
    const cookies = result.cookies || [];
    if (opts.verbose)
        logger.info(`✅ Retrieved ${cookies.length} cookie(s)`);
    return { success: true, cookies, count: cookies.length };
}
/**
 * Set a cookie.
 */
export async function setCookie(browser, name, value, domain, path = '/', secure = false, httpOnly = false, options) {
    const opts = mergeOptions(options);
    if (opts.verbose)
        logger.info(`🍪 Setting cookie: ${name}`);
    const cookieParams = {
        name,
        value,
        path,
        secure,
        httpOnly,
        ...(domain && { domain })
    };
    await browser.sendCommand('Network.setCookie', cookieParams);
    if (opts.verbose)
        logger.info(`✅ Cookie set successfully`);
    return { success: true, name };
}
/**
 * Delete cookies.
 */
export async function deleteCookies(browser, name, options) {
    const opts = mergeOptions(options);
    if (name) {
        if (opts.verbose)
            logger.info(`🍪 Deleting cookie: ${name}`);
        // Get all cookies to find the domain
        const result = await browser.sendCommand('Network.getCookies');
        const cookies = result.cookies || [];
        // Find matching cookies
        const matchingCookies = cookies.filter((c) => c.name === name);
        if (matchingCookies.length > 0) {
            for (const cookie of matchingCookies) {
                await browser.sendCommand('Network.deleteCookies', {
                    name,
                    domain: cookie.domain || ''
                });
            }
            if (opts.verbose)
                logger.info(`✅ Deleted ${matchingCookies.length} cookie(s) with name '${name}'`);
        }
        else {
            if (opts.verbose)
                logger.warn(`⚠️  Warning: Cookie '${name}' not found`);
        }
    }
    else {
        if (opts.verbose)
            logger.info('🍪 Deleting all cookies...');
        await browser.sendCommand('Network.clearBrowserCookies');
        if (opts.verbose)
            logger.info(`✅ All cookies deleted`);
    }
    return { success: true };
}
