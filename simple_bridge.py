#!/usr/bin/env python3
"""
Claude Code Bridge with Playwright-based Browser Automation
Connects Anthropic API to Keymaster (NVIDIA) with multi-step browser task support.
"""

import json
import os
import sys

# =============================================================================
# Docker Restricted Mode Support
# =============================================================================
IS_RESTRICTED = os.environ.get("RESTRICTED_MODE", "0") == "1"

# Patch Playwright before importing if in restricted mode
if IS_RESTRICTED:
    try:
        import docker_restricted_mode
        docker_restricted_mode.patch_playwright_for_restricted_mode()
        print("[BRIDGE] Restricted mode: Playwright patched for container", file=sys.stderr, flush=True)
    except ImportError:
        pass  # docker_restricted_mode not available

import re
import uuid
import asyncio
from contextlib import asynccontextmanager
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse, JSONResponse
import httpx

# Playwright imports
from playwright.async_api import async_playwright, Page, Browser, BrowserContext

# Lazy load searxng.py - only import when needed
searxng = None
def get_searxng():
    global searxng
    try:
        import searxng as _searxng
        searxng = _searxng
        print("[BRIDGE] searxng.py lazy loaded", file=sys.stderr, flush=True)
    except ImportError as e:
        print(f"[BRIDGE] ERROR: Failed to import searxng: {e}", file=sys.stderr, flush=True)
        searxng = None
    return searxng

# Browser state persistence
import importlib.util
spec = importlib.util.spec_from_file_location("browser_state", "/tmp/browser_state.py")
browser_state = importlib.util.module_from_spec(spec)
spec.loader.exec_module(browser_state)

# =============================================================================
# RESEARCH STATE MODULE (inline - no separate file)
# =============================================================================
RESEARCH_STATE_FILE = "/tmp/research_task_state.json"

class ResearchState:
    """Persistent research task state for enforcing multi-step workflow."""

    @staticmethod
    def load_state() -> Optional[Dict[str, Any]]:
        """Load saved research state."""
        if os.path.exists(RESEARCH_STATE_FILE):
            try:
                with open(RESEARCH_STATE_FILE, 'r') as f:
                    return json.load(f)
            except:
                return None
        return None

    @staticmethod
    def save_state(state: Dict[str, Any]):
        """Save research state to file."""
        with open(RESEARCH_STATE_FILE, 'w') as f:
            json.dump(state, f, indent=2)

    @staticmethod
    def clear_state():
        """Clear saved state."""
        if os.path.exists(RESEARCH_STATE_FILE):
            os.remove(RESEARCH_STATE_FILE)

    @staticmethod
    def init_task(task_id: str, topic: str):
        """Initialize a new research task."""
        ResearchState.save_state({
            "task_id": task_id,
            "topic": topic,
            "phases": {
                "search_complete": False,
                "fetch_complete": False,
                "synthesis_complete": False
            },
            "search_results": [],
            "fetched_urls": [],
            "started_at": str(asyncio.get_event_loop().time()),
            "completed": False
        })

    @staticmethod
    def mark_phase_complete(phase: str):
        """Mark a phase as complete. Phases: search, fetch, synthesis"""
        state = ResearchState.load_state()
        if state:
            if "phases" not in state:
                state["phases"] = {}
            state["phases"][f"{phase}_complete"] = True
            ResearchState.save_state(state)

    @staticmethod
    def add_search_results(results: List[Dict]):
        """Store search results for later use."""
        state = ResearchState.load_state()
        if state:
            if "search_results" not in state:
                state["search_results"] = []
            state["search_results"].extend(results)
            ResearchState.save_state(state)

    @staticmethod
    def add_fetched_urls(urls: List[str]):
        """Track which URLs were fetched."""
        state = ResearchState.load_state()
        if state:
            if "fetched_urls" not in state:
                state["fetched_urls"] = []
            state["fetched_urls"].extend(urls)
            ResearchState.save_state(state)

    @staticmethod
    def get_missing_phases() -> List[str]:
        """Return list of phases not yet completed."""
        state = ResearchState.load_state()
        if not state:
            return ["search", "fetch", "synthesis"]
        phases = state.get("phases", {})
        missing = []
        if not phases.get("search_complete"):
            missing.append("search")
        if not phases.get("fetch_complete"):
            missing.append("fetch")
        if not phases.get("synthesis_complete"):
            missing.append("synthesis")
        return missing

    @staticmethod
    def all_phases_complete() -> bool:
        """Check if all required phases are complete."""
        return len(ResearchState.get_missing_phases()) == 0

    @staticmethod
    def mark_completed():
        """Mark entire task as completed."""
        state = ResearchState.load_state()
        if state:
            state["completed"] = True
            ResearchState.save_state(state)

KEYMASTER_URL = os.getenv("KEYMASTER_URL", "http://127.0.0.1:8787")
CDP_URL = os.getenv("CDP_URL", "http://localhost:9222")

# Direct API mode - no keymaster needed
USE_DIRECT_API = os.getenv("USE_DIRECT_API", "0") == "1"
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

# Direct API endpoints
NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"
ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"

# Model mapping for Keymaster
# Haiku (side quests) now uses kimi-k2.5 instead of nvidia/nemotron which times out
MODEL_MAP = {
    "claude-sonnet-4-6": "moonshotai/kimi-k2.5",
    "claude-opus-4-6": "moonshotai/kimi-k2.5",
    "claude-haiku-4-5": "moonshotai/kimi-k2.5",  # Side quests - use reliable model
    "claude-haiku-4-5-20251001": "moonshotai/kimi-k2.5",
    "sonnet": "moonshotai/kimi-k2.5",
    "opus": "moonshotai/kimi-k2.5",
    "haiku": "moonshotai/kimi-k2.5",  # Side quests - use reliable model
}

# Direct API model mapping (for when USE_DIRECT_API=1)
DIRECT_MODEL_MAP = {
    "claude-sonnet-4-6": "nvidia/nemotron-3-nano-30b-a3b",
    "claude-opus-4-6": "nvidia/nemotron-3-nano-30b-a3b",
    "claude-haiku-4-5": "nvidia/nemotron-3-nano-30b-a3b",
    "claude-haiku-4-5-20251001": "nvidia/nemotron-3-nano-30b-a3b",
    "sonnet": "nvidia/nemotron-3-nano-30b-a3b",
    "opus": "nvidia/nemotron-3-nano-30b-a3b",
    "haiku": "nvidia/nemotron-3-nano-30b-a3b",
}

# Prefer NVIDIA free tier, fallback to others
DEFAULT_DIRECT_MODEL = os.getenv("DEFAULT_DIRECT_MODEL", "nvidia/nemotron-3-nano-30b-a3b")

def get_api_config():
    """Get API URL and headers based on mode."""
    if USE_DIRECT_API:
        if NVIDIA_API_KEY:
            return NVIDIA_API_URL, {"Authorization": f"Bearer {NVIDIA_API_KEY}", "Content-Type": "application/json"}
        elif OPENAI_API_KEY:
            return OPENAI_API_URL, {"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"}
        elif ANTHROPIC_API_KEY:
            # Anthropic uses different endpoint structure
            return ANTHROPIC_API_URL, {"Authorization": f"Bearer {ANTHROPIC_API_KEY}", "Content-Type": "application/json"}
        else:
            # No API key set - will fail but let it fail gracefully
            return NVIDIA_API_URL, {"Content-Type": "application/json"}
    else:
        # Keymaster mode - no auth headers needed
        return f"{KEYMASTER_URL}/v1/chat/completions", {"Content-Type": "application/json"}

WEB_TOOLS = [
    # Note: browser_task is now a native Claude Code tool (BrowserTaskTool), not injected here
    {
        "name": "web_search",
        "description": "Search the web for current information. Returns search results with titles, URLs, and snippets.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "The search query"},
                "depth": {"type": "string", "enum": ["fast", "standard", "deep"], "default": "standard"},
                "num_results": {"type": "number", "default": 10}
            },
            "required": ["query"]
        }
    },
    {
        "name": "web_fetch",
        "description": "Fetch a single public webpage with RETRY LOGIC. Handles timeouts, 403s, 420s automatically. Returns text content.",
        "input_schema": {
            "type": "object",
            "properties": {
                "url": {"type": "string"},
                "retries": {"type": "number", "default": 3},
                "timeout": {"type": "number", "default": 30}
            },
            "required": ["url"]
        }
    },
]

BRIDGE_TOOL_NAMES = {t["name"] for t in WEB_TOOLS}
http_client: httpx.AsyncClient = None

# Prevent concurrent browser tasks
browser_task_lock = asyncio.Lock()


# =============================================================================
# PLAYWRIGHT BROWSER AUTOMATION
# =============================================================================

