"use strict";

const NotificationBus = require('../core/notifications/bus');
const ChannelRegistry = require('../core/notifications/channel-registry');

const registry = new ChannelRegistry();
const channels = registry.config.channels || {};
const DEFAULT_TARGET = process.env.NOTIFY_TARGET || '+5511999999999';
const AGENT_ID = process.env.NOTIFY_AGENT || 'agent-nanobot';
const STATUS = process.env.NOTIFY_STATUS || 'status-update';
const SUMMARY = process.env.NOTIFY_SUMMARY || 'Atualização enviada por notify-all-channels';

if (Object.keys(channels).length === 0) {
    console.warn('Nenhum canal configurado; abortando.');
    process.exit(1);
}

(async () => {
    for (const channelId of Object.keys(channels)) {
        const payload = {
            agentId: AGENT_ID,
            status: STATUS,
            summary: SUMMARY,
            taskId: `notify-${Date.now()}-${channelId}`,
            channel: channelId,
            channelTarget: DEFAULT_TARGET,
            reference: 'notify-all-channels.js'
        };

        const resp = await NotificationBus.publish(payload);
        console.log(`evento lançado: ${channelId} (${resp.id})`);
    }
})();
