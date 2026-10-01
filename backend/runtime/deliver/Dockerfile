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

# 3. Install Deliver Dependencies
# Reset WORKDIR so we copy to /app/runtime/deliver, not /app/shared/runtime/deliver
WORKDIR /app
COPY runtime/deliver/package.json runtime/deliver/bun.lock ./runtime/deliver/
WORKDIR /app/runtime/deliver
RUN bun install --frozen-lockfile

# 4. Build Deliver
# Skipped - we run strict TypeScript in production with Bun
# COPY runtime/deliver ./
# RUN bun run build
COPY runtime/deliver ./

# Stage 2: Production runner
FROM oven/bun:${BUN_VERSION}-alpine AS runner
WORKDIR /app

# Install su-exec for dropping privileges from root
RUN apk add --no-cache su-exec

# Copy all installed dependencies
COPY --from=builder /app/runtime/deliver/node_modules /app/runtime/deliver/node_modules

# FORCE COPY Shared into node_modules (replaces symlink with actual code)
# This prevents "Cannot find module" errors due to broken/missing symlinks in production
# We copy /app/shared (which is built) to /app/runtime/deliver/node_modules/@kyrazo/shared
RUN rm -rf /app/runtime/deliver/node_modules/@kyrazo/shared && mkdir -p /app/runtime/deliver/node_modules/@kyrazo/shared
COPY --from=builder /app/shared /app/runtime/deliver/node_modules/@kyrazo/shared

# ALSO Copy shared to /app/shared because tsconfig paths point to "../../shared"
# When running with "bun run src/...", Bun follows tsconfig paths.
COPY --from=builder /app/shared /app/shared

# Copy deliver package binaries and config
COPY --from=builder /app/runtime/deliver/package.json /app/runtime/deliver/package.json
COPY --from=builder /app/runtime/deliver/tsconfig.json /app/runtime/deliver/tsconfig.json
COPY --from=builder /app/runtime/deliver/src /app/runtime/deliver/src
# COPY --from=builder /app/runtime/deliver/dist /app/runtime/deliver/dist

# Set working directory to deliver package so "bun run start" works
WORKDIR /app/runtime/deliver

# Pre-create logs directory
RUN mkdir -p /app/runtime/deliver/logs && chown -R bun:bun /app/runtime/deliver/logs


# Copy and setup entrypoint script
COPY runtime/deliver/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Ensure everything is owned by the bun user (for non-volume cases)
RUN chown -R bun:bun /app

ENV NODE_ENV=production
ENV PORT=3000
HEALTHCHECK  --start-period=20s --interval=30s --timeout=3s --retries=3 \
    CMD wget -qO- http://127.0.0.1:${PORT}/v1/health || exit 1

# Entrypoint runs as root to fix log dir permissions, then drops to bun
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