async def get_page_accessibility_snapshot(page: Page) -> Dict[str, Any]:
    """
    Get ARIA accessibility snapshot with SEMANTIC DETECTION for ANY website.
    Returns role-based tree with interactive elements using standard ARIA patterns.
    """
    try:
        # Build semantic role tree that works on ANY website
        snapshot_data = await page.evaluate("""() => {
            // Comprehensive ARIA role mapping (works on any modern site)
            function getImplicitRole(el) {
                const explicitRole = el.getAttribute('role');
                if (explicitRole) return explicitRole;

                const tag = el.tagName.toLowerCase();
                const type = el.type;

                // Form elements
                if (tag === 'button') return 'button';
                if (tag === 'a' && el.href) return 'link';
                if (tag === 'input') {
                    if (type === 'submit' || type === 'button') return 'button';
                    if (type === 'checkbox') return 'checkbox';
                    if (type === 'radio') return 'radio';
                    if (type === 'hidden') return 'none';
                    if (type === 'search' || el.getAttribute('aria-autocomplete')) return 'searchbox';
                    return 'textbox';
                }
                if (tag === 'textarea') return 'textbox';
                if (tag === 'select') return 'combobox';

                // Structural elements
                if (tag === 'nav') return 'navigation';
                if (tag === 'main') return 'main';
                if (tag === 'article') return 'article';
                if (tag === 'form') return 'form';
                if (tag === 'header') return 'banner';
                if (tag === 'footer') return 'contentinfo';
                if (tag === 'aside') return 'complementary';
                if (tag === 'section') return 'region';

                // Headings
                if (tag.match(/^h[1-6]$/)) return 'heading';

                // Lists
                if (tag === 'ul' || tag === 'ol') return 'list';
                if (tag === 'li') return 'listitem';

                // Images
                if (tag === 'img') return 'img';

                // Check for clickable divs/spans (common pattern)
                if ((tag === 'div' || tag === 'span') &&
                    (el.onclick || el.getAttribute('onclick') ||
                     el.getAttribute('tabindex') === '0')) {
                    return 'button';
                }

                return 'generic';
            }

            // Get accessible name with multiple fallbacks
            function getAccessibleName(el) {
                // Priority 1: aria-label
                const ariaLabel = el.getAttribute('aria-label');
                if (ariaLabel) return ariaLabel.trim().substring(0, 100);

                // Priority 2: aria-labelledby
                const ariaLabelledBy = el.getAttribute('aria-labelledby');
                if (ariaLabelledBy) {
                    const labelEl = document.getElementById(ariaLabelledBy);
                    if (labelEl) return labelEl.textContent.trim().substring(0, 100);
                }

                // Priority 3: Associated label
                if (el.id) {
                    const label = document.querySelector(`label[for="${el.id}"]`);
                    if (label) return label.textContent.trim().substring(0, 100);
                }

                // Priority 4: Placeholder (for inputs)
                const placeholder = el.getAttribute('placeholder');
                if (placeholder) return placeholder.trim().substring(0, 100);

                // Priority 5: title attribute
                if (el.title) return el.title.trim().substring(0, 100);

                // Priority 6: Text content (for buttons, links)
                const text = (el.innerText || el.textContent || '').trim();
                if (text && text.length > 0) return text.substring(0, 100);

                // Priority 7: Value attribute (for inputs)
                if (el.value) return el.value.trim().substring(0, 100);

                // Priority 8: Name attribute
                const name = el.getAttribute('name');
                if (name) return name.trim().substring(0, 100);

                return '';
            }

            // Check visibility
            function isVisible(el) {
                const rect = el.getBoundingClientRect();
                if (rect.width === 0 || rect.height === 0) return false;
                const style = window.getComputedStyle(el);
                return style.display !== 'none' &&
                       style.visibility !== 'hidden' &&
                       style.opacity !== '0';
            }

            // Check if element is actionable
            function isActionable(el) {
                const role = getImplicitRole(el);
                const actionableRoles = new Set([
                    'button', 'link', 'textbox', 'checkbox', 'radio', 'combobox',
                    'searchbox', 'tab', 'menuitem', 'switch', 'slider'
                ]);

                if (actionableRoles.has(role)) return true;

                // Check for click handlers or tabindex
                if (el.onclick || el.getAttribute('onclick')) return true;
                if (el.getAttribute('tabindex') === '0') return true;

                // Check cursor style
                const style = window.getComputedStyle(el);
                if (style.cursor === 'pointer') return true;

                return false;
            }

            // Get element type hint
            function getTypeHint(el) {
                const type = el.type;
                const role = getImplicitRole(el);

                if (type) return type;
                if (role !== 'generic') return role;

                // Check for common patterns
                const placeholder = (el.getAttribute('placeholder') || '').toLowerCase();
                if (placeholder.includes('search')) return 'search';
                if (placeholder.includes('email')) return 'email';
                if (placeholder.includes('password')) return 'password';

                return '';
            }

            // Select candidates broadly
            const candidates = document.querySelectorAll(
                'button, a, input, textarea, select, [role], ' +
                'h1, h2, h3, h4, h5, h6, img, ' +
                '[onclick], [tabindex="0"], [data-testid], [data-test]'
            );

            const nodes = [];
            let refCounter = 1;
            const seen = new Set();

            candidates.forEach(el => {
                if (!isVisible(el)) return;

                const role = getImplicitRole(el);
                if (role === 'none') return;

                const name = getAccessibleName(el);
                const tag = el.tagName.toLowerCase();

                // Avoid duplicates
                const key = el.id || el.getAttribute('data-testid') ||
                           `${tag}-${name}-${refCounter}`;
                if (seen.has(key)) return;
                seen.add(key);

                // Generate stable ref
                let ref = el.id || el.getAttribute('data-testid') || el.getAttribute('data-test');
                if (!ref) {
                    ref = `e${refCounter++}`;
                    el.setAttribute('data-browser-ref', ref);
                }

                nodes.push({
                    ref: ref,
                    role: role,
                    name: name,
                    tag: tag,
                    type: getTypeHint(el),
                    interactive: isActionable(el),
                    clickable: el.onclick || el.getAttribute('onclick') ||
                              el.getAttribute('tabindex') === '0' ||
                              window.getComputedStyle(el).cursor === 'pointer'
                });
            });

            return {
                url: window.location.href,
                title: document.title,
                nodes: nodes.slice(0, 75),  // Increased limit
                stats: {
                    buttons: nodes.filter(n => n.role === 'button').length,
                    links: nodes.filter(n => n.role === 'link').length,
                    textboxes: nodes.filter(n => n.role === 'textbox').length,
                    forms: nodes.filter(n => n.role === 'form').length
                }
            };
        }
        """)

        # Get body text separately
        body_text = await page.inner_text("body")

        return {
            "url": snapshot_data.get("url", page.url),
            "title": snapshot_data.get("title", await page.title()),
            "nodes": snapshot_data.get("nodes", []),
            "text": body_text[:2000]
        }
    except Exception as e:
        print(f"[BROWSER] Error getting snapshot: {e}", file=sys.stderr, flush=True)
        return {"url": page.url, "title": "", "nodes": [], "text": ""}


def format_elements_for_llm(nodes: List[Dict]) -> str:
    """Format semantic elements for LLM with SMART HINTS for selector construction."""
    lines = []
    interactive_count = 0

    # Group by role for better organization
    by_role: Dict[str, List[Dict]] = {}
    for node in nodes:
        role = node.get("role", "generic")
        if role not in by_role:
            by_role[role] = []
        by_role[role].append(node)

    # Build hints for common actions
    hints = []
    if "searchbox" in by_role or any(n.get("type") == "search" for n in nodes):
        hints.append("Search: [role='searchbox'] or input[type='search']")
    if "textbox" in by_role:
        email_inputs = [n for n in by_role.get("textbox", []) if "email" in n.get("type", "")]
        pwd_inputs = [n for n in by_role.get("textbox", []) if "password" in n.get("type", "")]
        if email_inputs:
            hints.append(f"Email inputs: {len(email_inputs)} found")
        if pwd_inputs:
            hints.append(f"Password inputs: {len(pwd_inputs)} found")
        hints.append("Text inputs: [role='textbox'] or input:not([type='hidden'])")
    if "button" in by_role:
        hints.append("Buttons: [role='button'] or button")
    if "link" in by_role:
        hints.append("Links: [role='link'] or a[href]")

    for role, role_nodes in by_role.items():
        # Skip purely decorative
        if role in ["generic", "none"]:
            continue

        for node in role_nodes:
            name = node.get("name", "")
            ref = node.get("ref", "")
            tag = node.get("tag", "")
            is_interactive = node.get("interactive", False)

            # Build smart selector hint
            selector_hints = []
            if node.get("type"):
                selector_hints.append(f"type={node['type']}")
            if name:
                # Truncate long names
                short_name = name[:30] + "..." if len(name) > 30 else name
                selector_hints.append(f'text="{short_name}"')

            hint_str = " ".join(selector_hints)

            # Format based on role
            if name:
                line = f"- {role} \"{name[:40]}\" [ref={ref}]"
            else:
                line = f"- {role} <{tag}> [ref={ref}]"

            if hint_str:
                line += f" ({hint_str})"

            lines.append(line)
            if is_interactive:
                interactive_count += 1

    if not lines:
        return "(no elements found - page may not have loaded)"

    # Build intelligent guidance
    result_parts = []

    if hints:
        result_parts.append("SMART SELECTORS (use these):\n" + "\n".join(f"  {h}" for h in hints[:6]))

    result_parts.append(f"\nInteractive elements ({interactive_count}):\n" + "\n".join(lines[:50]))

    # Add generic guidance
    result_parts.append("\nSELECTOR PATTERNS:")
    result_parts.append("  By role: [role='button'], [role='textbox']")
    result_parts.append("  By text: button:has-text('Submit')")
    result_parts.append("  By type: input[type='email'], input[type='password']")
    result_parts.append("  By ref: [data-browser-ref='e1']")

    return "\n".join(result_parts)


