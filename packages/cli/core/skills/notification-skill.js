const { Command } = require('@oclif/core');
const NotificationBus = require('../notifications/bus');
const ChannelRegistry = require('../notifications/channel-registry');

class NotificationSkill extends Command {
  static description = 'Skill para publicar eventos de notificação em todos os canais configurados.';

  static flags = {
    agent: Command.flags.string({
      char: 'a',
      description: 'ID do agente associado ao evento',
      default: 'agent-nanobot'
    }),
    status: Command.flags.string({
      char: 's',
      description: 'Status a ser reportado',
      default: 'test-event'
    }),
    summary: Command.flags.string({
      char: 'm',
      description: 'Resumo da execução',
      default: 'Teste automático de notificações'
    }),
    task: Command.flags.string({
      char: 't',
      description: 'ID da task/execution context',
      default: `test-${Date.now()}`
    }),
    channel: Command.flags.string({
      char: 'c',
      description: 'Canal sobreescrito (se não, toma preferência configurada)',
    }),
    allChannels: Command.flags.boolean({
      char: 'a',
      description: 'Publica um evento em todos os canais configurados',
      default: false
    }),
    target: Command.flags.string({
      char: 'T',
      description: 'Destinatário (número, webhook, etc.)',
      default: '+5511999999999'
    })
  };

  async run() {
    const { flags } = await this.parse(NotificationSkill);
    const registry = new ChannelRegistry();
    const defaults = registry.config.channels || {};
    const targetChannels = flags.allChannels
      ? Object.keys(defaults)
      : flags.channel
        ? [flags.channel]
        : [];

    const basePayload = {
      agentId: flags.agent,
      status: flags.status,
      summary: flags.summary,
      taskId: flags.task,
      channelTarget: flags.target,
      reference: `Skill notification-test ${new Date().toISOString()}`
    };

    if (flags.allChannels) {
      if (targetChannels.length === 0) {
        this.error('Não há canais configurados para enviar (channels.json vazio).');
        return;
      }
      for (const channelId of targetChannels) {
        await this.publishForChannel(channelId, basePayload);
      }
      return;
    }

    if (!flags.channel && !flags.allChannels) {
      await this.publishForChannel(undefined, basePayload);
      return;
    }

    await this.publishForChannel(flags.channel, basePayload);
  }

  async publishForChannel(channelId, basePayload) {
    const payload = {
      ...basePayload,
      channel: channelId,
      taskId: `${basePayload.taskId}-${channelId || 'preferred'}`
    };
    const result = await NotificationBus.publish(payload);
    this.log(`Evento enviado para ${channelId || 'preferência'}: ${result.id}`);
  }
}

module.exports = NotificationSkill;
