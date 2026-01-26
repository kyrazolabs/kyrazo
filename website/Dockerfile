# Stage 1: Build the application
FROM node:22-slim AS builder

# Install Bun
RUN npm install -g bun

WORKDIR /app

# Copy dependency definitions
COPY package.json bun.lock ./

# Install dependencies including devDependencies
RUN bun install

# Copy source code
COPY . .

# Build the application
RUN bun run build

# Stage 2: Production runtime
FROM node:22-slim

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy production build artifacts
COPY --from=builder /app/dist ./dist

# Expose the server port
ENV PORT=4000
EXPOSE 4000

# Healthcheck
HEALTHCHECK --start-period=20s --interval=30s --timeout=3s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Start the server using Node.js (more stable for SSR)
CMD ["node", "dist/website/server/server.mjs"]