async def execute_browser_action(action: Dict[str, Any]) -> Dict[str, Any]:
    """Execute a browser action using Playwright with multi-tab support and retry logic."""
    global _tabs, _active_tab
    action_type = action.get("action")
    tab_name = action.get("tab", "main")
    max_retries = action.get("retries", 1)

    # Handle cleanup first (modifies global state)
    if action_type == "cleanup":
        reset_url = action.get("reset_url", "https://google.com")
        results = {"tabs_closed": 0, "files_deleted": 0}
        # Close all tabs except main
        for t_name in list(_tabs.keys()):
            if t_name != "main":
                try:
                    await _tabs[t_name].close()
                    results["tabs_closed"] += 1
                except:
                    pass
                del _tabs[t_name]
        # Reset main tab
        if "main" in _tabs:
            await _tabs["main"].goto(reset_url, wait_until="domcontentloaded", timeout=20000)
        _active_tab = "main"
        # Delete temp files
        for path in ["/tmp/proof.png", "/tmp/screenshot.png", "/tmp/browser_task_state.json"]:
            try:
                if os.path.exists(path):
                    os.remove(path)
                    results["files_deleted"] += 1
            except:
                pass
        return {"success": True, "action_result": f"Cleanup: {results['tabs_closed']} tabs closed, {results['files_deleted']} files deleted, reset to {reset_url}", "results": results}

    page = await get_browser_page(tab_name)

    async def try_action():
        if action_type == "navigate":
            url = action.get("url")
            wait_until = action.get("wait_until", "domcontentloaded")
            await page.goto(url, wait_until=wait_until, timeout=30000)
            await asyncio.sleep(action.get("post_wait", 1))
            return {"success": True, "url": page.url, "action_result": f"Navigated to {page.url}"}

        elif action_type == "new_tab":
            new_tab_name = action.get("new_tab_name", f"tab_{len(_tabs)}")
            new_page = await get_browser_page(new_tab_name)
            await switch_to_tab(new_tab_name)
            return {"success": True, "tab": new_tab_name, "action_result": f"Created new tab: {new_tab_name}"}

        elif action_type == "switch_tab":
            target = action.get("tab_name", "main")
            switched = await switch_to_tab(target)
            if switched:
                return {"success": True, "tab": target, "action_result": f"Switched to tab: {target}"}
            return {"success": False, "error": f"Tab '{target}' not found"}

        elif action_type == "close_tab":
            target = action.get("tab_name", tab_name)
            await close_tab(target)
            return {"success": True, "action_result": f"Closed tab: {target}"}

        elif action_type == "list_tabs":
            tabs = await list_tabs()
            return {"success": True, "tabs": tabs, "action_result": f"Found {len(tabs)} tabs"}

        elif action_type == "click":
            selector = action.get("selector")
            if not selector:
                return {"success": False, "error": "Click requires a selector"}
            await page.wait_for_selector(selector, timeout=action.get("timeout", 5000))
            await page.click(selector)
            await asyncio.sleep(action.get("post_wait", 0.5))
            return {"success": True, "clicked": selector, "action_result": f"Clicked: {selector}"}

        elif action_type == "type":
            selector = action.get("selector")
            text = action.get("text", "")
            clear_first = action.get("clear", True)
            if not selector or text is None:
                return {"success": False, "error": "Type requires selector and text"}
            await page.wait_for_selector(selector, timeout=action.get("timeout", 5000))
            if clear_first:
                await page.fill(selector, "")
            await page.fill(selector, text)
            return {"success": True, "typed": text[:50], "selector": selector, "action_result": f"Typed into: {selector}"}

        elif action_type == "wait":
            seconds = action.get("seconds", 2)
            await asyncio.sleep(seconds)
            return {"success": True, "waited": seconds, "action_result": f"Waited {seconds}s"}

        elif action_type == "wait_for":
            selector = action.get("selector")
            text = action.get("text")
            timeout = action.get("timeout", 10000)
            if selector:
                try:
                    await page.wait_for_selector(selector, timeout=timeout)
                    return {"success": True, "action_result": f"Found: {selector}"}
                except:
                    return {"success": False, "error": f"Timeout waiting for: {selector}"}
            elif text:
                start = asyncio.get_event_loop().time()
                while asyncio.get_event_loop().time() - start < timeout / 1000:
                    page_text = await page.inner_text("body")
                    if text in page_text:
                        return {"success": True, "action_result": f"Found text: {text}"}
                    await asyncio.sleep(0.2)  # Minimal pause between steps
                return {"success": False, "error": f"Timeout waiting for text: {text}"}
            else:
                return {"success": False, "error": "wait_for requires selector or text"}

        elif action_type == "screenshot":
            path = action.get("path", "/tmp/screenshot.png")
            full_page = action.get("full_page", True)
            await page.screenshot(path=path, full_page=full_page)
            return {"success": True, "path": path, "action_result": f"Screenshot saved to: {path}"}

        elif action_type == "verify":
            selector = action.get("selector")
            expected_text = action.get("expected_text")
            url_should_contain = action.get("url_should_contain")
            results = []
            if url_should_contain:
                current_url = page.url
                if url_should_contain in current_url:
                    results.append(f"URL contains: {url_should_contain}")
                else:
                    results.append(f"URL missing: {url_should_contain} (got: {current_url})")
            if selector:
                try:
                    await page.wait_for_selector(selector, timeout=2000)
                    results.append(f"Element found: {selector}")
                except:
                    results.append(f"Element NOT found: {selector}")
            if expected_text:
                page_text = await page.inner_text("body")
                if expected_text in page_text:
                    results.append(f"Text found: {expected_text}")
                else:
                    results.append(f"Text NOT found: {expected_text}")
            all_passed = not any("NOT" in r for r in results)
            return {"success": all_passed, "checks": results, "action_result": "; ".join(results)}

        elif action_type == "query":
            selector = action.get("selector", "")
            if not selector:
                return {"success": False, "error": "Query requires a selector"}
            elements = await page.query_selector_all(selector)
            matches = []
            for i, el in enumerate(elements[:10]):
                try:
                    tag = await el.evaluate("el => el.tagName.toLowerCase()")
                    text = await el.evaluate("el => (el.innerText || el.textContent || '').substring(0, 100)")
                    aria = await el.evaluate("el => el.getAttribute('aria-label') || ''")
                    is_visible = await el.is_visible()
                    if is_visible:
                        matches.append({
                            "index": i,
                            "tag": tag,
                            "text": text.strip(),
                            "aria_label": aria,
                            "selector": f"{selector} >> nth={i}" if i > 0 else selector
                        })
                except:
                    continue
            return {"success": True, "count": len(matches), "matches": matches}

        elif action_type == "press":
            key = action.get("key", "Enter")
            await page.keyboard.press(key)
            return {"success": True, "pressed": key, "action_result": f"Pressed key: {key}"}

        elif action_type == "extract":
            text = await page.inner_text("body")
            return {"success": True, "text": text[:5000], "action_result": f"Extracted {len(text)} chars"}

        elif action_type == "get_state":
            return {"success": True, "action_result": "State captured"}

        else:
            return {"success": False, "error": f"Unknown action: {action_type}"}

    last_error = None
    for attempt in range(max_retries):
        try:
            result = await try_action()
            if result.get("success"):
                return result
            if attempt == max_retries - 1:
                return result
            await asyncio.sleep(1)
        except Exception as e:
            last_error = str(e)
            if attempt == max_retries - 1:
                return {"success": False, "error": f"Failed after {max_retries} attempts: {last_error}"}
            await asyncio.sleep(1)

    return {"success": False, "error": "Action failed"}


async def decide_next_action(task_context: Dict, page_state: Dict) -> Dict[str, Any]:
    """Use LLM to decide next browser action based on ARIA snapshot."""

    elements_text = format_elements_for_llm(page_state.get("nodes", []))

    # Build action history
    history = task_context.get("actions_taken", [])
    history_summary = "\n".join([
        f"Step {a.get('step', i)}: {a.get('action', {}).get('action', 'unknown')} - success={a.get('result', {}).get('success', False)}"
        for i, a in enumerate(history[-5:])
    ]) if history else "No actions yet"

    # Check if we've already extracted data and should complete
    if len(history) > 0:
        last_action = history[-1].get('action', {}).get('action', '')
        last_result = history[-1].get('result', {})
        # If we just extracted data and have it, complete the task
        if last_action == 'extract' and last_result.get('success') and last_result.get('text'):
            return {"action": "complete", "result": last_result.get('text', 'Task completed')}

    # Analyze what the user is asking for
    goal_lower = task_context["goal"].lower()

    # Detect singular vs plural items
    looking_for_single = any(kw in goal_lower for kw in [
        "most recent", "latest", "first ", "top ", "the ", "main ", "specific "
    ])
    on_list_page = any(kw in goal_lower for kw in [
        "inbox", "list", "feed", "timeline", "results", "posts", "messages"
    ])

    prompt = f"""You are controlling a Chrome browser. User asked: "{task_context["goal"]}"

CRITICAL RULE - READ CAREFULLY:

IF the user asks for "THE most recent email" or "THE first post" or "THE article" (singular):
→ YOU MUST CLICK ON IT FIRST before extracting
→ Do NOT just extract the inbox/list page
→ CLICK the item → Wait → THEN extract

IF the user asks for "emails" or "posts" or "messages" (plural):
→ Extract the list/overview

CURRENT PAGE:
- URL: {page_state["url"]}
- Title: {page_state["title"]}

INTERACTIVE ELEMENTS (USE THESE REFS TO CLICK):
{elements_text}

ACTION HISTORY:
{history_summary}

WHAT TO DO NOW:
1. Look at the INTERACTIVE ELEMENTS above
2. If user wants THE most recent email → Find and CLICK it using its ref (e.g., ref="e1")
3. If user wants emails list → Extract current page
4. NEVER just extract a list when asked for a specific item

RESPOND WITH JSON ONLY:
{{"action": "click", "ref": "e1", "reason": "Clicking the first email to open it"}}
{{"action": "extract", "reason": "Reading the email content"}}
{{"action": "complete", "result": "The email from LinkedIn says... [summary]"}}

Actions: navigate, click, type, press, wait, extract, complete"""

    # Try LLM decision with retry
    for attempt in range(2):
        try:
            resp = await http_client.post(
                f"{KEYMASTER_URL}/v1/chat/completions",
                json={
                    "model": "moonshotai/kimi-k2.5",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 300,
                    "temperature": 0.1
                },
                timeout=httpx.Timeout(60.0, connect=10.0, read=50.0, write=10.0, pool=10.0)
            )

            if resp.status_code == 200:
                data = resp.json()
                content = ""

                # Extract content from response
                if data and "choices" in data and len(data["choices"]) > 0:
                    choice = data["choices"][0]
                    if choice.get("message"):
                        content = choice["message"].get("content", "")
                    elif "text" in choice:
                        content = choice["text"]
                    elif "delta" in choice:
                        content = choice["delta"].get("content", "") if choice["delta"] else ""

                # Parse JSON action
                if content:
                    try:
                        # Try to find JSON in response
                        json_match = re.search(r'\{[^}]*"action"[^}]*\}', content, re.DOTALL)
                        if json_match:
                            action = json.loads(json_match.group())
                        else:
                            action = json.loads(content.strip())

                        if action and "action" in action:
                            return action
                    except:
                        pass

        except httpx.TimeoutException:
            print(f"[BROWSER] LLM timeout (attempt {attempt + 1})", file=sys.stderr, flush=True)
            if attempt == 0:
                await asyncio.sleep(1)
                continue
        except httpx.ConnectError as e:
            print(f"[BROWSER] Connection error to Keymaster: {e}", file=sys.stderr, flush=True)
            break
        except Exception as e:
            print(f"[BROWSER] LLM error: {type(e).__name__}: {e}", file=sys.stderr, flush=True)
            break

    # Fallback heuristic
    return _heuristic_decide(task_context, page_state)


def _heuristic_decide(task_context: Dict, page_state: Dict) -> Dict[str, Any]:
    """Smart fallback that makes good decisions based on context."""
    goal = task_context["goal"].lower()
    nodes = page_state.get("nodes", [])
    url = page_state.get("url", "")
    history = task_context.get("actions_taken", [])

    # Check if we've already clicked on something and extracted - then complete
    clicked_items = [h for h in history if h["action"].get("action") == "click"]
    extracted_items = [h for h in history if h["action"].get("action") == "extract" and h["result"].get("success")]

    if extracted_items:
        # We clicked something and extracted it - summarize and complete
        last_extract = extracted_items[-1]["result"].get("text", "")
        if len(last_extract) > 50:
            return {"action": "complete", "result": last_extract[:2000]}

    # If on Gmail and asked for "most recent email" - CLICK the first email
    if ("mail.google.com" in url or "gmail.com" in url) and any(kw in goal for kw in ["most recent", "latest", "first email", "top email"]):
        # Find the first email row - look for links with email-like content
        for node in nodes:
            if not node.get("interactive", False):
                continue
            name = node.get("name", "").lower()
            role = node.get("role", "")
            # Look for sender names or email subjects in the list
            if role == "link" and len(name) > 3 and not any(bad in name for bad in ["compose", "inbox", "starred", "sent", "drafts", "more", "labels"]):
                return {"action": "click", "ref": node["ref"], "reason": f"Clicking first email: {name[:30]}"}

    # If on a list page and asked for a specific item - try to click the first relevant item
    if any(kw in goal for kw in ["most recent", "latest", "first ", "top ", "the ", "specific "]):
        for node in nodes:
            if not node.get("interactive", False):
                continue
            role = node.get("role", "")
            name = node.get("name", "")
            # Click links that look like content items (articles, posts, emails)
            if role in ["link", "button"] and len(name) > 5 and not any(bad in name.lower() for bad in ["compose", "new", "create", "add", "menu", "settings", "profile"]):
                return {"action": "click", "ref": node["ref"], "reason": f"Clicking: {name[:30]}"}

    # Default: extract page content
    return {"action": "extract", "reason": "Extracting page content"}


