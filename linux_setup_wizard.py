#!/usr/bin/env python3
"""
Claude Code Setup Wizard
Installs and configures claude-code-haha with Keymaster, Chrome debug port, and simple_bridge.
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


def check_system_requirements():
    """Check if the system meets minimum requirements."""
    issues = []

    # Check Python version
    if sys.version_info < (3, 8):
        issues.append(f"Python 3.8+ required, found {sys.version_info.major}.{sys.version_info.minor}")

    # Check for Linux
    if not sys.platform.startswith('linux'):
        issues.append(f"This wizard is designed for Linux. Detected: {sys.platform}")

    # Check for systemd
    code, _, _ = run_command(['which', 'systemctl'], check=False)
    if code != 0:
        issues.append("systemd not found - required for service management")

    # Check for curl
    code, _, _ = run_command(['which', 'curl'], check=False)
    if code != 0:
        issues.append("curl not found - required for health checks")

    # Check disk space (need at least 1GB free)
    try:
        stat = shutil.disk_usage(Path.home())
        free_gb = stat.free / (1024**3)
        if free_gb < 1:
            issues.append(f"Low disk space: {free_gb:.1f}GB free (recommend 1GB+)")
    except Exception:
        pass

    if issues:
        print_colored("\n⚠️  System Requirements Issues:", Colors.FAIL + Colors.BOLD)
        for issue in issues:
            print_colored(f"  - {issue}", Colors.FAIL)
        print()
        response = input("Continue anyway? (yes/no): ").strip().lower()
        if response not in ('y', 'yes'):
            sys.exit(1)


def print_colored(text: str, color: str = ""):
    """Print colored text."""
    if color:
        print(f"{color}{text}{Colors.END}")
    else:
        print(text)


def print_step(step_num: int, total: int, description: str):
    """Print a step header."""
    print()
    print_colored(f"{'='*60}", Colors.CYAN)
    print_colored(f"  STEP {step_num}/{total}: {description}", Colors.BOLD + Colors.CYAN)
    print_colored(f"{'='*60}", Colors.CYAN)
    print()


def run_command(cmd: List[str], capture: bool = True, check: bool = True, sudo: bool = False, cwd: str = None) -> Tuple[int, str, str]:
    """Run a shell command and return exit code, stdout, stderr."""
    if sudo and os.geteuid() != 0:
        cmd = ['sudo'] + cmd

    try:
        if capture:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=False,
                cwd=cwd
            )
            return result.returncode, result.stdout, result.stderr
        else:
            result = subprocess.run(cmd, check=check, cwd=cwd)
            return result.returncode, "", ""
    except Exception as e:
        return 1, "", str(e)


def prompt_user(message: str, options: List[str] = None) -> str:
    """Prompt user for input with optional predefined options."""
    print()
    if options:
        print_colored(message, Colors.CYAN)
        for i, opt in enumerate(options, 1):
            print(f"  [{i}] {opt}")
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
    for path in ["/usr/bin/pip3", "/usr/local/bin/pip3", "/usr/bin/pip", "/usr/local/bin/pip"]:
        if os.path.exists(path):
            return path
    return None


def find_system_python() -> str:
    """Find system Python executable."""
    python_cmd = shutil.which("python3") or shutil.which("python")
    if python_cmd:
        return python_cmd
    # Try common locations
    for path in ["/usr/bin/python3", "/usr/local/bin/python3", "/usr/bin/python"]:
        if os.path.exists(path):
            return path
    return sys.executable  # Fallback to current Python


# Store the venv path we decide to use (set during install_dependencies)
_BRIDGE_VENV_PATH: Optional[Path] = None


def get_bridge_venv_path() -> Path:
    """Get the virtual environment path for the bridge.

    This is where bridge dependencies (playwright, fastapi, etc) are installed.
    Uses ~/.claude-code-haha/venv by default for consistency.
    """
    global _BRIDGE_VENV_PATH
    if _BRIDGE_VENV_PATH:
        return _BRIDGE_VENV_PATH

    # Use a dedicated venv for claude-code-haha to avoid conflicts
    # Use the real user's home, not root's when using sudo
    venv_path = get_real_home() / ".claude-code-haha" / "venv"
    return venv_path


def set_bridge_venv_path(path: Path):
    """Set the bridge venv path after creation."""
    global _BRIDGE_VENV_PATH
    _BRIDGE_VENV_PATH = path


def get_venv_path() -> Optional[Path]:
    """Get Python virtual environment path (legacy - prefer get_bridge_venv_path).

    Checks in order:
    1. Bridge venv (~/.claude-code-haha/venv)
    2. Active virtual environment (VIRTUAL_ENV env var)
    3. Existing ~/.venv
    4. Returns None if none exist
    """
    # Prefer the dedicated bridge venv
    bridge_venv = get_bridge_venv_path()
    if bridge_venv.exists():
        return bridge_venv

    # Check for active virtual environment
    venv_env = os.environ.get("VIRTUAL_ENV")
    if venv_env and os.path.exists(venv_env):
        return Path(venv_env)

    # Check for ~/.venv in real home
    home_venv = get_real_home() / ".venv"
    if home_venv.exists():
        return home_venv

    return None


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

    # Try different venv creation methods
    methods = [
        # Method 1: Standard venv
        ([python, "-m", "venv", str(venv_path)], "standard venv"),
        # Method 2: venv without pip (sometimes works when standard fails)
        ([python, "-m", "venv", str(venv_path), "--without-pip"], "venv without pip"),
    ]

    # Method 3: Try virtualenv if available
    virtualenv_cmd = shutil.which("virtualenv")
    if virtualenv_cmd:
        methods.append(([virtualenv_cmd, "-p", python, str(venv_path)], "virtualenv"))

    for cmd, desc in methods:
        print(f"  Trying {desc}...")
        code, out, err = run_command(cmd, check=False)
        if code == 0:
            print_colored(f"✓ Created venv using {desc}", Colors.GREEN)
            set_bridge_venv_path(venv_path)
            return venv_path
        else:
            print_colored(f"  {desc} failed: {err[:100] if err else 'unknown error'}", Colors.WARNING)

    # All methods failed - check common issues
    print_colored("\n⚠️ Virtual environment creation failed.", Colors.FAIL)

    # Check if python3-venv is installed (Debian/Ubuntu)
    code, _, _ = run_command(["dpkg", "-l", "python3-venv"], check=False)
    if code != 0 and os.path.exists("/usr/bin/apt-get"):
        print_colored("\n💡 Missing python3-venv package. Try:", Colors.CYAN)
        print_colored("   sudo apt-get update && sudo apt-get install -y python3-venv", Colors.CYAN)

    # Check if ensurepip is available
    code, _, _ = run_command([python, "-c", "import ensurepip"], check=False)
    if code != 0:
        print_colored("\n💡 Python ensurepip module not available.", Colors.CYAN)
        print_colored("   Your Python may be a minimal install without venv support.", Colors.CYAN)

    # Offer fallback to system python
    print_colored("\n🔄 Fallback option: Use system Python without venv?", Colors.WARNING)
    response = input("Continue with system Python? (yes/no): ").strip().lower()
    if response in ('y', 'yes'):
        print_colored("Using system Python. Some isolation features may not work.", Colors.WARNING)
        # Return a dummy path that signals "use system python"
        return None

    sys.exit(1)


def get_venv_python(venv_path: Optional[Path] = None) -> Optional[Path]:
    """Get the Python executable path in the virtual environment."""
    if venv_path is None:
        venv_path = get_bridge_venv_path()
    # Handle fallback to system python (venv_path is None)
    if venv_path is None:
        return Path(find_system_python())
    if not venv_path.exists():
        return None
    if os.name == 'nt':
        return venv_path / "Scripts" / "python.exe"
    return venv_path / "bin" / "python"


def get_venv_pip(venv_path: Optional[Path] = None) -> Optional[Path]:
    """Get the pip executable path in the virtual environment."""
    if venv_path is None:
        venv_path = get_bridge_venv_path()
    if not venv_path.exists():
        return None
    if os.name == 'nt':
        pip_path = venv_path / "Scripts" / "pip.exe"
    else:
        pip_path = venv_path / "bin" / "pip"
    return pip_path if pip_path.exists() else None


def get_pip_cmd() -> List[str]:
    """Get pip command as list, preferring venv pip but falling back to system."""
    # Always use the bridge venv for consistency
    venv_path = get_bridge_venv_path()
    if not venv_path.exists():
        create_venv()

    venv_pip = get_venv_pip(venv_path)
    if venv_pip:
        return [str(venv_pip)]

    # Try venv python -m pip
    venv_python = get_venv_python(venv_path)
    if venv_python:
        return [str(venv_python), "-m", "pip"]

    # Fall back to system pip
    system_pip = find_system_pip()
    if system_pip:
        return [system_pip]

    # Last resort: system python -m pip
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
    """Get the Keymaster virtual environment path.

    Keymaster uses its own isolated venv at ~/.openclaw/keymaster_venv
    """
    return get_real_home() / ".openclaw" / "keymaster_venv"


def get_keymaster_python() -> str:
    """Get the Python executable for Keymaster.

    Keymaster uses its own venv. Returns the path if it exists,
    otherwise falls back to system python.
    """
    venv_path = get_keymaster_venv_path()
    if os.name == 'nt':
        python_path = venv_path / "Scripts" / "python.exe"
    else:
        python_path = venv_path / "bin" / "python"

    if python_path.exists():
        return str(python_path)
    return find_system_python()


def install_bun():
    """Install Bun if not already installed."""
    home = get_real_home()
    bun_path = home / ".bun" / "bin" / "bun"

    # Check if bun is already in PATH
    bun_in_path = shutil.which('bun')
    if bun_in_path:
        print_colored(f"Bun already in PATH at {bun_in_path}", Colors.GREEN)
        return

    if bun_path.exists():
        print_colored(f"Bun already installed at {bun_path}", Colors.GREEN)
        # Add to PATH for current session
        bun_bin = str(home / ".bun" / "bin")
        os.environ['PATH'] = bun_bin + os.pathsep + os.environ.get('PATH', '')
        return

    print("Installing Bun...")

    # Detect package manager and install unzip/curl if needed
    has_apt = os.path.exists('/usr/bin/apt-get')
    has_yum = os.path.exists('/usr/bin/yum')
    has_dnf = os.path.exists('/usr/bin/dnf')
    has_pacman = os.path.exists('/usr/bin/pacman')

    if has_apt:
        run_command(['apt-get', 'update'], sudo=True, check=False)
        run_command(['apt-get', 'install', '-y', 'unzip', 'curl'], sudo=True, check=False)
    elif has_dnf:
        run_command(['dnf', 'install', '-y', 'unzip', 'curl'], sudo=True, check=False)
    elif has_yum:
        run_command(['yum', 'install', '-y', 'unzip', 'curl'], sudo=True, check=False)
    elif has_pacman:
        run_command(['pacman', '-S', '--noconfirm', 'unzip', 'curl'], sudo=True, check=False)

    # Install Bun
    install_cmd = 'curl -fsSL https://bun.sh/install | bash'
    result = subprocess.run(install_cmd, shell=True, capture_output=True, text=True)

    if result.returncode != 0:
        print_colored(f"Failed to install Bun: {result.stderr}", Colors.FAIL)
        print_colored("You may need to install Bun manually from https://bun.sh", Colors.WARNING)
        return

    print_colored("Bun installed successfully.", Colors.GREEN)

    # Add to PATH for current session
    bun_bin = str(home / ".bun" / "bin")
    os.environ['PATH'] = bun_bin + os.pathsep + os.environ.get('PATH', '')

    # Add to shell profiles in real home
    home = get_real_home()
    shell_profiles = [
        home / ".bashrc",
        home / ".zshrc",
        home / ".profile",
    ]

    path_export = f'\n# Bun\nexport PATH="$HOME/.bun/bin:$PATH"\n'

    for profile in shell_profiles:
        if profile.exists():
            with open(profile, 'r') as f:
                content = f.read()
            if '.bun/bin' not in content:
                with open(profile, 'a') as f:
                    f.write(path_export)
                print(f"Added Bun to PATH in {profile}")

    print_colored("Bun added to PATH. Run 'source ~/.bashrc' or restart your shell.", Colors.GREEN)


def get_openclaw_dir() -> Path:
    """Get the .openclaw directory path."""
    return get_real_home() / ".openclaw"


def install_dependencies():
    """Install required Python packages into bridge venv."""
    # Ensure we have the bridge venv
    venv_path = get_bridge_venv_path()
    if venv_path is None:
        # Using system python fallback
        print_colored("Using system Python (no venv isolation)", Colors.WARNING)
        venv_path = None
    elif not venv_path.exists():
        venv_path = create_venv()
        if venv_path is None:
            print_colored("Using system Python (venv creation failed)", Colors.WARNING)

    deps = ['requests', 'playwright', 'psutil', 'httpx', 'websockets', 'fastapi', 'uvicorn']

    if venv_path:
        print(f"Installing dependencies into {venv_path}: {', '.join(deps)}")
    else:
        print(f"Installing dependencies into system Python: {', '.join(deps)}")

    pip_cmd = get_pip_cmd()
    code, out, err = run_command(pip_cmd + ['install'] + deps, check=False)
    if code != 0:
        print_colored(f"Failed to install dependencies: {err}", Colors.FAIL)
        print_colored("Continuing anyway, some features may not work...", Colors.WARNING)
    else:
        print_colored("Dependencies installed successfully.", Colors.GREEN)

    # Install Bun
    install_bun()

    # Verify Bun is in PATH
    bun_check = shutil.which('bun')
    if not bun_check:
        # Try the default location
        bun_path = Path.home() / ".bun" / "bin" / "bun"
        if bun_path.exists():
            os.environ['PATH'] = str(bun_path.parent) + os.pathsep + os.environ.get('PATH', '')
            print_colored(f"Using Bun from {bun_path}", Colors.GREEN)
        else:
            print_colored("Warning: Bun not found in PATH after installation", Colors.WARNING)


def wipe_claude_installation():
    """Remove existing Claude Code installation."""
    home = get_real_home()
    paths_to_remove = [
        home / ".local" / "bin" / "claude",
        home / ".local" / "share" / "claude",
        home / ".claude",
        home / ".config" / "claude",
        home / ".cache" / "claude",
    ]

    for path in paths_to_remove:
        if path.exists():
            print(f"Removing: {path}")
            if path.is_dir():
                shutil.rmtree(path, ignore_errors=True)
            else:
                path.unlink(missing_ok=True)

    # Verify removal
    remaining = [p for p in paths_to_remove if p.exists()]
    if remaining:
        print_colored(f"Warning: Could not remove: {remaining}", Colors.WARNING)
    else:
        print_colored("Claude Code installation removed.", Colors.GREEN)


def check_keymaster_exists() -> bool:
    """Check if Keymaster is already installed."""
    keymaster_dir = get_openclaw_dir() / "skills" / "keymaster"
    return (keymaster_dir / ".git").exists()


def check_keymaster_health() -> bool:
    """Check if Keymaster service is healthy using curl."""
    code, out, _ = run_command(['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}',
                                 'http://127.0.0.1:8787/health'], check=False)
    return code == 0 and out.strip() == "200"


def check_auth_profiles() -> Tuple[bool, int]:
    """Check if auth profiles exist and have API keys."""
    auth_file = get_openclaw_dir() / "agents" / "main" / "agent" / "auth-profiles.json"
    if not auth_file.exists():
        return False, 0

    try:
        with open(auth_file) as f:
            data = json.load(f)
        profiles = data.get("profiles", {})
        api_keys = [p for p in profiles.values() if p.get("type") == "api_key"]
        return len(api_keys) > 0, len(api_keys)
    except:
        return False, 0


def is_systemd_service_active(service_name: str) -> bool:
    """Check if a systemd service is active."""
    # For template services with @, don't use sudo; for non-template, may need sudo
    cmd = ['systemctl', 'is-active', service_name]
    code, out, _ = run_command(cmd, check=False)
    # Some systems return exit code 0 with "active\n", others might have different output
    return code == 0 and ('active' in out.lower() or out.strip() == 'active')


def clone_keymaster():
    """Clone or update Keymaster repository."""
    install_dir = get_openclaw_dir() / "skills" / "keymaster"
    parent_dir = install_dir.parent

    if (install_dir / ".git").exists():
        print("Updating existing Keymaster...")
        run_command(['git', 'pull', 'origin', 'main'], cwd=str(install_dir), check=True)
    else:
        parent_dir.mkdir(parents=True, exist_ok=True)
        run_command([
            'git', 'clone',
            'https://github.com/dommurphy155/Keymaster.git',
            str(install_dir)
        ], check=True)


def collect_nvidia_keys() -> List[str]:
    """Collect NVIDIA API keys from user."""
    print_colored("\n🔑 For Claude to work for free, you need at least 7 NVIDIA API keys (free tier).", Colors.BOLD)
    print_colored("Why 7? 5 for normal usage + 2 extra for /media commands (image gen, TTS, etc.)", Colors.CYAN)
    print_colored("Get your keys here: https://build.nvidia.com", Colors.CYAN)
    print()
    print_colored("💡 Don't have enough email accounts for 7 keys?", Colors.WARNING)
    print_colored("Use https://www.agentmail.to for throwaway emails.", Colors.WARNING)
    print_colored("(Free plan allows 3 inboxes at once - delete your existing 3 and create 3 more as needed.)", Colors.WARNING)
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


def backup_openclaw_config():
    """Backup existing openclaw.json if it exists."""
    config_path = get_openclaw_dir() / "openclaw.json"
    if config_path.exists():
        backup_path = config_path.parent / f"openclaw.json.backup.{int(time.time())}"
        shutil.copy2(config_path, backup_path)
        print_colored(f"Backed up existing config to: {backup_path}", Colors.GREEN)
        return backup_path
    return None


def merge_openclaw_config(keys: List[str]):
    """Merge Keymaster configuration into openclaw.json."""
    config_path = get_openclaw_dir() / "openclaw.json"
    config_path.parent.mkdir(parents=True, exist_ok=True)

    # Build auth profiles config
    auth_config = {
        "profiles": {},
        "order": {"nvidia": []}
    }
    profile_names = ["nvidia:primary", "nvidia:secondary", "nvidia:tertiary",
                     "nvidia:quaternary", "nvidia:quinary", "nvidia:senary",
                     "nvidia:septenary"][:len(keys)]

    for i, name in enumerate(profile_names[:len(keys)]):
        auth_config["profiles"][name] = {"provider": "nvidia", "mode": "api_key"}
        auth_config["order"]["nvidia"].append(name)

    # Build models config
    models_config = {"mode": "merge", "providers": {}}
    for i, key in enumerate(keys, 1):
        models_config["providers"][f"nvidia-key-{i}"] = {
            "baseUrl": "http://127.0.0.1:8787",
            "apiKey": key,
            "api": "openai-completions",
            "models": [{
                "id": "nvidia/nemotron-3-super-120b-a12b",
                "name": "Nemotron 3 Super",
                "reasoning": False,
                "input": ["text"],
                "cost": {"input": 0.000002, "output": 0.000008, "cacheRead": 0, "cacheWrite": 0},
                "contextWindow": 256000,
                "maxTokens": 16384
            }]
        }

    # Build agents config
    primary_model = f"nvidia-key-1/nvidia/nemotron-3-super-120b-a12b"
    fallbacks = [f"nvidia-key-{i}/nvidia/nemotron-3-super-120b-a12b" for i in range(2, len(keys) + 1)]

    models_aliases = {}
    for i in range(1, len(keys) + 1):
        models_aliases[f"nvidia-key-{i}/nvidia/nemotron-3-super-120b-a12b"] = {
            "alias": f"Nemotron 3 Super (Key {i})"
        }

    agents_config = {
        "defaults": {
            "model": {
                "primary": primary_model,
                "fallbacks": fallbacks
            },
            "models": models_aliases,
            "bootstrapMaxChars": 20000,
            "bootstrapTotalMaxChars": 150000,
            "compaction": {
                "mode": "safeguard",
                "reserveTokensFloor": 20000,
                "memoryFlush": {
                    "enabled": True,
                    "softThresholdTokens": 4000,
                    "systemPrompt": "Session nearing compaction. Store durable memories now.",
                    "prompt": "Write any lasting notes to memory/YYYY-MM-DD.md; reply with NO_REPLY if nothing to store."
                }
            },
            "timeoutSeconds": 86400,
            "maxConcurrent": 3,
            "subagents": {"maxConcurrent": 2}
        }
    }

    # Build tools config
    tools_config = {
        "profile": "full",
        "web": {
            "search": {"enabled": True},
            "fetch": {"enabled": True}
        },
        "loopDetection": {
            "enabled": True,
            "warningThreshold": 10,
            "criticalThreshold": 20,
            "globalCircuitBreakerThreshold": 30,
            "historySize": 30,
            "detectors": {
                "genericRepeat": True,
                "knownPollNoProgress": True,
                "pingPong": True
            }
        },
        "exec": {
            "backgroundMs": 10000,
            "timeoutSec": 86400,
            "cleanupMs": 1800000,
            "notifyOnExit": True,
            "notifyOnExitEmptySuccess": False,
            "applyPatch": {
                "enabled": True,
                "allowModels": ["nvidia/nemotron-3-super-120b-a12b:free"]
            }
        }
    }

    # Load existing config or create new
    if config_path.exists():
        with open(config_path) as f:
            existing = json.load(f)
    else:
        existing = {}

    # Merge configurations
    existing["auth"] = auth_config
    existing["models"] = models_config
    existing["agents"] = agents_config
    existing["tools"] = tools_config

    # Write merged config
    with open(config_path, 'w') as f:
        json.dump(existing, f, indent=2)

    print_colored(f"✓ Configuration written to: {config_path}", Colors.GREEN)


def write_auth_profiles(keys: List[str]):
    """Write auth-profiles.json with NVIDIA keys."""
    auth_dir = get_openclaw_dir() / "agents" / "main" / "agent"
    auth_dir.mkdir(parents=True, exist_ok=True)

    profile_names = ["nvidia:primary", "nvidia:secondary", "nvidia:tertiary",
                     "nvidia:quaternary", "nvidia:quinary", "nvidia:senary",
                     "nvidia:septenary"][:len(keys)]
    roles = ["coordinator", "strategist", "heavy_lifter", "worker", "fixer", "media_1", "media_2"]
    agent_mappings = ["main", "charlie", "echo", "alpha", "delta", "foxtrot", "golf"]

    profiles = {}
    for i, key in enumerate(keys):
        name = profile_names[i] if i < len(profile_names) else f"nvidia:key_{i+1}"
        role = roles[i] if i < len(roles) else "worker"
        agent_map = agent_mappings[i] if i < len(agent_mappings) else "worker"

        # Build fallback chain
        fallback_chain = []
        for j in range(len(keys)):
            if j != i:
                fallback_chain.append(profile_names[j] if j < len(profile_names) else f"nvidia:key_{j+1}")

        fallback_to = fallback_chain[0] if fallback_chain else ""

        profiles[name] = {
            "type": "api_key",
            "provider": f"nvidia-key-{i+1}",
            "key": key,
            "priority": i + 1,
            "coordinator_priority": i + 1,
            "is_primary_coordinator": (i == 0),
            "can_act_as_coordinator": (i < 2),
            "role": role,
            "agent_mapping": agent_map,
            "model": "nvidia/nemotron-3-super-120b-a12b",
            "fallback_to": fallback_to,
            "fallback_chain": fallback_chain
        }

    auth_data = {
        "version": 1,
        "profiles": profiles,
        "lastGood": {"nvidia": "nvidia:primary"},
        "usageStats": {},
        "keymaster": {
            "enabled": True,
            "auto_rotation": True,
            "context_compaction": True,
            "compaction_threshold": 0.8,
            "cooldown_seconds": 60,
            "max_retries_per_key": 3,
            "state_persistence": True,
            "parallel_tool_calls": False,
            "timeout_seconds": 86400,
            "max_concurrent": 3
        }
    }

    auth_file = auth_dir / "auth-profiles.json"
    with open(auth_file, 'w') as f:
        json.dump(auth_data, f, indent=2)

    print_colored(f"✓ Auth profiles written to: {auth_file}", Colors.GREEN)


def get_keymaster_service_name() -> str:
    """Get the systemd service name for Keymaster.

    For root user, uses openclaw-keymaster-root (non-template service)
    For other users, uses openclaw-keymaster@{user} (template service)
    """
    user = get_current_user()
    if user == "root":
        return "openclaw-keymaster-root"
    return f"openclaw-keymaster@{user}"


def get_keymaster_logs(lines: int = 50) -> str:
    """Get Keymaster service logs."""
    service_name = get_keymaster_service_name()
    # Root user can check logs without sudo, others may need sudo
    use_sudo = (get_current_user() != "root")
    code, out, err = run_command(
        ['journalctl', '-u', service_name, '-n', str(lines), '--no-pager'],
        sudo=use_sudo, check=False
    )
    return out or err or "No logs available"


def diagnose_keymaster_failure() -> Tuple[bool, str, List[str]]:
    """Diagnose why Keymaster failed to start.

    Returns: (can_fix, reason, fix_commands)
    """
    logs = get_keymaster_logs(100).lower()
    service_name = get_keymaster_service_name()

    # Check common failure patterns
    if "permission denied" in logs:
        return True, "Permission denied - service file may need reinstall", [
            "systemctl daemon-reload",
            f"systemctl enable {service_name}",
        ]

    if "venv" in logs or "virtualenv" in logs or "no such file" in logs:
        # Venv issue - reinstall
        return True, "Virtual environment missing or corrupted", [
            "Reinstall Keymaster dependencies",
        ]

    if "auth-profiles.json" in logs or "no api keys" in logs:
        return False, "No API keys configured in auth-profiles.json", []

    if "address already in use" in logs or "port 8787" in logs:
        # Port in use - maybe already running?
        return True, "Port 8787 already in use", [
            "systemctl stop keymaster || true",
            "pkill -f keymaster || true",
        ]

    if "module not found" in logs or "importerror" in logs:
        return True, "Python dependencies missing", [
            "Reinstall Keymaster dependencies",
        ]

    if logs.count("\n") < 5:
        # No logs - service might not be configured
        return True, "Service not configured or failed early", [
            "Reinstall service file",
        ]

    return False, f"Unknown failure - check logs:\n{get_keymaster_logs(30)}", []


def reinstall_keymaster_service():
    """Reinstall Keymaster systemd service manually."""
    keymaster_dir = get_openclaw_dir() / "skills" / "keymaster"
    user = get_current_user()
    home = str(get_real_home())
    venv_dir = get_keymaster_venv_path()

    if user == "root":
        # Use non-template service for root
        service_file = keymaster_dir / "systemd" / "openclaw-keymaster@.service"
        custom_service = f"""[Unit]
