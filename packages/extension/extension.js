const vscode = require('vscode');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Get workspace .ai-workspace path
 */
function getAiWorkspacePath() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) return null;
    return path.join(workspaceFolder.uri.fsPath, '.ai-workspace');
}

/**
 * Personas Tree Provider
 */
class PersonasTreeProvider {
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
        const aiWorkspacePath = getAiWorkspacePath();
        if (!aiWorkspacePath || !fs.existsSync(aiWorkspacePath)) {
            const item = new vscode.TreeItem('⚠️ No .ai-workspace found');
            item.command = {
                command: 'ai-agent-sync.init',
                title: 'Initialize Workspace'
            };
            return [item];
        }

        if (!element) {
            return this.getPersonas(aiWorkspacePath);
        } else if (element.contextValue === 'persona') {
            return this.getPersonaDetails(element);
        } else if (element.contextValue === 'tasks-section') {
            return this.getTasksForPersona(aiWorkspacePath, element.personaName);
        } else if (element.contextValue === 'task') {
            return this.getChecklistForTask(element.taskPath);
        }

        return [];
    }

    getPersonas(aiWorkspacePath) {
        const personasPath = path.join(aiWorkspacePath, 'personas');

        if (!fs.existsSync(personasPath)) {
            return [this.createActionItem('➕ Create First Persona', 'ai-agent-sync.createPersona')];
        }

        const personaFiles = fs.readdirSync(personasPath)
            .filter(f => f.endsWith('.md') && f.startsWith('AI-'));

        if (personaFiles.length === 0) {
            return [this.createActionItem('➕ Create First Persona', 'ai-agent-sync.createPersona')];
        }

        const personas = personaFiles.map(file => {
            const personaName = file.replace('.md', '');
            const personaPath = path.join(personasPath, file);
            const content = fs.readFileSync(personaPath, 'utf-8');

            // Extract description from frontmatter
            const descMatch = content.match(/description:\s*["']?([^"'\n]+)["']?/);
            const description = descMatch ? descMatch[1] : 'AI Agent';

            const item = new vscode.TreeItem(
                personaName,
                vscode.TreeItemCollapsibleState.Collapsed
            );
            item.iconPath = new vscode.ThemeIcon('robot', new vscode.ThemeColor('charts.purple'));
            item.contextValue = 'persona';
            item.description = description;
            item.personaName = personaName;
            item.personaPath = personaPath;

            return item;
        });

        // Add "Create New" button at the end
        personas.push(this.createActionItem('➕ Create New Persona', 'ai-agent-sync.createPersona'));

        return personas;
    }

    getPersonaDetails(personaElement) {
        const details = [];

        // Tasks section
        const tasksItem = new vscode.TreeItem('📋 Tasks', vscode.TreeItemCollapsibleState.Expanded);
        tasksItem.contextValue = 'tasks-section';
        tasksItem.personaName = personaElement.personaName;
        details.push(tasksItem);

        // Actions
        details.push(this.createActionItem('✏️ Edit Persona', 'ai-agent-sync.editPersona', personaElement.personaPath));
        details.push(this.createActionItem('🗑️ Delete Persona', 'ai-agent-sync.deletePersona', personaElement.personaName));
        details.push(this.createActionItem('📄 View Full Details', 'ai-agent-sync.openFile', personaElement.personaPath));

        return details;
    }

    getTasksForPersona(aiWorkspacePath, personaName) {
        const tasksPath = path.join(aiWorkspacePath, 'tasks', 'active');

        if (!fs.existsSync(tasksPath)) {
            return [this.createActionItem('➕ Create Task', 'ai-agent-sync.createTask', personaName)];
        }

        const taskFiles = fs.readdirSync(tasksPath)
            .filter(f => f.startsWith(personaName) && f.endsWith('.md'));

        if (taskFiles.length === 0) {
            return [this.createActionItem('➕ Create Task', 'ai-agent-sync.createTask', personaName)];
        }

        const tasks = taskFiles.map(file => {
            const taskPath = path.join(tasksPath, file);
            const content = fs.readFileSync(taskPath, 'utf-8');

            const titleMatch = content.match(/title:\s*["']?([^"'\n]+)["']?/);
            const title = titleMatch ? titleMatch[1] : file.replace('.md', '');

            // Count checklist progress
            const totalItems = (content.match(/^- \[[ x]\]/gm) || []).length;
            const doneItems = (content.match(/^- \[x\]/gm) || []).length;

            const item = new vscode.TreeItem(
                title,
                vscode.TreeItemCollapsibleState.Collapsed
            );
            item.iconPath = new vscode.ThemeIcon('checklist');
            item.contextValue = 'task';
            item.taskPath = taskPath;
            item.description = totalItems > 0 ? `${doneItems}/${totalItems}` : '';
            item.tooltip = `${file}\n${doneItems}/${totalItems} items completed`;

            return item;
        });

        tasks.push(this.createActionItem('➕ Create New Task', 'ai-agent-sync.createTask', personaName));

        return tasks;
    }

    getChecklistForTask(taskPath) {
        if (!fs.existsSync(taskPath)) {
            return [];
        }

        const content = fs.readFileSync(taskPath, 'utf-8');
        const checklistRegex = /^- \[([ x])\] (.+)$/gm;
        const items = [];
        let match;
        let lineNumber = 0;

        const lines = content.split('\n');
        lines.forEach((line, index) => {
            const match = line.match(/^- \[([ x])\] (.+)$/);
            if (match) {
                const isDone = match[1] === 'x';
                const text = match[2];

                const item = new vscode.TreeItem(text);
                item.iconPath = new vscode.ThemeIcon(
                    isDone ? 'pass-filled' : 'circle-outline',
                    isDone ? new vscode.ThemeColor('testing.iconPassed') : undefined
                );
                item.contextValue = 'checklistItem';
                item.taskPath = taskPath;
                item.lineNumber = index;
                item.isDone = isDone;
                item.command = {
                    command: 'ai-agent-sync.toggleChecklistItem',
                    title: 'Toggle',
                    arguments: [taskPath, index, !isDone]
                };

                items.push(item);
            }
        });

        if (items.length === 0) {
            return [new vscode.TreeItem('No checklist items')];
        }

        // Add actions
        items.push(this.createActionItem('✏️ Edit Task', 'ai-agent-sync.openFile', taskPath));
        items.push(this.createActionItem('📦 Archive Task', 'ai-agent-sync.archiveTask', taskPath));
        items.push(this.createActionItem('🗑️ Delete Task', 'ai-agent-sync.deleteTask', taskPath));

        return items;
    }

    createActionItem(label, command, arg) {
        const item = new vscode.TreeItem(label);
        item.iconPath = new vscode.ThemeIcon('add');
        item.command = {
            command: command,
            title: label,
            arguments: arg ? [arg] : []
        };
        item.contextValue = 'action';
        return item;
    }
}