async def cdp_browser_task_stream(goal: str, start_url: str = None):
    """
    Execute multi-step browser automation using Playwright with progress updates.
    Yields progress events as dicts for SSE streaming.
    """
    yield {"type": "progress", "message": f"Starting browser task: {goal}"}

    async with async_playwright() as p:
        try:
            # Connect to existing Chrome via CDP
            yield {"type": "progress", "message": "Connecting to Chrome..."}
            browser = await p.chromium.connect_over_cdp(CDP_URL)

            # Use existing context or create new one
            contexts = browser.contexts
            if contexts:
                context = contexts[0]
                yield {"type": "progress", "message": f"Using existing browser context"}
            else:
                context = await browser.new_context()
                yield {"type": "progress", "message": "Created new browser context"}

            # Get or create page
            pages = context.pages
            if pages:
                page = pages[0]
                yield {"type": "progress", "message": f"Using existing page: {page.url[:60]}..."}
            else:
                page = await context.new_page()
                yield {"type": "progress", "message": "Created new browser page"}

            # Navigate to start URL (if not already there)
            if start_url:
                current_url = page.url.lower()
                target_url = start_url.lower()
                target_domain = target_url.replace('https://', '').replace('http://', '').split('/')[0]

                if target_domain in current_url:
                    yield {"type": "progress", "message": f"Already on target site"}
                else:
                    yield {"type": "progress", "message": f"Navigating to {start_url}..."}
                    try:
                        await page.goto(start_url, wait_until="domcontentloaded", timeout=20000)
                        await asyncio.sleep(0.2)  # Minimal pause between steps  # Minimal buffer for JS
                        yield {"type": "progress", "message": f"Page loaded: {page.url}"}
                    except Exception as nav_err:
                        yield {"type": "progress", "message": f"Navigation warning: {str(nav_err)[:50]}"}
                        await page.goto(start_url, wait_until="load", timeout=15000)
                        await asyncio.sleep(0.3)  # Minimal buffer

            task_context = {
                "goal": goal,
                "actions_taken": [],
                "step_budget": 8,  # Start higher, fewer re-budgeting needed
                "budget_extensions": 0,
                "max_budget": 25
            }

            step = 0
            while step < task_context["step_budget"] and step < task_context["max_budget"]:
                step += 1
                budget = task_context['step_budget']
                yield {"type": "progress", "message": f"Step {step}/{budget}: Analyzing page..."}

                # Get page state with ARIA snapshot
                page_state = await get_page_accessibility_snapshot(page)
                yield {"type": "progress", "message": f"Page: {page_state.get('title', 'Unknown')[:50]}"}

                # LLM decides next action
                action = await decide_next_action(task_context, page_state)
                action_type = action.get("action", "unknown")

                if action_type == "complete":
                    result = action.get("result", "Task completed")
                    yield {"type": "progress", "message": "Task complete!"}
                    yield {"type": "result", "result": result}
                    return

                yield {"type": "progress", "message": f"Executing: {action_type}..."}

                # Execute action
                action_result = await execute_browser_action(page, action)

                task_context["actions_taken"].append({
                    "step": step,
                    "action": action,
                    "result": action_result
                })

                # Early completion check
                if action_type == "extract" and action_result.get("success"):
                    extracted_text = action_result.get("text", "")
                    if len(extracted_text) > 100:
                        yield {"type": "progress", "message": "Data extracted successfully!"}
                        yield {"type": "result", "result": extracted_text[:2000]}
                        return

                # Dynamic budget: if running low and not done, extend
                if step >= task_context["step_budget"] - 1 and task_context["budget_extensions"] < 3:
                    task_context["step_budget"] += 5
                    task_context["budget_extensions"] += 1
                    yield {"type": "progress", "message": f"Extending step budget to {task_context['step_budget']}..."}

                await asyncio.sleep(0.2)  # Minimal pause between steps

            # Check if we have any extracted data from previous steps
            for past in reversed(task_context["actions_taken"]):
                if past["action"].get("action") == "extract" and past["result"].get("success"):
                    yield {"type": "result", "result": past["result"].get("text", "")[:2000]}
                    return

            yield {"type": "result", "result": f"Task reached max budget ({task_context['step_budget']} steps). Final URL: {page.url}"}

        except Exception as e:
            import traceback
            error_msg = f"Browser task error: {str(e)[:100]}"
            yield {"type": "progress", "message": f"Error: {error_msg}"}
            yield {"type": "result", "result": error_msg}


async def cdp_browser_task(goal: str, start_url: str = None) -> str:
    """
    Execute multi-step browser automation using Playwright.
    Connects to existing Chrome instance with cookies/logins preserved.
    """
    print(f"[BROWSER] Starting task: {goal}", file=sys.stderr, flush=True)

    async with async_playwright() as p:
        try:
            # Connect to existing Chrome via CDP
            print(f"[BROWSER] Connecting to Chrome at {CDP_URL}", file=sys.stderr, flush=True)
            browser = await p.chromium.connect_over_cdp(CDP_URL)

            # Use existing context or create new one
            contexts = browser.contexts
            if contexts:
                context = contexts[0]
                print(f"[BROWSER] Using existing context with {len(context.pages)} pages", file=sys.stderr)
            else:
                context = await browser.new_context()
                print(f"[BROWSER] Created new context", file=sys.stderr)

            # Get or create page
            pages = context.pages
            if pages:
                page = pages[0]
                print(f"[BROWSER] Using existing page: {page.url}", file=sys.stderr)
            else:
                page = await context.new_page()
                print(f"[BROWSER] Created new page", file=sys.stderr)

            # Navigate to start URL (if not already there)
            if start_url:
                # Check if already on the target domain
                current_url = page.url.lower()
                target_url = start_url.lower()
                # Extract domain from target
                target_domain = target_url.replace('https://', '').replace('http://', '').split('/')[0]
                if target_domain in current_url and '/inbox' in current_url and 'gmail' in target_domain:
                    print(f"[BROWSER] Already on Gmail inbox: {page.url}", file=sys.stderr)
                elif current_url.rstrip('/') == target_url.rstrip('/'):
                    print(f"[BROWSER] Already on target page: {page.url}", file=sys.stderr)
                else:
                    print(f"[BROWSER] Navigating to {start_url}", file=sys.stderr)
                    # Use domcontentloaded for faster navigation, then wait 2s for JS
                    try:
                        await page.goto(start_url, wait_until="domcontentloaded", timeout=20000)
                        await asyncio.sleep(0.2)  # Minimal pause between steps  # Minimal buffer for JS/ajax
                    except Exception as nav_err:
                        print(f"[BROWSER] Navigation warning: {nav_err}", file=sys.stderr)
                        # If domcontentloaded fails, try with load event
                        await page.goto(start_url, wait_until="load", timeout=15000)
                        await asyncio.sleep(0.3)  # Minimal buffer

            task_context = {
                "goal": goal,
                "actions_taken": [],
                "step_budget": 8,  # Start higher, fewer re-budgeting needed
                "budget_extensions": 0,
                "max_budget": 25
            }

            step = 0
            while step < task_context["step_budget"] and step < task_context["max_budget"]:
                step += 1
                print(f"[BROWSER] Step {step}/{task_context['step_budget']}", file=sys.stderr)

                # Get page state with ARIA snapshot
                page_state = await get_page_accessibility_snapshot(page)

                # LLM decides next action
                action = await decide_next_action(task_context, page_state)
                action_type = action.get("action", "unknown")

                if action_type == "complete":
                    result = action.get("result", "Task completed")
                    print(f"[BROWSER] Task complete: {result[:200]}", file=sys.stderr)
                    return result

                # Execute action
                action_result = await execute_browser_action(page, action)

                task_context["actions_taken"].append({
                    "step": step,
                    "action": action,
                    "result": action_result
                })

                # Early completion check: if we extracted text and task seems done, return it
                if action_type == "extract" and action_result.get("success"):
                    extracted_text = action_result.get("text", "")
                    if len(extracted_text) > 100:
                        return f"Task completed. Extracted content:\n\n{extracted_text[:2000]}"

                # Dynamic budget: if running low and not done, extend
                if step >= task_context["step_budget"] - 1 and task_context["budget_extensions"] < 3:
                    task_context["step_budget"] += 5
                    task_context["budget_extensions"] += 1
                    print(f"[BROWSER] Extending step budget to {task_context['step_budget']}", file=sys.stderr)

                # Brief pause between actions
                await asyncio.sleep(0.2)  # Minimal pause between steps

            # Check if we have any extracted data from previous steps
            for past in reversed(task_context["actions_taken"]):
                if past["action"].get("action") == "extract" and past["result"].get("success"):
                    return f"Task completed. Extracted content:\n\n{past['result'].get('text', '')[:2000]}"

            return f"Task reached max budget ({task_context['step_budget']} steps). Final URL: {page.url}"

        except Exception as e:
            import traceback
            error_msg = f"Browser task error: {e}\n{traceback.format_exc()[:500]}"
            print(f"[BROWSER] {error_msg}", file=sys.stderr, flush=True)
            return error_msg


# =============================================================================
# LEGACY CDP FUNCTIONS (for web_fetch/web_search)
# =============================================================================

async def cdp_fetch_with_retry(url: str, max_chars: int = 15000, retries: int = 3, timeout: int = 30) -> str:
    """Fetch a webpage with RETRY LOGIC and exponential backoff.

    Handles common failures:
    - 408 Request Timeout
    - 420 Rate Limited
    - 429 Too Many Requests
    - 5xx Server errors
    - Network timeouts
    """
    last_error = None
    base_delay = 1.0

    for attempt in range(retries):
        try:
            async with async_playwright() as p:
                browser = await p.chromium.connect_over_cdp(CDP_URL)
                context = browser.contexts[0] if browser.contexts else await browser.new_context()
                page = await context.new_page()

                # Use domcontentloaded for faster response, with configurable timeout
                await page.goto(url, wait_until="domcontentloaded", timeout=timeout * 1000)
                await asyncio.sleep(1)  # Brief wait for JS content

                # Get text content
                text = await page.inner_text("body")
                await page.close()

                text = re.sub(r'\n{3,}', '\n\n', text).strip()
                if not text:
                    return f"Error fetching {url}: Empty page content"
                return text[:max_chars]

        except Exception as e:
            last_error = str(e)
            error_lower = last_error.lower()

            # Check for retryable errors
            is_retryable = any(code in last_error for code in ['408', '420', '429']) or \
                          any(code in last_error for code in ['500', '502', '503', '504']) or \
                          'timeout' in error_lower or \
                          'net::' in last_error or \
                          'connection' in error_lower

            if not is_retryable:
                # Non-retryable error - return immediately
                return f"Error fetching {url}: {last_error}"

            if attempt < retries - 1:
                # Exponential backoff with jitter
                delay = base_delay * (2 ** attempt) + (hash(url) % 1000 / 1000)
                print(f"[FETCH] Attempt {attempt + 1}/{retries} failed for {url}: {last_error[:50]}... Retrying in {delay:.1f}s", file=sys.stderr, flush=True)
                await asyncio.sleep(delay)
            else:
                print(f"[FETCH] All {retries} attempts failed for {url}", file=sys.stderr, flush=True)

    return f"Error fetching {url}: Failed after {retries} attempts. Last error: {last_error}"


