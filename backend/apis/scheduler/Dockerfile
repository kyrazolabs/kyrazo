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

# 3. Install scheduler Dependencies
WORKDIR /app
COPY apis/scheduler/package.json apis/scheduler/bun.lock ./apis/scheduler/
WORKDIR /app/apis/scheduler
RUN bun install --frozen-lockfile

# 4. Copy scheduler source
COPY apis/scheduler ./

# Stage 2: Production runner
FROM oven/bun:${BUN_VERSION}-alpine AS runner
WORKDIR /app

# Copy all installed dependencies
COPY --from=builder /app/apis/scheduler/node_modules /app/apis/scheduler/node_modules

# FORCE COPY Shared into node_modules (replaces symlink with actual code)
# We copy /app/shared (which is built) to /app/apis/scheduler/node_modules/@kyrazo/shared
RUN rm -rf /app/apis/scheduler/node_modules/@kyrazo/shared && mkdir -p /app/apis/scheduler/node_modules/@kyrazo/shared
COPY --from=builder /app/shared /app/apis/scheduler/node_modules/@kyrazo/shared

# ALSO Copy shared to /app/shared because tsconfig paths point to "../../shared"
COPY --from=builder /app/shared /app/shared

# Copy scheduler package binaries and config
COPY --from=builder /app/apis/scheduler/package.json /app/apis/scheduler/package.json
COPY --from=builder /app/apis/scheduler/tsconfig.json /app/apis/scheduler/tsconfig.json
COPY --from=builder /app/apis/scheduler/src /app/apis/scheduler/src

# Set working directory to scheduler package
WORKDIR /app/apis/scheduler

# Ensure everything is owned by the bun user before switching
RUN chown -R bun:bun /app

# Run as non-root user for security
USER bun

# Expose the application port
EXPOSE ${PORT}

# Healthcheck
HEALTHCHECK  --start-period=20s --interval=30s --timeout=3s --retries=3 \
    CMD wget -qO- http://127.0.0.1:${PORT}/v1/health || exit 1

# Start the application
CMD ["bun", "run", "src/index.ts"]
