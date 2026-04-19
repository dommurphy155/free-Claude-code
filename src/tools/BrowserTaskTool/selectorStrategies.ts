/**
 * MULTI-LAYERED SELECTOR STRATEGY
 * Combines hardcoded fast paths with adaptive detection for maximum reliability
 */

// Layer 1: Hardcoded selectors for common sites (FAST PATH)
export const HARDCODED_SELECTORS: Record<string, SiteSelectors> = {
  'amazon': {
    search: ['#twotabsearchtextbox', '[data-testid="search-textbox"]', 'input[type="search"]'],
    searchButton: ['#nav-search-submit-button', '[data-testid="search-button"]', '[role="button"]:has-text("Search")'],
    addToCart: ['#add-to-cart-button', '[data-testid="add-to-cart-button"]', 'button:has-text("Add to Cart")'],
    cart: ['#nav-cart', '[data-testid="cart-button"]', 'a:has-text("Cart")'],
    productTitle: ['#productTitle', '[data-testid="product-title"]'],
    price: ['.a-price .a-offscreen', '[data-testid="price"]'],
    checkout: ['[name="proceedToRetailCheckout"]', 'button:has-text("Proceed to checkout")'],
  },
  'gmail': {
    compose: ['div[role="button"]:has-text("Compose")', '[data-testid="compose-button"]', '[role="button"][aria-label*="Compose"]'],
    send: ['div[role="button"]:has-text("Send")', '[data-testid="send-button"]'],
    toField: ['input[aria-label="To recipients"]', 'input[peoplekit-id="To"]', '[role="combobox"][aria-label*="To"]'],
    subject: ['input[name="subjectbox"]', 'input[placeholder="Subject"]'],
    body: ['div[role="textbox"][aria-label="Message Body"]', 'div[aria-label*="Message"]'],
    firstEmail: ['tr[role="row"]:first-child', '[data-testid="message-row"]:first-child'],
    search: ['input[aria-label="Search mail"]', 'input[type="text"][placeholder*="Search"]'],
  },
  'github': {
    search: ['input[placeholder*="Search"]', '[data-testid="search-input"]', 'input[name="q"]'],
    signIn: ['a:has-text("Sign in")', 'input[value="Sign in"]', '[data-testid="header-signin-button"]'],
    newRepo: ['a:has-text("New")', '[data-testid="create-repository-button"]', '.btn:has-text("New")'],
    commit: ['button:has-text("Commit changes")', '[data-testid="commit-button"]'],
  },
  'twitter': {
    tweetText: ['[data-testid="tweetTextarea_0"]', 'div[role="textbox"]', '[data-text="true"]'],
    tweetButton: ['[data-testid="tweetButton"]', '[role="button"]:has-text("Post")', 'button:has-text("Tweet")'],
    reply: ['[data-testid="reply"]', '[role="button"][aria-label*="Reply"]'],
    like: ['[data-testid="like"]', '[role="button"][aria-label*="Like"]'],
  },
  'google': {
    search: ['textarea[name="q"]', 'input[name="q"]', '[role="combobox"]'],
    searchButton: ['input[value="Google Search"]', 'button:has-text("Google Search")', '[role="button"]:has-text("Search")'],
    feelingLucky: ['input[value="I\'m Feeling Lucky"]'],
  },
  'generic_login': {
    email: ['input[type="email"]', 'input[name="email"]', 'input[name="username"]', 'input[id*="email"]', 'input[placeholder*="email" i]'],
    password: ['input[type="password"]', 'input[name="password"]', 'input[id*="password"]'],
    submit: ['button[type="submit"]', 'input[type="submit"]', 'button:has-text("Sign in")', 'button:has-text("Log in")', 'button:has-text("Continue")', '[role="button"]:has-text("Sign")'],
    forgotPassword: ['a:has-text("Forgot")', 'a:has-text("Reset password")'],
  },
  'generic_ecommerce': {
    search: ['input[type="search"]', 'input[placeholder*="search" i]', '[role="searchbox"]', 'input[name*="search" i]'],
    searchButton: ['button[type="submit"]', '[role="button"]:has-text("Search")', 'button:has-text("Search")', 'button[aria-label*="Search"]'],
    addToCart: ['button:has-text(/Add|Buy|Cart/i)', '[role="button"]:has-text("Add")', 'button[id*="cart" i]', 'button[data-testid*="cart" i]'],
    checkout: ['button:has-text(/Checkout|Proceed/i)', 'a:has-text("Checkout")', '[role="button"]:has-text("Checkout")'],
    cart: ['a:has-text("Cart")', '[role="link"]:has-text("Cart")', 'button:has-text("Cart")', '[data-testid*="cart"]'],
  },
}