async def cdp_fetch(url: str, max_chars: int = 15000) -> str:
    """Simple page fetch using CDP (for basic use). Backwards compatible."""
    return await cdp_fetch_with_retry(url, max_chars, retries=3, timeout=30)


# Semaphore for controlling concurrent fetches
_fetch_semaphore = asyncio.Semaphore(3)


async def cdp_fetch_http_first(
    url: str,
    max_chars: int = 15000,
    timeout: int = 15
) -> Dict:
    """Fetch URL using HTTP first, browser fallback only if needed.

    Returns dict with url, content, success status, and method used.
    """
    # Try HTTP first with curl_cffi
    try:
        import curl_cffi.requests as curl_requests

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate, br",
            "DNT": "1",
        }

        resp = curl_requests.get(
            url,
            impersonate="chrome124",
            headers=headers,
            timeout=timeout,
            allow_redirects=True
        )

        if resp.status_code == 200:
            # Parse with BeautifulSoup to extract main content
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(resp.text, "html.parser")

            # Remove script/style/nav/footer
            for tag in soup(["script", "style", "nav", "footer", "header"]):
                tag.decompose()

            # Get text from main content areas first
            main = soup.find("main") or soup.find("article") or soup.find("div", class_="content")
            text = main.get_text(separator="\n", strip=True) if main else soup.get_text(separator="\n", strip=True)

            # Clean up whitespace
            lines = [line.strip() for line in text.splitlines() if line.strip()]
            text = "\n".join(lines[:100])  # First 100 lines

            return {
                "url": url,
                "content": text[:max_chars],
                "success": True,
                "method": "http",
                "size": len(resp.text)
            }

    except Exception as e:
        print(f"[FETCH HTTP] Failed for {url[:50]}...: {e}", file=sys.stderr, flush=True)

    # Fallback to browser/CDP
    try:
        content = await cdp_fetch_with_retry(url, max_chars, retries=2, timeout=timeout)

        if content.startswith("Error fetching"):
            return {
                "url": url,
                "content": content,
                "success": False,
                "method": "browser",
                "error": content
            }

        return {
            "url": url,
            "content": content,
            "success": True,
            "method": "browser",
            "size": len(content)
        }

    except Exception as e:
        return {
            "url": url,
            "content": f"Error: {str(e)}",
            "success": False,
            "method": "browser",
            "error": str(e)
        }


async def cdp_fetch_parallel(
    urls: List[str],
    max_chars: int = 15000,
    max_concurrent: int = 3
) -> List[Dict]:
    """Fetch multiple URLs in parallel with concurrency control.

    Args:
        urls: List of URLs to fetch
        max_chars: Max chars per URL
        max_concurrent: Max simultaneous requests (default 3)

    Returns:
        List of result dicts, one per URL
    """
    print(f"[FETCH PARALLEL] Starting {len(urls)} URLs with max {max_concurrent} concurrent", file=sys.stderr, flush=True)

    semaphore = asyncio.Semaphore(max_concurrent)

    async def fetch_with_limit(url: str) -> Dict:
        async with semaphore:
            print(f"[FETCH PARALLEL] Starting: {url[:60]}...", file=sys.stderr, flush=True)
            result = await cdp_fetch_http_first(url, max_chars)
            print(f"[FETCH PARALLEL] Completed: {url[:60]}... ({result.get('method', 'unknown')})", file=sys.stderr, flush=True)
            return result

    tasks = [fetch_with_limit(url) for url in urls]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    # Handle exceptions in results
    processed = []
    for url, result in zip(urls, results):
        if isinstance(result, Exception):
            processed.append({
                "url": url,
                "content": f"Error: {str(result)}",
                "success": False,
                "method": "error",
                "error": str(result)
            })
        else:
            processed.append(result)

    print(f"[FETCH PARALLEL] All {len(urls)} URLs completed", file=sys.stderr, flush=True)
    return processed


async def cdp_search_with_retry(
    query: str,
    max_chars: int = 10000,
    retries: int = 3,
    num_results: int = 10,
    depth: str = "standard",
    provider: str = "searxng"
) -> str:
    """Search using SearXNG meta-search engine with query expansion.

    Args:
        query: Search query
        max_chars: Not used (kept for compatibility)
        retries: Number of retry attempts
        num_results: Max results to return
        depth: 'fast', 'standard', or 'deep' - controls query expansion
        provider: Deprecated, kept for compatibility

    Returns structured JSON with deduplicated, ranked results.
    """
    searxng = get_searxng()
    if searxng is None:
        return json.dumps({
            "query": query,
            "error": "searxng.py not available",
            "results": []
        })

    print(f"[SEARCH] {depth} search: '{query}'", file=sys.stderr, flush=True)

    for attempt in range(retries):
        try:
            # Use SearXNG search engine with expansion
            results = await searxng.search_with_expansion(
                query=query,
                depth=depth,
                max_results=num_results
            )

            print(f"[SEARCH] Found {results.get('num_results', 0)} results", file=sys.stderr, flush=True)
            return json.dumps(results, indent=2)

        except Exception as e:
            error_msg = str(e)
            print(f"[SEARCH] Error (attempt {attempt + 1}): {error_msg}", file=sys.stderr, flush=True)

            # Only retry on certain errors
            is_retryable = any(term in error_msg.lower() for term in
                             ['rate limit', 'captcha', 'timeout', 'connection'])

            if not is_retryable or attempt == retries - 1:
                return json.dumps({
                    "query": query,
                    "error": f"Search failed: {error_msg}",
                    "results": []
                })

            await asyncio.sleep(2 ** attempt)

    return json.dumps({
        "query": query,
        "error": "Failed after all retries",
        "results": []
    })


async def cdp_search(query: str, max_chars: int = 10000) -> str:
    """Search using DuckDuckGo via browser. Backwards compatible."""
    return await cdp_search_with_retry(query, max_chars, retries=3, num_results=10)


async def process_tool_result(tool_name: str, tool_input: dict, raw_result: str) -> str:
    """Format raw tool result for the model. Keep it clean and structured.

    The TypeScript side has detailed instructions on how to use these results.
    This function just ensures the data is properly formatted.
    """
    try:
        if tool_name == "web_search":
            # Parse JSON and format cleanly
            try:
                search_data = json.loads(raw_result)
                results = search_data.get("results", [])
                query = search_data.get("query", tool_input.get("query", ""))

                if not results:
                    return f"No results found for '{query}'."

                # Simple clean formatting - let the LLM decide what to do with it
                lines = [f"Search results for: {query}", f"Found {len(results)} results", ""]

                for i, result in enumerate(results[:10], 1):
                    title = result.get("title", "No title")
                    url = result.get("url", "")
                    snippet = result.get("snippet", "")

                    lines.append(f"{i}. {title}")
                    lines.append(f"   URL: {url}")
                    if snippet:
                        lines.append(f"   {snippet}")
                    lines.append("")

                return "\n".join(lines)

            except json.JSONDecodeError:
                # Not JSON, return as-is
                return raw_result

        elif tool_name == "web_fetch":
            # Return content with minimal formatting
            url = tool_input.get("url", "")
            lines = [
                f"Content from: {url}",
                "",
                raw_result[:10000]  # Limit size
            ]
            return "\n".join(lines)

        else:
            return raw_result

    except Exception as e:
        print(f"[BRIDGE] Error formatting result: {e}", file=sys.stderr, flush=True)
        return raw_result


async def execute_tool(name: str, arguments: dict) -> str:
    """Execute a bridge tool with RETRY LOGIC."""
    print(f"[BRIDGE] Tool: {name}", file=sys.stderr, flush=True)
    if name == "web_fetch":
        return await cdp_fetch_with_retry(
            arguments.get("url", ""),
            retries=arguments.get("retries", 3),
            timeout=arguments.get("timeout", 30)
        )
    elif name == "web_search":
        return await cdp_search_with_retry(
            arguments.get("query", ""),
            retries=arguments.get("retries", 3),
            num_results=arguments.get("num_results", 10)
        )
    # Note: browser_task is now handled by native BrowserTaskTool
    return f"Unknown tool: {name}"


# =============================================================================
# FASTAPI APP
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    global http_client
    # OPTIMIZED: HTTP/2 enabled, larger pool, faster timeouts
    http_client = httpx.AsyncClient(
        timeout=httpx.Timeout(300.0, connect=10.0, read=120.0, write=30.0, pool=60.0),
        limits=httpx.Limits(max_connections=200, max_keepalive_connections=50),
        follow_redirects=True,
        http2=True  # Enable HTTP/2 for connection reuse
    )
    print("[BRIDGE] HTTP client started with HTTP/2", file=sys.stderr, flush=True)

    # Warm up connection to Keymaster
    try:
        await http_client.get(f"{KEYMASTER_URL}/health", timeout=5.0)
        print("[BRIDGE] Keymaster connection warmed up", file=sys.stderr, flush=True)
    except:
        pass

    yield
    await http_client.aclose()
    print("[BRIDGE] HTTP client closed", file=sys.stderr, flush=True)

app = FastAPI(lifespan=lifespan)


@app.get("/cdp/search")
async def cdp_search_endpoint(q: str = "", depth: str = "standard", max_results: int = 10):
    """Search with query expansion support.

    Args:
        q: Search query - can be a natural language query OR a DuckDuckGo URL
        depth: 'fast' (1 query), 'standard' (2 queries), 'deep' (3+ queries)
        max_results: Max results to return
    """
    if not q:
        return JSONResponse(content={"error": "no query"}, status_code=400)

    # Check if q is already a DuckDuckGo URL
    if q.startswith("https://html.duckduckgo.com/html/") or q.startswith("http://html.duckduckgo.com/html/"):
        # Extract query from URL
        from urllib.parse import parse_qs, urlparse
        parsed = urlparse(q)
        query_params = parse_qs(parsed.query)
        if "q" in query_params:
            q = query_params["q"][0]
            print(f"[SEARCH] Extracted query from URL: {q}", file=sys.stderr, flush=True)

    result = await cdp_search_with_retry(q, num_results=max_results, depth=depth)
    from fastapi.responses import PlainTextResponse
    return PlainTextResponse(result)


