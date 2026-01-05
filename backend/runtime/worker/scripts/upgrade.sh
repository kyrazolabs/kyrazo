#!/bin/bash
# upgrade.sh - Safe upgrade script with rollback capability

set -e

# Configuration
SERVICE_NAME="worker-service" # Docker container name base
IMAGE_NAME="worker-service"
CONTAINER_CURRENT="${SERVICE_NAME}-current"
CONTAINER_NEW="${SERVICE_NAME}-new"
CONTAINER_BACKUP="${SERVICE_NAME}-backup"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKERFILE_PATH="$(dirname "$SCRIPT_DIR")/Dockerfile"
BACKEND_ROOT="$(dirname "$(dirname "$(dirname "$SCRIPT_DIR")")")"

echo ">>> Starting Upgrade Process for $SERVICE_NAME"

# 1. Pull latest changes
echo ">>> Pulling latest changes from git..."
git pull

# 2. Build new image
echo ">>> Building new Docker image..."
docker build -f "$DOCKERFILE_PATH" -t "$IMAGE_NAME:new" "$BACKEND_ROOT"

# 3. Cleanup any failed previous attempts
if [ "$(docker ps -aq -f name=^/${CONTAINER_NEW}$)" ]; then
    echo ">>> Cleaning up previous failed 'new' container..."
    docker rm -f "$CONTAINER_NEW"
fi

# 4. Start the new container
echo ">>> Starting new container ($CONTAINER_NEW)..."
# Add your specific run flags here (env vars, networks etc)
# Using strict limits as requested
docker run -d \
  --cpus="1.0" \
  --memory="2g" \
  --restart unless-stopped \
  --name "$CONTAINER_NEW" \
  "$IMAGE_NAME:new"

# 5. Health Check / Verification
echo ">>> Verifying new container health (waiting 10s)..."
sleep 10

if [ "$(docker ps -q -f status=running -f name=^/${CONTAINER_NEW}$)" ]; then
    echo ">>> New container is running."
    
    # Optional: Check logs for specific success message
    # if ! docker logs "$CONTAINER_NEW" | grep -q "Started"; then
    #    echo "!!! Health check failed: 'Started' not found in logs."
    #    docker stop "$CONTAINER_NEW"
    #    exit 1
    # fi
else
    echo "!!! New container failed to start or crashed."
    echo ">>> Logs:"
    docker logs "$CONTAINER_NEW"
    echo ">>> Aborting upgrade. Old container is still running."
    exit 1
fi

# 6. Cutover
echo ">>> validation successful. Performing cutover..."

# Stop the old container if it exists
if [ "$(docker ps -aq -f name=^/${CONTAINER_CURRENT}$)" ]; then
    echo ">>> Stopping current container..."
    docker stop "$CONTAINER_CURRENT"
    
    # Rename current to backup
    if [ "$(docker ps -aq -f name=^/${CONTAINER_BACKUP}$)" ]; then
        docker rm "$CONTAINER_BACKUP"
    fi
    docker rename "$CONTAINER_CURRENT" "$CONTAINER_BACKUP"
fi

# Rename new to current
docker rename "$CONTAINER_NEW" "$CONTAINER_CURRENT"

echo ">>> Upgrade Complete! New version is running as $CONTAINER_CURRENT."
echo ">>> Previous version is saved as $CONTAINER_BACKUP (stopped)."
