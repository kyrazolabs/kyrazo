import { config } from '@/core/config';
import type { AgentCommand } from '@/core/types';

export class ControlApi {
    private static headers = {
        'Content-Type': 'application/json',
        'X-Server-Key': config.serverApiKey,
        'X-Server-Id': config.serverId,
    };

    static async register(metadata: { cores: number; max_workers: number }) {
        try {
            const res = await fetch(`${config.schedulerUrl}/servers/register`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(metadata),
            });

            if (!res.ok)
                throw new Error(`Registration failed: ${res.statusText}`);
            console.log('✅ Server registered successfully');

            return await res.json();
        } catch (error) {
            console.error('❌ Failed to register server:', error);
            throw error;
        }
    }

    static async heartbeat() {
        try {
            const res = await fetch(
                `${config.schedulerUrl}/servers/heartbeat`,
                {
                    method: 'POST',
                    headers: this.headers,
                }
            );
            if (!res.ok) console.warn(`Heartbeat failed: ${res.status}`);
            console.log('✅ Heartbeat sent successfully');
        } catch (error) {
            console.error('❌ Failed to send heartbeat:', error);
        }
    }

    static async getCommands(): Promise<AgentCommand[]> {
        try {
            const res = await fetch(`${config.schedulerUrl}/servers/commands`, {
                headers: this.headers,
            });
            if (!res.ok) return [];
            const data = (await res.json()) as { commands: AgentCommand[] };
            console.log('✅ Commands fetched successfully');
            return data.commands || [];
        } catch (error) {
            console.error('❌ Failed to fetch commands:', error);
            return [];
        }
    }

    static async ackCommand(
        commandId: string,
        status: 'acked' | 'completed' | 'failed'
    ) {
        try {
            await fetch(`${config.schedulerUrl}/servers/commands/ack`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({ commandId, status }),
            });
            console.log(`✅ Command ${commandId} acked successfully`);
        } catch (error) {
            console.error(`❌ Failed to ack command ${commandId}:`, error);
        }
    }
}
