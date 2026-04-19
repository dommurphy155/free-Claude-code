# Using Keymaster with Claude Code

This setup routes Claude Code through Keymaster's NVIDIA key rotation system.

## Architecture

```
Claude Code (port 8789) → Anthropic Bridge → Keymaster (port 8787) → NVIDIA API
         │
         └→ Chrome CDP (port 9222) for web tools
```

## Prerequisites

1. Keymaster is installed and running (`~/.openclaw/skills/keymaster/`)
2. Python 3.10+ with dependencies: `pip install fastapi uvicorn httpx playwright curl_cffi beautifulsoup4`
3. Chrome with remote debugging enabled on port 9222

## Quick Start

### Step 1: Start Keymaster (if not running)

```bash
~/.openclaw/skills/keymaster/keymaster start
```

Verify it's running:
```bash
~/.openclaw/skills/keymaster/keymaster status
```

### Step 2: Start Chrome Debug Port

```bash
# Via systemd service
sudo systemctl start chrome-debug

# Or manually
google-chrome --remote-debugging-port=9222 --headless --no-sandbox --disable-gpu
```

Verify Chrome CDP:
```bash
curl http://localhost:9222/json/version
```

### Step 3: Start the Anthropic Bridge

```bash
# From this directory
python simple_bridge.py
```

The bridge will start on port 8789 and connect to Keymaster on port 8787.

Verify bridge health:
```bash
curl http://127.0.0.1:8789/health
```

### Step 4: Configure Claude Code Environment

The `.env` file should be configured:

```bash
ANTHROPIC_BASE_URL=http://127.0.0.1:8789
ANTHROPIC_AUTH_TOKEN=dummy-keymaster-handles-auth
DISABLE_TELEMETRY=1
CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
```

### Step 5: Run Claude Code

```bash
export PATH="$HOME/.bun/bin:$PATH"
bun run ./src/entrypoints/cli.tsx --bare --print "Hello"
```

## Model Mapping

The bridge maps Anthropic model names to NVIDIA models:

| Anthropic Model | NVIDIA Model |
|----------------|--------------|
| claude-sonnet-4-6 | moonshotai/kimi-k2.5 |
| claude-opus-4-6 | moonshotai/kimi-k2.5 |
| claude-haiku-4-5 | moonshotai/kimi-k2.5 |
| sonnet | moonshotai/kimi-k2.5 |
| opus | moonshotai/kimi-k2.5 |
| haiku | moonshotai/kimi-k2.5 |

## Web Tools

The bridge provides web automation tools:

### Web Search
Searches using DuckDuckGo with query expansion:
```bash
curl -X POST http://127.0.0.1:8789/cdp/search \
  -H "Content-Type: application/json" \
  -d '{"query": "latest AI news", "depth": "standard", "max_results": 10}'
```

Depth options:
- `fast` - Single query, quick results
- `standard` - Multiple related queries, balanced
- `deep` - Comprehensive search with expansion

### Web Fetch
Fetches URL content (HTTP first, browser fallback):
```bash
curl -X POST http://127.0.0.1:8789/cdp/fetch \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### Parallel Fetch
Fetches multiple URLs with concurrency control:
```bash
curl -X POST http://127.0.0.1:8789/cdp/fetch/parallel \
  -H "Content-Type: application/json" \
  -d '{"urls": ["https://a.com", "https://b.com"], "max_concurrent": 3}'
```

### Browser Task
Multi-step browser automation:
```bash
curl -X POST http://127.0.0.1:8789/cdp/browser-task \
  -H "Content-Type: application/json" \
  -d '{"goal": "check my gmail inbox", "start_url": "https://mail.google.com"}'
```

### Browser Action
Single action with ARIA snapshot:
```bash
curl -X POST http://127.0.0.1:8789/cdp/browser-action \
  -H "Content-Type: application/json" \
  -d '{"action": "navigate", "url": "https://example.com"}'
```

Supported actions: `navigate`, `click`, `type`, `wait`, `wait_for`, `screenshot`, `verify`, `extract`, `new_tab`, `switch_tab`, `close_tab`, `list_tabs`, `cleanup`

### Research State
Enforces search → fetch → synthesis workflow:
```bash
# Initialize research task
curl -X POST http://127.0.0.1:8789/research/init \
  -d '{"topic": "AI safety", "task_id": "task-123"}'

# Mark phase complete
curl -X POST http://127.0.0.1:8789/research/track-phase \
  -d '{"phase": "search", "results": [...]}'

# Check completion
curl -X POST http://127.0.0.1:8789/research/check-completion \
  -d '{"action": "complete"}'
```

## How It Works

1. **Claude Code** sends Anthropic API format requests to the bridge (port 8789)
2. **Anthropic Bridge** converts requests to OpenAI format
3. **Keymaster** receives OpenAI requests and rotates through your NVIDIA API keys
4. **NVIDIA API** processes the request and returns responses
5. **Bridge** converts OpenAI responses back to Anthropic format
6. **Claude Code** receives responses as if from Anthropic

**For web tools:**
1. Bridge connects to Chrome via CDP (port 9222)
2. Uses Playwright for browser automation
3. Provides semantic ARIA snapshots for element detection
4. Supports multi-step browser tasks with verification requirements

## Troubleshooting

### Check Bridge Health
```bash
curl http://127.0.0.1:8789/health
```

### Check Keymaster Health
```bash
curl http://127.0.0.1:8787/health
```

### Check Chrome CDP
```bash
curl http://127.0.0.1:9222/json/version
```

### View Logs

Keymaster logs:
```bash
~/.openclaw/skills/keymaster/keymaster logs
```

Bridge logs: Check terminal where `simple_bridge.py` is running

### Test Directly

Test the bridge:
```bash
curl -X POST http://127.0.0.1:8789/v1/messages \
  -H "Content-Type: application/json" \
  -d '{
    "model": "sonnet",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 100,
    "stream": false
  }'
```

Test web search:
```bash
curl -X POST http://127.0.0.1:8789/cdp/search \
  -H "Content-Type: application/json" \
  -d '{"query": "test", "depth": "fast"}'
```

### Common Issues

**"Connection refused" to port 8789**
- Bridge is not running: `python simple_bridge.py`

**"Connection refused" to port 8787**
- Keymaster is not running: `keymaster start`

**"Connection refused" to port 9222**
- Chrome CDP is not running: `sudo systemctl start chrome-debug`

**"No API key found"**
- Check auth-profiles.json: `cat ~/.openclaw/agents/main/agent/auth-profiles.json`
- Verify Keymaster can read it: `keymaster keys`

**Browser tasks failing**
- Verify Chrome CDP: `curl http://localhost:9222/json/version`
- Check Chrome has --remote-debugging-port=9222 flag
- Ensure Chrome is not headless if sites block headless browsers

## Benefits

- **Automatic key rotation**: When one key hits rate limits, Keymaster switches to the next
- **5 key slots**: Uses primary, secondary, tertiary, quaternary, quinary keys
- **No interruption**: Conversations continue seamlessly across key switches
- **Long-running tasks**: Can run for hours without manual intervention
- **Web automation**: Full browser automation via Chrome CDP with ARIA snapshots
- **Research workflow**: Enforces search → fetch → synthesis for thorough results