/**
 * Status Tree Provider
 */
class StatusTreeProvider {
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
                const item = new vscode.TreeItem('❌ ai-doc CLI not found');
                item.description = 'Install: npm install -g ai-agent-ide-context-sync';
                item.command = {
                    command: 'vscode.open',
                    title: 'Open NPM',
                    arguments: [vscode.Uri.parse('https://www.npmjs.com/package/ai-agent-ide-context-sync')]
                };
                return [item];
            }
        }
        return [];
    }
}

/**
 * Analytics Tree Provider
 */
class AnalyticsTreeProvider {
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
        const aiWorkspacePath = getAiWorkspacePath();
        if (!aiWorkspacePath || !fs.existsSync(aiWorkspacePath)) {
            return [new vscode.TreeItem('No workspace')];
        }

        if (!element) {
            const stats = this.calculateStats(aiWorkspacePath);
            return [
                this.createStatItem('👥 Personas', stats.personas),
                this.createStatItem('📋 Active Tasks', stats.activeTasks),
                this.createStatItem('✅ Completed Tasks', stats.completedTasks),
                this.createStatItem('📊 Total Checklist Items', stats.totalChecklistItems),
                this.createStatItem('✓ Completed Items', stats.completedChecklistItems),
                this.createStatItem('📈 Completion Rate', `${stats.completionRate}%`)
            ];
        }
        return [];
    }

    calculateStats(aiWorkspacePath) {
        const stats = {
            personas: 0,
            activeTasks: 0,
            completedTasks: 0,
            totalChecklistItems: 0,
            completedChecklistItems: 0,
            completionRate: 0
        };

        // Count personas
        const personasPath = path.join(aiWorkspacePath, 'personas');
        if (fs.existsSync(personasPath)) {
            stats.personas = fs.readdirSync(personasPath)
                .filter(f => f.endsWith('.md') && f.startsWith('AI-')).length;
        }

        // Count active tasks
        const activeTasksPath = path.join(aiWorkspacePath, 'tasks', 'active');
        if (fs.existsSync(activeTasksPath)) {
            const taskFiles = fs.readdirSync(activeTasksPath).filter(f => f.endsWith('.md'));
            stats.activeTasks = taskFiles.length;

            // Count checklist items
            taskFiles.forEach(file => {
                const content = fs.readFileSync(path.join(activeTasksPath, file), 'utf-8');
                const total = (content.match(/^- \[[ x]\]/gm) || []).length;
                const done = (content.match(/^- \[x\]/gm) || []).length;
                stats.totalChecklistItems += total;
                stats.completedChecklistItems += done;
            });
        }

        // Count archived tasks
        const archiveTasksPath = path.join(aiWorkspacePath, 'tasks', 'archive');
        if (fs.existsSync(archiveTasksPath)) {
            stats.completedTasks = fs.readdirSync(archiveTasksPath)
                .filter(f => f.endsWith('.md')).length;
        }

        // Calculate completion rate
        if (stats.totalChecklistItems > 0) {
            stats.completionRate = Math.round(
                (stats.completedChecklistItems / stats.totalChecklistItems) * 100
            );
        }

        return stats;
    }

    createStatItem(label, value) {
        const item = new vscode.TreeItem(`${label}: ${value}`);
        item.iconPath = new vscode.ThemeIcon('graph');
        return item;
    }
}

