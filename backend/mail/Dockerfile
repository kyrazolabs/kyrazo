# Use bun 1.3.5 alpine as base
ARG BUN_VERSION=1.3.5
FROM oven/bun:${BUN_VERSION}-alpine AS base
WORKDIR /app

# Stage 1: Builder
FROM base AS builder

# 1. Copy root package files
COPY package.json bun.lock ./

# 2. Copy workspace package files for dependencies install
COPY packages/utils/package.json ./packages/utils/
COPY packages/bullmq/package.json ./packages/bullmq/
COPY apps/mail/package.json ./apps/mail/

# 3. Install dependencies
RUN bun install

# 4. Copy source code
COPY packages ./packages
COPY apps ./apps
COPY tsconfig.json tsconfig.base.json ./

# 5. Build all packages
RUN bun run build

# Stage 2: Production runner
FROM oven/bun:${BUN_VERSION}-alpine AS runner
WORKDIR /app

# Copy necessary files from builder
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/bun.lock /app/bun.lock
COPY --from=builder /app/node_modules /app/node_modules

COPY --from=builder /app/packages/utils/package.json /app/packages/utils/package.json
COPY --from=builder /app/packages/utils/build /app/packages/utils/build
COPY --from=builder /app/packages/utils/node_modules /app/packages/utils/node_modules

COPY --from=builder /app/packages/bullmq/package.json /app/packages/bullmq/package.json
COPY --from=builder /app/packages/bullmq/build /app/packages/bullmq/build
COPY --from=builder /app/packages/bullmq/node_modules /app/packages/bullmq/node_modules

COPY --from=builder /app/apps/mail/package.json /app/apps/mail/package.json
COPY --from=builder /app/apps/mail/dist /app/apps/mail/dist
COPY --from=builder /app/apps/mail/src /app/apps/mail/src
COPY --from=builder /app/apps/mail/node_modules /app/apps/mail/node_modules

# Ensure everything is owned by the bun user
RUN chown -R bun:bun /app

# Run as non-root user
USER bun

# Set working directory to the mail app
WORKDIR /app/apps/mail

ENV NODE_ENV=production

# Start the application
CMD ["bun", "run", "start"]
