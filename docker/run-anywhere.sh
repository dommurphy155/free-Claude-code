#!/bin/bash
# =============================================================================
# Claude Code Local - Run Anywhere Script
# Works on any machine with Docker, zero dependencies
# =============================================================================

set -e

REPO_URL="${REPO_URL:-https://github.com/yourusername/claude-code-haha.git}"
IMAGE_NAME="claude-code-haha"
CONTAINER_NAME="claude-code-haha"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() { echo -e "${GREEN}[*]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[X]${NC} $1"; }

# Check Docker
check_docker() {
    if ! command -v docker &> /dev/null; then
        error "Docker not found. Install from https://docs.docker.com/get-docker/"
        exit 1
    fi
    log "Docker found: $(docker --version)"
}

# Get the code
get_code() {
    if [ -f "Dockerfile" ] && [ -f "docker-compose.yml" ]; then
        log "Using local code"
        return
    fi

    if [ -d ".git" ]; then
        log "Git repo found, pulling latest"
        git pull
    else
        log "Cloning repo..."
        git clone "$REPO_URL" .
    fi
}

# Setup environment
setup_env() {
    if [ ! -f ".env.docker" ]; then
        log "Creating .env.docker config"
        cat > .env.docker << 'EOF'
# Mode: 1 = restricted (works everywhere), 0 = full browser
RESTRICTED_MODE=1

# Direct API (no keymaster needed)
USE_DIRECT_API=1
NVIDIA_API_KEY=${NVIDIA_API_KEY:-}
OPENAI_API_KEY=${OPENAI_API_KEY:-}
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY:-}

# Claude Code
ANTHROPIC_AUTH_TOKEN=local-bridge-mode
ANTHROPIC_BASE_URL=http://localhost:8789
DISABLE_TELEMETRY=1
EOF
        warn "Edit .env.docker and add your API key"
    fi
}

# Build image
build() {
    log "Building Docker image..."
    docker build -t "$IMAGE_NAME" .
    log "Build complete"
}

# Run bridge
run() {
    log "Starting Claude Code bridge..."

    # Stop existing
    docker rm -f "$CONTAINER_NAME" 2>/dev/null || true

    # Run new
    docker run -d \
        --name "$CONTAINER_NAME" \
        -p 8789:8789 \
        --env-file .env.docker \
        -v claude-data:/tmp/claude-data \
        "$IMAGE_NAME"

    log "Container started. Checking health..."
    sleep 3

    if curl -s http://localhost:8789/health > /dev/null 2>&1; then
        log "Bridge is healthy!"
        log ""
        log "Test it: curl http://localhost:8789/health"
    else
        warn "Bridge not responding yet, may need a few more seconds"
        docker logs "$CONTAINER_NAME" --tail 20
    fi
}

# Run with docker-compose
run_compose() {
    log "Starting with docker-compose..."
    docker-compose up -d
    log "Services started"
    docker-compose ps
}

# Stop
stop() {
    log "Stopping Claude Code..."
    docker rm -f "$CONTAINER_NAME" 2>/dev/null || true
    docker-compose down 2>/dev/null || true
    log "Stopped"
}

# Status
status() {
    echo "=== Container Status ==="
    docker ps -a --filter "name=$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

    echo ""
    echo "=== Health Check ==="
    curl -s http://localhost:8789/health 2>/dev/null || echo "Not responding"
}

# Logs
logs() {
    docker logs "$CONTAINER_NAME" -f
}

# CLI mode
cli() {
    log "Starting interactive CLI..."
    docker run -it --rm \
        --env-file .env.docker \
        "$IMAGE_NAME" cli
}

# Main
main() {
    check_docker

    case "${1:-run}" in
        setup)
            get_code
            setup_env
            build
            log "Setup complete. Edit .env.docker then run: ./run-anywhere.sh run"
            ;;
        build)
            build
            ;;
        run)
            if ! docker image inspect "$IMAGE_NAME" > /dev/null 2>&1; then
                get_code
                setup_env
                build
            fi
            run
            ;;
        compose|up)
            run_compose
            ;;
        stop|down)
            stop
            ;;
        status)
            status
            ;;
        logs)
            logs
            ;;
        cli)
            cli
            ;;
        help|--help|-h)
            echo "Usage: ./run-anywhere.sh [command]"
            echo ""
            echo "Commands:"
            echo "  setup     - Clone, setup env, build"
            echo "  build     - Build Docker image"
            echo "  run       - Run bridge (default)"
            echo "  compose   - Run with docker-compose"
            echo "  stop      - Stop all services"
            echo "  status    - Check status"
            echo "  logs      - View logs"
            echo "  cli       - Interactive CLI mode"
            echo ""
            echo "First time: ./run-anywhere.sh setup"
            ;;
        *)
            error "Unknown command: $1"
            echo "Run: ./run-anywhere.sh help"
            exit 1
            ;;
    esac
}

main "$@"