/**
 * Activate extension
 */
function activate(context) {
    console.log('AI Agent IDE Context Sync extension activated!');

    // Register Tree Providers
    const personasProvider = new PersonasTreeProvider();
    const statusProvider = new StatusTreeProvider();
    const analyticsProvider = new AnalyticsTreeProvider();

    vscode.window.registerTreeDataProvider('ai-agent-sync-personas', personasProvider);
    vscode.window.registerTreeDataProvider('ai-agent-sync-status', statusProvider);
    vscode.window.registerTreeDataProvider('ai-agent-sync-analytics', analyticsProvider);

    // Watch for file changes
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (workspaceFolder) {
        const aiWorkspacePath = path.join(workspaceFolder.uri.fsPath, '.ai-workspace');
        const watcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(aiWorkspacePath, '**/*')
        );

        watcher.onDidChange(() => {
            personasProvider.refresh();
            analyticsProvider.refresh();
        });
        watcher.onDidCreate(() => {
            personasProvider.refresh();
            analyticsProvider.refresh();
        });
        watcher.onDidDelete(() => {
            personasProvider.refresh();
            analyticsProvider.refresh();
        });

        context.subscriptions.push(watcher);
    }

    // Register Commands
    registerCommands(context, personasProvider, statusProvider, analyticsProvider);
}

/**
 * Register all commands
 */
