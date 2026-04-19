import { registerBundledSkill } from '../bundledSkills.js'
import { BROWSER_TASK_TOOL_NAME } from '../../tools/BrowserTaskTool/BrowserTaskTool.js'

const BROWSER_PROMPT = `# Browser Automation - FAST & RELIABLE

You control a Chrome browser through ${BROWSER_TASK_TOOL_NAME}. **MINIMIZE STEPS. MAXIMIZE SPEED.**

## ⚡ SPEED PRINCIPLES (CRITICAL)

### 1. MINIMUM Steps Strategy
- **AVOID** discovery/query unless stuck
- **AVOID** explicit wait commands (use post_wait)
- **AVOID** multiple verification attempts
- **COMBINE** operations where possible

### 2. AGGRESSIVE Selector Strategy
- **ALWAYS** use multiple OR options in ONE selector:
  - GOOD: "click {selector: \'#search, input[type=search], [role=searchbox]\'"
  - BAD: Query first, then click
- **USE** post_wait instead of separate wait command
- **USE** high retries (3-5) instead of multiple attempts

### 3. Streamlined Workflow
**FAST**: init → navigate → action(s) → verify+screenshot → complete → cleanup
**NEVER**: init → navigate → query → wait → click → wait → query → wait → verify → screenshot → complete

## ENFORCED FEATURES

### Completion Blocking
The \'complete\' command FAILS until verification passes. System returns:
"CANNOT MARK COMPLETE: Missing verifications"

### Auto-Retry
- Actions retry automatically (use retries=3, not multiple attempts)
- NO "let me try again" needed

## Commands

### Task Control
- init_task {required_verification: {...}} - REQUIRED first step
- complete - BLOCKED until verified
- cleanup {reset_url?} - ALWAYS LAST

### Interaction (Fast Path)
- click {selector, retries=3, post_wait=0.5} - Built-in wait after
- type {selector, text, retries=3, post_wait=0.5} - Built-in wait after
- press {key} - For submitting forms

### NO SEPARATE WAIT UNLESS REQUIRED
- wait {seconds} - ONLY for specific delays (rare)
- wait_for {selector, timeout: 10000} - ONLY if element slow to appear

### Verification (Single Step)
- verify {selector, expected_text, url_should_contain} - ALL IN ONE
- screenshot {path: "/tmp/proof.png", full_page: true}

## MULTI-LAYERED SELECTOR STRATEGY (AMAZING Reliability)

The system uses **4 LAYERS** for maximum reliability on ANY website:

### LAYER 1: Hardcoded Fast Path (Known Sites)
For common sites, use battle-tested selectors:

**Amazon:**
- Search: #twotabsearchtextbox, #nav-search-submit-button
- Add to Cart: #add-to-cart-button
- Cart: #nav-cart

**Gmail:**
- Compose: div[role="button"]:has-text("Compose")
- Send: div[role="button"]:has-text("Send")
- First email: tr[role="row"]:first-child

**X/Twitter:**
- Post: [data-testid="tweetTextarea_0"]
- Tweet button: [data-testid="tweetButton"]

**Generic Login:**
- Email: input[type="email"]
- Password: input[type="password"]
- Submit: button[type="submit"] or button:has-text("Sign")

### LAYER 2: Semantic Detection (Universal)
When hardcoded fails, use ARIA roles (works on ALL modern sites):

**Form Elements:**
- Search: [role="searchbox"], input[type="search"]
- Email: input[type="email"], input[autocomplete="email"]
- Password: input[type="password"]
- Submit: button[type="submit"], [role="button"]:has-text(/Submit|Sign|Continue/i)

**Actions:**
- Buttons: [role="button"], button, input[type="button"]
- Links: [role="link"], a[href]
- Clickable: [role="button"], button, a[href], [tabindex="0"]

**Navigation:**
- Nav: [role="navigation"], nav
- Menu: [role="menu"], nav ul
- Search: [role="search"]

### LAYER 3: Pattern Matching (Self-Healing)
When specific selectors fail, escalate through patterns:

**Search Escalation:**
1. #search -> [data-testid*="search"] -> input[type="search"] -> input[placeholder*="search" i] -> form input[type="text"]

**Submit Escalation:**
1. button[type="submit"] -> button:has-text("Submit") -> [role="button"]:has-text("Submit") -> form button:last-child

**Email Escalation:**
1. input[type="email"] -> input[autocomplete="email"] -> input[placeholder*="email" i] -> form input:first-of-type

### LAYER 4: Visual/Positional (Last Resort)
When all else fails, use structure:

**Position-based:**
- First item: :first-child, :nth-child(1)
- Last item: :last-child
- Near element: :near(selector)

**Structure-based:**
- In header: header button, [role="banner"] button
- In form: form input, form button
- In main: main button, [role="main"] button

## SELF-HEALING Retry Strategy

**The SYSTEM automatically retries with escalating strategies:**

Attempt 1: Hardcoded selector (Amazon, Gmail, etc.)
Attempt 2: Semantic pattern (ARIA roles)
Attempt 3: Attribute pattern (type, placeholder)
Attempt 4: Text-based (button:has-text("X"))
Attempt 5: Positional (first button in form)
Attempt 6: Query and index (discover then click)

**Manual escalation:** If a selector fails, try progressively broader patterns:
1. Specific: #add-to-cart-button
2. Semantic: button:has-text("Add to Cart")
3. Generic: button:has-text(/Add|Buy/i)
4. Structural: form button

## Discovery Commands (Use These!)

**When facing unknown page structure:**

**Quick discovery:**
- query {selector: "[role=\'button\']"} - All buttons
- query {selector: "input:not([type=\'hidden\'])"} - All inputs
- extract - Full page text

**Targeted discovery:**
- query {selector: "button:has-text(\'Search\')"} - Buttons with text
- query {selector: "input[type=\'email\'], input[type=\'password\']"} - Form fields
- query {selector: "[data-testid]"} - Test ID elements

## Common Task Patterns (Multi-Strategy)

### Search (Any Site)
// Fast path: Amazon
click {selector: "#twotabsearchtextbox"}

// Universal fallback:
click {selector: "[role=\'searchbox\'], input[type=\'search\'], input[placeholder*=\'search\' i]"}

### Login (Any Site)
// Fast path: Standard login
type {selector: "input[type=\'email\']", text: "..."}
type {selector: "input[type=\'password\']", text: "..."}
click {selector: "button[type=\'submit\'], button:has-text(\'Sign\')"}

// Fallback with query:
query {selector: "input[type=\'email\'], input[type=\'text\']"}
type {selector: "input[type=\'email\']", text: "..."}

### Add to Cart (E-commerce)
// Fast paths:
click {selector: "#add-to-cart-button"}  // Amazon
click {selector: "button:has-text(\'Add to Cart\')"}  // Generic
click {selector: "button:has-text(/Add|Buy|Cart/i)"}  // Pattern match
click {selector: "[role=\'button\']:has-text(\'Add\')"}  // Semantic

## What The System Blocks

❌ "Let me start over" - State persists, continue
❌ "Done" without verify/screenshot - BLOCKED
❌ Giving up after one selector failure - Use escalation
❌ Not using discovery when stuck - Query first

## ⚡ FAST Examples (MINIMUM STEPS)

### Amazon Add to Cart (6 steps)

1. init_task {required_verification: {element_present: true, screenshot_taken: true}}
2. navigate {url: "https://amazon.com/s?k=anker+charger", post_wait: 2}
3. click {selector: "#twotabsearchtextbox, input[type=\'search\']", post_wait: 0.5}
4. type {selector: "#twotabsearchtextbox", text: "anker nano", post_wait: 0.5}
5. click {selector: "#nav-search-submit-button", post_wait: 1}
6. click {selector: "#add-to-cart-button, button:has-text(\'Add to Cart\'), [role=\'button\']:has-text(\'Add\')", retries: 3}
7. verify {selector: "#sw-atc-details-single-container, h1:has-text(\'Added to Cart\')"}
8. screenshot {path: "/tmp/proof.png"}
9. complete
10. cleanup

### Search on ANY Site (5 steps)

1. init_task {required_verification: {text_present: true}}
2. navigate {url: "https://unknown-shop.com", post_wait: 1}
3. type {selector: "#search, [role=\'searchbox\'], input[type=\'search\'], input[placeholder*=\'search\' i], input[name*=\'search\' i]", text: "wireless charger", post_wait: 0.5}
4. click {selector: "button[type=\'submit\'], [role=\'button\']:has-text(\'Search\'), button:has-text(\'Search\'), input[type=\'submit\']", post_wait: 2}
5. verify {text: "wireless", expected_text: "charger"}
6. screenshot {path: "/tmp/proof.png"}
7. complete
8. cleanup

### Login on ANY Site (5 steps)

1. init_task {required_verification: {url_should_contain: "dashboard"}}
2. navigate {url: "https://unknown-site.com/login", post_wait: 1}
3. type {selector: "input[type=\'email\'], input[name*=\'email\' i], input[autocomplete=\'email\'], input[placeholder*=\'email\' i]", text: "user@example.com", post_wait: 0.3}
4. type {selector: "input[type=\'password\'], input[name*=\'password\' i]", text: "password", post_wait: 0.3}
5. click {selector: "button[type=\'submit\'], button:has-text(\'Sign\'), button:has-text(\'Log\'), [role=\'button\']:has-text(\'Sign\'), [role=\'button\']:has-text(\'Continue\')", retries: 3, post_wait: 2}
6. verify {url_should_contain: "/dashboard, /home, /main"}
7. screenshot {path: "/tmp/proof.png"}
8. complete
9. cleanup

### Post on X/Twitter (5 steps)

1. init_task {required_verification: {text_present: true, screenshot_taken: true}}
2. navigate {url: "https://x.com", post_wait: 2}
3. click {selector: "[data-testid=\'tweetTextarea_0\'], div[role=\'textbox\']", post_wait: 0.5}
4. type {selector: "[data-testid=\'tweetTextarea_0\'], div[role=\'textbox\']", text: "Hello world!"}
5. click {selector: "[data-testid=\'tweetButton\'], [role=\'button\']:has-text(\'Post\'), button:has-text(\'Tweet\')", retries: 3, post_wait: 1}
6. verify {text: "Hello world!"}
7. screenshot {path: "/tmp/proof.png"}
8. complete
9. cleanup

### Add to Cart on ANY E-commerce (4 steps)

1. init_task {required_verification: {element_present: true, screenshot_taken: true}}
2. navigate {url: "https://any-shop.com/products/123", post_wait: 1}
3. click {selector: "#add-to-cart-button, button:has-text(\'Add to Cart\'), button:has-text(/Add|Buy/i), [role=\'button\']:has-text(\'Add\'), [data-testid*=\'cart\'], .product button", retries: 3, post_wait: 1}
4. verify {selector: "[class*=\'cart\'], [class*=\'success\'], [role=\'alert\'], .added-to-cart", expected_text: "added"}
5. screenshot {path: "/tmp/proof.png"}
6. complete
7. cleanup

## ⚡ Speed Checklist

**Before acting, ask:**
1. Can I combine multiple selectors with OR? selector: "#a, .b, [role=c]"
2. Can I use post_wait instead of separate wait? post_wait: 1
3. Can I skip discovery and go direct? (YES, unless previous attempt failed)
4. Can I verify multiple things at once? verify {selector, text, url}
5. Is this more than 8 steps? (Target: 5-7 steps for most tasks)

## ⚡ What NOT To Do (SLOW)

❌ Query first, then act - Use OR selectors
❌ Separate wait commands - Use post_wait
❌ Multiple verification attempts - One verify with multiple checks
❌ Discovery queries - Only if direct fails
❌ "Let me start over" - Continue from current state
❌ Excessive steps - Combine operations

## ✅ What To Do (FAST)

✓ OR selectors in ONE command - selector: "#search, [role=searchbox], input[type=search]"
✓ post_wait not wait - click {..., post_wait: 1}
✓ High retries - retries: 3, not multiple attempts
✓ Skip discovery - Go direct
✓ Verify multiple things - verify {selector, expected_text, url_should_contain}
✓ Minimal steps - Target 5-7 steps for simple tasks

## Cleanup (Post-Task)

**ALWAYS END WITH:**
- cleanup {} - Single command closes tabs, resets, cleans up

## Enforcement (Automatic)

**The system guarantees:**
- No completion without verification
- Auto-retry handles failures
- Screenshot required for proof
- YOU focus on SPEED, system handles reliability
`

export function registerBrowserSkill(): void {
  registerBundledSkill({
    name: 'browser',
    description: 'AMAZINGLY HARDENED browser automation with 4-LAYER selector strategy: (1) Hardcoded fast path for common sites, (2) Semantic ARIA detection, (3) Pattern escalation, (4) Visual/positional. Code-enforced completion requirements with multi-tab persistence, auto-retry, and mandatory verification. complete command BLOCKED until verify/screenshot pass.',
    userInvocable: true,
    argumentHint: 'task description',
    whenToUse: 'When user wants browser automation. System ENFORCES: verify before complete, screenshot for proof, state persistence.',
    allowedTools: [BROWSER_TASK_TOOL_NAME],
    async getPromptForCommand(args) {
      let prompt = BROWSER_PROMPT

      if (args) {
        prompt += `

## User Request

${args}

**Remember: init → execute → verify → screenshot → complete → cleanup (enforced).**
`
      }

      return [{ type: 'text', text: prompt }]
    },
  })
}
