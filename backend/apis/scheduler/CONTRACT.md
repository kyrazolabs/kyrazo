# Scheduler <-> Agent HTTP Contract

This document defines the strict HTTP contract between the **Scheduler (Control Plane)** and **Server Agents**.

## 1. Protocol Overview

- **Protocol**: HTTP/1.1
- **Content-Type**: `application/json`
- **Encoding**: UTF-8
- **Date Format**: ISO 8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`)

## 2. Authentication

All requests from the Agent to the Scheduler often MUST include the API Key in the `Authorization` header.

- **Header**: `Authorization`
- **Format**: `Bearer <SERVER_API_KEY>`
- **Validation**: The Scheduler validates this against the `servers` table.
- **Error**: `401 Unauthorized` if missing or invalid.

## 3. Shared Types (TypeScript)

```typescript
// --- Enums ---
export type ServerStatus = "active" | "draining" | "down";
export type WorkerStatus =
  | "pending"
  | "starting"
  | "running"
  | "stopping"
  | "stopped"
  | "failed";
export type CommandType = "START_WORKER" | "STOP_WORKER";
export type CommandStatus = "pending" | "acked" | "completed" | "failed";

// --- Payloads ---

// POST /servers/register
export interface RegisterServerRequest {
  cores: number; // e.g. 4
  max_workers: number; // e.g. 10
}

export interface RegisterServerResponse {
  serverId: string; // UUID
  apiKey: string; // If cycled, or confirming current
}

// POST /servers/commands/ack
export interface AckCommandRequest {
  commandId: string; // UUID
  status: "acked" | "completed" | "failed";
}

// --- Commands (GET /servers/commands) ---

export interface BaseCommand {
  command_id: string; // UUID
  type: CommandType;
  created_at: string; // ISO Date
}

export interface StartWorkerPayload {
  workerId: string; // UUID
  clientId: string; // UUID
  scriptPath?: string;
  env?: Record<string, string>;
}

export interface StopWorkerPayload {
  workerId: string; // UUID
}

export interface StartWorkerCommand extends BaseCommand {
  type: "START_WORKER";
  payload: StartWorkerPayload;
}

export interface StopWorkerCommand extends BaseCommand {
  type: "STOP_WORKER";
  payload: StopWorkerPayload;
}

export type AgentCommand = StartWorkerCommand | StopWorkerCommand;
```

## 4. Endpoints

### 4.1 Register Server

- **URL**: `POST /servers/register`
- **Purpose**: Announces server availability and capacity.
- **Idempotency**: Safe to call multiple times. Updates capacity if changed.

### 4.2 Send Heartbeat

- **URL**: `POST /servers/heartbeat`
- **Purpose**: Update Liveness.
- **Frequency**: Every 5 seconds.
- **Response**: `200 OK`
- **Failure**: If 401, Agent must stop and log fatal error.

### 4.3 Poll Commands

- **URL**: `GET /servers/commands`
- **Purpose**: Fetch pending commands.
- **Response**: `200 OK` with `{ commands: AgentCommand[] }`.
- **Logic**: Returns all commands in `pending` state for this server.

### 4.4 Acknowledge Command

- **URL**: `POST /servers/commands/ack`
- **Purpose**: Confirm receipt or execution result.
- **Logic**:
  - Agent receives command -> Sends `acked` (Optional, if long running).
  - Agent finishes -> Sends `completed` or `failed`.
  - Scheduler updates DB.

## 5. Failure Scenarios & Recovery

### 5.1 Idempotency

- **Agents MUST** track executed `command_id`s (in memory or check process list) to prevent double-execution if they receive the same command twice (e.g. ACK failed so Scheduler resent it).
- **Scheduler** resends `pending` commands until ACKed or timeout (dead server).

### 5.2 Network Partition

- **Agent**: If Heartbeat fails > 3 times, Agent should assume it's partitioned. It **MAY** continue running existing workers but **SHOULD NOT** start new ones until connection restores.
- **Scheduler**: If Heartbeat missing > 30s, Server marked `DOWN`. Workers rescheduled to other nodes.
- **Recovery**: When Agent reconnects, it calls Register/Heartbeat. Scheduler marks `ACTIVE`.
  - _Conflict_: If Scheduler rescheduled workers, the old Agent might still be running them.
  - _Resolution_: Agent should reconcile running workers with Scheduler state (advanced) OR Scheduler sends `STOP_WORKER` for everything that shouldn't be valid (Kill Zombie workers).

### 5.3 Crash Recovery

- **Agent Restart**: Agent checks PM2 list. Re-registers.
- **Scheduler**: Sees new Register. Syncs state.
