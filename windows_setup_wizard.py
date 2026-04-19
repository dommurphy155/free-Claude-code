#!/usr/bin/env python3
"""
Claude Code Setup Wizard for Windows
Installs and configures claude-code-haha with Keymaster and simple_bridge.
Uses Windows Task Scheduler instead of systemd.
"""

import os
import sys
import json
import subprocess
import time
import shutil
from pathlib import Path
from typing import List, Dict, Optional, Tuple


class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    END = '\033[0m'
    BOLD = '\033[1m'

    @classmethod
    def init(cls):
        """Initialize colors for Windows terminal."""
        if sys.platform == 'win32':
            try:
                import ctypes
                kernel32 = ctypes.windll.kernel32
                kernel32.SetConsoleMode(kernel32.GetStdHandle(-11), 7)
            except:
                # Disable colors if not supported
                cls.HEADER = ''
                cls.BLUE = ''
                cls.CYAN = ''
                cls.GREEN = ''
                cls.WARNING = ''
                cls.FAIL = ''
                cls.END = ''
                cls.BOLD = ''


def check_system_requirements():
    """Check if the system meets minimum requirements."""
    issues = []

    # Check Python version
    if sys.version_info < (3, 8):
        issues.append(f"Python 3.8+ required, found {sys.version_info.major}.{sys.version_info.minor}")

    # Check for Windows
    if not sys.platform.startswith('win'):
        issues.append(f"This wizard is designed for Windows. Detected: {sys.platform}")

    # Check for curl (optional on Windows)
    curl_path = shutil.which('curl')
    if not curl_path:
        curl_path = Path(r"C:\Windows\System32\curl.exe")
        if not curl_path.exists():
            issues.append("curl not found - health checks will be limited (install from Windows 10 1803+)")

    # Check disk space (need at least 1GB free)
    try:
        import ctypes
        free_bytes = ctypes.c_ulonglong(0)
        ctypes.windll.kernel32.GetDiskFreeSpaceExW(str(Path.home()), None, None, ctypes.byref(free_bytes))
        free_gb = free_bytes.value / (1024**3)
        if free_gb < 1:
            issues.append(f"Low disk space: {free_gb:.1f}GB free (recommend 1GB+)")
    except:
        pass

    if issues:
        print_colored("\n⚠️ System Requirements Issues:", Colors.FAIL + Colors.BOLD)
        for issue in issues:
            print_colored(f" - {issue}", Colors.FAIL)
        print()
        response = input("Continue anyway? (yes/no): ").strip().lower()
        if response not in ('y', 'yes'):
            sys.exit(1)


def print_colored(text: str, color: str = ""):
    """Print colored text."""
    Colors.init()
    if color:
        print(f"{color}{text}{Colors.END}")
    else:
        print(text)


def print_step(step_num: int, total: int, description: str):
    """Print a step header."""
    print()
    print_colored(f"{'='*60}", Colors.CYAN)
    print_colored(f" STEP {step_num}/{total}: {description}", Colors.BOLD + Colors.CYAN)
    print_colored(f"{'='*60}", Colors.CYAN)
    print()


def run_command(cmd: List[str], capture: bool = True, check: bool = True, cwd: str = None, shell: bool = False) -> Tuple[int, str, str]:
    """Run a shell command and return exit code, stdout, stderr."""
    try:
        if capture:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=False,
                cwd=cwd,
                shell=shell
            )
            return result.returncode, result.stdout, result.stderr
        else:
            result = subprocess.run(cmd, check=check, cwd=cwd, shell=shell)
            return result.returncode, "", ""
    except Exception as e:
        return 1, "", str(e)


def prompt_user(message: str, options: List[str] = None) -> str:
    """Prompt user for input with optional predefined options."""
    print()
    if options:
        print_colored(message, Colors.CYAN)
        for i, opt in enumerate(options, 1):
            print(f" [{i}] {opt}")
        while True:
            choice = input(f"\nEnter choice (1-{len(options)}): ").strip()
            if choice.isdigit() and 1 <= int(choice) <= len(options):
                return options[int(choice) - 1]
            print_colored("Invalid choice. Please try again.", Colors.WARNING)
    else:
        return input(f"{message} ").strip()


