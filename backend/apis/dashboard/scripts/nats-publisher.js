#!/usr/bin/env node

import { connect } from 'nats';

// NATS connection configuration
const natsConfig = {
    servers: ['nats://localhost:4222'],
    user: 'admin',
    pass: 'adminPass',
};

async function publishToJetStream() {
    try {
        console.log('🔌 Connecting to NATS for publishing...');

        // Connect to NATS
        const nc = await connect(natsConfig);
        console.log('✅ Connected to NATS successfully');

        // Get JetStream client
        const js = nc.jetstream();
        console.log('🚀 JetStream client ready');

        // Publish a test message
        const subject = 'events.test';
        const message = {
            eventId: `test-${Date.now()}`,
            eventType: 'TEST',
            workspaceId: 'test-workspace',
            webhookId: 'test-webhook',
            timestamp: new Date().toISOString(),
            data: {
                message: 'Hello from JetStream with ACK!',
                timestamp: new Date().toISOString(),
            },
            targets: 1,
            producerId: 'test-publisher',
        };

        console.log(`📤 Publishing to subject: ${subject}`);
        const pubAck = await js.publish(subject, JSON.stringify(message));

        console.log('✅ Message published successfully!');
        console.log(`   Stream: ${pubAck.stream}`);
        console.log(`   Sequence: ${pubAck.seq}`);
        console.log(`   Duplicate: ${pubAck.duplicate || false}`);

        await nc.drain();
        console.log('👋 Connection drained');
    } catch (error: any) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Run the publisher
publishToJetStream().catch(console.error);
