#!/usr/bin/env python3
"""
Claude Code Setup - Platform Detector
Detects the platform and runs the appropriate setup wizard.
"""

import sys
import subprocess
from pathlib import Path


def get_platform():
    """Detect the current platform."""
    if sys.platform.startswith('win'):
        return 'windows'
    elif sys.platform.startswith('darwin'):
        return 'macos'
    elif sys.platform.startswith('linux'):
        return 'linux'
    return 'unknown'


def main():
    platform = get_platform()
    script_dir = Path(__file__).parent

    print(f"Detected platform: {platform}")
    print()

    if platform == 'linux':
        wizard = script_dir / "linux_setup_wizard.py"
    elif platform == 'macos':
        wizard = script_dir / "mac_setup_wizard.py"
    elif platform == 'windows':
        wizard = script_dir / "windows_setup_wizard.py"
    else:
        print(f"Unknown platform: {sys.platform}")
        print("Please manually run the appropriate wizard:")
        print("  - Linux: python3 linux_setup_wizard.py")
        print("  - macOS: python3 mac_setup_wizard.py")
        print("  - Windows: python windows_setup_wizard.py")
        sys.exit(1)

    if not wizard.exists():
        print(f"Wizard not found: {wizard}")
        sys.exit(1)

    print(f"Running: {wizard.name}")
    print("-" * 60)
    print()

    # Run the appropriate wizard
    result = subprocess.run([sys.executable, str(wizard)])
    sys.exit(result.returncode)


if __name__ == "__main__":
    main()
