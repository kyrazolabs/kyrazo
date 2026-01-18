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
RUN bun run prod:build

# Stage 2: Production runtime
FROM node:22-slim

WORKDIR /app

# Copy production build artifacts
COPY --from=builder /app/dist ./dist

# Expose the server port
ENV PORT=4000
EXPOSE 4000

# Start the server using Node.js (more stable for SSR)
CMD ["node", "dist/server/server.mjs"]