@app.post("/cdp/search")
async def cdp_search_post_endpoint(request: Request):
    """Search via POST with more control.

    Request body: {"query": "search terms", "depth": "standard", "max_results": 10, "search_url": "https://html.duckduckgo.com/html/?q=..."}
    If search_url is provided, query is extracted from it.
    """
    try:
        body = await request.json()
        query = body.get("query", "")
        search_url = body.get("search_url", "")
        depth = body.get("depth", "standard")
        max_results = body.get("max_results", 10)

        # Use search_url if provided
        if search_url:
            from urllib.parse import parse_qs, urlparse
            parsed = urlparse(search_url)
            query_params = parse_qs(parsed.query)
            if "q" in query_params:
                query = query_params["q"][0]
                print(f"[SEARCH POST] Extracted query from URL: {query}", file=sys.stderr, flush=True)

        if not query:
            return JSONResponse(content={"error": "no query"}, status_code=400)

        result = await cdp_search_with_retry(query, num_results=max_results, depth=depth)
        from fastapi.responses import PlainTextResponse
        return PlainTextResponse(result)

    except Exception as e:
        print(f"[SEARCH POST] Error: {e}", file=sys.stderr, flush=True)
        return JSONResponse(
            content={"error": str(e), "results": []},
            status_code=500
        )


@app.post("/cdp/search/parallel")
async def cdp_search_parallel_endpoint(request: Request):
    """Search multiple queries in parallel with aggregation.

    Request body: {"queries": ["query1", "query2"], "max_results": 10}
    Returns: Aggregated, deduplicated results from all queries
    """
    try:
        body = await request.json()
        queries = body.get("queries", [])
        max_results = body.get("max_results", 10)

        if not queries or not isinstance(queries, list):
            return JSONResponse(
                content={"error": "queries array required"},
                status_code=400
            )

        duck = get_duck()
        if duck is None:
            return JSONResponse(
                content={"error": "duck.py not available"},
                status_code=500
            )

        print(f"[SEARCH PARALLEL] {len(queries)} queries", file=sys.stderr, flush=True)

        # Use search engine with expansion disabled (manual queries)
        engine = duck.SearchEngine("duckduckgo", min_delay=0.5, max_delay=1.5)
        results = await engine.search_parallel(queries, max_results, aggregate=True)
        engine.close()

        return JSONResponse(content=results)

    except Exception as e:
        print(f"[SEARCH PARALLEL] Error: {e}", file=sys.stderr, flush=True)
        return JSONResponse(
            content={"error": str(e), "results": []},
            status_code=500
        )


@app.get("/cdp/fetch")
async def cdp_fetch_endpoint(url: str = ""):
    """Fetch single URL (HTTP first, browser fallback)."""
    if not url:
        return JSONResponse(content={"error": "no url"}, status_code=400)

    result = await cdp_fetch_http_first(url)
    return JSONResponse(content=result)


@app.post("/cdp/fetch/parallel")
async def cdp_fetch_parallel_endpoint(request: Request):
    """Fetch multiple URLs in parallel with concurrency control.

    Request body: {"urls": ["url1", "url2"], "max_chars": 15000, "max_concurrent": 3}
    Returns: Array of fetch results
    """
    try:
        body = await request.json()
        urls = body.get("urls", [])
        max_chars = body.get("max_chars", 15000)
        max_concurrent = body.get("max_concurrent", 3)

        if not urls or not isinstance(urls, list):
            return JSONResponse(
                content={"error": "urls array required"},
                status_code=400
            )

        print(f"[FETCH PARALLEL ENDPOINT] {len(urls)} URLs", file=sys.stderr, flush=True)

        results = await cdp_fetch_parallel(urls, max_chars, max_concurrent)

        return JSONResponse(content={"results": results})

    except Exception as e:
        print(f"[FETCH PARALLEL] Error: {e}", file=sys.stderr, flush=True)
        return JSONResponse(
            content={"error": str(e), "results": []},
            status_code=500
        )


@app.post("/cdp/browser-task")
async def cdp_browser_task_endpoint(request: Request):
    try:
        body = await request.json()
        goal = body.get("goal", "")
        start_url = body.get("start_url")
        if not goal:
            return JSONResponse(content={"error": "no goal provided"}, status_code=400)
        result = await cdp_browser_task(goal, start_url)
        return JSONResponse({"result": result})
    except Exception as e:
        import traceback
        error_detail = f"{str(e)}\n{traceback.format_exc()[:500]}"
        return JSONResponse(content={"error": error_detail}, status_code=500)


@app.post("/cdp/browser-task-stream")
async def cdp_browser_task_stream_endpoint(request: Request):
    """Streaming endpoint for browser task with progress updates via SSE."""
    try:
        body = await request.json()
        goal = body.get("goal", "")
        start_url = body.get("start_url")
        if not goal:
            return JSONResponse(content={"error": "no goal provided"}, status_code=400)

        async def generate():
            async for event in cdp_browser_task_stream(goal, start_url):
                yield f"data: {json.dumps(event)}\n\n"
            yield "data: {\"type\": \"done\"}\n\n"

        return StreamingResponse(generate(), media_type="text/event-stream")
    except Exception as e:
        import traceback
        error_detail = f"{str(e)}\n{traceback.format_exc()[:500]}"
        return JSONResponse(content={"error": error_detail}, status_code=500)


# Global Playwright and browser instances
_playwright = None
_browser = None
_tabs: Dict[str, Page] = {}  # Multi-tab support: name -> Page
_active_tab = "main"  # Currently active tab name

async def get_browser():
    """Get or create browser instance. Ensures CDP connection is alive."""
    global _playwright, _browser

    # Check if existing browser is still connected
    if _browser:
        try:
            # Verify connection is alive by getting browser version
            await _browser.new_context()
            return _browser
        except Exception:
            # Connection died, reset
            _browser = None

    # Start fresh Playwright if needed
    if not _playwright:
        _playwright = await async_playwright().start()

    # Connect to Chrome via CDP
    try:
        _browser = await _playwright.chromium.connect_over_cdp(CDP_URL)
        print(f"[BROWSER] Connected to Chrome CDP at {CDP_URL}", file=sys.stderr, flush=True)
    except Exception as e:
        print(f"[BROWSER] Failed to connect to Chrome CDP: {e}", file=sys.stderr, flush=True)
        raise

    return _browser

async def get_browser_page(tab_name: str = None):
    """Get or create browser page. Supports multi-tab."""
    global _tabs, _active_tab

    tab = tab_name or _active_tab

    # Check if tab exists and is valid
    if tab in _tabs:
        try:
            await _tabs[tab].evaluate("1")
            return _tabs[tab]
        except:
            del _tabs[tab]

    # Initialize browser
    browser = await get_browser()

    # Get or create context
    contexts = browser.contexts
    if contexts:
        context = contexts[0]
    else:
        context = await browser.new_context()

    # Try to reuse existing page if main tab
    if tab == "main":
        pages = context.pages
        if pages:
            _tabs[tab] = pages[0]
        else:
            _tabs[tab] = await context.new_page()
    else:
        _tabs[tab] = await context.new_page()

    return _tabs[tab]

async def switch_to_tab(tab_name: str):
    """Switch active tab."""
    global _active_tab
    if tab_name in _tabs:
        _active_tab = tab_name
        return _tabs[tab_name]
    return None

async def close_tab(tab_name: str):
    """Close a specific tab."""
    global _tabs, _active_tab
    if tab_name in _tabs:
        try:
            await _tabs[tab_name].close()
        except:
            pass
        del _tabs[tab_name]
        if _active_tab == tab_name:
            _active_tab = "main" if "main" in _tabs else (list(_tabs.keys())[0] if _tabs else None)

async def list_tabs():
    """List all open tabs with their URLs."""
    tabs_info = []
    for name, page in _tabs.items():
        try:
            tabs_info.append({"name": name, "url": page.url, "active": name == _active_tab})
        except:
            tabs_info.append({"name": name, "url": "error", "active": name == _active_tab})
    return tabs_info


@app.post("/cdp/browser-action")
async def cdp_browser_action_endpoint(request: Request):
    """Execute a browser action and return page state with persistence."""
    try:
        body = await request.json()
        action = body.get("action")

        # BLOCK completion without verification
        if action == "complete" or body.get("command") == "complete":
            if not browser_state.all_verifications_passed():
                required = browser_state.get_required_verification()
                results = browser_state.load_state().get('verification_results', {}) if browser_state.load_state() else {}
                missing = [k for k, v in required.items() if v and not results.get(k, False)]

                return JSONResponse({
                    "url": "",
                    "title": "BLOCKED",
                    "elements": [],
                    "text": f"CANNOT COMPLETE: Missing verifications: {missing}\n\nUse 'verify' command to prove completion.",
                    "action_result": f"BLOCKED: Need {missing}",
                    "success": False,
                    "error": f"Verification required: {missing}"
                })

        page = await get_browser_page(body.get("tab", "main"))

        # Execute the action
        result = await execute_browser_action(body)

        # Track verification results automatically
        if action == "verify":
            if result.get("success"):
                for check in result.get("checks", []):
                    if "Element found" in check:
                        browser_state.set_verification_passed("element_present", True)
                    if "Text found" in check:
                        browser_state.set_verification_passed("text_present", True)
                    if "URL contains" in check:
                        browser_state.set_verification_passed("url_correct", True)

        # Save state after important actions
        if action in ["navigate", "new_tab", "switch_tab", "screenshot"]:
            tabs = await list_tabs()
            browser_state.update_state({
                "last_action": action,
                "last_result": result.get("action_result", ""),
                "tabs": tabs
            })

        # Get page state
        page_state = await get_page_accessibility_snapshot(page)

        return JSONResponse({
            "url": page.url,
            "title": page_state.get("title", ""),
            "elements": page_state.get("nodes", []),
            "text": page_state.get("text", ""),
            "action_result": result.get("action_result", ""),
            "success": result.get("success", False),
            "error": result.get("error", ""),
            "verifications_complete": browser_state.all_verifications_passed()
        })

    except Exception as e:
        import traceback
        error_detail = f"{str(e)}\n{traceback.format_exc()[:500]}"
        return JSONResponse({"error": error_detail}, status_code=500)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "keymaster": KEYMASTER_URL,
        "restricted_mode": IS_RESTRICTED,
        "version": "1.0.0-docker"
    }


