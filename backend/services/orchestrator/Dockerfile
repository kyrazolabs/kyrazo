# Use bun 1.3.5 alpine as base
ARG BUN_VERSION=1.3.5
FROM oven/bun:${BUN_VERSION}-alpine AS base
WORKDIR /app

# Stage 1: Builder (Install & Build everything in strict order)
FROM base AS builder

# 1. Install Shared Dependencies
COPY shared/package.json shared/bun.lock ./shared/
WORKDIR /app/shared
RUN bun install

# 2. Build Shared (Requires source)
COPY shared ./
RUN bun run build

# 3. Install orchestrator Dependencies
WORKDIR /app
COPY services/orchestrator/package.json services/orchestrator/bun.lock ./services/orchestrator/
WORKDIR /app/services/orchestrator
RUN bun install --frozen-lockfile

# 4. Copy orchestrator source
COPY services/orchestrator ./

# Stage 2: Production runner
FROM oven/bun:${BUN_VERSION}-alpine AS runner
WORKDIR /app

# Install su-exec for dropping privileges from root
RUN apk add --no-cache su-exec

# Copy all installed dependencies
COPY --from=builder /app/services/orchestrator/node_modules /app/services/orchestrator/node_modules

# FORCE COPY Shared into node_modules (replaces symlink with actual code)
# We copy /app/shared (which is built) to /app/services/orchestrator/node_modules/@kyrazo/shared
RUN rm -rf /app/services/orchestrator/node_modules/@kyrazo/shared && mkdir -p /app/services/orchestrator/node_modules/@kyrazo/shared
COPY --from=builder /app/shared /app/services/orchestrator/node_modules/@kyrazo/shared

# ALSO Copy shared to /app/shared because tsconfig paths point to "../../shared"
COPY --from=builder /app/shared /app/shared

# Copy orchestrator package binaries and config
COPY --from=builder /app/services/orchestrator/package.json /app/services/orchestrator/package.json
COPY --from=builder /app/services/orchestrator/tsconfig.json /app/services/orchestrator/tsconfig.json
COPY --from=builder /app/services/orchestrator/drizzle.config.ts /app/services/orchestrator/drizzle.config.ts
COPY --from=builder /app/services/orchestrator/src /app/services/orchestrator/src

# Set working directory to orchestrator package
WORKDIR /app/services/orchestrator

# Pre-create logs directory
RUN mkdir -p /app/services/orchestrator/logs && chown -R bun:bun /app/services/orchestrator/logs

# Copy and setup entrypoint script
COPY services/orchestrator/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Ensure everything is owned by the bun user before switching
RUN chown -R bun:bun /app

# Expose the application port
EXPOSE ${PORT}

# Healthcheck
HEALTHCHECK  --start-period=20s --interval=30s --timeout=3s --retries=3 \
    CMD wget -qO- http://127.0.0.1:${PORT}/v1/health || exit 1

# Entrypoint runs as root to fix log dir permissions, then drops to bun
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