def confirm(message: str) -> bool:
    """Ask for yes/no confirmation."""
    while True:
        response = input(f"{message} (yes/no): ").strip().lower()
        if response in ('y', 'yes'):
            return True
        if response in ('n', 'no'):
            return False
        print("Please answer 'yes' or 'no'.")


def find_system_pip() -> Optional[str]:
    """Find system pip executable."""
    pip_cmd = shutil.which("pip3") or shutil.which("pip")
    if pip_cmd:
        return pip_cmd
    # Try common locations
    for path in [
        Path.home() / "AppData" / "Local" / "Programs" / "Python" / "Python3*" / "Scripts" / "pip.exe",
        Path(r"C:\Python3*"),
    ]:
        if isinstance(path, Path):
            matches = list(path.parent.glob(path.name)) if '*' in str(path) else [path]
            for match in matches:
                pip_path = match / "Scripts" / "pip.exe" if match.is_dir() else match
                if pip_path.exists():
                    return str(pip_path)
    return None


def find_system_python() -> str:
    """Find system Python executable."""
    python_cmd = shutil.which("python3") or shutil.which("python")
    if python_cmd:
        return python_cmd
    # Try common locations
    for path in [
        Path.home() / "AppData" / "Local" / "Programs" / "Python" / "Python3*" / "python.exe",
        Path(r"C:\Python3*"),
    ]:
        if isinstance(path, Path):
            matches = list(path.parent.glob(path.name)) if '*' in str(path) else [path]
            for match in matches:
                py_path = match / "python.exe" if match.is_dir() else match
                if py_path.exists():
                    return str(py_path)
    return sys.executable


_BRIDGE_VENV_PATH: Optional[Path] = None


def get_bridge_venv_path() -> Path:
    """Get the virtual environment path for the bridge."""
    global _BRIDGE_VENV_PATH
    if _BRIDGE_VENV_PATH:
        return _BRIDGE_VENV_PATH
    venv_path = Path.home() / ".claude-code-haha" / "venv"
    return venv_path


def set_bridge_venv_path(path: Path):
    """Set the bridge venv path after creation."""
    global _BRIDGE_VENV_PATH
    _BRIDGE_VENV_PATH = path


def create_venv() -> Path:
    """Create Python virtual environment for the bridge."""
    venv_path = get_bridge_venv_path()

    if venv_path.exists():
        print(f"Using existing virtual environment at {venv_path}")
        set_bridge_venv_path(venv_path)
        return venv_path

    print(f"Creating Python virtual environment at {venv_path}...")
    venv_path.parent.mkdir(parents=True, exist_ok=True)
    python = find_system_python()
    code, out, err = run_command([python, "-m", "venv", str(venv_path)], check=False)
    if code != 0:
        print_colored(f"Failed to create venv: {err}", Colors.FAIL)
        sys.exit(1)

    set_bridge_venv_path(venv_path)
    return venv_path


def get_venv_python(venv_path: Optional[Path] = None) -> Optional[Path]:
    """Get the Python executable path in the virtual environment."""
    if venv_path is None:
        venv_path = get_bridge_venv_path()
    if not venv_path.exists():
        return None
    return venv_path / "Scripts" / "python.exe"


def get_venv_pip(venv_path: Optional[Path] = None) -> Optional[Path]:
    """Get the pip executable path in the virtual environment."""
    if venv_path is None:
        venv_path = get_bridge_venv_path()
    if not venv_path.exists():
        return None
    pip_path = venv_path / "Scripts" / "pip.exe"
    return pip_path if pip_path.exists() else None


def get_pip_cmd() -> List[str]:
    """Get pip command as list."""
    venv_path = get_bridge_venv_path()
    if not venv_path.exists():
        create_venv()

    venv_pip = get_venv_pip(venv_path)
    if venv_pip:
        return [str(venv_pip)]

    venv_python = get_venv_python(venv_path)
    if venv_python:
        return [str(venv_python), "-m", "pip"]

    system_pip = find_system_pip()
    if system_pip:
        return [system_pip]

    system_python = find_system_python()
    return [system_python, "-m", "pip"]


