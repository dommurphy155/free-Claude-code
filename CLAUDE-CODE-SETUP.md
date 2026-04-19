# Claude Code Setup Guide

One-command setup for claude-code-haha on any machine.

## Quick Start

If someone says "set up claude-code-haha on my machine", run these commands:

### 1. Clone the Repository

```bash
git clone https://github.com/dommurphy155/free-Claude-code.git ~/claude-code-haha
cd ~/claude-code-haha
```

### 2. Run the Setup Wizard

**Auto-detect platform:**
```bash
python3 setup.py
```

**Or run platform-specific:**
```bash
# Linux (Ubuntu/Debian/Fedora/CentOS/Arch)
python3 linux_setup_wizard.py

# macOS
python3 mac_setup_wizard.py

# Windows
python windows_setup_wizard.py
```

### 3. What the Wizard Does

The setup wizard will:

1. **Check system requirements** - Python 3.8+, disk space, platform detection
2. **Install dependencies** - Creates Python venv, installs Bun, Python packages
3. **Collect NVIDIA API keys** - Asks for 7 keys (5 base + 2 extra for media commands)
   - Get free keys at: https://build.nvidia.com
   - Use https://www.agentmail.to for throwaway emails
4. **Configure Keymaster** - Sets up API key rotation proxy on port 8787
5. **Install Chrome + Playwright** - For browser automation
6. **Start services** - simple_bridge.py on port 8789, Chrome debug on 9222
7. **Optional: Telegram Bridge** - Message @BotFather, get token, add to group
8. **Create .env file** - Points Claude to local bridge
9. **Create 'claude' command** - Symlink in ~/.local/bin

### 4. Verify Installation

```bash
# Check all services are running
curl -s http://127.0.0.1:8787/health  # Keymaster
curl -s http://127.0.0.1:8789/health  # Bridge
curl -s http://127.0.0.1:9222/json/version  # Chrome

# Launch Claude
claude
```

## Post-Setup Commands

### Keymaster Management

```bash
# Check status
keymaster status
keymaster health
keymaster keys

# View logs
keymaster logs
keymaster detailed-log

# Manage cooldowns
keymaster cooldowns
keymaster reset

# Restart
keymaster stop && keymaster start
```

### Service Management (Linux)

```bash
# systemd services
sudo systemctl status openclaw-keymaster-root
sudo systemctl status simple-bridge
sudo systemctl status chrome-debug

# Restart services
sudo systemctl restart openclaw-keymaster-root
sudo systemctl restart simple-bridge
sudo systemctl restart chrome-debug

# View logs
sudo journalctl -u openclaw-keymaster-root -f
sudo journalctl -u simple-bridge -f
sudo journalctl -u chrome-debug -f
```

### Service Management (macOS)

```bash
# launchd services
launchctl list | grep claude
launchctl start com.claude.telegram-bridge
launchctl stop com.claude.telegram-bridge

# View logs
tail -f /tmp/claude-telegram-bridge.log
```

## Troubleshooting

### "claude: command not found"

```bash
# Reload shell
source ~/.bashrc  # or ~/.zshrc

# Or run directly
~/claude-code-haha/bin/claude-haha
```

### Keymaster not responding

```bash
# Check if running
curl http://127.0.0.1:8787/health

# Check logs
sudo journalctl -u openclaw-keymaster-root -n 50

# Restart
sudo systemctl restart openclaw-keymaster-root
```

### Bridge not responding

```bash
# Check if running
curl http://127.0.0.1:8789/health

# Check logs
sudo journalctl -u simple-bridge -n 50

# Restart
sudo systemctl restart simple-bridge
```

### Chrome not responding

```bash
# Check if running
curl http://127.0.0.1:9222/json/version

# Check logs
sudo journalctl -u chrome-debug -n 50

# Restart
sudo systemctl restart chrome-debug
```

### Telegram bridge issues

```bash
# Check config
cat ~/.config/claude-telegram/config.json

# Check service (Linux)
sudo systemctl status claude-telegram-bridge

# Run manually for debugging
python3 ~/claude-code-haha/telegram_bridge.py
```

### Out of API keys

If you hit rate limits:
1. Get more free keys at https://build.nvidia.com
2. Add them to `~/.openclaw/agents/main/agent/auth-profiles.json`
3. Run `keymaster reset` to clear cooldowns

## Directory Structure After Setup

```
~/claude-code-haha/          # Main repo
├── .env                     # Claude config (points to bridge)
├── linux_setup_wizard.py    # Linux installer
├── mac_setup_wizard.py      # macOS installer
├── windows_setup_wizard.py  # Windows installer
├── setup.py                 # Auto-detector
├── simple_bridge.py         # API bridge
├── telegram_bridge.py       # Telegram bot
└── ...

~/.openclaw/                 # Keymaster config
├── openclaw.json            # Main config
├── agents/main/agent/
│   └── auth-profiles.json   # API keys (7 keys)
└── skills/keymaster/        # Keymaster source

~/.claude-code-haha/         # Bridge venv
└── venv/

~/.config/claude-telegram/   # Telegram config (if enabled)
└── config.json              # Bot token + chat ID
```

## Security Notes

- **API keys** stored in `~/.openclaw/agents/main/agent/auth-profiles.json`
- **Telegram token** stored in `~/.config/claude-telegram/config.json` (permissions 600)
- **Never commit these files** - they're in .gitignore
- **Bridge runs locally** - no external API calls except to NVIDIA

## One-Liner Setup (Advanced)

For automated setup (requires 7 NVIDIA keys in environment):

```bash
export NVIDIA_KEY1="nvapi-..."
export NVIDIA_KEY2="nvapi-..."
# ... keys 3-7
git clone https://github.com/dommurphy155/free-Claude-code.git ~/claude-code-haha && \
cd ~/claude-code-haha && \
python3 setup.py <<< "yes"  # Auto-answer prompts
```

## Need Help?

If the wizard fails:
1. Check the logs it prints at the end
2. Run individual steps manually
3. Check service status with the commands above
4. Re-run the wizard: `python3 setup.py`
