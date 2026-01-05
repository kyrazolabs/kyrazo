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

# 3. Install integration Dependencies
WORKDIR /app
COPY apis/integration/package.json apis/integration/bun.lock ./apis/integration/
WORKDIR /app/apis/integration
RUN bun install --frozen-lockfile

# 4. Copy integration source
COPY apis/integration ./

# Stage 2: Production runner
FROM oven/bun:${BUN_VERSION}-alpine AS runner
WORKDIR /app

# Copy all installed dependencies
COPY --from=builder /app/apis/integration/node_modules /app/apis/integration/node_modules

# FORCE COPY Shared into node_modules (replaces symlink with actual code)
# We copy /app/shared (which is built) to /app/apis/integration/node_modules/@kyrazo/shared
RUN rm -rf /app/apis/integration/node_modules/@kyrazo/shared && mkdir -p /app/apis/integration/node_modules/@kyrazo/shared
COPY --from=builder /app/shared /app/apis/integration/node_modules/@kyrazo/shared

# ALSO Copy shared to /app/shared because tsconfig paths point to "../../shared"
COPY --from=builder /app/shared /app/shared

# Copy integration package binaries and config
COPY --from=builder /app/apis/integration/package.json /app/apis/integration/package.json
COPY --from=builder /app/apis/integration/tsconfig.json /app/apis/integration/tsconfig.json
COPY --from=builder /app/apis/integration/src /app/apis/integration/src

# Set working directory to integration package
WORKDIR /app/apis/integration

# Ensure everything is owned by the bun user before switching
RUN chown -R bun:bun /app

# Run as non-root user for security
USER bun

ENV NODE_ENV=production
ENV PORT=4000

# Expose the application port
EXPOSE 4000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD wget -qO- http://localhost:3000/v1/health || exit 1

# Start the application
CMD ["bun", "run", "src/index.ts"]
