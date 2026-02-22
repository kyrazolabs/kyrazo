# Use bun 1.3.5 alpine as base
ARG BUN_VERSION=1.3.5
FROM oven/bun:${BUN_VERSION}-alpine AS base
WORKDIR /app

# Stage 1: Builder (Install & Build everything in strict order)
FROM base AS builder

RUN apk update && apk add curl

# 1. Install Shared Dependencies
COPY shared/package.json shared/bun.lock ./shared/
WORKDIR /app/shared
RUN bun install

# 2. Build Shared (Requires source)
COPY shared ./
RUN bun run build

# 3. Install Dashboard Dependencies
WORKDIR /app
COPY apis/dashboard/package.json apis/dashboard/bun.lock ./apis/dashboard/
WORKDIR /app/apis/dashboard
RUN bun install --frozen-lockfile

# 4. Copy Dashboard source
COPY apis/dashboard ./

# Stage 2: Production runner
FROM oven/bun:${BUN_VERSION}-alpine AS runner
WORKDIR /app

# Copy all installed dependencies
COPY --from=builder /app/apis/dashboard/node_modules /app/apis/dashboard/node_modules

# FORCE COPY Shared into node_modules (replaces symlink with actual code)
# We copy /app/shared (which is built) to /app/apis/dashboard/node_modules/@kyrazo/shared
RUN rm -rf /app/apis/dashboard/node_modules/@kyrazo/shared && mkdir -p /app/apis/dashboard/node_modules/@kyrazo/shared
COPY --from=builder /app/shared /app/apis/dashboard/node_modules/@kyrazo/shared

# ALSO Copy shared to /app/shared because tsconfig paths point to "../../shared"
COPY --from=builder /app/shared /app/shared

# Copy dashboard package binaries and config
COPY --from=builder /app/apis/dashboard/package.json /app/apis/dashboard/package.json
COPY --from=builder /app/apis/dashboard/tsconfig.json /app/apis/dashboard/tsconfig.json
COPY --from=builder /app/apis/dashboard/src /app/apis/dashboard/src

# Set working directory to dashboard package
WORKDIR /app/apis/dashboard

# Ensure everything is owned by the bun user before switching
RUN chown -R bun:bun /app

# Run as non-root user for security
USER bun

# Expose the application port
EXPOSE 3000

# Healthcheck
HEALTHCHECK  --start-period=20s --interval=30s --timeout=3s --retries=3 \
    CMD curl -qO- http://localhost:3000/v1/health || exit 1

# Start the application
CMD ["bun", "run", "src/index.ts"]