Description=OpenClaw Keymaster API Key Rotation Service (root)
After=network.target

[Service]
Type=simple
User=root
Environment="HOME={home}"
Environment="KEYMASTER_DIR={home}/.openclaw/skills/keymaster"
Environment="VENV_DIR={venv_dir}"
WorkingDirectory={home}/.openclaw/skills/keymaster
ExecStart={venv_dir}/bin/python {home}/.openclaw/skills/keymaster/proxy/unified_server.py
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
"""
        service_name = "openclaw-keymaster-root.service"
    else:
        # Use template service for non-root
        service_file = keymaster_dir / "systemd" / "openclaw-keymaster@.service"
        custom_service = f"""[Unit]
Description=OpenClaw Keymaster API Key Rotation Service for %i
After=network.target

[Service]
Type=simple
User=%i
Environment="HOME={home}"
Environment="KEYMASTER_DIR={home}/.openclaw/skills/keymaster"
Environment="VENV_DIR={venv_dir}"
WorkingDirectory={home}/.openclaw/skills/keymaster
ExecStart={venv_dir}/bin/python {home}/.openclaw/skills/keymaster/proxy/unified_server.py
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
"""
        service_name = "openclaw-keymaster@.service"

    if not service_file.exists():
        print_colored(f"Service file not found at {service_file}", Colors.WARNING)
        return False

    with open(f"/tmp/{service_name}", "w") as f:
        f.write(custom_service)

    run_command(['cp', f'/tmp/{service_name}',
                f'/etc/systemd/system/{service_name}'], sudo=True, check=False)
    run_command(['systemctl', 'daemon-reload'], sudo=True, check=False)
    return True


def start_keymaster_manual() -> bool:
    """Start Keymaster manually (fallback if systemd fails)."""
    keymaster_dir = get_openclaw_dir() / "skills" / "keymaster"
    venv_python = get_keymaster_venv_path() / "bin" / "python"
    server_script = keymaster_dir / "proxy" / "unified_server.py"

    if not server_script.exists():
        print_colored(f"Server script not found: {server_script}", Colors.FAIL)
        return False

    python_cmd = str(venv_python) if venv_python.exists() else "python3"

    # Start in background
    print("Starting Keymaster manually...")
    try:
        import subprocess
        subprocess.Popen(
            [python_cmd, str(server_script)],
            cwd=str(keymaster_dir),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            start_new_session=True
        )
        time.sleep(3)
        return check_keymaster_health()
    except Exception as e:
        print_colored(f"Failed to start manually: {e}", Colors.FAIL)
        return False


def install_keymaster():
    """Run Keymaster installer with error handling."""
    keymaster_dir = get_openclaw_dir() / "skills" / "keymaster"
    install_script = keymaster_dir / "install.sh"
    venv_path = get_keymaster_venv_path()

    # Check if Keymaster is already installed and working
    if check_keymaster_health():
        print_colored("Keymaster is already running, skipping install.", Colors.GREEN)
        return

    # Check if venv exists and is valid - if not, we need to set it up
    venv_python = venv_path / "bin" / "python"
    needs_setup = not venv_python.exists()

    if needs_setup and keymaster_dir.exists():
        print_colored("Keymaster found but virtual environment missing. Setting up...", Colors.WARNING)
    elif not keymaster_dir.exists():
        print_colored("Keymaster not found. Should have been cloned in step 4.", Colors.FAIL)
        return

    # Create venv if needed
    if needs_setup:
        print(f"Creating Keymaster virtual environment at {venv_path}...")
        venv_path.parent.mkdir(parents=True, exist_ok=True)
        code, _, err = run_command([find_system_python(), '-m', 'venv', str(venv_path)], check=False)
        if code != 0:
            print_colored(f"Failed to create venv: {err}", Colors.FAIL)
            return
        print_colored("✓ Virtual environment created.", Colors.GREEN)

    # Install/update dependencies
    pip = venv_path / "bin" / "pip"
    if pip.exists():
        print("Installing Keymaster dependencies...")
        deps = ['fastapi', 'uvicorn', 'httpx', 'requests', 'aiohttp', 'websockets', 'psutil']
        run_command([str(pip), 'install'] + deps, check=False)
        print_colored("✓ Dependencies installed.", Colors.GREEN)

    # Run install script if it exists (for service file setup)
    if install_script.exists():
        print("Running Keymaster install script...")
        code, out, err = run_command(
            ['bash', str(install_script)],
            cwd=str(keymaster_dir),
            check=False,
            capture=True
        )
        if code != 0:
            print_colored(f"Install script had issues: {err}", Colors.WARNING)
            print("Continuing with manual service setup...")

    # Ensure service file exists
    reinstall_keymaster_service()


def start_keymaster_service_with_retry(max_retries: int = 3) -> bool:
    """Start Keymaster service with auto-retry and diagnostics."""
    service_name = get_keymaster_service_name()
    user = get_current_user()
    use_sudo = (user != "root")

    for attempt in range(max_retries):
        print(f"Attempt {attempt + 1}/{max_retries}: Starting Keymaster...")

        # Try keymaster command first
        code, _, _ = run_command(['which', 'keymaster'], check=False)
        if code == 0:
            run_command(['keymaster', 'start'], check=False)
        else:
            # Try systemd directly
            run_command(['systemctl', 'start', service_name], sudo=use_sudo, check=False)

        time.sleep(3)

        if check_keymaster_health():
            return True

        # Diagnose and attempt fix
        print_colored("Service failed to start. Diagnosing...", Colors.WARNING)
        can_fix, reason, fixes = diagnose_keymaster_failure()
        print_colored(f"Issue: {reason}", Colors.WARNING)

        if can_fix and attempt < max_retries - 1:
            print("Applying fixes...")
            for fix in fixes:
                if "Reinstall" in fix:
                    reinstall_keymaster_service()
                elif "port" in fix.lower():
                    # Kill anything on port 8787
                    run_command(['fuser', '-k', '8787/tcp'], sudo=use_sudo, check=False)

            time.sleep(2)
        else:
            # Show logs for debugging
            print("\n--- Keymaster Logs ---")
            print(get_keymaster_logs(30))
            print("--- End Logs ---\n")

    # Final fallback: try manual start
    print_colored("Systemd failed. Trying manual start...", Colors.WARNING)
    if start_keymaster_manual():
        return True

    return False


def start_keymaster_service():
    """Start Keymaster systemd service."""
    # Deprecated - use start_keymaster_service_with_retry
    start_keymaster_service_with_retry()


def wait_for_keymaster_health(timeout: int = 60) -> bool:
    """Wait for Keymaster to become healthy."""
    print("Waiting for Keymaster to become healthy...")
    for _ in range(timeout):
        if check_keymaster_health():
            return True
        time.sleep(1)
    return False


def install_chrome() -> str:
    """Install Chrome or Chromium. Returns the executable name."""
    print("Installing Chrome/Chromium...")

    # Detect package manager
    has_apt = os.path.exists('/usr/bin/apt-get')
    has_yum = os.path.exists('/usr/bin/yum')
    has_dnf = os.path.exists('/usr/bin/dnf')
    has_pacman = os.path.exists('/usr/bin/pacman')

    # Check if Chrome is already installed
    chrome_paths = [
        "/usr/bin/google-chrome-stable",
        "/usr/bin/google-chrome",
        "/usr/bin/chromium",
        "/usr/bin/chromium-browser",
        "/usr/local/bin/google-chrome",
    ]
    for path in chrome_paths:
        if os.path.exists(path):
            print_colored(f"✓ Chrome already installed at {path}.", Colors.GREEN)
            return os.path.basename(path)

    # Try to install Chrome
    installed = False

    if has_apt:
        # Debian/Ubuntu
        # First, try to add Chrome repo if not present
        if not os.path.exists('/etc/apt/sources.list.d/google-chrome.list'):
            run_command(['apt-get', 'update'], sudo=True, check=False)
            run_command(['apt-get', 'install', '-y', 'wget', 'gnupg'], sudo=True, check=False)
            run_command(['wget', '-q', '-O', '-', 'https://dl.google.com/linux/linux_signing_key.pub',
                        '|', 'apt-key', 'add', '-'], sudo=True, check=False, capture=False)
            with open('/tmp/google-chrome.list', 'w') as f:
                f.write('deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main\n')
            run_command(['cp', '/tmp/google-chrome.list', '/etc/apt/sources.list.d/'], sudo=True, check=False)
            run_command(['apt-get', 'update'], sudo=True, check=False)

        code, _, _ = run_command(['apt-get', 'install', '-y', 'google-chrome-stable'], sudo=True, check=False)
        if code == 0:
            installed = True
            print_colored("✓ Google Chrome installed.", Colors.GREEN)
            return "google-chrome-stable"

        # Fallback to Chromium
        code, _, _ = run_command(['apt-get', 'install', '-y', 'chromium-browser'], sudo=True, check=False)
        if code == 0:
            installed = True
            print_colored("✓ Chromium installed.", Colors.GREEN)
            return "chromium-browser"

        code, _, _ = run_command(['apt-get', 'install', '-y', 'chromium'], sudo=True, check=False)
        if code == 0:
            installed = True
            print_colored("✓ Chromium installed.", Colors.GREEN)
            return "chromium"

    elif has_dnf:
        # Fedora
        code, _, _ = run_command(['dnf', 'install', '-y', 'google-chrome-stable'], sudo=True, check=False)
        if code == 0:
            installed = True
            print_colored("✓ Google Chrome installed.", Colors.GREEN)
            return "google-chrome-stable"

        code, _, _ = run_command(['dnf', 'install', '-y', 'chromium'], sudo=True, check=False)
        if code == 0:
            installed = True
            print_colored("✓ Chromium installed.", Colors.GREEN)
            return "chromium"

    elif has_yum:
        # CentOS/RHEL
        code, _, _ = run_command(['yum', 'install', '-y', 'chromium'], sudo=True, check=False)
        if code == 0:
            installed = True
            print_colored("✓ Chromium installed.", Colors.GREEN)
            return "chromium"

    elif has_pacman:
        # Arch
        code, _, _ = run_command(['pacman', '-S', '--noconfirm', 'chromium'], sudo=True, check=False)
        if code == 0:
            installed = True
            print_colored("✓ Chromium installed.", Colors.GREEN)
            return "chromium"

    if not installed:
        print_colored("Warning: Could not install Chrome or Chromium automatically.", Colors.WARNING)
        print("Please install Chrome manually:")
        print("  Ubuntu/Debian: sudo apt-get install google-chrome-stable")
        print("  Fedora: sudo dnf install google-chrome-stable")
        print("  CentOS: sudo yum install chromium")
        print("  Arch: sudo pacman -S chromium")

    return "google-chrome"  # Default to google-chrome anyway


def install_playwright():
    """Install Playwright Chromium into bridge venv."""
    print("Installing Playwright Chromium...")
    pip_cmd = get_pip_cmd()
    python_cmd = get_python_cmd()

    # Ensure playwright is installed
    code, _, _ = run_command([python_cmd, '-c', 'import playwright'], check=False)
    if code != 0:
        run_command(pip_cmd + ['install', 'playwright'], check=False)

    # Install Chromium browser
    code, out, err = run_command([python_cmd, '-m', 'playwright', 'install', 'chromium'], check=False)
    if code == 0:
        print_colored("✓ Playwright Chromium installed.", Colors.GREEN)
    else:
        print_colored("Warning: Could not install Playwright Chromium.", Colors.WARNING)
        print("You may need to install system dependencies manually.")


def get_bridge_python_for_service() -> str:
    """Get the Python path for systemd service (must be absolute)."""
    python_path = get_venv_python(get_bridge_venv_path())
    if python_path and python_path.exists():
        return str(python_path)
    # Fall back to system python
    return find_system_python()


def get_current_user() -> str:
    """Get the current username.

    Returns the actual user (not root when using sudo) for service files.
    """
    # If SUDO_USER is set, we're running with sudo - return the original user
    sudo_user = os.environ.get('SUDO_USER')
    if sudo_user:
        return sudo_user
    # Otherwise return current user
    return os.environ.get('USER') or os.environ.get('USERNAME') or 'root'


def get_real_home() -> Path:
    """Get the real home directory, even when using sudo.

    When using sudo, Path.home() returns /root, but we need the actual user's home.
    """
    # Try to get home from SUDO_USER first
    sudo_user = os.environ.get('SUDO_USER')
    if sudo_user:
        # Look up the user's home from /etc/passwd
        try:
            import pwd
            user_info = pwd.getpwnam(sudo_user)
            return Path(user_info.pw_dir)
        except (KeyError, ImportError):
            pass
        # Fallback: construct from SUDO_USER
        if sudo_user == 'root':
            return Path('/root')
        return Path(f'/home/{sudo_user}')

    # Otherwise use standard home
    return Path.home()


def get_project_dir() -> Path:
    """Get the directory where this script is located.

    This is the claude-code-haha directory, which could be anywhere.
    """
    # Get the directory of this script
    script_path = Path(__file__).resolve()
    return script_path.parent


def get_home_dir_for(user: str) -> Path:
    """Get the home directory for a specific user."""
    if user == 'root':
        return Path('/root')
    # Try to look up from /etc/passwd
    try:
        import pwd
        user_info = pwd.getpwnam(user)
        return Path(user_info.pw_dir)
    except (KeyError, ImportError):
        pass
    # Fallback
    return Path(f'/home/{user}')


def get_chrome_logs(lines: int = 20) -> str:
    """Get Chrome service logs."""
    use_sudo = (get_current_user() != "root")
    code, out, err = run_command(
        ['journalctl', '-u', 'chrome-debug', '-n', str(lines), '--no-pager'],
        sudo=use_sudo, check=False
    )
    return out or err or "No logs available"


def check_chrome_health() -> bool:
    """Check if Chrome debug port is responding using curl."""
    code, out, _ = run_command(['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}',
                                 'http://127.0.0.1:9222/json/version'], check=False)
    return code == 0 and out.strip() == "200"


def create_chrome_service(chrome_binary: str, max_retries: int = 3) -> bool:
    """Create and start Chrome debug systemd service with retry."""
    user = get_current_user()
    home = str(Path.home())

    # Check if Chrome is already running on port 9222
    if check_chrome_health():
        print_colored("Chrome debug service is already running on port 9222.", Colors.GREEN)
        return True

    # Find chrome executable path
    chrome_paths = [
        f"/usr/bin/{chrome_binary}",
        f"/usr/local/bin/{chrome_binary}",
        shutil.which(chrome_binary) or f"/usr/bin/{chrome_binary}",
        "/usr/bin/google-chrome-stable",  # Common Ubuntu path
        "/usr/bin/google-chrome",
        "/usr/bin/chromium",
        "/usr/bin/chromium-browser",
    ]
    chrome_path = None
    for path in chrome_paths:
        if path and os.path.exists(path):
            chrome_path = path
            break

    if not chrome_path:
        print_colored(f"Error: Could not find {chrome_binary} executable", Colors.FAIL)
        return False

    print_colored(f"Using Chrome at: {chrome_path}", Colors.CYAN)

    # Build Chrome flags
    chrome_flags = [
        "--remote-debugging-port=9222",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-gpu",
        "--headless=new",  # Use new headless mode
        "--disable-dev-shm-usage",
        "--disable-software-rasterizer",
        "--disable-extensions",
        "--disable-default-apps",
        "--disable-background-networking",
        "--disable-background-timer-throttling",
        "--force-color-profile=srgb",
        "--window-size=1920,1080",
    ]

    # Add --no-sandbox for root user (required)
    if user == "root":
        chrome_flags.append("--no-sandbox")

    flags_str = " ".join(chrome_flags)

    service_content = f"""[Unit]
