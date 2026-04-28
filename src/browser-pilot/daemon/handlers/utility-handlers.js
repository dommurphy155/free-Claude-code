/**
 * Utility command handlers for Browser Pilot Daemon
 */
import * as actions from '../../cdp/actions';
/**
 * Handle scroll command
 */
export async function handleScroll(context, params) {
    const x = params.x;
    const y = params.y;
    return actions.scroll(context.browser, { x, y });
}
/**
 * Handle wait command
 */
export async function handleWait(context, params) {
    const duration = params.duration;
    if (duration) {
        // Simple sleep implementation
        await new Promise(resolve => setTimeout(resolve, duration));
        return { success: true, duration };
    }
    else {
        return actions.waitForLoad(context.browser);
    }
}
/**
 * Handle console command
 */
export async function handleConsole(context, params) {
    const errorsOnly = params.errorsOnly;
    const result = await actions.getConsoleMessages(context.browser, errorsOnly);
    if (params.clear) {
        context.browser.clearConsoleMessages();
    }
    return result;
}
/**
 * Handle status command
 */
export async function handleStatus(context, _params, startTime, lastActivity) {
    const currentUrl = await context.browser.sendCommand('Runtime.evaluate', {
        expression: 'window.location.href',
        returnByValue: true
    });
    return {
        connected: true,
        currentUrl: currentUrl.result?.value || null,
        targetId: null, // CDP client doesn't expose targetId directly
        debugPort: context.browser.debugPort,
        consoleMessageCount: context.browser.getConsoleMessages().length,
        networkErrorCount: context.browser.getNetworkErrors().length,
        uptime: Date.now() - startTime,
        lastActivity: lastActivity
    };
}