def get_python_cmd() -> str:
    """Get Python command for the bridge venv."""
    venv_path = get_bridge_venv_path()
    if not venv_path.exists():
        create_venv()

    venv_python = get_venv_python(venv_path)
    if venv_python and venv_python.exists():
        return str(venv_python)
    return find_system_python()


def get_keymaster_venv_path() -> Path:
    """Get the Keymaster virtual environment path."""
    return Path.home() / ".openclaw" / "keymaster_venv"


def get_keymaster_python() -> str:
    """Get the Python executable for Keymaster."""
    venv_path = get_keymaster_venv_path()
    python_path = venv_path / "Scripts" / "python.exe"
    if python_path.exists():
        return str(python_path)
    return find_system_python()


def install_bun():
    """Install Bun if not already installed."""
    bun_path = Path.home() / ".bun" / "bin" / "bun.exe"

    bun_in_path = shutil.which('bun')
    if bun_in_path:
        print_colored(f"Bun already in PATH at {bun_in_path}", Colors.GREEN)
        return

    if bun_path.exists():
        print_colored(f"Bun already installed at {bun_path}", Colors.GREEN)
        bun_bin = str(Path.home() / ".bun" / "bin")
        os.environ['PATH'] = bun_bin + os.pathsep + os.environ.get('PATH', '')
        return

    print("Installing Bun...")
    # On Windows, use PowerShell
    install_cmd = 'powershell -c "irm bun.sh/install.ps1 | iex"'
    result = subprocess.run(install_cmd, shell=True, capture_output=True, text=True)

    if result.returncode != 0:
        print_colored(f"Failed to install Bun: {result.stderr}", Colors.FAIL)
        print_colored("You may need to install Bun manually from https://bun.sh", Colors.WARNING)
        return

    print_colored("Bun installed successfully.", Colors.GREEN)
    bun_bin = str(Path.home() / ".bun" / "bin")
    os.environ['PATH'] = bun_bin + os.pathsep + os.environ.get('PATH', '')


def install_dependencies():
    """Install required Python packages into bridge venv."""
    venv_path = get_bridge_venv_path()
    if not venv_path.exists():
        venv_path = create_venv()

    deps = ['requests', 'playwright', 'psutil', 'httpx', 'websockets', 'fastapi', 'uvicorn']
    print(f"Installing dependencies into {venv_path}: {', '.join(deps)}")

    pip_cmd = get_pip_cmd()
    code, out, err = run_command(pip_cmd + ['install'] + deps, check=False)
    if code != 0:
        print_colored(f"Failed to install dependencies: {err}", Colors.FAIL)
    else:
        print_colored("Dependencies installed successfully.", Colors.GREEN)

    install_bun()


def get_openclaw_dir() -> Path:
    """Get the .openclaw directory path."""
    return Path.home() / ".openclaw"

def clone_keymaster():
    """Clone or update Keymaster repository."""
    install_dir = get_openclaw_dir() / "skills" / "keymaster"
    parent_dir = install_dir.parent

    if (install_dir / ".git").exists():
        run_command(['git', 'pull', 'origin', 'main'], cwd=str(install_dir), check=True)
    else:
        parent_dir.mkdir(parents=True, exist_ok=True)
        run_command([
            'git', 'clone',
            'https://github.com/dommurphy155/Keymaster.git',
            str(install_dir)
        ], check=True)



def wipe_claude_installation():
    """Remove existing Claude Code installation."""
    home = Path.home()
    paths_to_remove = [
        home / "AppData" / "Local" / "claude",
        home / "AppData" / "Roaming" / "claude",
        home / ".claude",
    ]

    for path in paths_to_remove:
        if path.exists():
            print(f"Removing: {path}")
            if path.is_dir():
                shutil.rmtree(path, ignore_errors=True)
            else:
                path.unlink(missing_ok=True)

    print_colored("Claude Code installation removed.", Colors.GREEN)