Description=Chrome Remote Debugging on port 9222
After=network.target

[Service]
Type=simple
User={user}
Environment="HOME={home}"
Environment="DISPLAY=:1"
ExecStart={chrome_path} {flags_str} about:blank
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
"""

    for attempt in range(max_retries):
        print(f"Attempt {attempt + 1}/{max_retries}: Starting Chrome debug service...")

        service_path = Path("/etc/systemd/system/chrome-debug.service")

        # Write service file
        with open("/tmp/chrome-debug.service", 'w') as f:
            f.write(service_content)

        run_command(['cp', '/tmp/chrome-debug.service', str(service_path)], sudo=True, check=False)
        run_command(['systemctl', 'daemon-reload'], sudo=True, check=False)
        run_command(['systemctl', 'enable', 'chrome-debug'], sudo=True, check=False)

        # Stop any existing instance
        run_command(['systemctl', 'stop', 'chrome-debug'], sudo=True, check=False)
        time.sleep(1)

        # Kill any existing chrome processes
        run_command(['pkill', '-f', 'chrome.*9222'], sudo=True, check=False)
        time.sleep(1)

        # Start fresh
        run_command(['systemctl', 'start', 'chrome-debug'], sudo=True, check=False)

        # Wait and verify
        time.sleep(3)

        if check_chrome_health():
            print_colored("✓ Chrome debug service is running on port 9222.", Colors.GREEN)
            return True

        print_colored("Chrome failed to start. Checking logs...", Colors.WARNING)
        logs = get_chrome_logs(20)
        print(logs)

        if attempt < max_retries - 1:
            print("Retrying...")
            time.sleep(2)

    print_colored("Error: Chrome debug service failed to start after all attempts", Colors.FAIL)
    print()
    print("Common fixes:")
    print("  - Install Chrome manually: sudo apt-get install google-chrome-stable")
    print("  - Check port 9222 is free: sudo lsof -i :9222")
    print("  - Check logs: sudo journalctl -u chrome-debug -f")
    print()

    if confirm("Continue anyway? (Bridge may not work without Chrome)"):
        print_colored("Continuing without Chrome...", Colors.WARNING)
        return False
    else:
        sys.exit(1)


def get_bridge_logs(lines: int = 30) -> str:
    """Get bridge service logs."""
    use_sudo = (get_current_user() != "root")
    code, out, err = run_command(
        ['journalctl', '-u', 'simple-bridge', '-n', str(lines), '--no-pager'],
        sudo=use_sudo, check=False
    )
    return out or err or "No logs available"


def diagnose_bridge_failure() -> Tuple[bool, str, List[str]]:
    """Diagnose why bridge failed to start.

    Returns: (can_fix, reason, fix_commands)
    """
    logs = get_bridge_logs(50).lower()

    if "permission denied" in logs:
        return True, "Permission denied on script", ["chmod +x on bridge script"]

    if "no module named" in logs or "importerror" in logs:
        return True, "Python dependencies missing in bridge venv", ["reinstall deps"]

    if "address already in use" in logs or "port 8789" in logs:
        return True, "Port 8789 already in use", ["kill process on port"]

    if "connection refused" in logs or "keymaster" in logs:
        return True, "Cannot connect to Keymaster", ["check keymaster"]

    if "chrome" in logs or "cdp" in logs or "port 9222" in logs:
        return True, "Cannot connect to Chrome debug port", ["check chrome"]

    return False, f"Unknown failure: {logs[:500]}", []


def reinstall_bridge_service():
    """Reinstall bridge service with fresh config."""
    user = get_current_user()
    home = get_real_home()
    project_dir = get_project_dir()
    python_cmd = get_bridge_python_for_service()
    bridge_script = project_dir / "simple_bridge.py"
    use_sudo = (user != "root")

    project_dir_str = str(project_dir)
    service_content = f"""[Unit]