// Layer 2: Semantic patterns (ADAPTIVE - works on any site)
export const SEMANTIC_PATTERNS = {
  // Form elements
  search: [
    '[role="searchbox"]',
    'input[type="search"]',
    'input[placeholder*="search" i]',
    'input[name*="search" i]',
    'input[aria-label*="search" i]',
    'form[role="search"] input',
  ],
  email: [
    'input[type="email"]',
    'input[name*="email" i]',
    'input[id*="email" i]',
    'input[autocomplete="email"]',
    'input[placeholder*="email" i]',
    'input[inputmode="email"]',
  ],
  password: [
    'input[type="password"]',
    'input[name*="password" i]',
    'input[id*="password" i]',
    'input[autocomplete="current-password"]',
    'input[autocomplete="new-password"]',
  ],
  submit: [
    'button[type="submit"]',
    'input[type="submit"]',
    '[role="button"]:has-text(/Submit|Sign|Log|Continue|Next/i)',
    'button:has-text(/Submit|Sign|Log|Continue|Next/i)',
  ],
  textInput: [
    '[role="textbox"]',
    'input:not([type="hidden"]):not([type="submit"])',
    'textarea',
  ],

  // Interactive elements
  button: [
    '[role="button"]',
    'button',
    'input[type="button"]',
    'input[type="submit"]',
    '[tabindex="0"]:not([role="textbox"]):not(input)', // Clickable divs
  ],
  link: [
    '[role="link"]',
    'a[href]',
  ],
  clickable: [
    '[role="button"], button, a[href], [tabindex="0"], [onclick]',
  ],

  // Common actions
  primaryAction: [
    'button[type="submit"]',
    '[role="button"][aria-primary="true"]',
    'button.primary',
    'button.btn-primary',
    '.btn-primary',
  ],
  cancel: [
    'button:has-text("Cancel")',
    '[role="button"]:has-text("Cancel")',
    'button.cancel',
    '.btn-cancel',
  ],
  close: [
    'button[aria-label*="Close"]',
    '[role="button"][aria-label*="Close"]',
    '.close, .close-button',
  ],

  // E-commerce
  product: [
    '[role="listitem"]:has(img)',
    'article:has(img)',
    '[data-testid*="product"]',
    '.product, [class*="product"]',
  ],
  price: [
    '[data-testid*="price"]',
    '[class*="price"]',
    'span:has-text(/^\$[\d,]+/)',
  ],

  // Navigation
  navigation: [
    '[role="navigation"]',
    'nav',
    'header nav',
  ],
  menu: [
    '[role="menu"]',
    '[role="menubar"]',
    'nav ul',
  ],
}

// Layer 3: Visual/Positional patterns
export const VISUAL_PATTERNS = {
  // Position-based
  first: ':first-child',
  last: ':last-child',
  nth: (n: number) => `:nth-child(${n})`,

  // Structural
  inHeader: 'header :scope, [role="banner"] :scope',
  inMain: 'main :scope, [role="main"] :scope',
  inFooter: 'footer :scope, [role="contentinfo"] :scope',
  inForm: 'form :scope, [role="form"] :scope',

  // Near other elements
  near: (selector: string) => `:near(${selector})`,
  within: (selector: string) => `${selector} :scope`,
}

