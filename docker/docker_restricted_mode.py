#!/usr/bin/env python3
"""
Restricted Mode for Dockerized Claude Code

When running in unprivileged containers without --ipc=host, this module:
1. Disables Playwright's Chromium sandbox (uses --no-sandbox)
2. Mocks browser automation with safe fallbacks
3. Disables system-level operations
4. Provides graceful degradation for features requiring elevated privileges

Usage:
    Set RESTRICTED_MODE=1 in environment to enable
"""

import os
import sys
from typing import Optional, Dict, Any, List
from unittest.mock import MagicMock

# =============================================================================
# Configuration
# =============================================================================

IS_RESTRICTED = os.environ.get("RESTRICTED_MODE", "0") == "1"
MOCK_BROWSER = os.environ.get("MOCK_BROWSER", "auto")  # auto, true, false


def is_restricted() -> bool:
    """Check if running in restricted mode."""
    return IS_RESTRICTED


def get_browser_launch_args() -> List[str]:
    """Get Chromium launch args appropriate for the environment."""
    base_args = ["--disable-gpu", "--disable-dev-shm-usage"]

    if IS_RESTRICTED:
        # Unprivileged container: disable sandbox entirely
        base_args.extend([
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-features=IsolateOrigins,site-per-process",
        ])
    else:
        # Privileged container: can use sandbox with proper setup
        base_args.extend([
            "--ipc=host",  # Requires docker run --ipc=host
            "--cap-add=SYS_ADMIN",  # Requires docker run --cap-add=SYS_ADMIN
        ])

    return base_args


# =============================================================================
# Mock Browser for Restricted Mode
# =============================================================================

