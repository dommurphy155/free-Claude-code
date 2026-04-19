# =============================================================================
# Claude Code Local - Production Docker Image
# Multi-stage build with security hardening
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies (builder)
# -----------------------------------------------------------------------------
FROM oven/bun:1.2.4-alpine AS builder

WORKDIR /build

# Install Python + build deps (only needed for building)
RUN apk add --no-cache \
    python3=~3.12 \
    py3-pip \
    py3-virtualenv \
    curl \
    unzip \
    build-base \
    python3-dev

# Copy dependency manifests first (for layer caching)
COPY package.json bun.lock* ./
COPY setup.py ./

# Install Bun dependencies
RUN bun install --frozen-lockfile --production

# Create Python virtual environment with dependencies
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies
RUN pip install --no-cache-dir \
    fastapi==0.115.0 \
    uvicorn[standard]==0.34.0 \
    httpx==0.28.0 \
    playwright==1.50.0 \
    requests==2.32.0 \
    curl-cffi==0.9.0 \
    beautifulsoup4==4.13.0

# -----------------------------------------------------------------------------
# Stage 2: Runtime
# -----------------------------------------------------------------------------
FROM python:3.12-alpine AS runtime

# Security: Run as non-root
ARG USERNAME=claude
ARG USER_UID=1000
ARG USER_GID=1000

# Install runtime dependencies
# Chrome + Playwright deps + ffmpeg for media processing
RUN apk add --no-cache \
    # Chrome/Chromium
    chromium \
    nss \
    freetype \
    harfbuzz \
    ttf-freefont \
    ttf-liberation \
    font-noto \
    font-noto-cjk \
    font-noto-emoji \
    # Media processing
    ffmpeg \
    ffmpeg-libs \
    # General utilities
    curl \
    ca-certificates \
    jq \
    wget \
    # Playwright system deps (minimal)
    libstdc++ \
    libgcc \
    # Misc
    dbus \
    udev \
    su-exec \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g $USER_GID $USERNAME \
    && adduser -u $USER_UID -G $USERNAME -s /bin/sh -D $USERNAME

# Install Bun (runtime only)
COPY --from=oven/bun:1.2.4-alpine /usr/local/bin/bun /usr/local/bin/bun
COPY --from=oven/bun:1.2.4-alpine /usr/local/bin/bunx /usr/local/bin/bunx

# Copy Python virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Create app directory
WORKDIR /app
RUN chown -R $USERNAME:$USERNAME /app

# Copy Bun dependencies from builder
COPY --from=builder /build/node_modules ./node_modules

# Copy application code (respects .dockerignore)
COPY --chown=$USERNAME:$USERNAME . .

# Set environment
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Chrome configuration
ENV PLAYWRIGHT_BROWSERS_PATH=/usr/bin/chromium-browser
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Claude Code environment
ENV CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
ENV DISABLE_TELEMETRY=1
ENV IS_SANDBOX=1

# Create required directories
RUN mkdir -p /tmp/claude-data /tmp/.claude /tmp/.cache \
    && chown -R $USERNAME:$USERNAME /tmp/claude-data /tmp/.claude /tmp/.cache

# Make entrypoint executable
RUN chmod +x /app/docker/docker_entrypoint.py

# Switch to non-root user
USER $USERNAME

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:8789/health 2>/dev/null || exit 1

# Expose bridge port
EXPOSE 8789

# Default: run the bridge via entrypoint
ENTRYPOINT ["python3", "/app/docker/docker_entrypoint.py"]
CMD ["bridge"]
