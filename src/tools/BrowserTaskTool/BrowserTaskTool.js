import { z } from 'zod/v4';
import { buildTool } from '../../Tool.js';
import { lazySchema } from '../../utils/lazySchema.js';
import { logError } from '../../utils/log.js';
import { getToolUseSummary, renderToolUseMessage, renderToolUseProgressMessage, renderToolResultMessage, } from './UI.js';
// Browser tool that acts as "eyes and hands" - Claude Code decides what to do
const inputSchema = lazySchema(() => z.strictObject({
    command: z.enum([
        'navigate', 'click', 'type', 'press', 'extract', 'get_state', 'query',
        'new_tab', 'switch_tab', 'close_tab', 'list_tabs',
        'wait', 'wait_for', 'verify', 'screenshot', 'complete', 'init_task', 'cleanup'
    ]).describe('What action to perform'),
    url: z.string().optional().describe('URL to navigate to (for navigate command)'),
    selector: z.string().optional().describe('Playwright CSS/XPath selector (for click/type/query/wait_for commands)'),
    text: z.string().optional().describe('Text to type (for type command) OR text to wait for (for wait_for command)'),
    key: z.string().optional().describe('Key to press (for press command, e.g., "Enter", "Tab")'),
    tab: z.string().optional().describe('Tab name to operate on (default: "main")'),
    new_tab_name: z.string().optional().describe('Name for new tab (for new_tab command)'),
    tab_name: z.string().optional().describe('Tab name to switch to (for switch_tab command)'),
    seconds: z.number().optional().describe('Seconds to wait (for wait command)'),
    timeout: z.number().optional().describe('Timeout in ms (for wait_for command, default: 10000)'),
    retries: z.number().optional().describe('Number of retries (default: 1)'),
    post_wait: z.number().optional().describe('Seconds to wait after action (for navigate/click, default: 0.5-1)'),
    path: z.string().optional().describe('File path for screenshot (default: /tmp/screenshot.png)'),
    full_page: z.boolean().optional().describe('Full page screenshot (default: true)'),
    expected_text: z.string().optional().describe('Text that should be present (for verify command)'),
    url_should_contain: z.string().optional().describe('URL substring that should be present (for verify command)'),
    clear: z.boolean().optional().describe('Clear field before typing (default: true)'),
    reset_url: z.string().optional().describe('URL to reset to after cleanup (default: https://google.com)'),
    required_verification: z.object({}).passthrough().optional().describe('Verification requirements for task completion'),
    task_id: z.string().optional().describe('Task ID for state tracking'),
}));
const outputSchema = lazySchema(() => z.object({
    url: z.string().describe('Current page URL'),
    title: z.string().describe('Current page title'),
    elements: z.array(z.object({
        ref: z.string(),
        role: z.string(),
        name: z.string(),
        interactive: z.boolean(),
    })).describe('Interactive elements on the page with refs'),
    text: z.string().describe('Visible page text content'),
    action_result: z.string().optional().describe('Result of the performed action'),
    success: z.boolean().optional().describe('Whether action succeeded'),
    error: z.string().optional().describe('Error message if failed'),
    tabs: z.array(z.object({
        name: z.string(),
        url: z.string(),
        active: z.boolean(),
    })).optional().describe('List of open tabs (for list_tabs command)'),
    matches: z.array(z.object({
        index: z.number(),
        tag: z.string(),
        text: z.string(),
        selector: z.string(),
    })).optional().describe('Query matches (for query command)'),
    checks: z.array(z.string()).optional().describe('Verification results (for verify command)'),
    path: z.string().optional().describe('Screenshot path (for screenshot command)'),
}));
export const BROWSER_TASK_TOOL_NAME = 'browser_task';
export const BrowserTaskTool = buildTool({
    name: BROWSER_TASK_TOOL_NAME,
    searchHint: 'multi-step browser control - navigate, click, type, extract (call multiple times)',
    maxResultSizeChars: 50_000,
    shouldDefer: true, // Allow Claude to continue with multi-step workflow after seeing result
    async description(input) {
        const base = `Browser: ${input.command}`;
        if (input.command === 'navigate' && input.url)
            return `${base} to ${input.url}`;
        if (input.command === 'new_tab')
            return `${base} "${input.new_tab_name || 'unnamed'}"`;
        if (input.command === 'switch_tab')
            return `${base} to "${input.tab_name}"`;
        if (input.selector)
            return `${base} ${input.selector.substring(0, 40)}`;
        return base;
    },
    userFacingName() {
        return 'Browser';
    },
    getToolUseSummary,
    getActivityDescription(input) {
        const cmd = input.command;
        if (cmd === 'navigate')
            return `navigate${input.url ? ` ${input.url}` : ''}${input.tab ? ` (tab: ${input.tab})` : ''}`;
        if (cmd === 'new_tab')
            return `new tab: ${input.new_tab_name || 'unnamed'}`;
        if (cmd === 'switch_tab')
            return `switch to tab: ${input.tab_name}`;
        if (cmd === 'wait_for')
            return `wait for ${input.selector || input.text || '...'}`;
        if (cmd === 'verify')
            return `verify ${input.selector || input.expected_text || input.url_should_contain || '...'}`;
        if (cmd === 'screenshot')
            return `screenshot${input.path ? ` → ${input.path}` : ''}`;
        return `${cmd}${input.selector ? ` ${input.selector.substring(0, 30)}` : ''}${input.tab ? ` (tab: ${input.tab})` : ''}`;
    },
    isEnabled() {
        return true;
    },
    get inputSchema() {
        return inputSchema();
    },
    get outputSchema() {
        return outputSchema();
    },
    isConcurrencySafe() {
        return false;
    },
    isReadOnly() {
        return false;
    },
    toAutoClassifierInput(input) {
        return `${input.command} ${input.url || ''} ${input.ref || ''}`;
    },
    async checkPermissions(_input) {
        return {
            behavior: 'passthrough',
            message: 'Browser control requires permission.',
            suggestions: [
                {
                    type: 'addRules',
                    rules: [{ toolName: BROWSER_TASK_TOOL_NAME }],
                    behavior: 'allow',
                    destination: 'localSettings',
                },
            ],
        };
    },
    async prompt() {
        return `AUTONOMOUS BROWSER AGENT - FAST & RELIABLE

**USER HAS AUTHORIZED ALL ACTIONS - POSTING, SIGNUPS, EMAIL ACCESS, SCREENSHOTS**

**SPEED FIRST: MINIMIZE STEPS, MAXIMIZE OR SELECTORS, USE post_wait**

## SPEED PRINCIPLES (CRITICAL - READ FIRST)

1. NEVER query first - Use OR selectors directly: "#search, [role=searchbox], input[type=search]"
2. NEVER use separate wait commands - Use post_wait parameter instead: click {..., post_wait: 1}
3. COMBINE operations - One click with OR selectors instead of multiple attempts
4. TARGET 5-7 steps for simple tasks - Not 15-20 steps
5. USE retries=3 parameter instead of manually retrying
6. VERIFY everything in ONE command - verify {selector, expected_text, url_should_contain}

## Commands Reference

### Navigation
- navigate {url, post_wait=1}: Go to URL, waits post_wait seconds after load
- new_tab {new_tab_name}: Create named tab
- switch_tab {tab_name}: Switch to named tab
- close_tab {tab_name}: Close specific tab
- list_tabs: List all open tabs

### Interaction (always use retries + post_wait)
- click {selector, retries=3, post_wait=0.5}: Click element, retries on failure
- type {selector, text, clear=true, retries=3, post_wait=0.5}: Type text, clears first by default
- press {key}: Press keyboard key e.g. "Enter", "Tab", "Escape"

### Waiting (ONLY when genuinely needed)
- wait {seconds}: Fixed delay - ONLY for animations or known slow operations
- wait_for {selector, timeout: 10000}: Wait for element to appear - ONLY for slow SPAs
- wait_for {text: "something", timeout: 30000}: Wait for text - ONLY for async operations

### Verification (REQUIRED before complete)
- verify {selector}: Check element exists on page
- verify {expected_text}: Check text is present on page
- verify {url_should_contain}: Check URL contains string
- verify {selector, expected_text, url_should_contain}: ALL CHECKS IN ONE COMMAND
- screenshot {path: "/tmp/proof.png", full_page: true}: Capture visual proof

### Task Control
- init_task {required_verification: {...}}: Initialize task with verification requirements
- complete: Mark task done - BLOCKED until verify + screenshot have been called
- cleanup {reset_url?}: Close extra tabs, reset browser, delete temp files - ALWAYS LAST

### Discovery (use sparingly - only when direct approach fails)
- query {selector}: Find elements matching selector, returns list with refs
- extract: Get full visible page text content
- get_state: Get full page state including all elements

## State Machine

On failure: RETRY with retries param -> Try OR selector -> Alternative approach -> Continue
NEVER say "Let me start over" - state persists, continue from where you are
NEVER make multiple separate attempts for same action - use OR selectors in one command

## Streamlined Workflow

FAST: init_task -> navigate -> action(s) with OR selectors -> verify -> screenshot -> complete -> cleanup
SLOW (avoid): init -> navigate -> query -> wait -> click -> wait -> query -> wait -> verify -> screenshot -> complete

## Fast Example: SaaS Signup via Gmail (12 steps)

1. init_task({required_verification: {element_present: true, screenshot_taken: true}})
2. navigate({url: "https://gmail.com", post_wait: 2})
3. new_tab({new_tab_name: "signup"})
4. switch_tab({tab_name: "signup"})
5. navigate({url: "https://saas.com", post_wait: 2})
6. type({selector: "#email, input[type=email], input[name=email], input[autocomplete=email]", text: "user@gmail.com", retries: 3, post_wait: 0.5})
7. click({selector: "button:has-text('Sign Up'), button:has-text('Continue'), button[type=submit], [role=button]:has-text('Sign')", retries: 3, post_wait: 2})
8. switch_tab({tab_name: "main"})
9. wait_for({text: "verification", timeout: 30000})
10. extract
11. switch_tab({tab_name: "signup"})
12. type({selector: "#code, input[name=code], input[placeholder*='code' i], input[placeholder*='verify' i]", text: "EXTRACTED_CODE", retries: 3})
13. verify({selector: ".success, [role=alert], .verified, .dashboard", url_should_contain: "dashboard"})
14. screenshot({path: "/tmp/proof.png"})
15. complete
16. cleanup

## Fast Example: E-commerce Add to Cart (8 steps)

1. init_task({required_verification: {element_present: true, screenshot_taken: true}})
2. navigate({url: "https://amazon.com/s?k=anker+charger", post_wait: 2})
3. type({selector: "#twotabsearchtextbox, input[type=search], [role=searchbox]", text: "anker nano charger", post_wait: 0.5})
4. click({selector: "#nav-search-submit-button, button[type=submit], [role=button]:has-text('Search')", post_wait: 2})
5. click({selector: "[data-component-type='s-search-result']:first-child h2 a, .s-result-item h2 a", post_wait: 2})
6. click({selector: "#add-to-cart-button, button:has-text('Add to Cart'), button:has-text('Add to Bag'), [role=button]:has-text('Add')", retries: 3, post_wait: 1})
7. verify({selector: "#sw-atc-details-single-container, .a-alert-success, [class*=confirmation]", expected_text: "Added"})
8. screenshot({path: "/tmp/proof.png"})
9. complete
10. cleanup

## Fast Example: Login on ANY Site (6 steps)

1. init_task({required_verification: {url_should_contain: "dashboard"}})
2. navigate({url: "https://app.example.com/login", post_wait: 1})
3. type({selector: "input[type=email], input[name*=email i], input[autocomplete=email], input[placeholder*=email i]", text: "user@example.com", post_wait: 0.3})
4. type({selector: "input[type=password], input[name*=password i], input[autocomplete=current-password]", text: "password123", post_wait: 0.3})
5. click({selector: "button[type=submit], button:has-text('Sign In'), button:has-text('Log In'), button:has-text('Continue'), [role=button]:has-text('Sign'), form button:last-child", retries: 3, post_wait: 2})
6. verify({url_should_contain: "/dashboard"})
7. screenshot({path: "/tmp/proof.png"})
8. complete
9. cleanup

## Fast Example: Post on X/Twitter (6 steps)

1. init_task({required_verification: {text_present: true, screenshot_taken: true}})
2. navigate({url: "https://x.com/home", post_wait: 2})
3. click({selector: "[data-testid='tweetTextarea_0'], div[role=textbox], [aria-label*='Post' i]", post_wait: 0.5})
4. type({selector: "[data-testid='tweetTextarea_0'], div[role=textbox]", text: "Hello world!", post_wait: 0.5})
5. click({selector: "[data-testid='tweetButton'], button:has-text('Post'), button:has-text('Tweet')", retries: 3, post_wait: 2})
6. verify({text: "Hello world!"})
7. screenshot({path: "/tmp/proof.png"})
8. complete
9. cleanup

## 4-LAYER SELECTOR STRATEGY (Maximum Reliability)

Use all 4 layers combined in OR selectors for best results on ANY website.

### LAYER 1: Hardcoded Fast Path (Known Sites)
Pre-tested selectors that work immediately on popular platforms:

Amazon:
- Search box: #twotabsearchtextbox
- Search button: #nav-search-submit-button
- Add to cart: #add-to-cart-button
- Cart: #nav-cart
- Checkout: [name=proceedToRetailCheckout]
- First result: [data-component-type='s-search-result']:first-child h2 a

Gmail:
- Compose: div[role="button"]:has-text("Compose")
- First email: tr[role="row"]:first-child
- To field: input[aria-label="To recipients"]
- Subject: input[name="subjectbox"]
- Send: div[role="button"]:has-text("Send")

X/Twitter:
- Post textarea: [data-testid="tweetTextarea_0"]
- Tweet/Post button: [data-testid="tweetButton"]
- Reply: [data-testid="reply"]
- Like: [data-testid="like"]

GitHub:
- Search: input[placeholder="Search GitHub"]
- Code tab: [data-tab-item="code"]
- Issues tab: [data-tab-item="issues"]
- Submit issue: button:has-text("Submit new issue")

Google:
- Search input: input[name="q"], #search, [aria-label="Search"]
- Search button: input[value="Google Search"]
- First result: #search .g:first-child a

### LAYER 2: Semantic Detection (Works on ALL Modern Sites)
ARIA roles are standardized and work universally:

Form elements:
- Any button: [role="button"], button, input[type=button], input[type=submit]
- Any text input: [role="textbox"], input:not([type=hidden]):not([type=submit]):not([type=button])
- Search input: [role="searchbox"], input[type=search]
- Email input: input[type=email], input[autocomplete=email]
- Password: input[type=password], input[autocomplete=current-password]
- Checkbox: [role="checkbox"], input[type=checkbox]
- Dropdown: [role="combobox"], [role="listbox"], select

Navigation:
- Nav bar: [role="navigation"], nav
- Menu: [role="menu"], [role="menubar"]
- Tab: [role="tab"]
- Link: [role="link"], a[href]

Content:
- Main content: [role="main"], main
- Article: [role="article"], article
- Dialog/Modal: [role="dialog"], [role="alertdialog"]
- Alert: [role="alert"], [role="status"]

### LAYER 3: Pattern Escalation (Self-Healing Fallbacks)
When specific selectors fail, escalate through broader patterns:

Search field escalation:
#search -> #search-input -> [data-testid*="search"] -> input[type="search"] -> input[name*="search" i] -> input[placeholder*="search" i] -> form input[type="text"]:first-of-type

Submit button escalation:
button[type="submit"] -> input[type="submit"] -> button:has-text("Submit") -> button:has-text("Continue") -> button:has-text("Next") -> [role="button"]:has-text("Submit") -> form button:last-child

Email field escalation:
input[type="email"] -> input[autocomplete="email"] -> input[name*="email" i] -> input[placeholder*="email" i] -> input[id*="email" i] -> form input[type="text"]:first-of-type

Password field escalation:
input[type="password"] -> input[autocomplete="current-password"] -> input[name*="password" i] -> input[placeholder*="password" i]

Add to cart escalation:
#add-to-cart-button -> button:has-text("Add to Cart") -> button:has-text("Add to Bag") -> button:has-text("Buy Now") -> [role="button"]:has-text("Add") -> [data-testid*="cart" i] -> form button[type="submit"]

### LAYER 4: Visual/Positional (Last Resort)
Use DOM structure when all else fails:

Position-based:
- First of type: :first-child, :nth-child(1), :first-of-type
- Last of type: :last-child, :last-of-type
- Second item: :nth-child(2)
- Near element: input:near(label:has-text("Email"))

Structure-based:
- In header: header button, [role="banner"] button, nav button
- In main form: main form button, [role="main"] form input
- In modal: [role="dialog"] button, [role="dialog"] input
- In footer: footer button, [role="contentinfo"] a
- In sidebar: aside button, [role="complementary"] a

## Discovery Commands (When Direct Approach Fails)

When you do not know the page structure, use these to discover before acting:

Quick scan:
- query {selector: "button"} - All buttons on page
- query {selector: "[role='button']"} - All ARIA buttons
- query {selector: "input:not([type='hidden'])"} - All visible inputs
- query {selector: "a[href]"} - All links
- extract - Full page text to understand content

Targeted discovery:
- query {selector: "button:has-text('Submit')"} - Specific button text
- query {selector: "input[type='email'], input[type='text']"} - Form fields
- query {selector: "[data-testid]"} - Test ID elements (React apps)
- query {selector: "form input, form button"} - All form elements

## Speed Checklist (Before Every Action)

1. Can I use OR selectors to avoid a query step? YES -> use "selector1, selector2, selector3"
2. Can I use post_wait instead of a separate wait? YES -> add post_wait: 1 to action
3. Can I combine multiple checks into one verify? YES -> verify {selector, expected_text, url_should_contain}
4. Am I using retries=3 instead of manual retry loops? YES -> retries: 3
5. Is my step count above 10 for a simple task? YES -> combine steps with OR selectors

## What NOT To Do

- Query first then click - use OR selectors in one click command
- Separate wait commands - use post_wait on the preceding action
- Multiple verify commands - combine into one verify with all checks
- "Let me try a different approach" - just use OR selector in same command
- "Let me start over" - state persists, continue from current state
- More than 10 steps for simple login/search/click tasks

**EXECUTE. RETRY. VERIFY. COMPLETE.**`;
    },
    renderToolUseMessage,
    renderToolUseProgressMessage,
    renderToolResultMessage,
    async validateInput(input) {
        const { command, url, selector, text, tab_name, new_tab_name } = input;
        if (command === 'navigate' && !url) {
            return { result: false, message: 'navigate requires url', errorCode: 1 };
        }
        if ((command === 'click' || command === 'type') && !selector) {
            return { result: false, message: `${command} requires selector`, errorCode: 1 };
        }
        if (command === 'type' && !text) {
            return { result: false, message: 'type requires text', errorCode: 1 };
        }
        if (command === 'query' && !selector) {
            return { result: false, message: 'query requires selector', errorCode: 1 };
        }
        if (command === 'wait_for' && !selector && !text) {
            return { result: false, message: 'wait_for requires selector or text', errorCode: 1 };
        }
        if (command === 'verify' && !selector && !text && !input.url_should_contain && !input.expected_text) {
            return { result: false, message: 'verify requires at least one check (selector/expected_text/url_should_contain)', errorCode: 1 };
        }
        if (command === 'new_tab' && !new_tab_name) {
            return { result: false, message: 'new_tab requires new_tab_name', errorCode: 1 };
        }
        if (command === 'switch_tab' && !tab_name) {
            return { result: false, message: 'switch_tab requires tab_name', errorCode: 1 };
        }
        return { result: true };
    },
    async call(input, context, _canUseTool, _parentMessage, _onProgress) {
        try {
            // Handle state management commands
            if (input.command === 'init_task') {
                const initResponse = await fetch('http://127.0.0.1:8789/cdp/browser-state/init', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        task_id: input.task_id || crypto.randomUUID(),
                        required_verification: input.required_verification || {
                            element_present: true,
                            text_present: true,
                            screenshot_taken: true
                        }
                    }),
                    signal: context.abortController.signal,
                });
                const initData = await initResponse.json();
                return {
                    data: {
                        url: '',
                        title: 'Task Initialized',
                        elements: [],
                        text: `Task ${initData.task_id} initialized with verification requirements`,
                        action_result: 'Task state initialized',
                        success: initData.success,
                    }
                };
            }
            if (input.command === 'complete') {
                // ENFORCED: Check completion requirements
                const checkResponse = await fetch('http://127.0.0.1:8789/cdp/browser-state/check-completion', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'complete' }),
                    signal: context.abortController.signal,
                });
                const checkData = await checkResponse.json();
                if (!checkData.success) {
                    return {
                        data: {
                            url: '',
                            title: 'COMPLETION BLOCKED',
                            elements: [],
                            text: `CANNOT MARK COMPLETE: ${checkData.details?.message || 'Verification required'}\n\n` +
                                `Missing verifications: ${checkData.details?.missing_verifications?.join(', ') || 'unknown'}\n\n` +
                                `You MUST:\n` +
                                `1. Run verify commands for all missing checks\n` +
                                `2. Take screenshot as proof\n` +
                                `3. Then call complete`,
                            action_result: 'BLOCKED: Missing verification',
                            success: false,
                            error: checkData.error || 'Verification required',
                        }
                    };
                }
                return {
                    data: {
                        url: '',
                        title: 'Task Complete',
                        elements: [],
                        text: 'Task verified and marked complete',
                        action_result: 'Task completed successfully',
                        success: true,
                    }
                };
            }
            // Handle screenshot to track verification
            if (input.command === 'screenshot') {
                const bridgeInput = {
                    action: 'screenshot',
                    path: input.path || '/tmp/screenshot.png',
                    full_page: input.full_page ?? true,
                };
                const response = await fetch('http://127.0.0.1:8789/cdp/browser-action', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bridgeInput),
                    signal: context.abortController.signal,
                });
                const data = await response.json();
                // Track screenshot as verification
                await fetch('http://127.0.0.1:8789/cdp/browser-state/init', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ required_verification: { screenshot_taken: true } }),
                    signal: context.abortController.signal,
                });
                return {
                    data: {
                        url: data.url || '',
                        title: data.title || '',
                        elements: data.elements || [],
                        text: data.text || '',
                        action_result: data.action_result || `Screenshot saved to ${input.path}`,
                        success: data.success,
                        path: data.path,
                    }
                };
            }
            // Handle cleanup - close all tabs except main, reset to Google, delete files
            if (input.command === 'cleanup') {
                const response = await fetch('http://127.0.0.1:8789/cdp/browser-cleanup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reset_url: input.reset_url || 'https://google.com' }),
                    signal: context.abortController.signal,
                });
                const data = await response.json();
                return {
                    data: {
                        url: '',
                        title: 'Cleanup Complete',
                        elements: [],
                        text: data.message || 'Browser cleaned up: all extra tabs closed, reset to Google, temp files deleted',
                        action_result: data.message || 'Cleanup complete',
                        success: data.success,
                        results: data.results,
                    }
                };
            }
            // Standard browser actions
            const bridgeInput = {
                action: input.command,
            };
            if (input.url)
                bridgeInput.url = input.url;
            if (input.selector)
                bridgeInput.selector = input.selector;
            if (input.text)
                bridgeInput.text = input.text;
            if (input.key)
                bridgeInput.key = input.key;
            if (input.tab)
                bridgeInput.tab = input.tab;
            if (input.new_tab_name)
                bridgeInput.new_tab_name = input.new_tab_name;
            if (input.tab_name)
                bridgeInput.tab_name = input.tab_name;
            if (input.seconds !== undefined)
                bridgeInput.seconds = input.seconds;
            if (input.timeout !== undefined)
                bridgeInput.timeout = input.timeout;
            if (input.retries !== undefined)
                bridgeInput.retries = input.retries;
            if (input.post_wait !== undefined)
                bridgeInput.post_wait = input.post_wait;
            if (input.full_page !== undefined)
                bridgeInput.full_page = input.full_page;
            if (input.expected_text)
                bridgeInput.expected_text = input.expected_text;
            if (input.url_should_contain)
                bridgeInput.url_should_contain = input.url_should_contain;
            if (input.clear !== undefined)
                bridgeInput.clear = input.clear;
            if (input.reset_url)
                bridgeInput.reset_url = input.reset_url;
            if (input.required_verification)
                bridgeInput.required_verification = input.required_verification;
            if (input.task_id)
                bridgeInput.task_id = input.task_id;
            const response = await fetch('http://127.0.0.1:8789/cdp/browser-action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bridgeInput),
                signal: context.abortController.signal,
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Bridge error: ${response.status} ${errorText}`);
            }
            const data = await response.json();
            return {
                data: {
                    url: data.url || '',
                    title: data.title || '',
                    elements: data.elements || [],
                    text: data.text || '',
                    action_result: data.action_result || '',
                    success: data.success,
                    error: data.error || '',
                    tabs: data.tabs,
                    matches: data.matches,
                    checks: data.checks,
                    verifications_complete: data.verifications_complete,
                }
            };
        }
        catch (e) {
            logError(e instanceof Error ? e : new Error(String(e)));
            return {
                data: {
                    url: '',
                    title: 'Error',
                    elements: [],
                    text: `Error: ${e instanceof Error ? e.message : String(e)}`,
                    action_result: 'failed',
                }
            };
        }
    },
    mapToolResultToToolResultBlockParam(output, toolUseID) {
        // Format the result in a way Claude can understand and act on
        const elements_text = output.elements
            .filter(e => e.interactive)
            .map(e => `- ${e.role} "${e.name}" [ref=${e.ref}]`)
            .join('\n');
        const summary = `Page: ${output.title}\nURL: ${output.url}\n\nInteractive elements:\n${elements_text || '(none)'}\n\nContent:\n${output.text.slice(0, 2000)}${output.text.length > 2000 ? '...' : ''}`;
        return {
            tool_use_id: toolUseID,
            type: 'tool_result',
            content: summary,
        };
    },
});
