# syntax=docker/dockerfile:1

# ---- Stage 1: Build the application ----------------------------------------
# Bun is the package manager, but the Angular CLI's route extractor relies on
# Node.js ESM loader hooks (`--import` in worker threads), which Bun does not
# support yet. A real Node binary is provided so `bunx ng build` runs the CLI
# under Node via its `#!/usr/bin/env node` shebang.
FROM oven/bun:1 AS builder

COPY --from=node:22-slim /usr/local/bin/node /usr/local/bin/node

WORKDIR /app

# Install dependencies from the lockfile (including devDependencies for the build)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source code and build
COPY . .
RUN bun run build

# ---- Stage 2: Production runtime — static nginx ----------------------------
FROM nginx:1.27-alpine

ENV NODE_ENV=production
EXPOSE 4000

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/website/browser /usr/share/nginx/html

HEALTHCHECK --start-period=10s --interval=30s --timeout=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1:4000/health || exit 1
