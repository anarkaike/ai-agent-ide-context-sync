const vscode = require('vscode');
const path = require('path');
const AIClient = require('./ai-client');

class AutomationTreeProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.client = new AIClient();
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
            const promptItem = new vscode.TreeItem('✨ Generate Smart Prompt');
            promptItem.command = {
                command: 'ai-agent-sync.generatePrompt',
                title: 'Generate Smart Prompt'
            };
            promptItem.tooltip = 'Create a structured prompt using semantic search and active rules';
            items.push(promptItem);

            // 2. Workflows Section
            const workflowsItem = new vscode.TreeItem('🚀 Workflows', vscode.TreeItemCollapsibleState.Expanded);
            workflowsItem.contextValue = 'workflows-section';
            items.push(workflowsItem);

            return items;
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
                items.push(this.createActionItem('▶️ Run Workflow...', 'ai-agent-sync.runWorkflowInput'));

                // Demo workflows (hardcoded for stability until CLI JSON output is ready)
                const demoWf = new vscode.TreeItem('React Component');
                demoWf.command = {
                    command: 'ai-agent-sync.runWorkflow',
                    title: 'Run Workflow',
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

    createActionItem(label, command, args = []) {
        const item = new vscode.TreeItem(label);
        item.command = {
            command: command,
            title: label,
            arguments: args
        };
        return item;
    }
}

/**
 * Handle Generate Smart Prompt
 */
async function handleGeneratePrompt() {
    const goal = await vscode.window.showInputBox({
        placeHolder: 'Ex: Create a new login component with auth logic',
        prompt: 'Describe your goal for the Smart Prompt'
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
            placeHolder: 'create-component',
            prompt: 'Enter workflow ID'
        });
    }

    if (!targetWorkflow) return;

    // TODO: Dynamic Params Input
    // For now, we assume simple params string input
    const paramsString = await vscode.window.showInputBox({
        placeHolder: 'name=MyComponent',
        prompt: 'Enter parameters (key=value)'
    });

    if (paramsString === undefined) return; // Cancelled

    const params = {};
    paramsString.split(' ').forEach(p => {
        const [k, v] = p.split('=');
        if (k && v) params[k] = v;
    });

    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Running workflow: ${targetWorkflow}...`,
        cancellable: false
    }, async (progress) => {
        try {
            const client = new AIClient();
            await client.runWorkflow(targetWorkflow, params);
            vscode.window.showInformationMessage(`Workflow ${targetWorkflow} completed!`);
        } catch (e) {
            vscode.window.showErrorMessage(`Workflow error: ${e}`);
        }
    });
}

module.exports = {
    AutomationTreeProvider,
    handleGeneratePrompt,
    handleRunWorkflow
};
