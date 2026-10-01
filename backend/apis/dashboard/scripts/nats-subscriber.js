#!/usr/bin/env node

import { connect } from 'nats';

// NATS connection configuration
const natsConfig = {
    servers: ['nats://localhost:4222'],
    user: 'admin',
    pass: 'adminPass',
};

async function subscribeWithJetStream() {
    try {
        console.log('🔌 Connecting to NATS with JetStream...');

        // Connect to NATS
        const nc = await connect(natsConfig);
        console.log('✅ Connected to NATS successfully');

        // Get JetStream manager and client
        const jsm = await nc.jetstreamManager();
        const js = nc.jetstream();
        console.log('🚀 JetStream initialized');

        // Create a stream if it doesn't exist
        try {
            await jsm.streams.add({
                name: 'EVENTS',
                subjects: ['workspace.>'],
            });
            console.log('📚 Created EVENTS stream');
        } catch (error) {
            if (!error.message.includes('stream already exists')) {
                throw error;
            }
            console.log('📚 EVENTS stream already exists');
        }

        console.log('👂 Creating JetStream consumer with ACK...');

        // Create the consumer first
        try {
            await jsm.consumers.add('EVENTS', {
                name: 'worker-consumer',
                durable_name: 'worker-consumer',
                ack_policy: 'explicit',
                deliver_policy: 'all',
                replay_policy: 'instant',
            });
            console.log('✅ Created JetStream consumer with ACK support');
        } catch (error) {
            if (!error.message.includes('already exists')) {
                throw error;
            }
            console.log('✅ JetStream consumer already exists');
        }

        // Now get the consumer
        const consumer = await js.consumers.get('EVENTS', 'event-monitor');
        console.log('✅ JetStream consumer ready with ACK support');

        // Subscribe to messages
        const messages = await consumer.consume();

        console.log('🎧 Listening for messages with ACK...');
        console.log('💡 Messages will be acknowledged after processing');

        for await (const msg of messages) {
            console.log(`📨 Received JetStream message:`);
            console.log(`   Subject: ${msg.subject}`);
            console.log(`   Sequence: ${msg.info.streamSequence}`);
            console.log(`   Data: ${msg.data ? msg.data.toString() : 'No data'}`);
            console.log(`   Time: ${new Date().toISOString()}`);

            // Process the message (simulate processing time)
            await new Promise(resolve => setTimeout(resolve, 100));

            // Acknowledge the message
            msg.ack();
            console.log(`   ✅ Message acknowledged`);
            console.log('---');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down subscriber...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 Shutting down subscriber...');
    process.exit(0);
});

// Run the subscriber
subscribeWithJetStream().catch(console.error);
