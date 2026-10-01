#!/usr/bin/env bash
set -e

BASE_DIR=$(dirname "$0")

echo "Starting NATS JetStream cluster..."

nats-server -c "$BASE_DIR/srv1.conf" > "$BASE_DIR/srv1.log" 2>&1 &
PID1=$!

# nats-server -c "$BASE_DIR/srv2.conf" > "$BASE_DIR/srv2.log" 2>&1 &
# PID2=$!

# nats-server -c "$BASE_DIR/srv3.conf" > "$BASE_DIR/srv3.log" 2>&1 &
# PID3=$!

echo $PID1 > "$BASE_DIR/logs/srv1.pid"
# echo $PID2 > "$BASE_DIR/logs/srv2.pid"
# echo $PID3 > "$BASE_DIR/logs/srv3.pid"

echo "Cluster started (3 nodes). Logs: srv1.log, srv2.log, srv3.log"