@app.post("/cdp/browser-state/init")
async def init_browser_state(request: Request):
    """Initialize task state with requirements."""
    body = await request.json()
    task_id = body.get("task_id", str(uuid.uuid4()))
    required_verification = body.get("required_verification", {})

    browser_state.save_state({
        "task_id": task_id,
        "started_at": str(asyncio.get_event_loop().time()),
        "required_verification": required_verification,
        "verification_results": {},
        "completed": False,
        "tabs": {}
    })

    return JSONResponse({
        "success": True,
        "task_id": task_id,
        "message": "Task state initialized"
    })


@app.post("/cdp/browser-state/check-completion")
async def check_completion(request: Request):
    """Check if task can be marked complete. ENFORCES verification."""
    body = await request.json()
    attempted_action = body.get("action", "")

    # If trying to complete without verification
    if attempted_action == "complete":
        if not browser_state.all_verifications_passed():
            required = browser_state.get_required_verification()
            results = browser_state.load_state().get('verification_results', {})

            missing = [k for k, v in required.items() if v and not results.get(k, False)]

            return JSONResponse({
                "success": False,
                "error": "BLOCKED: Cannot complete without verification",
                "details": {
                    "missing_verifications": missing,
                    "message": f"You must pass these verifications first: {missing}. Use 'verify' command."
                }
            }, status_code=400)

        # All verifications passed - mark complete
        browser_state.update_state({"completed": True})
        return JSONResponse({
            "success": True,
            "message": "Task verified and marked complete"
        })

    return JSONResponse({"success": True})


@app.post("/cdp/browser-state/save-tabs")
async def save_tabs(request: Request):
    """Save current tab state."""
    tabs = await list_tabs()
    browser_state.update_state({"tabs": tabs})
    return JSONResponse({"success": True, "tabs": tabs})


@app.get("/cdp/browser-state/load")
async def load_state():
    """Load saved state."""
    state = browser_state.load_state()
    return JSONResponse({"state": state or {}})


@app.post("/cdp/browser-state/clear")
async def clear_state():
    """Clear saved state."""
    browser_state.clear_state()
    return JSONResponse({"success": True})


@app.post("/cdp/browser-cleanup")
async def cleanup_browser(request: Request):
    """Cleanup after task: close all tabs except main, clear screenshots, reset to Google."""
    try:
        body = await request.json()
        reset_url = body.get("reset_url", "https://google.com")

        global _tabs, _active_tab

        results = {
            "tabs_closed": 0,
            "screenshots_deleted": 0,
            "state_cleared": False,
            "reset_to": reset_url
        }

        # Close all tabs except main
        tabs_to_close = [name for name in _tabs.keys() if name != "main"]
        for tab_name in tabs_to_close:
            try:
                await _tabs[tab_name].close()
                results["tabs_closed"] += 1
            except:
                pass
            del _tabs[tab_name]

        # Reset main tab to Google (or specified URL)
        if "main" in _tabs:
            try:
                await _tabs["main"].goto(reset_url, wait_until="domcontentloaded", timeout=20000)
            except:
                pass
        else:
            # Recreate main tab
            _tabs["main"] = await get_browser_page("main")
            await _tabs["main"].goto(reset_url, wait_until="domcontentloaded", timeout=20000)

        _active_tab = "main"

        # Delete old screenshots
        screenshot_paths = [
            "/tmp/proof.png",
            "/tmp/screenshot.png",
            "/tmp/browser_task_state.json"
        ]
        for path in screenshot_paths:
            try:
                if os.path.exists(path):
                    os.remove(path)
                    results["screenshots_deleted"] += 1
            except:
                pass

        # Clear state
        browser_state.clear_state()
        results["state_cleared"] = True

        return JSONResponse({
            "success": True,
            "message": f"Cleanup complete: {results['tabs_closed']} tabs closed, {results['screenshots_deleted']} files deleted, reset to {reset_url}",
            "results": results
        })

    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


# =============================================================================
# RESEARCH STATE ENDPOINTS (enforces search -> fetch -> synthesis workflow)
# =============================================================================

@app.post("/research/init")
async def init_research(request: Request):
    """Initialize research task with required phases."""
    try:
        body = await request.json()
        task_id = body.get("task_id", str(uuid.uuid4()))
        topic = body.get("topic", "")

        ResearchState.init_task(task_id, topic)

        return JSONResponse({
            "success": True,
            "task_id": task_id,
            "message": f"Research task initialized for: {topic}",
            "required_phases": ["search", "fetch", "synthesis"]
        })
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


@app.post("/research/track-phase")
async def track_phase(request: Request):
    """Mark a phase as complete."""
    try:
        body = await request.json()
        phase = body.get("phase", "")

        if phase not in ["search", "fetch", "synthesis"]:
            return JSONResponse({
                "success": False,
                "error": f"Invalid phase: {phase}. Must be search, fetch, or synthesis"
            }, status_code=400)

        ResearchState.mark_phase_complete(phase)

        # Store additional data if provided
        if phase == "search" and body.get("results"):
            ResearchState.add_search_results(body.get("results", []))
        if phase == "fetch" and body.get("urls"):
            ResearchState.add_fetched_urls(body.get("urls", []))

        missing = ResearchState.get_missing_phases()

        return JSONResponse({
            "success": True,
            "phase": phase,
            "message": f"Phase '{phase}' marked complete",
            "remaining_phases": missing
        })
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


@app.post("/research/check-completion")
async def check_research_completion(request: Request):
    """Check if research can be completed. BLOCKS if phases incomplete."""
    try:
        body = await request.json()
        attempted_action = body.get("action", "")

        # If trying to complete without finishing all phases
        if attempted_action == "complete":
            missing = ResearchState.get_missing_phases()

            if missing:
                return JSONResponse({
                    "success": False,
                    "error": "BLOCKED: Research workflow incomplete",
                    "details": {
                        "missing_phases": missing,
                        "message": f"You MUST complete these phases first: {', '.join(missing)}. " +
                                   f"Call web_search for 'search', web_fetch for 'fetch', " +
                                   f"then provide synthesis before completing."
                    }
                }, status_code=400)

            # All phases complete - mark done
            ResearchState.mark_completed()
            return JSONResponse({
                "success": True,
                "message": "Research task verified and marked complete"
            })

        # Just checking status
        missing = ResearchState.get_missing_phases()
        return JSONResponse({
            "success": True,
            "all_phases_complete": len(missing) == 0,
            "missing_phases": missing,
            "completed": ResearchState.load_state().get("completed", False) if ResearchState.load_state() else False
        })
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


@app.get("/research/state")
async def get_research_state():
    """Get current research state."""
    try:
        state = ResearchState.load_state()
        if not state:
            return JSONResponse({
                "success": True,
                "has_active_task": False,
                "state": None
            })

        return JSONResponse({
            "success": True,
            "has_active_task": True,
            "state": {
                "task_id": state.get("task_id"),
                "topic": state.get("topic"),
                "phases": state.get("phases", {}),
                "missing_phases": ResearchState.get_missing_phases(),
                "search_results_count": len(state.get("search_results", [])),
                "fetched_urls_count": len(state.get("fetched_urls", [])),
                "completed": state.get("completed", False)
            }
        })
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


@app.post("/research/clear")
async def clear_research_state():
    """Clear research state."""
    try:
        ResearchState.clear_state()
        return JSONResponse({"success": True, "message": "Research state cleared"})
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


# =============================================================================
# MESSAGE CONVERSION
# =============================================================================

def convert_messages(body):
    msgs = []
    if "system" in body:
        system = body["system"]
        if isinstance(system, list):
            system = "\n".join(b.get("text", "") for b in system if isinstance(b, dict))
        msgs.append({"role": "system", "content": system})

    for msg in body.get("messages", []):
        role = msg.get("role", "user")
        content = msg.get("content", "")

        if isinstance(content, list):
            content = [b for b in content if isinstance(b, dict) and b.get("type") != "thinking"]
            tool_results = [b for b in content if isinstance(b, dict) and b.get("type") == "tool_result"]
            tool_uses = [b for b in content if isinstance(b, dict) and b.get("type") == "tool_use"]
            text_parts = [b.get("text", "") for b in content if isinstance(b, dict) and b.get("type") == "text"]

            if tool_uses and role == "assistant":
                msgs.append({
                    "role": "assistant",
                    "content": "\n".join(text_parts) if text_parts else None,
                    "tool_calls": [
                        {
                            "id": tu.get("id", "call_0"),
                            "type": "function",
                            "function": {"name": tu.get("name", ""), "arguments": json.dumps(tu.get("input", {}))}
                        }
                        for tu in tool_uses
                    ]
                })
                continue

            if tool_results:
                for tr in tool_results:
                    tr_content = tr.get("content", "")
                    if isinstance(tr_content, list):
                        tr_content = "\n".join(b.get("text", "") for b in tr_content if isinstance(b, dict))
                    msgs.append({"role": "tool", "tool_call_id": tr.get("tool_use_id", "call_0"), "content": tr_content})
                if text_parts:
                    real_parts = [t for t in text_parts if not t.strip().startswith("<system-reminder")]
                    if real_parts:
                        msgs.append({"role": "user", "content": real_parts[-1].strip()})
                continue

            content = "\n".join(text_parts)

        msgs.append({"role": "assistant" if role == "assistant" else "user", "content": content})

    return msgs


def build_openai_body(body, anthropic_model):
    # Use direct API model mapping when in direct API mode
    if USE_DIRECT_API:
        model = DIRECT_MODEL_MAP.get(anthropic_model, DEFAULT_DIRECT_MODEL)
    else:
        model = MODEL_MAP.get(anthropic_model, "nvidia/nemotron-3-nano-30b-a3b")

    openai_body = {
        "model": model,
        "messages": convert_messages(body),
        "max_tokens": body.get("max_tokens", 4096),
        "temperature": body.get("temperature", 0.7),
        "stream": body.get("stream", False)
    }

    all_tools = list(body.get("tools", []))
    existing_names = {t["name"] for t in all_tools}
    for wt in WEB_TOOLS:
        if wt["name"] not in existing_names:
            all_tools.append(wt)

    if all_tools:
        openai_body["tools"] = [
            {"type": "function", "function": {"name": t["name"], "description": t.get("description", ""), "parameters": t.get("input_schema", {})}}
            for t in all_tools
        ]
        openai_body["tool_choice"] = "auto"

    return openai_body


# =============================================================================
# MAIN MESSAGE HANDLER
# =============================================================================

