# Use bun 1.3.5 alpine as base
ARG BUN_VERSION=1.3.11
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

# 3. Install integration Dependencies
WORKDIR /app
COPY api/integration/package.json api/integration/bun.lock ./api/integration/
WORKDIR /app/api/integration
RUN bun install --frozen-lockfile

# 4. Copy integration source
COPY api/integration ./
RUN bun run build

# Stage 2: Production runner
FROM oven/bun:${BUN_VERSION}-alpine AS runner
WORKDIR /app

# Install su-exec and wget for healthchecks
RUN apk add --no-cache su-exec wget

# Copy all installed dependencies
COPY --from=builder /app/api/integration/node_modules /app/api/integration/node_modules

# FORCE COPY Shared into node_modules (replaces symlink with actual code)
# We copy /app/shared (which is built) to /app/api/integration/node_modules/@kyrazo/shared
RUN rm -rf /app/api/integration/node_modules/@kyrazo/shared && mkdir -p /app/api/integration/node_modules/@kyrazo/shared
COPY --from=builder /app/shared /app/api/integration/node_modules/@kyrazo/shared

# ALSO Copy shared to /app/shared because tsconfig paths point to "../../shared"
COPY --from=builder /app/shared /app/shared

# Copy integration package binaries and config
COPY --from=builder /app/api/integration/package.json /app/api/integration/package.json
COPY --from=builder /app/api/integration/tsconfig.json /app/api/integration/tsconfig.json
COPY --from=builder /app/api/integration/src /app/api/integration/src
COPY --from=builder /app/api/integration/dist /app/api/integration/dist

# Set working directory to integration package
WORKDIR /app/api/integration

# Pre-create logs & certs directory
RUN mkdir -p /app/api/integration/logs && chown -R bun:bun /app/api/integration/logs
RUN mkdir -p /data/nats/certs && chown -R bun:bun /data/nats/certs

# Copy and setup entrypoint script
COPY api/integration/scripts/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Ensure everything is owned by the bun user before switching
RUN chown -R bun:bun /app

# Expose the application port
EXPOSE ${PORT}

# Healthcheck
HEALTHCHECK  --start-period=20s --interval=30s --timeout=3s --retries=3 \
    CMD wget -qO- http://127.0.0.1:${PORT}/v1/health || exit 1

# Start the application
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
