#!/usr/bin/env node
"use strict";

const NotificationBus = require('../core/notifications/bus');
const ChannelRegistry = require('../core/notifications/channel-registry');
const ApprovalLogger = require('../core/security/ApprovalLogger');
const { spawnSync } = require('child_process');
const registry = new ChannelRegistry();

function renderTemplate(template = '', context = {}) {
    return template.replace(/\$\{([^}]+)\}/g, (_, key) => {
        return context[key.trim()] ?? context[key.trim().split('.')[0]] ?? '';
    });
}

async function notify(event) {
    const channelId = event.channel || 'whatsapp';
    const channelConfig = registry.getChannelConfig(channelId);
    if (!channelConfig) {
        console.warn(`[worker] Canal configurado inexistente: ${channelId}`);
        return { handled: true };
    }

    const context = {
        agentId: event.agentId,
        taskId: event.taskId,
        status: event.status,
        summary: event.summary,
        message: event.message || event.summary,
        target: event.channelTarget || event.target || event.agentId,
        reference: event.reference || ''
    };

    const renderedMessage = renderTemplate(channelConfig.template || '${message}', context);
    const commandTemplate = channelConfig.command;
    let result = {};
    if (commandTemplate) {
        const command = renderTemplate(commandTemplate, { ...context, message: renderedMessage });
        result = spawnSync('sh', ['-c', command], { encoding: 'utf8' });

        if (result.error) {
            console.error('[worker] Falha ao executar canal', result.error.message);
        }

        if (result.stderr) {
            console.warn(result.stderr);
        }
    } else {
        console.warn(`[worker] Canal ${channelId} não possui comando configurado.`);
    }

    ApprovalLogger.logDecision({
        action: 'notification',
        level: 'INFO',
        agentId: event.agentId,
        reason: `sent:${channelId}`,
        context: event.summary || renderedMessage,
        meta: { channel: channelId, result }
    });
    return { handled: true };
}

async function loop() {
    while (true) {
        await NotificationBus.consume(async event => notify(event));
        await new Promise(r => setTimeout(r, 1000));
    }
}

loop().catch(err => {
    console.error('worker erro', err);
    process.exit(1);
});