@app.post("/v1/messages")
async def messages(request: Request):
    request_id = uuid.uuid4().hex[:8]
    try:
        body = await request.json()
        anthropic_model = body.get("model", "sonnet")
        stream = body.get("stream", False)

        print(f"[BRIDGE:{request_id}] Incoming model={anthropic_model} stream={stream} direct={USE_DIRECT_API}", file=sys.stderr)

        openai_body = build_openai_body(body, anthropic_model)
        api_url, headers = get_api_config()

        if stream:
            async def generate():
                msg_id = f"msg_{uuid.uuid4().hex[:12]}"
                yield f"event: message_start\ndata: {json.dumps({'type': 'message_start', 'message': {'id': msg_id, 'type': 'message', 'role': 'assistant', 'content': [], 'model': anthropic_model, 'usage': {'input_tokens': 0, 'output_tokens': 0}}})}\n\n"
                yield f"event: content_block_start\ndata: {json.dumps({'type': 'content_block_start', 'index': 0, 'content_block': {'type': 'text', 'text': ''}})}\n\n"

                full_content = ""
                tool_call_chunks = {}

                try:
                    async with http_client.stream("POST", api_url,
                        json=openai_body, headers=headers, timeout=httpx.Timeout(600.0)) as resp:
                        async for line in resp.aiter_lines():
                            if line.startswith("data: "):
                                data = line[6:]
                                if data == "[DONE]":
                                    break
                                try:
                                    chunk = json.loads(data)
                                    delta = chunk["choices"][0].get("delta", {}) or {}
                                    text = delta.get("content") or ""
                                    if text:
                                        full_content += text
                                        yield f"event: content_block_delta\ndata: {json.dumps({'type': 'content_block_delta', 'index': 0, 'delta': {'type': 'text_delta', 'text': text}})}\n\n"
                                    for tc in delta.get("tool_calls", []) or []:
                                        idx = tc.get("index", 0)
                                        if idx not in tool_call_chunks:
                                            tool_call_chunks[idx] = {"id": tc.get("id", f"call_{idx}"), "name": "", "arguments": ""}
                                        if tc.get("function", {}).get("name"):
                                            tool_call_chunks[idx]["name"] += tc["function"]["name"]
                                        if tc.get("function", {}).get("arguments"):
                                            tool_call_chunks[idx]["arguments"] += tc["function"]["arguments"]
                                except:
                                    pass
                except Exception as e:
                    print(f"[BRIDGE] Stream error: {e}", file=sys.stderr)

                yield f"event: content_block_stop\ndata: {json.dumps({'type': 'content_block_stop', 'index': 0})}\n\n"

                if tool_call_chunks:
                    bridge_tools = []
                    other_tools = []
                    for idx, tc in tool_call_chunks.items():
                        if tc["name"] in BRIDGE_TOOL_NAMES:
                            try:
                                tool_input = json.loads(tc["arguments"])
                            except:
                                tool_input = {}
                            bridge_tools.append({"id": tc["id"], "name": tc["name"], "input": tool_input})
                        else:
                            other_tools.append((idx, tc))

                    # Process bridge tools and return as proper tool_result blocks
                    for bt in bridge_tools:
                        raw_result = await execute_tool(bt["name"], bt["input"])
                        # Process through LLM to make conversational
                        conversational_result = await process_tool_result(bt["name"], bt["input"], raw_result)
                        # Yield tool_result block
                        yield f"event: content_block_start\ndata: {json.dumps({'type': 'content_block_start', 'index': len(other_tools) + 1, 'content_block': {'type': 'tool_result', 'tool_use_id': bt['id'], 'content': conversational_result}})}\n\n"
                        yield f"event: content_block_stop\ndata: {json.dumps({'type': 'content_block_stop', 'index': len(other_tools) + 1})}\n\n"

                    for i, (idx, tc) in enumerate(other_tools, start=1):
                        yield f"event: content_block_start\ndata: {json.dumps({'type': 'content_block_start', 'index': i, 'content_block': {'type': 'tool_use', 'id': tc['id'], 'name': tc['name'], 'input': {}}})}\n\n"
                        yield f"event: content_block_delta\ndata: {json.dumps({'type': 'content_block_delta', 'index': i, 'delta': {'type': 'input_json_delta', 'partial_json': tc['arguments']}})}\n\n"
                        yield f"event: content_block_stop\ndata: {json.dumps({'type': 'content_block_stop', 'index': i})}\n\n"

                    # ALWAYS use tool_use when tools ran, so model can continue multi-step workflows
                    stop_reason = "tool_use"
                else:
                    stop_reason = "end_turn"

                yield f"event: message_delta\ndata: {json.dumps({'type': 'message_delta', 'delta': {'stop_reason': stop_reason}, 'usage': {'input_tokens': 0, 'output_tokens': len(full_content) // 4 or 1}})}\n\n"
                yield f"event: message_stop\ndata: {json.dumps({'type': 'message_stop'})}\n\n"

            return StreamingResponse(
                generate(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "X-Accel-Buffering": "no"  # Disable nginx buffering if present
                }
            )

        else:
            msg_id = f"msg_{uuid.uuid4().hex[:12]}"
            resp = await http_client.post(api_url,
                json=openai_body, headers=headers, timeout=httpx.Timeout(600.0))

            if resp.status_code != 200:
                return JSONResponse(content={"id": msg_id, "type": "message", "role": "assistant",
                    "content": [{"type": "text", "text": f"Error: Keymaster returned {resp.status_code}"}],
                    "model": anthropic_model, "stop_reason": "error"})

            openai_resp = resp.json()
            message = openai_resp.get("choices", [{}])[0].get("message", {})
            content_blocks = []

            if message.get("tool_calls"):
                bridge_tools = []
                other_tools = []
                for tc in message["tool_calls"]:
                    name = tc.get("function", {}).get("name", "")
                    if name in BRIDGE_TOOL_NAMES:
                        try:
                            tool_input = json.loads(tc["function"]["arguments"])
                        except:
                            tool_input = {}
                        bridge_tools.append({"name": name, "input": tool_input, "id": tc.get("id", "call_0")})
                    else:
                        other_tools.append(tc)

                # Process bridge tools and return as proper tool_result blocks
                for bt in bridge_tools:
                    raw_result = await execute_tool(bt["name"], bt["input"])
                    conversational_result = await process_tool_result(bt["name"], bt["input"], raw_result)
                    content_blocks.append({"type": "tool_result", "tool_use_id": bt["id"], "content": conversational_result})

                # Add original assistant content if present
                if message.get("content"):
                    content_blocks.insert(0, {"type": "text", "text": message.get("content")})

                # Add other tools as tool_use blocks
                for tc in other_tools:
                    try:
                        input_data = json.loads(tc["function"]["arguments"])
                    except:
                        input_data = {}
                    content_blocks.append({"type": "tool_use", "id": tc.get("id", "call_0"),
                        "name": tc["function"]["name"], "input": input_data})

                # ALWAYS use tool_use when tools ran, so model can continue multi-step workflows
                stop_reason = "tool_use" if (bridge_tools or other_tools) else "end_turn"
            else:
                content_blocks.append({"type": "text", "text": message.get("content", "")})
                stop_reason = "end_turn"

            return JSONResponse(content={
                "id": openai_resp.get("id", msg_id),
                "type": "message",
                "role": "assistant",
                "content": content_blocks,
                "model": anthropic_model,
                "stop_reason": stop_reason,
                "usage": {"input_tokens": openai_resp.get("usage", {}).get("prompt_tokens", 0),
                         "output_tokens": openai_resp.get("usage", {}).get("completion_tokens", 0)}
            })

    except Exception as e:
        import traceback
        print(f"[BRIDGE:{request_id}] ERROR: {e}\n{traceback.format_exc()[:500]}", file=sys.stderr)
        return JSONResponse(status_code=500, content={
            "id": f"msg_{request_id}",
            "type": "message",
            "role": "assistant",
            "content": [{"type": "text", "text": f"Bridge Error: {str(e)}"}],
            "model": anthropic_model if 'anthropic_model' in locals() else "unknown",
            "stop_reason": "error"
        })


# =============================================================================
# OPENAI COMPATIBLE ENDPOINT (for OpenJarvis integration)
# =============================================================================
@app.post("/v1/chat/completions")
async def chat_completions(request: Request):
    """OpenAI-compatible chat completions endpoint."""
    request_id = uuid.uuid4().hex[:8]
    try:
        body = await request.json()
        model = body.get("model", "moonshotai/kimi-k2.5")
        stream = body.get("stream", False)
        messages = body.get("messages", [])

        print(f"[BRIDGE:{request_id}] OpenAI chat model={model} stream={stream}", file=sys.stderr)

        # Build OpenAI body for NVIDIA API
        openai_body = {
            "model": model,
            "messages": messages,
            "max_tokens": body.get("max_tokens", 1024),
            "temperature": body.get("temperature", 0.7),
            "stream": stream,
        }
        if "tools" in body:
            openai_body["tools"] = body["tools"]
            openai_body["tool_choice"] = body.get("tool_choice", "auto")

        api_url, headers = get_api_config()

        if stream:
            async def generate_openai_stream():
                try:
                    async with http_client.stream("POST", api_url,
                                                  json=openai_body, headers=headers,
                                                  timeout=httpx.Timeout(600.0)) as resp:
                        async for line in resp.aiter_lines():
                            if line.startswith("data: "):
                                yield line + "\n\n"
                            elif line == "[DONE]":
                                yield "data: [DONE]\n\n"
                                break
                except Exception as e:
                    print(f"[BRIDGE] Stream error: {e}", file=sys.stderr)
                    yield f"data: {{\"error\": \"{str(e)}\"}}\n\n"

            return StreamingResponse(
                generate_openai_stream(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                }
            )
        else:
            # Non-streaming response
            resp = await http_client.post(api_url, json=openai_body, headers=headers, timeout=httpx.Timeout(600.0))
            data = resp.json()

            # Convert to OpenAI format
            return JSONResponse(content={
                "id": f"chatcmpl-{request_id}",
                "object": "chat.completion",
                "created": int(asyncio.get_event_loop().time()),
                "model": model,
                "choices": data.get("choices", []),
                "usage": data.get("usage", {})
            })

    except Exception as e:
        import traceback
        print(f"[BRIDGE:{request_id}] ERROR: {e}\n{traceback.format_exc()[:500]}", file=sys.stderr)
        return JSONResponse(status_code=500, content={
            "error": {
                "message": str(e),
                "type": "bridge_error"
            }
        })


@app.get("/v1/models")
async def list_models():
    """List available models (OpenAI compatible)."""
    return JSONResponse(content={
        "object": "list",
        "data": [
            {"id": "moonshotai/kimi-k2.5", "object": "model"},
            {"id": "deepseek-ai/deepseek-r1", "object": "model"},
            {"id": "qwen/qwen3-235b-a22b", "object": "model"},
        ]
    })


if __name__ == "__main__":
    import uvicorn
    # Use uvloop for better async performance
    try:
        import uvloop
        uvloop.install()
    except ImportError:
        pass
    uvicorn.run(app, host="127.0.0.1", port=8789, log_level="info", loop="uvloop")
