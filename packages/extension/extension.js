const vscode = require('vscode');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Personas View Provider - Shows active AI agents with their tasks
 */
class PersonasViewProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element) {
        return element;
    }

    getChildren(element) {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return [new vscode.TreeItem('No workspace folder open')];
        }

        const aiWorkspacePath = path.join(workspaceFolder.uri.fsPath, '.ai-workspace');

        if (!fs.existsSync(aiWorkspacePath)) {
            const item = new vscode.TreeItem('⚠️ No .ai-workspace found');
            item.description = 'Run: ai-doc init';
            return [item];
        }

        if (!element) {
            // Root level - show personas
            return this.getPersonas(aiWorkspacePath);
        } else if (element.contextValue === 'persona') {
            // Show tasks for this persona
            return this.getTasksForPersona(aiWorkspacePath, element.label);
        } else if (element.contextValue === 'task') {
            // Show checklist items for this task
            return this.getChecklistForTask(element.taskPath);
        }

        return [];
    }

    getPersonas(aiWorkspacePath) {
        const personasPath = path.join(aiWorkspacePath, 'personas');

        if (!fs.existsSync(personasPath)) {
            return [new vscode.TreeItem('No personas found')];
        }

        const personaFiles = fs.readdirSync(personasPath)
            .filter(f => f.endsWith('.md') && f.startsWith('AI-'));

        if (personaFiles.length === 0) {
            return [new vscode.TreeItem('No AI personas found')];
        }

        return personaFiles.map(file => {
            const personaName = file.replace('.md', '');
            const item = new vscode.TreeItem(
                personaName,
                vscode.TreeItemCollapsibleState.Expanded
            );
            item.iconPath = new vscode.ThemeIcon('robot');
            item.contextValue = 'persona';
            item.description = 'AI Agent';
            return item;
        });
    }

    getTasksForPersona(aiWorkspacePath, personaName) {
        const tasksPath = path.join(aiWorkspacePath, 'tasks', 'active');

        if (!fs.existsSync(tasksPath)) {
            const item = new vscode.TreeItem('No tasks');
            item.iconPath = new vscode.ThemeIcon('check');
            return [item];
        }

        const taskFiles = fs.readdirSync(tasksPath)
            .filter(f => f.startsWith(personaName) && f.endsWith('.md'));

        if (taskFiles.length === 0) {
            const item = new vscode.TreeItem('No active tasks');
            item.iconPath = new vscode.ThemeIcon('check');
            return [item];
        }

        return taskFiles.map(file => {
            const taskPath = path.join(tasksPath, file);
            const content = fs.readFileSync(taskPath, 'utf-8');

            // Extract title from frontmatter or filename
            const titleMatch = content.match(/title:\s*["']?([^"'\n]+)["']?/);
            const title = titleMatch ? titleMatch[1] : file.replace('.md', '');

            const item = new vscode.TreeItem(
                title,
                vscode.TreeItemCollapsibleState.Collapsed
            );
            item.iconPath = new vscode.ThemeIcon('checklist');
            item.contextValue = 'task';
            item.taskPath = taskPath;
            item.tooltip = file;

            return item;
        });
    }

    getChecklistForTask(taskPath) {
        if (!fs.existsSync(taskPath)) {
            return [];
        }

        const content = fs.readFileSync(taskPath, 'utf-8');

        // Extract checklist items (lines starting with - [ ] or - [x])
        const checklistRegex = /^- \[([ x])\] (.+)$/gm;
        const items = [];
        let match;

        while ((match = checklistRegex.exec(content)) !== null) {
            const isDone = match[1] === 'x';
            const text = match[2];

            const item = new vscode.TreeItem(text);
            item.iconPath = new vscode.ThemeIcon(isDone ? 'check' : 'circle-outline');
            item.description = isDone ? '✓' : '';
            item.contextValue = 'checklistItem';

            items.push(item);
        }

        if (items.length === 0) {
            const item = new vscode.TreeItem('No checklist items');
            item.iconPath = new vscode.ThemeIcon('info');
            return [item];
        }

        return items;
    }
}

/**
 * Status View Provider
 */
class StatusViewProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element) {
        return element;
    }

    getChildren(element) {
        if (!element) {
            try {
                const output = execSync('ai-doc status', { encoding: 'utf-8' });
                const lines = output.split('\n').filter(line => line.trim());

                return lines.map(line => {
                    const item = new vscode.TreeItem(line.trim());
                    item.iconPath = new vscode.ThemeIcon('info');
                    return item;
                });
            } catch (error) {
                const item = new vscode.TreeItem('❌ ai-doc not installed');
                item.description = 'Run: npm install -g ai-agent-ide-context-sync';
                return [item];
            }
        }
        return [];
    }
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('AI Agent IDE Context Sync extension is now active!');

    // Register View Providers
    const personasProvider = new PersonasViewProvider();
    const statusProvider = new StatusViewProvider();

    vscode.window.registerTreeDataProvider('ai-agent-sync-personas', personasProvider);
    vscode.window.registerTreeDataProvider('ai-agent-sync-status', statusProvider);

    // Watch for file changes in .ai-workspace
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (workspaceFolder) {
        const aiWorkspacePath = path.join(workspaceFolder.uri.fsPath, '.ai-workspace');
        const watcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(aiWorkspacePath, '**/*')
        );

        watcher.onDidChange(() => personasProvider.refresh());
        watcher.onDidCreate(() => personasProvider.refresh());
        watcher.onDidDelete(() => personasProvider.refresh());

        context.subscriptions.push(watcher);
    }

    // Command: Build Context
    let buildCommand = vscode.commands.registerCommand('ai-agent-sync.build', function () {
        vscode.window.showInformationMessage('Building AI Agent Context...');

        try {
            const output = execSync('ai-doc build', { encoding: 'utf-8' });
            vscode.window.showInformationMessage('✅ Context built successfully!');
            console.log(output);

            // Refresh views
            statusProvider.refresh();
            personasProvider.refresh();
        } catch (error) {
            vscode.window.showErrorMessage(`❌ Build failed: ${error.message}`);
        }
    });

    // Command: Show Status
    let statusCommand = vscode.commands.registerCommand('ai-agent-sync.status', function () {
        try {
            const output = execSync('ai-doc status', { encoding: 'utf-8' });

            const outputChannel = vscode.window.createOutputChannel('AI Agent Sync');
            outputChannel.clear();
            outputChannel.appendLine(output);
            outputChannel.show();
        } catch (error) {
            vscode.window.showErrorMessage(`❌ Status check failed: ${error.message}`);
        }
    });

    // Command: Refresh Personas View
    let refreshPersonasCommand = vscode.commands.registerCommand('ai-agent-sync.refreshPersonas', () => {
        personasProvider.refresh();
    });

    // Command: Refresh Status View
    let refreshStatusCommand = vscode.commands.registerCommand('ai-agent-sync.refreshStatus', () => {
        statusProvider.refresh();
    });

    // Command: Open Task File
    let openTaskCommand = vscode.commands.registerCommand('ai-agent-sync.openTask', (item) => {
        if (item && item.taskPath) {
            vscode.workspace.openTextDocument(item.taskPath).then(doc => {
                vscode.window.showTextDocument(doc);
            });
        }
    });

    context.subscriptions.push(buildCommand);
    context.subscriptions.push(statusCommand);
    context.subscriptions.push(refreshPersonasCommand);
    context.subscriptions.push(refreshStatusCommand);
    context.subscriptions.push(openTaskCommand);
}

function deactivate() { }

module.exports = {
    activate,
    deactivate
}