// Layer 4: Self-healing escalation paths
export const ESCALATION_PATHS: Record<string, string[][]> = {
  'search': [
    ['#search', '#search-input', '#searchInput'],  // ID-based
    ['[data-testid*="search"]', '[data-test-id*="search"]'],  // test IDs
    ['input[type="search"]', '[role="searchbox"]', '[aria-label*="search" i]'],  // Semantic
    ['input[placeholder*="search" i]', 'input[name*="search" i]', 'input[id*="search" i]'],  // Attributes
    ['form input[type="text"]', 'input:not([type])'],  // Generic fallback
  ],
  'submit': [
    ['button[type="submit"]', 'input[type="submit"]'],
    ['[data-testid*="submit"]', '[data-testid*="save"]', '[data-testid*="send"]'],
    ['button:has-text("Submit")', 'button:has-text("Save")', 'button:has-text("Send")'],
    ['[role="button"]:has-text("Submit")', '[role="button"]:has-text("Save")'],
    ['form button:last-child', 'form button'],  // Generic
  ],
  'email': [
    ['input[type="email"]', 'input[name="email"]', 'input[id*="email"]'],
    ['input[autocomplete="email"]', 'input[autocomplete="username"]'],
    ['input[placeholder*="email" i]', 'input[aria-label*="email" i]'],
    ['form input:first-of-type', 'input:not([type="hidden"]):not([type="password"])'],  // Generic
  ],
  'password': [
    ['input[type="password"]', 'input[name="password"]', 'input[id*="password"]'],
    ['input[autocomplete="current-password"]', 'input[autocomplete="new-password"]'],
    ['input[aria-label*="password" i]', 'input[placeholder*="password" i]'],
  ],
  'login_button': [
    ['button:has-text("Sign in")', 'button:has-text("Log in")', 'button:has-text("Login")'],
    ['[role="button"]:has-text("Sign")', '[role="button"]:has-text("Log")'],
    ['input[type="submit"][value*="Sign"]', 'input[type="submit"][value*="Log"]'],
    ['form button[type="submit"]', 'form button:last-child'],
  ],
}

// Site detection
export function detectSite(url: string): string | null {
  const hostname = new URL(url).hostname.toLowerCase()

  for (const [site, _] of Object.entries(HARDCODED_SELECTORS)) {
    if (hostname.includes(site)) {
      return site
    }
  }

  // Check for common patterns
  if (hostname.includes('login') || hostname.includes('auth') || hostname.includes('signin')) {
    return 'generic_login'
  }
  if (hostname.includes('shop') || hostname.includes('store') || hostname.includes('buy')) {
    return 'generic_ecommerce'
  }

  return null
}

// Get selector with full escalation strategy
export function getSelectorStrategy(
  action: string,
  url: string,
  context?: { text?: string; nearby?: string }
): SelectorStrategy {
  const site = detectSite(url)
  const strategies: SelectorStrategy = {
    primary: [],
    fallbacks: [],
    semantic: [],
    positional: [],
  }

  // Layer 1: Hardcoded (fast path)
  if (site && HARDCODED_SELECTORS[site]?.[action]) {
    strategies.primary = HARDCODED_SELECTORS[site][action]
  }

  // Layer 2: Escalation paths
  if (ESCALATION_PATHS[action]) {
    // Flatten escalation paths into fallbacks
    const escalation = ESCALATION_PATHS[action]
    for (const level of escalation) {
      strategies.fallbacks.push(...level)
    }
  }

  // Layer 3: Semantic patterns
  if (SEMANTIC_PATTERNS[action as keyof typeof SEMANTIC_PATTERNS]) {
    strategies.semantic = SEMANTIC_PATTERNS[action as keyof typeof SEMANTIC_PATTERNS]
  }

  // Layer 4: Context-based (text or position)
  if (context?.text) {
    strategies.positional.push(`:has-text("${context.text}")`)
    strategies.positional.push(`[aria-label*="${context.text}" i]`)
  }
  if (context?.nearby) {
    strategies.positional.push(`:near(${context.nearby})`)
  }

  return strategies
}

// Combine all strategies into ordered array (most specific → most generic)
export function buildSelectorChain(strategy: SelectorStrategy): string[] {
  const chain = [
    ...strategy.primary,
    ...strategy.fallbacks,
    ...strategy.semantic,
    ...strategy.positional,
  ]

  // Remove duplicates while preserving order
  return [...new Set(chain)]
}

// Types
export interface SiteSelectors {
  [action: string]: string[]
}

export interface SelectorStrategy {
  primary: string[]      // Hardcoded selectors (fast path)
  fallbacks: string[]   // Escalation path
  semantic: string[]    // ARIA/data-based
  positional: string[]  // Context-based
}
