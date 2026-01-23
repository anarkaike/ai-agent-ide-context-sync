const vscode = require('vscode');
const path = require('path');
const AIClient = require('./ai-client');

let i18nRef = null;

function t(key, ...args) {
    if (i18nRef) {
        return i18nRef.t(key, ...args);
    }
    return key;
}

class AutomationTreeProvider {
    constructor(i18n) {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.client = new AIClient();
        i18nRef = i18n || i18nRef;
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element) {
        return element;
    }

    async getChildren(element) {
        if (!element) {
            // Root items
            const items = [];

            // 1. Generate Smart Prompt
            const promptItem = new vscode.TreeItem(t('automation.generatePromptLabel'));
            promptItem.command = {
                command: 'ai-agent-sync.generatePrompt',
                title: t('automation.generatePromptLabel')
            };
            promptItem.tooltip = t('automation.generatePromptTooltip');
            items.push(promptItem);

            // 1.1 Maintenance Section (New)
            const maintenanceItem = new vscode.TreeItem(t('automation.maintenanceSectionLabel'), vscode.TreeItemCollapsibleState.Expanded);
            maintenanceItem.contextValue = 'maintenance-section';
            items.push(maintenanceItem);

            // 2. Workflows Section
            const workflowsItem = new vscode.TreeItem(t('automation.workflowsSectionLabel'), vscode.TreeItemCollapsibleState.Expanded);
            workflowsItem.contextValue = 'workflows-section';
            items.push(workflowsItem);

            // 3. Rules Section
            const rulesItem = new vscode.TreeItem(t('automation.rulesSectionLabel'), vscode.TreeItemCollapsibleState.Collapsed);
            rulesItem.contextValue = 'rules-section';
            items.push(rulesItem);

            return items;
        }

        if (element.contextValue === 'maintenance-section') {
            const items = [];
            
            items.push(this.createActionItem(
                t('automation.scanDocsLabel'), 
                'ai-agent-sync.scanDocs', 
                [], 
                t('automation.scanDocsTooltip')
            ));

            items.push(this.createActionItem(
                t('automation.runRitualLabel'), 
                'ai-agent-sync.ritual', 
                [], 
                t('automation.runRitualTooltip')
            ));

            items.push(this.createActionItem(
                t('automation.evolveRulesLabel'), 
                'ai-agent-sync.evolve', 
                [], 
                t('automation.evolveRulesTooltip')
            ));

            return items;
        }

        if (element.contextValue === 'rules-section') {
            try {
                const output = await this.client.listRules();
                // Remove ANSI colors
                const cleanOutput = output.replace(/\x1b\[[0-9;]*m/g, '');
                const lines = cleanOutput.split('\n');
                const rules = [];
                
                lines.forEach(line => {
                    const trimmed = line.trim();
                    // Captura linhas que parecem regras (começam com traço ou bullet)
                    if (trimmed.length > 3 && (trimmed.startsWith('-') || trimmed.startsWith('*'))) {
                        const ruleItem = new vscode.TreeItem(trimmed);
                        ruleItem.iconPath = new vscode.ThemeIcon('law');
                        rules.push(ruleItem);
                    }
                });
                
                if (rules.length === 0) {
                     return [new vscode.TreeItem('No active rules found')];
                }
                return rules;
            } catch (e) {
                return [new vscode.TreeItem('Error loading rules')];
            }
        }

        if (element.contextValue === 'workflows-section') {
            try {
                // List workflows from CLI
                // Requires CLI to output clean JSON or we parse it
                // For now, let's hardcode the 'create-component' we know exists or try to fetch
                // Wait, AIClient.listWorkflows is imperfect currently.
                // Let's implement a direct file reader for now in the TreeProvider to be fast/robust
                // Or better: AIClient should be fixed to return robust list.
                // Let's assume AIClient returns empty list and we add a "Run..." generic item

                const items = [];
                items.push(this.createActionItem(t('automation.runWorkflowPromptLabel'), 'ai-agent-sync.runWorkflowInput', [], t('automation.runWorkflowPromptTooltip')));

                // Demo workflows (hardcoded for stability until CLI JSON output is ready)
                const demoWf = new vscode.TreeItem(t('automation.demoWorkflowLabel'));
                demoWf.command = {
                    command: 'ai-agent-sync.runWorkflow',
                    title: t('automation.runWorkflowLabel'),
                    arguments: ['create-component']
                };
                demoWf.iconPath = new vscode.ThemeIcon('play');
                items.push(demoWf);

                return items;
            } catch (e) {
                return [new vscode.TreeItem('Error loading workflows')];
            }
        }

        return [];
    }

    createActionItem(label, command, args = [], tooltip = '') {
        const item = new vscode.TreeItem(label);
        item.command = {
            command: command,
            title: label,
            arguments: args
        };
        if (tooltip) {
            item.tooltip = tooltip;
        }
        return item;
    }
}

/**
 * Handle Generate Smart Prompt
 */
async function handleGeneratePrompt() {
    const goal = await vscode.window.showInputBox({
        placeHolder: t('automation.generatePromptPlaceholder'),
        prompt: t('automation.generatePromptPrompt')
    });

    if (!goal) return;

    const client = new AIClient(); // Re-instantiate to adapt to workspace root if needed

    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Generating Smart Prompt...",
        cancellable: false
    }, async (progress) => {
        try {
            const prompt = await client.generatePrompt(goal);

            // Show result in a new document
            const doc = await vscode.workspace.openTextDocument({
                content: prompt,
                language: 'markdown'
            });
            await vscode.window.showTextDocument(doc);

        } catch (e) {
            vscode.window.showErrorMessage(`Error generating prompt: ${e}`);
        }
    });
}

/**
 * Handle Run Workflow
 */
async function handleRunWorkflow(workflowId) {
    let targetWorkflow = workflowId;

    if (!targetWorkflow || typeof targetWorkflow !== 'string') {
        // If not passed, ask user
        // Ideal: fetch list from CLI. For now, manual input.
        targetWorkflow = await vscode.window.showInputBox({
            placeHolder: t('automation.workflowIdPlaceholder'),
            prompt: t('automation.workflowIdPrompt')
        });
    }

    if (!targetWorkflow) return;

    // TODO: Dynamic Params Input
    // For now, we assume simple params string input
    const paramsString = await vscode.window.showInputBox({
        placeHolder: t('automation.workflowParamsPlaceholder'),
        prompt: t('automation.workflowParamsPrompt')
    });

    if (paramsString === undefined) return; // Cancelled

    const params = {};
    paramsString.split(' ').forEach(p => {
        const [k, v] = p.split('=');
        if (k && v) params[k] = v;
    });

    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: t('automation.runningWorkflowTitle', targetWorkflow),
        cancellable: false
    }, async (progress) => {
        try {
            const client = new AIClient();
            await client.runWorkflow(targetWorkflow, params);
            vscode.window.showInformationMessage(t('automation.workflowCompleted', targetWorkflow));
        } catch (e) {
            vscode.window.showErrorMessage(t('automation.workflowError', e));
        }
    });
}

module.exports = {
    AutomationTreeProvider,
    handleGeneratePrompt,
    handleRunWorkflow,
    setAutomationI18n: (i18n) => {
        i18nRef = i18n;
    }
};
