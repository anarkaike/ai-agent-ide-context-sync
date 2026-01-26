const vscode = require('vscode');
const AIClient = require('../ai-client');

class RitualScheduler {
    constructor(context, i18n, intervalMs = 60 * 60 * 1000) {
        this.context = context;
        this.i18n = i18n;
        this.intervalMs = intervalMs;
        this.timer = null;
        this.client = new AIClient();
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 90);
        this.statusBarItem.text = this.i18n ? this.i18n.t('ritualScheduler.statusText') : "$(pulse) AI Kernel";
        this.statusBarItem.tooltip = this.i18n ? this.i18n.t('ritualScheduler.statusTooltip') : "AI Kernel Monitor Active";
        this.statusBarItem.command = "ai-agent-sync.status";
    }

    start() {
        if (this.timer) return;
        
        this.statusBarItem.show();
        console.log('[RitualScheduler] Started monitoring.');
        
        // Initial check after 1 minute (let workspace load)
        setTimeout(() => this.check(), 60 * 1000);

        this.timer = setInterval(() => {
            this.check();
        }, this.intervalMs);
    }

    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.statusBarItem.hide();
        console.log('[RitualScheduler] Stopped monitoring.');
    }

    async check() {
        console.log('[RitualScheduler] Checking for drift...');
        try {
            // Run evolution check (lightweight)
            const output = await this.client.evolveRules();
            
            // Analyze output for drift signals
            // CLI output usually contains "Drift Detected" or low scores
            if (output.includes('Drift detectado') || output.includes('Score baixo')) {
                this.notifyDrift(output);
            } else {
                console.log('[RitualScheduler] No critical drift detected.');
            }
        } catch (error) {
            if (AIClient.logger) {
                AIClient.logger.error('[RitualScheduler] Check failed:', error);
            } else {
                console.error('[RitualScheduler] Check failed:', error);
            }
        }
    }

    async notifyDrift(details) {
        const runRitualLabel = this.i18n ? this.i18n.t('ritualScheduler.runRitual') : 'Rodar Ritual';
        const ignoreLabel = this.i18n ? this.i18n.t('ritualScheduler.ignore') : 'Ignorar';
        
        const action = await vscode.window.showWarningMessage(
            this.i18n ? this.i18n.t('ritualScheduler.driftDetected') : 'AI Kernel: Drift detectado nas regras. O contexto pode estar desatualizado.',
            runRitualLabel,
            ignoreLabel
        );

        if (action === runRitualLabel) {
            vscode.commands.executeCommand('ai-agent-sync.ritual');
        }
    }
}

module.exports = RitualScheduler;
