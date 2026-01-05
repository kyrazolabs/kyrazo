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

# 3. Install agent Dependencies
# Reset WORKDIR so we copy to /app/runtime/agent, not /app/shared/runtime/agent
WORKDIR /app
COPY runtime/agent/package.json runtime/agent/bun.lock ./runtime/agent/
WORKDIR /app/runtime/agent
RUN bun install --frozen-lockfile

# 4. Build agent
# Skipped - we run strict TypeScript in production with Bun
# COPY runtime/agent ./
# RUN bun run build
COPY runtime/agent ./

# Stage 2: Production runner
FROM oven/bun:${BUN_VERSION}-alpine AS runner
WORKDIR /app

# Copy all installed dependencies
COPY --from=builder /app/runtime/agent/node_modules /app/runtime/agent/node_modules

# FORCE COPY Shared into node_modules (replaces symlink with actual code)
# This prevents "Cannot find module" errors due to broken/missing symlinks in production
# We copy /app/shared (which is built) to /app/runtime/agent/node_modules/@kyrazo/shared
RUN rm -rf /app/runtime/agent/node_modules/@kyrazo/shared && mkdir -p /app/runtime/agent/node_modules/@kyrazo/shared
COPY --from=builder /app/shared /app/runtime/agent/node_modules/@kyrazo/shared

# ALSO Copy shared to /app/shared because tsconfig paths point to "../../shared"
# When running with "bun run src/...", Bun follows tsconfig paths.
COPY --from=builder /app/shared /app/shared

# Copy agent package binaries and config
COPY --from=builder /app/runtime/agent/package.json /app/runtime/agent/package.json
COPY --from=builder /app/runtime/agent/tsconfig.json /app/runtime/agent/tsconfig.json
COPY --from=builder /app/runtime/agent/src /app/runtime/agent/src
# COPY --from=builder /app/runtime/agent/dist /app/runtime/agent/dist

# Set working directory to agent package so "bun run start" works
WORKDIR /app/runtime/agent

ENV NODE_ENV=production

CMD ["bun", "run", "start"]
