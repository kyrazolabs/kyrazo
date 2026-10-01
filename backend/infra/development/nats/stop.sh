#!/usr/bin/env bash
set -e

BASE_DIR=$(dirname "$0")

for NODE in 1 2 3; do
  PID_FILE="$BASE_DIR/logs/srv$NODE.pid"
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    kill $PID || true
    rm "$PID_FILE"
    echo "Stopped NATS node srv$NODE"
  fi
done
