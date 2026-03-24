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

# 3. Install Ingestor Dependencies
WORKDIR /app
COPY services/ingestor/package.json services/ingestor/bun.lock ./services/ingestor/
WORKDIR /app/services/ingestor
RUN bun install --frozen-lockfile

# 4. Build Ingestor
COPY services/ingestor ./
RUN bun run build

# Stage 2: Production runner
FROM oven/bun:${BUN_VERSION}-alpine AS runner
WORKDIR /app

# Install su-exec and wget for healthchecks
RUN apk add --no-cache su-exec wget

# Copy all installed dependencies
COPY --from=builder /app/services/ingestor/node_modules /app/services/ingestor/node_modules

# FORCE COPY Shared into node_modules (replaces symlink with actual code)
# This prevents "Cannot find module" errors due to broken/missing symlinks in production
# We copy /app/shared (which is built) to /app/services/ingestor/node_modules/@kyrazo/shared
RUN rm -rf /app/services/ingestor/node_modules/@kyrazo/shared && mkdir -p /app/services/ingestor/node_modules/@kyrazo/shared
COPY --from=builder /app/shared /app/services/ingestor/node_modules/@kyrazo/shared

# ALSO Copy shared to /app/shared because tsconfig paths point to "../../shared"
COPY --from=builder /app/shared /app/shared

# Copy ingestor package binaries and config
COPY --from=builder /app/services/ingestor/package.json /app/services/ingestor/package.json
COPY --from=builder /app/services/ingestor/tsconfig.json /app/services/ingestor/tsconfig.json
COPY --from=builder /app/services/ingestor/dist /app/services/ingestor/dist
COPY --from=builder /app/services/ingestor/drizzle /app/services/ingestor/drizzle

# Set working directory to ingestor package
WORKDIR /app/services/ingestor

# Pre-create logs&certs directory
RUN mkdir -p /app/services/ingestor/logs && chown -R bun:bun /app/services/ingestor/logs


# Copy and setup entrypoint script
COPY services/ingestor/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Ensure everything is owned by the bun user before switching
RUN chown -R bun:bun /app

# Expose the application port
EXPOSE ${PORT}

# Healthcheck
HEALTHCHECK --start-period=20s --interval=30s --timeout=3s --retries=3 \
    CMD wget -qO- http://localhost:${PORT}/v1/health || exit 1

# Start the application
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
