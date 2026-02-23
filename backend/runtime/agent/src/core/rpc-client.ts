import WebSocket from 'ws'; // Bun has built-in WebSocket, but for type safety we might use 'ws' type or generic.
// Actually Bun's global WebSocket is available.
import {
    type AgentToServerMessage,
    type ServerToAgentMessage,
    type ServerToAgentSchema as SchemaType,
    ServerToAgentSchema, // Not needed if just importing
} from '@kyrazo/shared';

// Actually ServerToAgentSchema is a Zod schema (runtime value), so NOT type-only.
// But ServerToAgentMessage IS a type.
// I need `ServerToAgentSchema` as a value.
// StartWorkerPayload ... types.
import { Agent } from './agent';

export class RpcClient {
    private ws: WebSocket | null = null;
    private url: string;
    private heartbeatInterval: Timer | null = null;
    private agentKey: string;
    private shouldReconnect = true;
    private reconnectInterval = 5000;
    private agent: Agent;

    constructor(agent: Agent, schedulerUrl: string, agentKey: string) {
        this.agent = agent;
        // Ensure 'ws' if 'http'
        this.url = schedulerUrl.replace(/^http/, 'ws');
        console.log(`[RpcClient] Scheduler URL resolved to: ${this.url}`);
        this.agentKey = agentKey;
    }

    public connect() {
        console.log(`Connecting to Scheduler at ${this.url}...`);
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
            console.log('✅ Connected to Scheduler');
            this.reconnectInterval = 5000; // Reset backoff on success
            this.authenticate();
            this.startHeartbeatLoop();
        };

        this.ws.onmessage = event => {
            this.handleMessage(event.data);
        };

        this.ws.onclose = () => {
            console.log('❌ Disconnected from Scheduler');
            this.stopHeartbeatLoop();
            this.ws = null;
            if (this.shouldReconnect) {
                // Add simple backoff (max 30s)
                const delay = Math.min(this.reconnectInterval, 30000);
                console.log(`Reconnecting in ${delay / 1000}s...`);
                setTimeout(() => this.connect(), delay);
                this.reconnectInterval *= 1.5; // Exponential backoff
            }
        };

        this.ws.onerror = err => {
            console.error('WebSocket Error:', err);
            // Close will trigger reconnect
        };
    }

    private authenticate() {
        const ip = process.env.PUBLIC_IP;
        const msg: AgentToServerMessage = {
            type: 'CONNECT',
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            payload: { agentKey: this.agentKey, ip },
        };
        this.send(msg);
    }

    private handleMessage(data: any) {
        try {
            const raw = data.toString();
            const json = JSON.parse(raw);
            const parsed = ServerToAgentSchema.safeParse(json);

            if (!parsed.success) {
                console.error('Invalid Message from Server:', parsed.error);
                return;
            }

            const msg = parsed.data;
            switch (msg.type) {
                case 'START_WORKER':
                    this.agent.handleStartWorker(msg.payload, msg.id);
                    break;
                case 'STOP_WORKER':
                    this.agent.handleStopWorker(msg.payload, msg.id);
                    break;
                case 'HEALTH_CHECK':
                    this.agent.handleHealthCheck(msg.id);
                    break;
            }
        } catch (err) {
            console.error('Error handling message:', err);
        }
    }

    public send(msg: AgentToServerMessage) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(msg));
        }
    }

    public close() {
        this.shouldReconnect = false;
        this.ws?.close();
        this.stopHeartbeatLoop();
    }

    private startHeartbeatLoop() {
        this.stopHeartbeatLoop();
        this.heartbeatInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                // Trigger Agent to send Heartbeat
                this.agent.handleHealthCheck(crypto.randomUUID());
            }
        }, 15000); // 15 seconds
    }

    public getStatus(): 'connecting' | 'open' | 'closing' | 'closed' | 'not_initialized' {
        if (!this.ws) return 'not_initialized';
        switch (this.ws.readyState) {
            case WebSocket.CONNECTING:
                return 'connecting';
            case WebSocket.OPEN:
                return 'open';
            case WebSocket.CLOSING:
                return 'closing';
            case WebSocket.CLOSED:
                return 'closed';
            default:
                return 'not_initialized';
        }
    }

    private stopHeartbeatLoop() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }
}