class MockBrowserPage:
    """Mock Playwright page for restricted mode."""

    def __init__(self):
        self.url = "about:blank"
        self.content = "<html><body>Mock browser page (restricted mode)</body></html>"

    async def goto(self, url: str, **kwargs):
        self.url = url
        print(f"[RESTRICTED MODE] Would navigate to: {url}", file=sys.stderr)
        return self

    async def content(self) -> str:
        return f"""
        <html>
        <body>
            <h1>Restricted Mode - Browser Mock</h1>
            <p>URL: {self.url}</p>
            <p>Browser automation is disabled in restricted mode.</p>
            <p>To enable full browser automation, run with: --ipc=host</p>
        </body>
        </html>
        """

    async def screenshot(self, **kwargs) -> bytes:
        # Return a 1x1 transparent PNG
        return b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\xfc\xcf\xc0\x50\x0f\x00\x04A\x01\xa3\x3a\xf0\xfc\xcc\x00\x00\x00\x00IEND\xaeB`\x82'

    async def evaluate(self, script: str, **kwargs) -> Any:
        return None

    async def close(self):
        pass

    async def wait_for_selector(self, selector: str, **kwargs):
        return None

    async def click(self, selector: str, **kwargs):
        print(f"[RESTRICTED MODE] Would click: {selector}", file=sys.stderr)

    async def type(self, selector: str, text: str, **kwargs):
        print(f"[RESTRICTED MODE] Would type into {selector}: {text[:50]}...", file=sys.stderr)

    async def press(self, key: str, **kwargs):
        print(f"[RESTRICTED MODE] Would press key: {key}", file=sys.stderr)


class MockBrowserContext:
    """Mock browser context for restricted mode."""

    async def new_page(self):
        return MockBrowserPage()

    async def close(self):
        pass


class MockBrowser:
    """Mock browser for restricted mode."""

    async def new_context(self, **kwargs):
        return MockBrowserContext()

    async def close(self):
        pass


class MockPlaywright:
    """Mock Playwright for restricted mode."""

    chromium = MagicMock()

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        pass

    async def start(self):
        return self

    async def stop(self):
        pass


async def async_playwright_mock():
    """Return mock playwright for restricted mode."""
    return MockPlaywright()


def patch_playwright_for_restricted_mode():
    """
    Patch Playwright imports to use mocks in restricted mode.
    Call this before importing playwright.
    """
    if not IS_RESTRICTED:
        return

    # Create mock module
    mock_async_api = type(sys)('playwright.async_api')
    mock_async_api.async_playwright = async_playwright_mock
    mock_async_api.Page = MockBrowserPage
    mock_async_api.Browser = MockBrowser
    mock_async_api.BrowserContext = MockBrowserContext

    # Inject into sys.modules
    sys.modules['playwright'] = type(sys)('playwright')
    sys.modules['playwright.async_api'] = mock_async_api

    print("[RESTRICTED MODE] Playwright patched with mock browser", file=sys.stderr)


# =============================================================================
# Safe System Operations
# =============================================================================

class SafeSubprocessRunner:
    """
    Safe subprocess wrapper that blocks dangerous operations in restricted mode.
    """

    BLOCKED_COMMANDS = {
        'sudo', 'su', 'apt', 'apt-get', 'yum', 'dnf', 'pacman',
        'systemctl', 'service', 'reboot', 'shutdown', 'poweroff',
        'mkfs', 'fdisk', 'dd', 'mount', 'umount',
    }

    @classmethod
    def run(cls, cmd, *args, **kwargs):
        """Safe subprocess.run replacement."""
        cmd_list = cmd if isinstance(cmd, list) else cmd.split()
        cmd_name = os.path.basename(cmd_list[0]) if cmd_list else ""

        if IS_RESTRICTED and cmd_name in cls.BLOCKED_COMMANDS:
            print(f"[RESTRICTED MODE] Blocked: {' '.join(cmd_list[:3])}...", file=sys.stderr)
            class MockResult:
                returncode = 1
                stdout = ""
                stderr = f"Command '{cmd_name}' blocked in restricted mode"
            return MockResult()

        # Import subprocess here to avoid circular import issues
        import subprocess
        return subprocess.run(cmd, *args, **kwargs)

    @classmethod
    def Popen(cls, cmd, *args, **kwargs):
        """Safe subprocess.Popen replacement."""
        cmd_list = cmd if isinstance(cmd, list) else cmd.split()
        cmd_name = os.path.basename(cmd_list[0]) if cmd_list else ""

        if IS_RESTRICTED and cmd_name in cls.BLOCKED_COMMANDS:
            print(f"[RESTRICTED MODE] Blocked Popen: {cmd_name}", file=sys.stderr)
            # Return a mock process
            class MockProcess:
                def poll(self): return 1
                def wait(self, timeout=None): return 1
                def communicate(self, input=None): return (b"", b"Blocked in restricted mode")
                def kill(self): pass
                def terminate(self): pass
                stdin = None
                stdout = open(os.devnull, 'w')
                stderr = open(os.devnull, 'w')
            return MockProcess()

        import subprocess
        return subprocess.Popen(cmd, *args, **kwargs)


# =============================================================================
# Feature Detection
# =============================================================================

def detect_capabilities() -> Dict[str, bool]:
    """Detect what features are available in current environment."""
    capabilities = {
        "restricted_mode": IS_RESTRICTED,
        "browser_automation": not IS_RESTRICTED,
        "system_commands": not IS_RESTRICTED,
        "file_system": True,  # Always available but restricted to container
        "network": True,
        "api_calls": True,
    }

    # Check if we can actually launch browser
    if not IS_RESTRICTED:
        try:
            import subprocess
            result = subprocess.run(
                ["which", "chromium-browser"],
                capture_output=True,
                timeout=5
            )
            capabilities["chromium_available"] = result.returncode == 0
        except Exception:
            capabilities["chromium_available"] = False

    return capabilities


def print_capability_report():
    """Print a nice report of available capabilities."""
    caps = detect_capabilities()

    print("\n" + "="*60, file=sys.stderr)
    print("CLAUDE CODE - DOCKER CAPABILITY REPORT", file=sys.stderr)
    print("="*60, file=sys.stderr)

    for feature, available in caps.items():
        status = "✓" if available else "✗"
        print(f"  [{status}] {feature.replace('_', ' ').title()}", file=sys.stderr)

    if IS_RESTRICTED:
        print("\n[!] Running in RESTRICTED MODE", file=sys.stderr)
        print("    Browser automation is mocked.", file=sys.stderr)
        print("    System commands are blocked.", file=sys.stderr)
        print("    Run with --ipc=host for full functionality.", file=sys.stderr)

    print("="*60 + "\n", file=sys.stderr)


# Auto-print on import if in restricted mode
if IS_RESTRICTED:
    print_capability_report()