Description=Claude Code Simple Bridge
After=network.target chrome-debug.service
Wants=chrome-debug.service

[Service]
Type=simple
User={user}
Environment="HOME={home}"
Environment="KEYMASTER_URL=http://127.0.0.1:8787"
Environment="CDP_URL=http://localhost:9222"
WorkingDirectory={project_dir_str}
ExecStart={python_cmd} {bridge_script}
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
"""

    with open("/tmp/simple-bridge.service", 'w') as f:
        f.write(service_content)

    run_command(['cp', '/tmp/simple-bridge.service',
                '/etc/systemd/system/simple-bridge.service'], sudo=use_sudo, check=False)
    run_command(['systemctl', 'daemon-reload'], sudo=use_sudo, check=False)
    run_command(['systemctl', 'enable', 'simple-bridge'], sudo=use_sudo, check=False)


def start_bridge_manual() -> bool:
    """Start bridge manually as fallback."""
    project_dir = get_project_dir()
    python_cmd = get_python_cmd()
    bridge_script = project_dir / "simple_bridge.py"

    print("Starting bridge manually...")
    try:
        import subprocess
        env = os.environ.copy()
        env['KEYMASTER_URL'] = 'http://127.0.0.1:8787'
        env['CDP_URL'] = 'http://localhost:9222'

        subprocess.Popen(
            [python_cmd, str(bridge_script)],
            cwd=str(project_dir),
            env=env,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            start_new_session=True
        )
        time.sleep(3)
        return check_bridge_health()
    except Exception as e:
        print_colored(f"Manual start failed: {e}", Colors.FAIL)
        return False


def create_bridge_service_with_retry(max_retries: int = 3) -> bool:
    """Create and start bridge service with retry logic."""
    user = get_current_user()
    project_dir = get_project_dir()
    python_cmd = get_bridge_python_for_service()
    bridge_script = project_dir / "simple_bridge.py"
    use_sudo = (user != "root")

    print(f"Using Python for bridge service: {python_cmd}")

    # Verify paths exist
    if not bridge_script.exists():
        print_colored(f"Error: Bridge script not found at {bridge_script}", Colors.FAIL)
        return False

    # Ensure bridge script is executable
    os.chmod(bridge_script, 0o755)

    # Check if already running
    if check_bridge_health():
        print_colored("Bridge is already running and healthy.", Colors.GREEN)
        return True

    for attempt in range(max_retries):
        print(f"Attempt {attempt + 1}/{max_retries}: Starting bridge...")

        reinstall_bridge_service()

        # Stop any existing instance
        run_command(['systemctl', 'stop', 'simple-bridge'], sudo=use_sudo, check=False)
        time.sleep(1)

        # Kill anything on port 8789
        run_command(['fuser', '-k', '8789/tcp'], sudo=use_sudo, check=False)
        time.sleep(1)

        # Start fresh
        run_command(['systemctl', 'start', 'simple-bridge'], sudo=use_sudo, check=False)

        # Wait and verify with health check
        print("Waiting for bridge to start...")
        time.sleep(3)

        for health_attempt in range(5):
            if check_bridge_health():
                print_colored("✓ Simple bridge service is running and responding.", Colors.GREEN)
                return True
            time.sleep(2)

        # Diagnose failure
        print_colored("Bridge failed to start. Diagnosing...", Colors.WARNING)
        can_fix, reason, fixes = diagnose_bridge_failure()
        print_colored(f"Issue: {reason}", Colors.WARNING)

        if can_fix and attempt < max_retries - 1:
            print("Applying fixes...")
            for fix in fixes:
                if "reinstall deps" in fix:
                    install_dependencies()
                elif "kill process" in fix:
                    run_command(['fuser', '-k', '8789/tcp'], sudo=use_sudo, check=False)
                elif "check keymaster" in fix:
                    if not check_keymaster_health():
                        print_colored("Keymaster not running! Starting it...", Colors.WARNING)
                        start_keymaster_service_with_retry()
                elif "check chrome" in fix:
                    run_command(['systemctl', 'restart', 'chrome-debug'], sudo=use_sudo, check=False)
            time.sleep(2)
        else:
            print("\n--- Bridge Logs ---")
            print(get_bridge_logs(30))
            print("--- End Logs ---\n")

    # Final fallback: manual start
    print_colored("Systemd failed. Trying manual start...", Colors.WARNING)
    if start_bridge_manual():
        return True

    return False


def create_bridge_service():
    """Create and start simple_bridge systemd service.

    Deprecated: use create_bridge_service_with_retry
    """
    if not create_bridge_service_with_retry():
        print_colored("\n" + "="*60, Colors.FAIL)
        print_colored("Bridge failed to start after all attempts.", Colors.FAIL + Colors.BOLD)
        print_colored("="*60, Colors.FAIL)
        print()
        print("Logs from last attempt:")
        print("-" * 40)
        print(get_bridge_logs(50))
        print("-" * 40)
        print()

        if confirm("Continue anyway? (Claude will not work without the bridge)"):
            print_colored("Continuing without bridge...", Colors.WARNING)
        else:
            sys.exit(1)


def test_api_connection() -> bool:
    """Test end-to-end API connection through bridge and keymaster using curl."""
    # Create a temp file for the JSON payload
    import tempfile
    payload = json.dumps({
        "model": "claude-sonnet-4-6",
        "messages": [{"role": "user", "content": "Say hello"}],
        "max_tokens": 10
    })

    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        f.write(payload)
        temp_path = f.name

    try:
        # Test a simple message (Anthropic API format via bridge)
        code, out, err = run_command([
            'curl', '-s', '-X', 'POST',
            'http://127.0.0.1:8789/v1/messages',
            '-H', 'Content-Type: application/json',
            '-d', f'@{temp_path}',
            '-m', '30'
        ], check=False)

        if code == 0 and out.strip():
            try:
                data = json.loads(out)
                if "content" in data:
                    print(f"  ✓ API response received")
                    return True
                else:
                    print(f"  ✗ API response missing 'content': {list(data.keys())}")
                    return False
            except json.JSONDecodeError:
                print(f"  ✗ API returned invalid JSON: {out[:200]}")
                return False
        else:
            print(f"  ✗ API test failed: {err[:200] if err else 'no response'}")
            return False
    except Exception as e:
        print(f"  ✗ API test failed: {e}")
        return False
    finally:
        try:
            os.unlink(temp_path)
        except:
            pass


def check_bridge_health() -> bool:
    """Check if bridge is responding using curl."""
    code, out, _ = run_command(['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}',
                                 'http://127.0.0.1:8789/health'], check=False)
    return code == 0 and out.strip() == "200"


def create_claude_symlink():
    """Create symlink for 'claude' command in ~/.local/bin."""
    home = Path.home()
    local_bin = home / ".local" / "bin"
    claude_haha = home / "claude-code-haha" / "bin" / "claude-haha"
    claude_link = local_bin / "claude"

    # Create ~/.local/bin if it doesn't exist
    local_bin.mkdir(parents=True, exist_ok=True)

    # Remove existing symlink if it exists
    if claude_link.is_symlink():
        claude_link.unlink()

    # Create the symlink
    if claude_haha.exists():
        claude_link.symlink_to(claude_haha)
        print_colored(f"✓ Created 'claude' command at {claude_link}", Colors.GREEN)

        # Add ~/.local/bin to PATH if not already there
        shell_profiles = [
            home / ".bashrc",
            home / ".zshrc",
            home / ".profile",
        ]

        path_export = '\n# Local bin\nexport PATH="$HOME/.local/bin:$PATH"\n'

        for profile in shell_profiles:
            if profile.exists():
                with open(profile, 'r') as f:
                    content = f.read()
                if '.local/bin' not in content:
                    with open(profile, 'a') as f:
                        f.write(path_export)

        # Add to current PATH
        os.environ['PATH'] = str(local_bin) + os.pathsep + os.environ.get('PATH', '')
    else:
        print_colored(f"Warning: Could not find claude-haha at {claude_haha}", Colors.WARNING)


def create_env_file():
    """Create .env file pointing to the local bridge."""
    home = Path.home()
    project_dir = home / "claude-code-haha"
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

    # Backup existing .env if it exists
    if env_file.exists():
        backup_path = env_file.parent / f".env.backup.{int(time.time())}"
        shutil.copy2(env_file, backup_path)
        print_colored(f"Backed up existing .env to {backup_path}", Colors.GREEN)

    with open(env_file, 'w') as f:
        f.write(env_content)

    print_colored(f"✓ Created .env file at {env_file}", Colors.GREEN)


def detect_vps_environment():
    """Detect if running in a VPS/container environment."""
    indicators = []

    # Check for common VPS indicators
    if os.path.exists('/proc/1/cgroup'):
        with open('/proc/1/cgroup', 'r') as f:
            cgroup_content = f.read().lower()
            if any(x in cgroup_content for x in ['docker', 'lxc', 'containerd', 'kubepods']):
                indicators.append('container')

    # Check for cloud providers
    if os.path.exists('/sys/class/dmi/id/product_name'):
        with open('/sys/class/dmi/id/product_name', 'r') as f:
            product = f.read().lower()
            if any(x in product for x in ['amazon', 'google', 'azure', 'alibaba', 'tencent']):
                indicators.append('cloud_vm')

    # Check for limited resources
    try:
        with open('/proc/meminfo', 'r') as f:
            mem_content = f.read()
            for line in mem_content.split('\n'):
                if line.startswith('MemTotal:'):
                    mem_kb = int(line.split()[1])
                    if mem_kb < 2 * 1024 * 1024:  # Less than 2GB
                        indicators.append('low_memory')
    except:
        pass

    return indicators


def get_platform() -> str:
    """Detect the current platform."""
    if sys.platform.startswith('win'):
        return 'windows'
    elif sys.platform.startswith('darwin'):
        return 'macos'
    elif sys.platform.startswith('linux'):
        return 'linux'
    return 'unknown'


def is_systemd_available() -> bool:
    """Check if systemd is available (Linux only)."""
    if get_platform() != 'linux':
        return False
    code, _, _ = run_command(['which', 'systemctl'], check=False)
    return code == 0


def setup_telegram_bridge() -> bool:
    """Set up Telegram bridge as optional feature."""
    print_colored("\n📱 Telegram Bridge Setup (Optional)", Colors.CYAN + Colors.BOLD)
    print_colored("This lets you talk to Claude directly through Telegram.", Colors.CYAN)
    print()
    print("To set up:")
    print("  1. Message @BotFather on Telegram and create a new bot")
    print("  2. Copy the bot token (looks like: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz)")
    print("  3. Add the bot to a group chat and send a message")
    print("  4. Get your chat ID from: https://api.telegram.org/bot<TOKEN>/getUpdates")
    print()

    if not confirm("Set up Telegram bridge now?"):
        print_colored("Skipping Telegram setup.", Colors.WARNING)
        return False

    # Get bot token
    bot_token = input("Bot token: ").strip()
    if not bot_token or ':' not in bot_token:
        print_colored("Invalid token format. Skipping.", Colors.WARNING)
        return False

    # Get chat ID
    chat_id_input = input("Chat ID (can be negative for groups, e.g., -123456789): ").strip()
    try:
        chat_id = int(chat_id_input)
    except ValueError:
        print_colored("Invalid chat ID. Skipping.", Colors.WARNING)
        return False

    # Save to secure config
    config_dir = get_real_home() / ".config" / "claude-telegram"
    config_dir.mkdir(parents=True, exist_ok=True)

    config_file = config_dir / "config.json"
    config = {
        "bot_token": bot_token,
        "chat_id": chat_id,
        "enabled": True
    }

    with open(config_file, 'w') as f:
        json.dump(config, f, indent=2)

    # Set restrictive permissions (owner read/write only)
    os.chmod(config_file, 0o600)

    print_colored(f"✓ Telegram config saved to {config_file}", Colors.GREEN)

    # Create a simple bridge script wrapper
    project_dir = get_project_dir()
    bridge_script = project_dir / "telegram_claude_bot.py"

    if bridge_script.exists():
        print_colored(f"✓ Telegram bot script found at {bridge_script}", Colors.GREEN)
    else:
        print_colored("⚠ Telegram bot script not found. You'll need to create it manually.", Colors.WARNING)

    # Platform-specific service setup
    platform = get_platform()

    if platform == 'linux' and is_systemd_available():
        _create_telegram_systemd_service(config_file)
    elif platform == 'macos':
        _create_telegram_launchd_service(config_file)
    elif platform == 'windows':
        print_colored("Windows service setup not automated. To run manually:", Colors.WARNING)
        print(f"  python3 {bridge_script}")
    else:
        print_colored("Service auto-setup not available for this platform.", Colors.WARNING)
        print(f"To run manually: python3 {bridge_script}")

    print()
    print_colored("🎉 You can now talk to Claude through Telegram!", Colors.GREEN + Colors.BOLD)
    print(f"   - Bot token saved securely")
    print(f"   - Messages will be forwarded to Claude via the bridge")
    print(f"   - Check your Telegram group to start chatting")

    return True


def _create_telegram_systemd_service(config_file: Path):
    """Create systemd service for Telegram bot (Linux)."""
    user = get_current_user()
    project_dir = get_project_dir()
    python_cmd = get_python_cmd()
    bridge_script = project_dir / "telegram_claude_bot.py"

    service_content = f"""[Unit]
