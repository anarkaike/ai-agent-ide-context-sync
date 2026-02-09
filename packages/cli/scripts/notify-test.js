#!/usr/bin/env node
"use strict";

const fs = require('fs');
const path = require('path');
const NotificationBus = require('../core/notifications/bus');
const ChannelRegistry = require('../core/notifications/channel-registry');

const registry = new ChannelRegistry();
const channels = registry.config.channels || {};

if (Object.keys(channels).length === 0) {
    console.log('Nenhum canal configurado em ~/.ai-doc/notifications/channels.json');
    process.exit(1);
}

console.log('Canais disponíveis:');
Object.keys(channels).forEach(id => {
    console.log(`- ${id}: ${channels[id].description || channels[id].name}`);
});

const agentId = process.env.NOTIFY_TEST_AGENT || 'agent-nanobot';
const testStatus = process.env.NOTIFY_TEST_STATUS || 'test-event';
const testSummary = process.env.NOTIFY_TEST_SUMMARY || 'Teste automático de notificações';

(async () => {
    for (const channelId of Object.keys(channels)) {
        console.log(`\nPublicando evento de teste para canal ${channelId}...`);
        const payload = {
            agentId,
            status: testStatus,
            summary: testSummary,
            taskId: `test-${Date.now()}`,
            channel: channelId,
            channelTarget: process.env.NOTIFY_TEST_TARGET || '+5511999999999',
            reference: 'Painel de testes'
        };

        const result = await NotificationBus.publish(payload);
        console.log(`Evento ${result.id} inserido para ${channelId}`);
    }
})();
