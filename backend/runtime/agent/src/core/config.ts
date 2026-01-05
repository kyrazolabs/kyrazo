import os from 'os';

export const config = {
    schedulerUrl: process.env.SCHEDULER_URL || '',
    serverApiKey: process.env.SERVER_API_KEY || '',
    serverId: process.env.SERVER_ID || '',
    masterSecret: process.env.AGENT_MASTER_SECRET || '',
    maxWorkers: Math.max(1, Math.floor(os.cpus().length * 0.8)),
    serverCores: os.cpus().length,
    pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS || '3000', 10),
    heartbeatIntervalMs: parseInt(
        process.env.HEARTBEAT_INTERVAL_MS || '5000',
        10
    ),
};

if (!config.serverApiKey) {
    console.error('❌ Missing SERVER_API_KEY environment variable');
    process.exit(1);
}

if (!config.serverId) {
    console.error('❌ Missing SERVER_ID environment variable');
    process.exit(1);
}

if (!config.masterSecret) {
    console.error('❌ Missing AGENT_MASTER_SECRET environment variable');
    process.exit(1);
}