Description=Claude Telegram Bot
After=network.target simple-bridge.service
Wants=simple-bridge.service

[Service]
Type=simple
User={user}
Environment="HOME={get_real_home()}"
Environment="TELEGRAM_BOT_TOKEN={config_file}"
WorkingDirectory={project_dir}
ExecStart={python_cmd} {bridge_script}
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
"""

    service_name = "claude-telegram-bot"
    service_path = Path(f"/etc/systemd/system/{service_name}.service")

    try:
        with open(f"/tmp/{service_name}.service", 'w') as f:
            f.write(service_content)

        run_command(['cp', f'/tmp/{service_name}.service', str(service_path)],
                   sudo=True, check=False)
        run_command(['systemctl', 'daemon-reload'], sudo=True, check=False)
        run_command(['systemctl', 'enable', service_name], sudo=True, check=False)
        run_command(['systemctl', 'start', service_name], sudo=True, check=False)

        print_colored(f"✓ Systemd service created: {service_name}", Colors.GREEN)
        print_colored("  Manage with: sudo systemctl [start|stop|status] claude-telegram-bot", Colors.CYAN)
    except Exception as e:
        print_colored(f"⚠ Could not create systemd service: {e}", Colors.WARNING)


def _create_telegram_launchd_service(config_file: Path):
    """Create launchd service for Telegram bridge (macOS)."""
    user = get_current_user()
    project_dir = get_project_dir()
    python_cmd = get_python_cmd()
    bridge_script = project_dir / "telegram_claude_bot.py"

    plist_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.claude.telegram-bridge</string>
    <key>ProgramArguments</key>
    <array>
        <string>{python_cmd}</string>
        <string>{bridge_script}</string>
    </array>
    <key>WorkingDirectory</key>
    <string>{project_dir}</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>CONFIG_FILE</key>
        <string>{config_file}</string>
    </dict>
    <key>KeepAlive</key>
    <true/>
    <key>RunAtLoad</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/claude-telegram-bot.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/claude-telegram-bot.error</string>
</dict>
</plist>
"""

    launchd_dir = Path.home() / "Library" / "LaunchAgents"
    launchd_dir.mkdir(parents=True, exist_ok=True)
    plist_path = launchd_dir / "com.claude.telegram-bridge.plist"

    try:
        with open(plist_path, 'w') as f:
            f.write(plist_content)

        run_command(['launchctl', 'load', str(plist_path)], check=False)
        run_command(['launchctl', 'start', 'com.claude.telegram-bridge'], check=False)

        print_colored(f"✓ LaunchAgent created: {plist_path}", Colors.GREEN)
        print_colored("  Manage with: launchctl [start|stop] com.claude.telegram-bridge", Colors.CYAN)
    except Exception as e:
        print_colored(f"⚠ Could not create launchd service: {e}", Colors.WARNING)


