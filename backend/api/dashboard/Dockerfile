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

# 3. Install Dashboard Dependencies
WORKDIR /app
COPY api/dashboard/package.json api/dashboard/bun.lock ./api/dashboard/
WORKDIR /app/api/dashboard
RUN bun install --frozen-lockfile

# 4. Copy Dashboard source and BUILD
COPY api/dashboard ./
RUN bun run build

# Stage 2: Production runner
FROM oven/bun:${BUN_VERSION}-alpine AS runner
WORKDIR /app

# Install su-exec and wget for healthchecks
RUN apk add --no-cache su-exec wget

# Copy all installed dependencies
COPY --from=builder /app/api/dashboard/node_modules /app/api/dashboard/node_modules

# FORCE COPY Shared into node_modules (replaces symlink with actual code)
RUN rm -rf /app/api/dashboard/node_modules/@kyrazo/shared && mkdir -p /app/api/dashboard/node_modules/@kyrazo/shared
COPY --from=builder /app/shared /app/api/dashboard/node_modules/@kyrazo/shared

# ALSO Copy shared to /app/shared because tsconfig paths point to "../../shared"
COPY --from=builder /app/shared /app/shared

# Copy dashboard package binaries, config, and BUILT dist
COPY --from=builder /app/api/dashboard/package.json /app/api/dashboard/package.json
COPY --from=builder /app/api/dashboard/tsconfig.json /app/api/dashboard/tsconfig.json
COPY --from=builder /app/api/dashboard/dist /app/api/dashboard/dist
COPY --from=builder /app/api/dashboard/src /app/api/dashboard/src

# Set working directory to dashboard package
WORKDIR /app/api/dashboard

# Pre-create logs directory
RUN mkdir -p /app/api/dashboard/logs && chown -R bun:bun /app/api/dashboard/logs

# Copy and setup entrypoint script
COPY api/dashboard/scripts/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Ensure everything is owned by the bun user (for non-volume cases)
RUN chown -R bun:bun /app

# Expose the application port
EXPOSE ${PORT}

# Healthcheck
HEALTHCHECK  --start-period=20s --interval=30s --timeout=3s --retries=3 \
    CMD wget -qO- http://127.0.0.1:${PORT}/v1/health || exit 1

# Entrypoint runs as root to fix log dir permissions, then drops to bun
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
