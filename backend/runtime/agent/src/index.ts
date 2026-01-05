import { Agent } from './core/agent';

const agent = new Agent();

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('Stopping Agent...');
    process.exit(0);
});

// Start the agent
agent.start().catch(err => {
    console.error('Fatal Agent Error:', err);
    process.exit(1);
});
