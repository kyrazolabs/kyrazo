#!/bin/sh
set -e

LOG_DIR="/app/services/ingestor/logs"

# Ensure the logs directory exists and is writable by the bun user (UID 1000)
# This runs as root so it works even when the host volume is owned by root.
mkdir -p "$LOG_DIR"
chown -R bun:bun "$LOG_DIR"
chmod 775 "$LOG_DIR"

# Drop down to the bun user and start the application
exec su-exec bun bun run start
