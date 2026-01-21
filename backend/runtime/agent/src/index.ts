import { Agent } from './core/agent';

const agent = new Agent();

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('Stopping Agent...');
    process.exit(0);
});

// Start the agent
agent
    .start()
    .then(() => {
        // Start health check server
        const port = parseInt(process.env.AGENT_HEALTH_PORT || '4400', 10);
        Bun.serve({
            port,
            async fetch(req) {
                const url = new URL(req.url);
                if (url.pathname === '/health') {
                    const health = await agent.getHealth();
                    return new Response(JSON.stringify(health), {
                        status: health.success ? 200 : 503,
                        headers: { 'Content-Type': 'application/json' },
                    });
                }
                return new Response('Not Found', { status: 404 });
            },
        });
        console.log(`📡 Health check server running on port ${port}`);
    })
    .catch(err => {
        console.error('Fatal Agent Error:', err);
        process.exit(1);
    });