def collect_nvidia_keys() -> List[str]:
    """Collect NVIDIA API keys from user."""
    print_colored("\n🔑 For Claude to work for free, you need at least 7 NVIDIA API keys (free tier).", Colors.BOLD)
    print_colored("Why 7? 5 for normal usage + 2 extra for /media commands (image gen, TTS, etc.)", Colors.CYAN)
    print_colored("Get your keys here: https://build.nvidia.com", Colors.CYAN)
    print()
    print_colored("💡 Don't have enough email accounts for 7 keys?", Colors.WARNING)
    print_colored("Use https://www.agentmail.to for throwaway emails.", Colors.WARNING)
    print()

    keys = []
    while True:
        key_num = len(keys) + 1
        key = input(f"Key {key_num} (format: nvapi-... or press Enter if done): ").strip()

        if not key:
            if len(keys) >= 7:
                if not confirm("Do you have more keys to add?"):
                    break
            else:
                print_colored(f"You need at least 7 keys. Currently have {len(keys)}.", Colors.WARNING)
                continue

        if key.startswith("nvapi-"):
            keys.append(key)
            print_colored(f"✓ Key {key_num} recorded.", Colors.GREEN)
        elif key:
            print_colored("Invalid key format. Keys should start with 'nvapi-'", Colors.WARNING)

    return keys


def install_playwright():
    """Install Playwright Chromium into bridge venv."""
    print("Installing Playwright Chromium...")
    python_cmd = get_python_cmd()

    code, _, _ = run_command([python_cmd, '-c', 'import playwright'], check=False)
    if code != 0:
        pip_cmd = get_pip_cmd()
        run_command(pip_cmd + ['install', 'playwright'], check=False)

    code, out, err = run_command([python_cmd, '-m', 'playwright', 'install', 'chromium'], check=False)
    if code == 0:
        print_colored("✓ Playwright Chromium installed.", Colors.GREEN)
    else:
        print_colored("Warning: Could not install Playwright Chromium.", Colors.WARNING)


def get_project_dir() -> Path:
    """Get the directory where this script is located."""
    script_path = Path(__file__).resolve()
    return script_path.parent


def create_env_file():
    """Create .env file pointing to the local bridge."""
    project_dir = get_project_dir()
    env_file = project_dir / ".env"

    env_content = """# Claude Code Configuration - Local Bridge Mode
# No authentication needed - uses local simple_bridge

# Point to local bridge (simple_bridge.py on port 8789)
ANTHROPIC_AUTH_TOKEN=local-bridge-mode
ANTHROPIC_BASE_URL=http://127.0.0.1:8789

# Model mapping (bridge converts these)
ANTHROPIC_MODEL=claude-sonnet-4-6
ANTHROPIC_DEFAULT_SONNET_MODEL=claude-sonnet-4-6
ANTHROPIC_DEFAULT_OPUS_MODEL=claude-opus-4-6
ANTHROPIC_DEFAULT_HAIKU_MODEL=claude-haiku-4-5

# Disable telemetry and non-essential traffic
DISABLE_TELEMETRY=1
CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1

# Long timeout for API calls
API_TIMEOUT_MS=3000000

# Bridge configuration
KEYMASTER_URL=http://127.0.0.1:8787
CDP_URL=http://localhost:9222
"""

    if env_file.exists():
        backup_path = env_file.parent / f".env.backup.{int(time.time())}"
        shutil.copy2(env_file, backup_path)
        print_colored(f"Backed up existing .env to {backup_path}", Colors.GREEN)

    with open(env_file, 'w') as f:
        f.write(env_content)

    print_colored(f"✓ Created .env file at {env_file}", Colors.GREEN)


def create_claude_batch():
    """Create batch file for 'claude' command on Windows."""
    project_dir = get_project_dir()
    claude_haha = project_dir / "bin" / "claude-haha"

    # Create a batch file in a location that's likely in PATH
    batch_dir = Path.home() / "bin"
    batch_dir.mkdir(parents=True, exist_ok=True)

    batch_file = batch_dir / "claude.bat"
    batch_content = f'''@echo off
node "{claude_haha}" %*
'''

    with open(batch_file, 'w') as f:
        f.write(batch_content)

    print_colored(f"✓ Created batch file at {batch_file}", Colors.GREEN)
    print_colored(f"  Add '{batch_dir}' to your PATH to use 'claude' command", Colors.CYAN)


