const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const os = require('os');

class SwarmTreeDataProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.registryPath = path.join(os.homedir(), '.ai-doc', 'swarm', 'registry.json');
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element) {
        return element;
    }

    getChildren(element) {
        if (!fs.existsSync(this.registryPath)) {
            const item = new vscode.TreeItem('No active agents found in Swarm');
            item.description = 'Run "agent start" to register';
            return [item];
        }

        if (element) {
            // Children of an agent (Capabilities, Actions)
            if (element.contextValue === 'agent') {
                return this.getAgentDetails(element);
            }
            return [];
        }

        // List Agents
        try {
            const agents = JSON.parse(fs.readFileSync(this.registryPath, 'utf8'));
            if (agents.length === 0) {
                return [new vscode.TreeItem('Swarm Registry Empty')];
            }

            return agents.map(agent => {
                const isSelf = agent.path === vscode.workspace.rootPath || 
                               (vscode.workspace.workspaceFolders && agent.path === vscode.workspace.workspaceFolders[0].uri.fsPath);
                
                const label = `${agent.name} ${isSelf ? '(Self)' : ''}`;
                const item = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.Collapsed);
                
                item.description = agent.id;
                item.contextValue = 'agent';
                item.agentData = agent;
                item.iconPath = new vscode.ThemeIcon(isSelf ? 'account' : 'hubot');
                
                return item;
            });

        } catch (e) {
            return [new vscode.TreeItem(`Error loading Swarm: ${e.message}`)];
        }
    }

    getAgentDetails(element) {
        const agent = element.agentData;
        const items = [];

        // Path
        const pathItem = new vscode.TreeItem(`Path: ${agent.path}`);
        pathItem.iconPath = new vscode.ThemeIcon('folder');
        items.push(pathItem);

        // Last Seen
        const seenItem = new vscode.TreeItem(`Last Seen: ${new Date(agent.last_seen).toLocaleTimeString()}`);
        seenItem.iconPath = new vscode.ThemeIcon('clock');
        items.push(seenItem);

        // Capabilities
        if (agent.capabilities && agent.capabilities.length > 0) {
            const capsItem = new vscode.TreeItem('Capabilities', vscode.TreeItemCollapsibleState.None);
            capsItem.description = agent.capabilities.join(', ');
            capsItem.iconPath = new vscode.ThemeIcon('tools');
            items.push(capsItem);
        }

        // Actions
        const connectItem = new vscode.TreeItem('📡 Delegate Task');
        connectItem.command = {
            command: 'ai-agent-sync.swarm.connect',
            title: 'Delegate Task to Agent',
            arguments: [agent]
        };
        connectItem.iconPath = new vscode.ThemeIcon('radio-tower');
        items.push(connectItem);

        return items;
    }
}

async function handleSwarmConnect(agent) {
    if (!agent) return;

    const message = await vscode.window.showInputBox({
        prompt: `Delegate task to ${agent.name}`,
        placeHolder: 'Ex: Refactor the login module...'
    });

    if (!message) return;

    const terminal = vscode.window.createTerminal(`Swarm Link: ${agent.name}`);
    terminal.show();
    // Use the new CLI command swarm delegate
    terminal.sendText(`node packages/cli/cli/ai-doc.js swarm delegate ${agent.id} "${message}"`);
}

module.exports = {
    SwarmTreeDataProvider,
    handleSwarmConnect
};