# Use bun 1.3.5 alpine as base
ARG BUN_VERSION=1.3.5
FROM oven/bun:${BUN_VERSION}-alpine AS base
WORKDIR /app

# Stage 1: Builder
FROM base AS builder

# 1. Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# 2. Copy source code
COPY . .

# Stage 2: Production runner
FROM oven/bun:${BUN_VERSION}-alpine AS runner
WORKDIR /app

# Copy all installed dependencies
COPY --from=builder /app/node_modules /app/node_modules

# Copy analytics package binaries and config
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/tsconfig.json /app/tsconfig.json
COPY --from=builder /app/src /app/src

# Ensure everything is owned by the bun user before switching
RUN chown -R bun:bun /app

# Run as non-root user for security
USER bun

# Expose the application port
EXPOSE ${PORT}

# Healthcheck
HEALTHCHECK --start-period=20s --interval=30s --timeout=3s --retries=3 \
    CMD wget -qO- http://localhost:${PORT}/v1/health || exit 1

# Start the application
CMD ["bun", "run", "src/index.ts"]
