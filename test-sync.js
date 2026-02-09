#!/usr/bin/env node

const NeuralLink = require('./packages/cli/core/swarm/NeuralLink.js');
const DatabaseManager = require('./packages/cli/core/swarm/DatabaseManager.js');

async function testSync() {
    console.log('🧪 Testing Neural Link synchronization...');

    try {
        // Initialize database
        const dbManager = new DatabaseManager();
        await dbManager.init();

        // Initialize Neural Link
        const neuralLink = new NeuralLink(dbManager);

        // Send a test message
        const testMessage = {
            id: `test-${Date.now()}`,
            from: 'cascade-test',
            to: 'broadcast',
            content: 'Testing synchronization across agents',
            type: 'system',
            timestamp: new Date().toISOString()
        };

        console.log('📤 Sending test message:', testMessage);
        await neuralLink.sendMessage(testMessage);

        // Try to sync
        console.log('🔄 Syncing messages...');
        await neuralLink.sync();

        // Get messages
        const messages = await dbManager.getMessages(10);
        console.log(`📨 Found ${messages.length} messages in database`);

        messages.forEach(msg => {
            console.log(`  - ${msg.from}: ${msg.content}`);
        });

        console.log('✅ Test completed');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testSync();
