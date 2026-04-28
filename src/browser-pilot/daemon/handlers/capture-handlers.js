/**
 * Capture command handlers for Browser Pilot Daemon
 */
import * as actions from '../../cdp/actions';
/**
 * Handle screenshot command
 */
export async function handleScreenshot(context, params) {
    const filename = params.filename;
    const fullPage = params.fullPage !== false; // Default true
    // Parse clip options if provided
    let clip;
    if (params.clipX !== undefined && params.clipY !== undefined &&
        params.clipWidth !== undefined && params.clipHeight !== undefined) {
        clip = {
            x: params.clipX,
            y: params.clipY,
            width: params.clipWidth,
            height: params.clipHeight,
            scale: params.clipScale
        };
    }
    return actions.screenshot(context.browser, filename || 'screenshot.png', fullPage, clip);
}
/**
 * Handle set viewport size command
 */
export async function handleSetViewport(context, params) {
    const width = params.width;
    const height = params.height;
    const deviceScaleFactor = params.deviceScaleFactor || 1;
    const mobile = params.mobile || false;
    if (!width || !height) {
        throw new Error('Width and height are required for viewport');
    }
    return actions.setViewportSize(context.browser, width, height, deviceScaleFactor, mobile);
}
/**
 * Handle get viewport command
 */
export async function handleGetViewport(context, params) {
    return actions.getViewport(context.browser);
}
/**
 * Handle get screen info command
 */
export async function handleGetScreenInfo(context, params) {
    return actions.getScreenInfo(context.browser);
}
/**
 * Handle PDF generation command
 */
export async function handlePdf(context, params) {
    const filename = params.filename;
    const landscape = params.landscape;
    return actions.generatePdf(context.browser, filename || 'page.pdf', landscape || false);
}