function registerCommands(context, personasProvider, statusProvider, analyticsProvider) {
    // Initialize workspace
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-agent-sync.init', async () => {
            try {
                execSync('ai-doc init', { encoding: 'utf-8' });
                vscode.window.showInformationMessage('✅ Workspace initialized!');
                personasProvider.refresh();
                statusProvider.refresh();
            } catch (error) {
                vscode.window.showErrorMessage(`❌ Init failed: ${error.message}`);
            }
        })
    );

    // Build context
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-agent-sync.build', async () => {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Building AI Agent Context...',
                cancellable: false
            }, async (progress) => {
                try {
                    progress.report({ increment: 0, message: 'Compiling modules...' });
                    const output = execSync('ai-doc build', { encoding: 'utf-8' });
                    progress.report({ increment: 100, message: 'Done!' });
                    vscode.window.showInformationMessage('✅ Context built successfully!');
                    statusProvider.refresh();
                } catch (error) {
                    vscode.window.showErrorMessage(`❌ Build failed: ${error.message}`);
                }
            });
        })
    );

    // Create persona
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-agent-sync.createPersona', async () => {
            const name = await vscode.window.showInputBox({
                prompt: 'Enter persona name (e.g., AI-NARUTO)',
                placeHolder: 'AI-NAME',
                validateInput: (value) => {
                    if (!value.startsWith('AI-')) {
                        return 'Name must start with AI-';
                    }
                    if (!/^AI-[A-Z]+$/.test(value)) {
                        return 'Use uppercase letters only (e.g., AI-NARUTO)';
                    }
                    return null;
                }
            });

            if (!name) return;

            const description = await vscode.window.showInputBox({
                prompt: 'Enter persona description',
                placeHolder: 'Senior Backend Developer specializing in Laravel'
            });

            try {
                execSync(`ai-doc identity create ${name}`, { encoding: 'utf-8' });
                vscode.window.showInformationMessage(`✅ Persona ${name} created!`);
                personasProvider.refresh();
                analyticsProvider.refresh();
            } catch (error) {
                vscode.window.showErrorMessage(`❌ Failed to create persona: ${error.message}`);
            }
        })
    );

    // Edit persona
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-agent-sync.editPersona', async (filePath) => {
            if (filePath) {
                const doc = await vscode.workspace.openTextDocument(filePath);
                await vscode.window.showTextDocument(doc);
            }
        })
    );

    // Delete persona
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-agent-sync.deletePersona', async (personaName) => {
            const confirm = await vscode.window.showWarningMessage(
                `Delete persona ${personaName}?`,
                { modal: true },
                'Delete'
            );

            if (confirm === 'Delete') {
                const aiWorkspacePath = getAiWorkspacePath();
                const personaPath = path.join(aiWorkspacePath, 'personas', `${personaName}.md`);

                if (fs.existsSync(personaPath)) {
                    fs.unlinkSync(personaPath);
                    vscode.window.showInformationMessage(`✅ Persona ${personaName} deleted`);
                    personasProvider.refresh();
                    analyticsProvider.refresh();
                }
            }
        })
    );

    // Create task
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-agent-sync.createTask', async (personaName) => {
            const title = await vscode.window.showInputBox({
                prompt: 'Enter task title',
                placeHolder: 'Implement user authentication'
            });

            if (!title) return;

            const aiWorkspacePath = getAiWorkspacePath();
            const tasksPath = path.join(aiWorkspacePath, 'tasks', 'active');

            if (!fs.existsSync(tasksPath)) {
                fs.mkdirSync(tasksPath, { recursive: true });
            }

            const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
            const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 30);
            const filename = `${personaName}--TASK-${date}-${slug}.md`;
            const taskPath = path.join(tasksPath, filename);

            const template = `---
title: "${title}"
persona: ${personaName}
created: ${new Date().toISOString()}
status: active
---

# ${title}

## Objetivo
[Descreva o objetivo da task]

## Checklist
- [ ] Item 1
- [ ] Item 2
- [ ] Item 3

## Notas
[Adicione notas aqui]
`;

            fs.writeFileSync(taskPath, template);
            const doc = await vscode.workspace.openTextDocument(taskPath);
            await vscode.window.showTextDocument(doc);

            vscode.window.showInformationMessage(`✅ Task created!`);
            personasProvider.refresh();
            analyticsProvider.refresh();
        })
    );

    // Toggle checklist item
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-agent-sync.toggleChecklistItem', async (taskPath, lineNumber, newState) => {
            const content = fs.readFileSync(taskPath, 'utf-8');
            const lines = content.split('\n');

            if (lines[lineNumber]) {
                lines[lineNumber] = lines[lineNumber].replace(
                    /^- \[[ x]\]/,
                    newState ? '- [x]' : '- [ ]'
                );

                fs.writeFileSync(taskPath, lines.join('\n'));
                personasProvider.refresh();
                analyticsProvider.refresh();
            }
        })
    );

    // Archive task
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-agent-sync.archiveTask', async (taskPath) => {
            const aiWorkspacePath = getAiWorkspacePath();
            const archivePath = path.join(aiWorkspacePath, 'tasks', 'archive');

            if (!fs.existsSync(archivePath)) {
                fs.mkdirSync(archivePath, { recursive: true });
            }

            const filename = path.basename(taskPath);
            const newPath = path.join(archivePath, filename);

            fs.renameSync(taskPath, newPath);
            vscode.window.showInformationMessage('✅ Task archived!');
            personasProvider.refresh();
            analyticsProvider.refresh();
        })
    );

    // Delete task
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-agent-sync.deleteTask', async (taskPath) => {
            const confirm = await vscode.window.showWarningMessage(
                'Delete this task?',
                { modal: true },
                'Delete'
            );

            if (confirm === 'Delete') {
                fs.unlinkSync(taskPath);
                vscode.window.showInformationMessage('✅ Task deleted');
                personasProvider.refresh();
                analyticsProvider.refresh();
            }
        })
    );

    // Open file
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-agent-sync.openFile', async (filePath) => {
            if (filePath) {
                const doc = await vscode.workspace.openTextDocument(filePath);
                await vscode.window.showTextDocument(doc);
            }
        })
    );

    // Refresh commands
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-agent-sync.refreshPersonas', () => personasProvider.refresh())
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-agent-sync.refreshStatus', () => statusProvider.refresh())
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-agent-sync.refreshAnalytics', () => analyticsProvider.refresh())
    );

    // Show status
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-agent-sync.status', async () => {
            try {
                const output = execSync('ai-doc status', { encoding: 'utf-8' });
                const outputChannel = vscode.window.createOutputChannel('AI Agent Sync');
                outputChannel.clear();
                outputChannel.appendLine(output);
                outputChannel.show();
            } catch (error) {
                vscode.window.showErrorMessage(`❌ Status check failed: ${error.message}`);
            }
        })
    );
}

function deactivate() { }

module.exports = {
    activate,
    deactivate
};
