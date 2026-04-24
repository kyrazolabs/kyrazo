# Use bun 1.3.5 alpine as base
ARG BUN_VERSION=1.3.11
FROM oven/bun:${BUN_VERSION}-alpine AS base
WORKDIR /app

# Stage 1: Builder (Install & Build everything in strict order)
FROM base AS builder

RUN apk update && apk add wget

# 1. Install Shared Dependencies
COPY shared/package.json shared/bun.lock ./shared/
WORKDIR /app/shared
RUN bun install

# 2. Build Shared (Requires source)
COPY shared ./
RUN bun run build

# 3. Install ingest Dependencies
WORKDIR /app
COPY api/ingest/package.json api/ingest/bun.lock ./api/ingest/
WORKDIR /app/api/ingest
RUN bun install --frozen-lockfile

# 4. Copy ingest source
COPY api/ingest ./
RUN bun run build

# Stage 2: Production runner
FROM oven/bun:${BUN_VERSION}-alpine AS runner
WORKDIR /app

# Install su-exec and wget for healthchecks
RUN apk add --no-cache su-exec wget

# Copy all installed dependencies
COPY --from=builder /app/api/ingest/node_modules /app/api/ingest/node_modules

# FORCE COPY Shared into node_modules (replaces symlink with actual code)
# We copy /app/shared (which is built) to /app/api/ingest/node_modules/@kyrazo/shared
RUN rm -rf /app/api/ingest/node_modules/@kyrazo/shared && mkdir -p /app/api/ingest/node_modules/@kyrazo/shared
COPY --from=builder /app/shared /app/api/ingest/node_modules/@kyrazo/shared

# ALSO Copy shared to /app/shared because tsconfig paths point to "../../shared"
COPY --from=builder /app/shared /app/shared

# Copy ingest package binaries and config
COPY --from=builder /app/api/ingest/package.json /app/api/ingest/package.json
COPY --from=builder /app/api/ingest/tsconfig.json /app/api/ingest/tsconfig.json
COPY --from=builder /app/api/ingest/src /app/api/ingest/src
COPY --from=builder /app/api/ingest/dist /app/api/ingest/dist

# Set working directory to ingest package
WORKDIR /app/api/ingest

# Pre-create logs & certs directory
RUN mkdir -p /app/api/ingest/logs && chown -R bun:bun /app/api/ingest/logs
RUN mkdir -p /data/nats/certs && chown -R bun:bun /data/nats/certs

# Copy and setup entrypoint script
COPY api/ingest/scripts/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Ensure everything is owned by the bun user before switching
RUN chown -R bun:bun /app



ENV NODE_ENV=production

# Expose the application port
EXPOSE ${PORT}

# Healthcheck
HEALTHCHECK  --start-period=20s --interval=30s --timeout=3s --retries=3 \
    CMD wget -qO- http://127.0.0.1:${PORT}/v1/health || exit 1

# Start the application using entrypoint script
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
