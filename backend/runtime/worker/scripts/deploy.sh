#!/bin/bash
set -e

# Configuration
IMAGE_NAME="worker-service"
TAG="latest"
# Dockerfile is one level up from this script (in backend/runtime/worker)
DOCKERFILE_PATH="$(dirname "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)")/Dockerfile"

# resolve absolute path of script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Backend root: script is in backend/runtime/worker/scripts
# Up 3 levels: scripts -> worker -> runtime -> backend
BACKEND_ROOT="$(dirname "$(dirname "$(dirname "$SCRIPT_DIR")")")"

echo "Using backend root as context: $BACKEND_ROOT"
echo "Using Dockerfile at: $DOCKERFILE_PATH"

# Build
echo "Building Docker image..."
docker build \
  -f "$DOCKERFILE_PATH" \
  -t "$IMAGE_NAME:$TAG" \
  "$BACKEND_ROOT"

echo "Build complete."

# Run (Simulation for verification)
echo "Running container with limits (1 CPU, 2GB RAM)..."
# We use --rm for testing to clean up after exit
docker run --rm \
  --cpus="1.0" \
  --memory="2g" \
  --name "$IMAGE_NAME-instance" \
  "$IMAGE_NAME:$TAG"
