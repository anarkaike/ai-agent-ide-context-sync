"use strict";

const fs = require('fs');
const path = require('path');
const ChannelRegistry = require('../packages/cli/core/notifications/channel-registry');

const registry = new ChannelRegistry();
const channels = registry.config.channels || {};
const allowedPlaceholders = ['message', 'target', 'agentId', 'status', 'summary', 'reference', 'channel'];
const envPattern = /\$\{([A-Z0-9_]+)\}/g;
const requiredEnvNames = new Set(['TELEGRAM_BOT_TOKEN', 'WHATSAPP_FROM', 'WHATSAPP_TO', 'NOTIFY_SECRET']);

if (Object.keys(channels).length === 0) {
    console.error('Nenhum canal configurado; configure ~/.ai-doc/notifications/channels.json antes de rodar.');
    process.exit(1);
}

const problems = [];
const rows = [];
const envUsed = new Set();

for (const [id, config] of Object.entries(channels)) {
    if (!config.command || !config.template) {
        problems.push(`Canal ${id} precisa de "command" e "template".`);
        continue;
    }

    const combined = `${config.command}${config.template}`;
    const matches = Array.from(combined.matchAll(envPattern));
    const placeholders = Array.from(new Set(matches.map(m => m[1])));

    matches.forEach(([, name]) => {
        if (/^[A-Z0-9_]+$/.test(name)) {
            envUsed.add(name);
            if (requiredEnvNames.has(name) && !process.env[name]) {
                problems.push(`Canal ${id} depende da variável de ambiente ${name} que não está definida.`);
            }
        }
    });

    const invalid = placeholders.filter(ph => {
        const isAllowedPlaceholder = allowedPlaceholders.includes(ph);
        const isEnvLike = /^[A-Z0-9_]+$/.test(ph);
        return !isAllowedPlaceholder && !isEnvLike;
    });
    if (invalid.length) {
        problems.push(`Canal ${id} usa placeholders não permitidos: ${invalid.join(', ')}.`);
    }

    rows.push(`| ${id} | ${config.executor || 'local'} | ${config.description || '-'} | \`${config.command}\` | \`${config.template}\` |`);
}

if (problems.length) {
    console.error('Problemas detectados:');
    problems.forEach(problem => console.error(`- ${problem}`));
    process.exit(1);
}

const docPath = path.join(__dirname, '..', 'docs', '40--tech-manual', '20--project-architecture-patterns', 'notification-channels.md');
const envSection = envUsed.size
    ? Array.from(envUsed)
        .map(env => `- ${env} (${process.env[env] ? 'definida' : 'não definida'})`)
        .join('\n')
    : '- Nenhuma variável de ambiente detectada.';
const content = `---
title: Catálogo de Canais de Notificação
subtitle: Atualizado automaticamente por scripts/sync-notification-channels.js
status: active
---

## Canais configurados

Este documento é gerado automaticamente a partir de \`.ai-doc/notifications/channels.json\`. Sempre que algum canal for alterado execute este script para manter a documentação sincronizada.

| ID | Executor | Descrição | Comando | Template |
| --- | --- | --- | --- | --- |
${rows.join('\n')}

## Uso

- Cada canal descreve o executor real (OpenClaw skill, Nanobot webhook, curl...) e o template que o worker popula.  
- Quando um agente publica um evento sem `channel` explícito, a preferência em `preferences` e o `fallback` definem qual canal será usado.  
- Os scripts `notify-all-channels` e `notification-skill --all-channels` usam este catálogo para saber quais destinos testar.

Gerencie os tokens (Twilio, Telegram, etc.) via `scripts/run-notify-worker.sh` ou via `systemd`/variáveis de ambiente para que os comandos funcionem.

## Variáveis de ambiente detectadas

${envSection}
`;

fs.writeFileSync(docPath, content, 'utf-8');
console.log(`Documentação atualizada em ${docPath}`);