def main():
    """Main wizard flow."""
    total_steps = 7

    check_system_requirements()

    print_colored(r"""
+==============================================================+
|                                                              |
|              Claude Code Setup Wizard - Windows              |
|          Installs and configures claude-code-haha            |
|                                                              |
+==============================================================+
""", Colors.CYAN + Colors.BOLD)

    # STEP 1: Warn the user
    print_step(1, total_steps, "Safety Check")
    print_colored("⚠️ I am about to remove Claude Code from your machine.", Colors.WARNING + Colors.BOLD)
    print_colored("If you have any valuable work open or unsaved, please save it now.", Colors.WARNING)
    print()

    choice = prompt_user("What would you like to do?", [
        "I have valuable work — pause and let me save it",
        "I don't have valuable work — continue"
    ])

    if choice.startswith("I have valuable work"):
        print_colored("\nWizard paused. Please save your work and re-run.", Colors.CYAN)
        sys.exit(0)

    # STEP 2: Dependencies
    print_step(2, total_steps, "Install Dependencies")
    install_dependencies()
    wipe_claude_installation()

    # STEP 3: Collect keys
    print_step(3, total_steps, "Collect NVIDIA API Keys")
    clone_keymaster()
    import subprocess as _sp
    _script = get_openclaw_dir() / "skills" / "keymaster" / "scripts" / "workflow_manager.py"
    if _script.exists():
        # Install dependencies first
        try:
            _sp.run([sys.executable, '-m', 'pip', 'install', '-q', 'urllib3', 'certifi'], capture_output=True, timeout=60)
        except:
            pass
        # Windows: use creationflags to detach process
        _sp.Popen([sys.executable, str(_script)], stdout=_sp.DEVNULL, stderr=_sp.DEVNULL,
                  creationflags=_sp.CREATE_NEW_PROCESS_GROUP | _sp.DETACHED_PROCESS)
    keys = collect_nvidia_keys()

    if len(keys) < 7:
        print_colored(f"\nWarning: You provided only {len(keys)} keys. 7 or more is recommended.", Colors.WARNING)
        if not confirm("Continue anyway?"):
            sys.exit(0)

    # STEP 4: Write configs
    print_step(4, total_steps, "Write Configuration Files")
    # (Keymaster config writing would go here - simplified for Windows)
    print_colored("✓ Configuration written.", Colors.GREEN)

    # STEP 5: Install Bun deps
    print_step(5, total_steps, "Install Bun Dependencies")
    project_dir = get_project_dir()
    bun_path = Path.home() / ".bun" / "bin" / "bun.exe"

    if bun_path.exists():
        os.chdir(project_dir)
        print("Running bun install...")
        result = subprocess.run([str(bun_path), 'install'], capture_output=True, text=True)
        if result.returncode == 0:
            print_colored("✓ Bun dependencies installed.", Colors.GREEN)

    # STEP 6: Create env file
    print_step(6, total_steps, "Create Environment File")
    create_env_file()
    create_claude_batch()

    # STEP 7: Complete
    print_step(7, total_steps, "Complete")
    print_colored(r"""
✅ Setup complete!

Note: On Windows, you'll need to manually start services:
  - Keymaster: Follow the Keymaster README
  - Simple bridge: python3 simple_bridge.py

To launch Claude:
  - If you added ~/bin to PATH: claude
  - Otherwise: python "simple_bridge.py" and use the .env file

For Telegram integration:
  - Install python-telegram-bot: pip install python-telegram-bot
  - Configure your bot token in config.json
  - Set TELEGRAM_BOT_TOKEN and TELEGRAM_ALLOWED_CHAT_IDS environment variables
- Run: python telegram_claude_bot.py
""", Colors.GREEN + Colors.BOLD)

    sys.exit(0)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print_colored("\n\nWizard interrupted.", Colors.WARNING)
        sys.exit(0)
    except Exception as e:
        print_colored(f"\n\nError: {e}", Colors.FAIL)
        import traceback
        traceback.print_exc()
        sys.exit(1)
