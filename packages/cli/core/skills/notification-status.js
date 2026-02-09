const { Command } = require('@oclif/core');
const ChannelRegistry = require('../notifications/channel-registry');
const NotificationBus = require('../notifications/bus');
const { execSync } = require('child_process');
const path = require('path');

class NotificationStatus extends Command {
  static description = 'Informa como o sistema de notificações está configurado, incluindo canais, backend e scripts úteis.';

  static flags = {
    showChannels: Command.flags.boolean({
      char: 'c',
      description: 'Mostra cada canal configurado com executor e comando',
      default: true
    }),
    runTests: Command.flags.boolean({
      char: 't',
      description: 'Dispara o script notify-all-channels para testar todos os canais',
      default: false
    }),
    startWorker: Command.flags.boolean({
      char: 'w',
      description: 'Inicia o worker via scripts/run-notify-worker.sh (para uso manual/desenvolvimento)',
      default: false
    })
  };

  async run() {
    const { flags } = await this.parse(NotificationStatus);
    const registry = new ChannelRegistry();
    const channels = registry.config.channels || {};
    const preferences = registry.config.preferences || {};
    const fallback = registry.config.fallback?.channel || 'whatsapp';
    const backend = process.env.NOTIFY_BACKEND || 'file';
    const secretInfo = process.env.NOTIFY_SECRET ? 'definida' : 'não definida';

    this.log('\n== Notificação global ==');
    this.log(`Backend ativo: ${backend} (${secretInfo})`);
    this.log(`Preferência fallback: ${fallback}`);
    this.log(`Channels configurados: ${Object.keys(channels).length}`);

    if (flags.showChannels) {
      for (const channelId of Object.keys(channels)) {
        const config = channels[channelId];
        this.log(`\n- Canal: ${channelId}`);
        this.log(`  executor: ${config.executor || 'desconhecido'}`);
        this.log(`  descrição: ${config.description || config.name || '-'}`);
        this.log(`  comando: ${config.command || '(sem comando)'}`);
        this.log(`  template: ${config.template || '-'} `);
        const prefers = Object.entries(preferences)
          .filter(([, v]) => v === channelId)
          .map(([k]) => k);
        if (prefers.length) {
          this.log(`  preferido por: ${prefers.join(', ')}`);
        }
      }
    }

    const status = await NotificationBus.status();
    this.log('\nFila:');
    this.log(`  pendentes: ${status.pending ?? '-'}`);
    this.log(`  processados: ${status.processed ?? '-'}`);

    this.log('\nSkills disponíveis: notification-skill (publica eventos) e notify-all-channels.');
    this.log('Rodar notify-worker (script ou systemd) mantém o loop processando a fila.');

    if (flags.runTests) {
      this.log('\nDisparando notify-all-channels...');
      execSync(
        'node packages/cli/scripts/notify-all-channels.js',
        { stdio: 'inherit', cwd: path.resolve(__dirname, '../../..') }
      );
    }

    if (flags.startWorker) {
      this.log('\nIniciando worker em primeiro plano...');
      execSync(
        'bash scripts/run-notify-worker.sh',
        { stdio: 'inherit', cwd: path.resolve(__dirname, '../../..') }
      );
    }
  }
}

module.exports = NotificationStatus;
