---
title: Sistema de Notificações Global
description: Como o NotificationBus, canais e workers conectam OpenClaw, Nanobot e agentes externos.
author: Junio de Almeida Vitorino
status: active
---

# Sistema de Notificações Centralizado

Este ecossistema traduz eventos de agentes (criminados pelo OpenClaw ou Nanobot) em mensagens direcionadas a canais reais (WhatsApp, Telegram, dashboard, etc.). A comunidade IA descobre tudo por meio da **skill `notification-skill`** e da **skill `notification-status`**.

## Componentes principais

- **NotificationBus** (node/CLI): expõe `publish`, `consume`, `status` e escolhe o adaptador (`file`, `redis`, `sqlite`, `mysql`, `postgres`). Usa `NOTIFY_BACKEND`/`NOTIFY_SECRET`.
- **ChannelRegistry**: armazena `channels.json` em `~/.ai-doc/notifications/` com `command`, `template`, `preferences` por agente e `fallback`.
- **notify-worker** (script/daemon): consome a fila e executa o comando definido no canal. Pode ser orquestrado via `scripts/run-notify-worker.sh` ou unit `notify-worker@.service`.
- **Workers/skills**: `notification-skill` publica eventos, `notify-all-channels` escreve para todos os canais, `notification-status` comenta o estado atual.

## Fluxo

1. Um agente publica `{ agentId, status, summary, channel?, channelTarget }` via `NotificationBus.publish`.
2. O worker lê o evento e rendeiza o template do canal escolhido (`${message}` etc.).
3. O `command` configurado chama o executor real (OpenClaw skill, Nanobot webhook, `curl` da API do Telegram).
4. O resultado é logado em `ApprovalLogger` e o status do canal permanece disponível via `notification-status`.

## Boas práticas

- Configure `channels.json` antes de disparar; cada canal deve documentar `executor`, `description`, `command`, `template`.
- Teste com `notify-all-channels` ou a opção `--all-channels` da skill `notification-skill`.
- Mantenha `NOTIFY_SECRET` sincronizado entre publishers e worker; sem ele os eventos são rejeitados.
- Use `notification-status` para descobrir:
  * Quais canais estão prontos
  * Qual backend está ativo
  * Onde estão os scripts/utilitários

## Limitações

- O worker executa comandos shell. As skills associadas devem validar/sanitizar o `channels.json`.
- Não há fallback automático para múltiplos canais; publique eventos distintos se quiser replicar a mesma mensagem em X canais.
- O backend `database` precisa de migrations manuais (tabela `notifications`) antes de ativar.

Use essas referências sempre que for explicar o sistema para outros agentes. Qualquer skill nova deve usar o `NotificationBus` e respeitar o `channel` escolhido.
