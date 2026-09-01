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

# ---- Stage 2: Production runtime — pure Bun --------------------------------
FROM oven/bun:1

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

WORKDIR /app

# The Angular build output is self-contained: only dist is needed at runtime
COPY --from=builder /app/dist ./dist

# Run as the non-root `bun` user provided by the base image
USER bun

# Healthcheck using Bun itself — no curl or apt-get needed
HEALTHCHECK --start-period=20s --interval=30s --timeout=5s --retries=3 \
    CMD bun -e "fetch('http://localhost:' + (process.env.PORT || 4000) + '/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Start the server using Bun
CMD ["bun", "dist/website/server/server.mjs"]