def check_system_requirements():
    """Check if the system meets minimum requirements."""
    issues = []
    platform = get_platform()

    # Check Python version
    if sys.version_info < (3, 8):
        issues.append(f"Python 3.8+ required, found {sys.version_info.major}.{sys.version_info.minor}")

    # Platform-specific checks
    if platform == 'linux':
        # Check for systemd (optional on Linux)
        code, _, _ = run_command(['which', 'systemctl'], check=False)
        if code != 0:
            issues.append("systemd not found - services will need manual startup")
    elif platform == 'macos':
        # macOS checks
        pass
    elif platform == 'windows':
        issues.append("Windows support is experimental - some features may not work")
    else:
        issues.append(f"Unknown platform: {platform} - your mileage may vary")

    # Check for curl
    code, _, _ = run_command(['which', 'curl'], check=False)
    if code != 0:
        issues.append("curl not found - health checks will be limited")

    # Check disk space (need at least 1GB free)
    try:
        stat = shutil.disk_usage(Path.home())
        free_gb = stat.free / (1024**3)
        if free_gb < 1:
            issues.append(f"Low disk space: {free_gb:.1f}GB free (recommend 1GB+)")
    except Exception:
        pass

    if issues:
        print_colored("\n⚠️ System Requirements Issues:", Colors.FAIL + Colors.BOLD)
        for issue in issues:
            print_colored(f" - {issue}", Colors.FAIL)
        print()
        response = input("Continue anyway? (yes/no): ").strip().lower()
        if response not in ('y', 'yes'):
            sys.exit(1)


