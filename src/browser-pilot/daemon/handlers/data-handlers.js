/**
 * Data extraction command handlers for Browser Pilot Daemon
 */
import * as actions from '../../cdp/actions';
/**
 * Handle extract command (text extraction)
 */
export async function handleExtract(context, params) {
    const selector = params.selector;
    // If selectors object provided, use extractData for multiple selectors
    if (params.selectors && typeof params.selectors === 'object') {
        return actions.extractData(context.browser, params.selectors);
    }
    // Otherwise use extractText for single selector
    return actions.extractText(context.browser, selector);
}
/**
 * Handle content command (get page HTML)
 */
export async function handleContent(context, _params) {
    return actions.getContent(context.browser);
}
/**
 * Handle find command (find element)
 */
export async function handleFind(context, params) {
    const selector = params.selector;
    return actions.findElement(context.browser, selector);
}
/**
 * Handle JavaScript evaluation command
 */
export async function handleEval(context, params) {
    const expression = params.expression;
    return actions.evaluate(context.browser, expression);
}
