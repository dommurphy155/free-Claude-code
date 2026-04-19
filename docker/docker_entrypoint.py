#!/usr/bin/env python3
"""
Docker Entrypoint - Handles both restricted and full modes

Usage:
    # Restricted mode (no --ipc=host needed, no root)
    docker run -e RESTRICTED_MODE=1 claude-code-haha

    # Full mode (requires --ipc=host)
    docker run --ipc=host claude-code-haha

    # Just the bridge
    docker run -p 8789:8789 --ipc=host claude-code-haha bridge

    # CLI only (interactive)
    docker run -it --ipc=host claude-code-haha cli
"""

import os
import sys
import subprocess
import signal

# Check restricted mode early
IS_RESTRICTED = os.environ.get("RESTRICTED_MODE", "0") == "1"


def setup_environment():
    """Configure environment based on mode."""
    # Always set these
    os.environ.setdefault("CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC", "1")
    os.environ.setdefault("DISABLE_TELEMETRY", "1")

    if IS_RESTRICTED:
        os.environ.setdefault("MOCK_BROWSER", "true")
        print("[!] RESTRICTED MODE ENABLED", file=sys.stderr)
        print("    - Browser automation: MOCKED", file=sys.stderr)
        print("    - System commands: BLOCKED", file=sys.stderr)
        print("    - File/network operations: ALLOWED", file=sys.stderr)
    else:
        print("[✓] Full mode enabled", file=sys.stderr)
        print("    - Browser automation: ENABLED", file=sys.stderr)
        print("    - System commands: ALLOWED (container-scoped)", file=sys.stderr)


def check_chromium():
    """Check if Chromium is available."""
    try:
        result = subprocess.run(
            ["which", "chromium-browser"],
            capture_output=True,
            timeout=5
        )
        if result.returncode == 0:
            path = result.stdout.decode().strip()
            print(f"[✓] Chromium found: {path}", file=sys.stderr)
            os.environ["PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH"] = path
            return True
    except Exception as e:
        print(f"[!] Chromium check failed: {e}", file=sys.stderr)

    print("[!] Chromium not found - browser features may fail", file=sys.stderr)
    return False


def run_bridge():
    """Run the FastAPI bridge."""
    import uvicorn

    # Import here to allow restricted mode patching
    if IS_RESTRICTED:
        import docker_restricted_mode
        docker_restricted_mode.patch_playwright_for_restricted_mode()

    # Now import the bridge (after patching if needed)
    from simple_bridge import app

    print(f"[✓] Starting bridge on 0.0.0.0:8789", file=sys.stderr)
    if IS_RESTRICTED:
        print(f"[!] Bridge running in RESTRICTED MODE", file=sys.stderr)

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8789,
        log_level="info",
        access_log=False
    )


def run_cli():
    """Run the Bun CLI."""
    # Set up environment for CLI
    env = os.environ.copy()
    env["CLAUDE_CODE_FORCE_RECOVERY_CLI"] = os.environ.get(
        "CLAUDE_CODE_FORCE_RECOVERY_CLI", "0"
    )

    cmd = [
        "bun",
        "--env-file=/app/.env",
        "/app/src/entrypoints/cli.tsx",
        "--dangerously-skip-permissions"
    ]

    print(f"[✓] Starting CLI...", file=sys.stderr)
    result = subprocess.run(cmd, env=env)
    sys.exit(result.returncode)


def run_telegram_bot():
    """Run the Telegram bot."""
    if not os.environ.get("TELEGRAM_BOT_TOKEN"):
        print("[!] TELEGRAM_BOT_TOKEN not set", file=sys.stderr)
        sys.exit(1)

    print(f"[✓] Starting Telegram bot...", file=sys.stderr)
    result = subprocess.run([sys.executable, "/app/telegram_claude_bot.py"])
    sys.exit(result.returncode)


def run_health_check():
    """Simple health check endpoint."""
    import http.client
    try:
        conn = http.client.HTTPConnection("localhost", 8789, timeout=5)
        conn.request("GET", "/health")
        response = conn.getresponse()
        if response.status == 200:
            print("[✓] Bridge is healthy", file=sys.stderr)
            sys.exit(0)
        else:
            print(f"[!] Bridge unhealthy: {response.status}", file=sys.stderr)
            sys.exit(1)
    except Exception as e:
        print(f"[!] Health check failed: {e}", file=sys.stderr)
        sys.exit(1)


def main():
    """Main entrypoint."""
    setup_environment()

    # Handle signals gracefully
    def signal_handler(signum, frame):
        print(f"\n[!] Received signal {signum}, shutting down...", file=sys.stderr)
        sys.exit(0)

    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)

    # Check what to run
    args = sys.argv[1:] if len(sys.argv) > 1 else []

    # Default: run bridge
    if not args or args[0] == "bridge":
        check_chromium()
        run_bridge()

    elif args[0] == "cli":
        run_cli()

    elif args[0] == "telegram":
        run_telegram_bot()

    elif args[0] == "health":
        run_health_check()

    elif args[0] == "--help" or args[0] == "-h":
        print(__doc__)
        sys.exit(0)

    else:
        print(f"[!] Unknown command: {args[0]}", file=sys.stderr)
        print("Use: bridge | cli | telegram | health", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