def main():
    """Main wizard flow."""
    platform = get_platform()
    total_steps = 9 if platform == 'linux' else 8  # Extra step for Telegram on Linux

    # Check system requirements first
    check_system_requirements()

    # Detect VPS environment
    vps_env = detect_vps_environment()
    if vps_env:
        print_colored(f"\nℹ️  Detected environment: {', '.join(vps_env)}", Colors.CYAN)
        if 'container' in vps_env:
            print_colored("Running in a container - some features may need special configuration.", Colors.WARNING)
        if 'low_memory' in vps_env:
            print_colored("Low memory detected - consider using swap or upgrading your VPS.", Colors.WARNING)

    # Print welcome banner
    print_colored("""
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║         Claude Code Setup Wizard                             ║
    ║         Installs and configures claude-code-haha             ║
    ║                                                              ║
    ║         Works on: Ubuntu, Debian, Fedora, CentOS, Arch       ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
    """, Colors.CYAN + Colors.BOLD)

    # STEP 1: Warn the user
    print_step(1, total_steps, "Safety Check")
    print_colored("⚠️  I am about to remove Claude Code from your machine.", Colors.WARNING + Colors.BOLD)
    print_colored("If you have any valuable work open or unsaved, please save it now before continuing.", Colors.WARNING)
    print()

    choice = prompt_user("What would you like to do?", [
        "I have valuable work — pause and let me save it",
        "I don't have valuable work — continue"
    ])

    if choice.startswith("I have valuable work"):
        print_colored("\nWizard paused. Please save your work and re-run this wizard when ready.", Colors.CYAN)
        script_path = Path(__file__).resolve()
        print_colored(f"Command to re-run: python3 {script_path}", Colors.CYAN)
        sys.exit(0)

    # STEP 2: Python venv and wipe Claude
    print_step(2, total_steps, "Install Dependencies & Remove Existing Claude")
    install_dependencies()
    print()
    wipe_claude_installation()

    # STEP 3: Check for existing Keymaster
    keymaster_exists = check_keymaster_exists()
    has_auth, key_count = check_auth_profiles()

    skip_to_step_6 = False

    if keymaster_exists and has_auth:
        print_colored(f"Keymaster installation found with {key_count} API keys.", Colors.GREEN)

        # Check if service is running
        user = get_current_user()
        service_name = get_keymaster_service_name()

        if is_systemd_service_active(service_name) or check_keymaster_health():
            print_colored("Keymaster is already running and healthy.", Colors.GREEN)
            skip_to_step_6 = True
        else:
            print_colored("Keymaster found but not running. Attempting to start...", Colors.WARNING)
            if start_keymaster_service_with_retry(max_retries=2):
                print_colored("Keymaster is now running and healthy.", Colors.GREEN)
                skip_to_step_6 = True
            else:
                print_colored("Could not auto-start existing Keymaster. Will reconfigure.", Colors.WARNING)

    keys = []
    if not skip_to_step_6:
        # STEP 4: Clone Keymaster and collect keys
        print_step(4, total_steps, " Collect API Keys For Rotation")
        clone_keymaster()
        import subprocess as sp
        sp.Popen(
            [sys.executable, str(get_openclaw_dir() / "skills" / "keymaster" / "scripts" / "workflow_manager.py")],
            stdout=sp.DEVNULL,
            stderr=sp.DEVNULL,
            start_new_session=True
        )
        print()
        keys = collect_nvidia_keys()

        if len(keys) < 5:
            print_colored(f"\nWarning: You provided only {len(keys)} keys. 5 or more is recommended.", Colors.WARNING)
            if not confirm("Continue anyway?"):
                sys.exit(0)

        # STEP 4c: Write configurations
        print_step(4, total_steps, "Write Configuration Files")
        backup_openclaw_config()
        merge_openclaw_config(keys)
        write_auth_profiles(keys)

        # STEP 5: Install and start Keymaster
        print_step(5, total_steps, "Install & Start Keymaster")
        install_keymaster()

        # Try to start with retry and auto-fix
        if not start_keymaster_service_with_retry(max_retries=3):
            print_colored("\n" + "="*60, Colors.FAIL)
            print_colored("Keymaster failed to start after all attempts.", Colors.FAIL + Colors.BOLD)
            print_colored("="*60, Colors.FAIL)
            print()
            print("The wizard has tried the following:")
            print("  1. Start via systemd service")
            print("  2. Diagnose and auto-fix common issues")
            print("  3. Reinstall service file if needed")
            print("  4. Manual fallback start")
            print()
            print("Logs from last attempt:")
            print("-" * 40)
            print(get_keymaster_logs(50))
            print("-" * 40)
            print()
            print("Common fixes to try manually:")
            print("  - Check auth-profiles.json has valid NVIDIA keys")
            print("  - Ensure port 8787 is not in use: lsof -i :8787")
            print("  - Try: keymaster stop && keymaster start")
            print("  - Check: journalctl -u openclaw-keymaster@$USER -f")
            print()

            if confirm("Continue anyway? (Claude will not work without Keymaster)"):
                print_colored("Continuing without Keymaster...", Colors.WARNING)
            else:
                sys.exit(1)
        else:
            print_colored("✓ Keymaster is healthy and running on port 8787.", Colors.GREEN)

    # STEP 5b: Install Bun dependencies
    print_step(5, total_steps, "Install Bun Dependencies")
    home = get_real_home()
    project_dir = get_project_dir()
    bun_path = home / ".bun" / "bin" / "bun"

    if bun_path.exists():
        os.chdir(project_dir)
        print("Running bun install...")
        result = subprocess.run([str(bun_path), 'install'], capture_output=True, text=True)
        if result.returncode == 0:
            print_colored("✓ Bun dependencies installed.", Colors.GREEN)
        else:
            print_colored(f"Warning: bun install had issues: {result.stderr}", Colors.WARNING)
    else:
        print_colored("Warning: Bun not found, skipping bun install", Colors.WARNING)

    # STEP 6: Install Chrome
    print_step(6, total_steps, "Install Chrome & Start Debug Port")
    chrome_binary = install_chrome()
    install_playwright()
    create_chrome_service(chrome_binary)

    # STEP 7: Start simple_bridge
    print_step(7, total_steps, "Start Simple Bridge Service")
    create_bridge_service()

    if check_bridge_health():
        print_colored("✓ Simple bridge is responding on port 8789.", Colors.GREEN)
    else:
        print_colored("Warning: Bridge may not be fully ready yet.", Colors.WARNING)

    # STEP 7b: Test end-to-end API call
    print_step(7, total_steps, "Test API Connection")
    if test_api_connection():
        print_colored("✓ API connection test passed.", Colors.GREEN)
    else:
        print_colored("Warning: API test failed. Claude may not work properly.", Colors.WARNING)

    # STEP 8: Final message and launch
    print_step(8, total_steps, "Complete & Launch Claude")

    # Create .env file for local bridge
    create_env_file()

    # Create claude symlink
    create_claude_symlink()

    # Final status check
    print_colored("\n" + "="*60, Colors.CYAN)
    print_colored("FINAL STATUS CHECK", Colors.BOLD + Colors.CYAN)
    print_colored("="*60, Colors.CYAN)

    services_ok = True

    # Check Keymaster
    if check_keymaster_health():
        print_colored("✓ Keymaster: Running on port 8787", Colors.GREEN)
    else:
        print_colored("✗ Keymaster: Not responding", Colors.FAIL)
        services_ok = False

    # Check Bridge
    if check_bridge_health():
        print_colored("✓ Bridge: Running on port 8789", Colors.GREEN)
    else:
        print_colored("✗ Bridge: Not responding", Colors.FAIL)
        services_ok = False

    # Check Chrome
    if check_chrome_health():
        print_colored("✓ Chrome: Running on port 9222", Colors.GREEN)
    else:
        print_colored("⚠ Chrome: Not responding (optional)", Colors.WARNING)

    print_colored("="*60, Colors.CYAN)

    if services_ok:
        project_dir = get_project_dir()
        print_colored(f"""
✅ Everything is set up in {project_dir}!

Here's what's now running:

- Keymaster — API key rotation proxy on localhost:8787 with NVIDIA keys
- Chrome — Remote debug port open on 9222 (systemd-managed, always-on)
- simple_bridge.py — Running as a systemd service

Quick Keymaster commands:

- keymaster status — Current status
- keymaster health — Health check
- keymaster keys — List keys
- keymaster logs — Follow logs
- keymaster detailed-log
- keymaster cooldowns — Show rate-limited keys
- keymaster reset — Clear all cooldowns

To launch claude simply run "claude"
""", Colors.GREEN + Colors.BOLD)
    else:
        print_colored("""
⚠️  Setup completed with warnings.

Some services are not running. You can try:
1. Run the wizard again: python3 {get_project_dir() / 'setup_wizard.py'}
2. Check logs manually with: journalctl -u SERVICE_NAME -f
3. Restart services:
   - sudo systemctl restart openclaw-keymaster-root
   - sudo systemctl restart simple-bridge
   - sudo systemctl restart chrome-debug
""", Colors.WARNING + Colors.BOLD)

    sys.exit(0)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print_colored("\n\nWizard interrupted. You can re-run with:", Colors.WARNING)
        script_path = Path(__file__).resolve()
        print_colored(f"  python3 {script_path}", Colors.CYAN)
        sys.exit(0)
    except Exception as e:
        print_colored(f"\n\nError: {e}", Colors.FAIL)
        import traceback
        traceback.print_exc()
        sys.exit(1)
