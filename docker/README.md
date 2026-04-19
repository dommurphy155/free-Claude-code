# Claude Code Local - Docker Setup

Production-ready Docker setup with unprivileged container support and restricted mode.

## Quick Start

### Build
```bash
docker build -t claude-code-haha .
```

### Run Bridge (Restricted Mode - Recommended)
No `--ipc=host` needed. Browser automation is mocked.
```bash
docker run -d \
  --name claude-bridge \
  -p 8789:8789 \
  -e RESTRICTED_MODE=1 \
  -e KEYMASTER_URL=http://host.docker.internal:8787 \
  claude-code-haha
```

### Run Bridge (Full Mode)
Requires `--ipc=host` for Chrome sandbox:
```bash
docker run -d \
  --name claude-bridge \
  -p 8789:8789 \
  --ipc=host \
  -e KEYMASTER_URL=http://host.docker.internal:8787 \
  claude-code-haha
```

### Run CLI (Interactive)
```bash
docker run -it \
  --rm \
  -e ANTHROPIC_AUTH_TOKEN=local-bridge-mode \
  -e ANTHROPIC_BASE_URL=http://host.docker.internal:8789 \
  claude-code-haha cli
```

## Commands

| Command | Description |
|---------|-------------|
| `bridge` | Run the FastAPI bridge (default) |
| `cli` | Run the Bun CLI interactively |
| `telegram` | Run the Telegram bot |
| `health` | Check bridge health |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `RESTRICTED_MODE` | `0` | Set to `1` to disable browser sandbox (no `--ipc=host` needed) |
| `MOCK_BROWSER` | `auto` | Force mock browser: `true`, `false`, or `auto` |
| `KEYMASTER_URL` | `http://127.0.0.1:8787` | NVIDIA Keymaster endpoint |
| `CDP_URL` | `http://localhost:9222` | Chrome DevTools Protocol URL |
| `CLAUDE_CODE_FORCE_RECOVERY_CLI` | `0` | Use simple recovery CLI instead of Ink TUI |

## Security

### Non-Root User
- Container runs as `claude` (UID 1000)
- No sudo access
- No host filesystem access except mounted volumes

### Restricted Mode
When `RESTRICTED_MODE=1`:
- Chrome runs with `--no-sandbox --disable-setuid-sandbox`
- System commands (sudo, apt, systemctl) are blocked
- Browser automation returns mock data
- No `--ipc=host` or `--cap-add=SYS_ADMIN` required

### Full Mode
When `RESTRICTED_MODE=0` (default):
- Requires `--ipc=host` for Chrome's shared memory
- Full browser automation via Playwright
- CDP connection to Chrome

## Volumes

Mount these for persistence:
```bash
docker run -d \
  -v claude-cache:/tmp/.claude \
  -v claude-remember:/app/.remember \
  -v $(pwd)/.env:/app/.env:ro \
  claude-code-haha
```

## Docker Compose

```yaml
version: '3.8'

services:
  claude-bridge:
    build: .
    ports:
      - "8789:8789"
    environment:
      - RESTRICTED_MODE=1
      - KEYMASTER_URL=http://host.docker.internal:8787
    volumes:
      - claude-data:/tmp/claude-data

volumes:
  claude-data:
```

## Troubleshooting

### Browser fails in restricted mode
This is expected. Use `--ipc=host` for full browser automation, or accept mocked responses.

### "Cannot connect to Chrome CDP"
In restricted mode, CDP is mocked. In full mode, ensure Chrome is running on the host at port 9222.

### Health check fails
```bash
docker exec claude-bridge python3 /app/docker_entrypoint.py health
```

## Files

- `Dockerfile` - Multi-stage build with Alpine Linux
- `.dockerignore` - Excludes dev files and secrets
- `docker_entrypoint.py` - Runtime entrypoint with mode detection
- `docker_restricted_mode.py` - Mock implementations for unprivileged containers
