const vscode = require('vscode');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { I18n, SmartNotifications } = require('./modules');

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

                // Remove ANSI color codes
                const cleanOutput = output.replace(/\x1b\[[0-9;]*m/g, '');

                // Parse the output into structured data
                const items = [];

                // Extract kernel info
                const versionMatch = cleanOutput.match(/Versão:\s*([^\n]+)/);
                if (versionMatch) {
                    const item = new vscode.TreeItem(`Kernel v${versionMatch[1].trim()}`);
                    item.iconPath = new vscode.ThemeIcon('package');
                    items.push(item);
                }

                // Extract heuristics count
                const heuristicsMatch = cleanOutput.match(/Inteligência:\s*(\d+)\s*heurísticas/);
                if (heuristicsMatch) {
                    const item = new vscode.TreeItem(`${heuristicsMatch[1]} Heurísticas Aprendidas`);
                    item.iconPath = new vscode.ThemeIcon('lightbulb');
                    items.push(item);
                }

                // Extract workspace info
                const projectMatch = cleanOutput.match(/Projeto:\s*([^\n]+)/);
                if (projectMatch) {
                    const item = new vscode.TreeItem(`Projeto: ${projectMatch[1].trim()}`);
                    item.iconPath = new vscode.ThemeIcon('folder');
                    items.push(item);
                }

                // Check if workspace is initialized
                if (cleanOutput.includes('Execute "ai-doc init"')) {
                    const item = new vscode.TreeItem('⚠️ Workspace não inicializado');
                    item.command = {
                        command: 'ai-agent-sync.init',
                        title: 'Initialize'
                    };
                    item.iconPath = new vscode.ThemeIcon('warning');
                    items.push(item);
                }

                return items.length > 0 ? items : [new vscode.TreeItem('No status available')];
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
 * Get all tasks from all personas
 */
function getAllTasks() {
    const aiWorkspacePath = getAiWorkspacePath();
    if (!aiWorkspacePath) return [];

    const tasksPath = path.join(aiWorkspacePath, 'tasks', 'active');
    if (!fs.existsSync(tasksPath)) return [];

    const taskFiles = fs.readdirSync(tasksPath).filter(f => f.endsWith('.md'));

    return taskFiles.map(file => {
        const taskPath = path.join(tasksPath, file);
        const content = fs.readFileSync(taskPath, 'utf-8');

        const titleMatch = content.match(/title:\s*["']?([^"'\n]+)["']?/);
        const personaMatch = file.match(/^(AI-[A-Z]+)/);

        const title = titleMatch ? titleMatch[1] : file.replace('.md', '');
        const persona = personaMatch ? personaMatch[1] : 'Unknown';

        // Count progress
        const totalItems = (content.match(/^- \[[ x]\]/gm) || []).length;
        const doneItems = (content.match(/^- \[x\]/gm) || []).length;
        const progress = totalItems > 0 ? `${doneItems}/${totalItems}` : '';

        return {
            label: title,
            description: `${persona} ${progress}`,
            detail: file,
            path: taskPath,
            persona: persona
        };
    });
}

/**
 * Status Bar Manager
 */
class StatusBarManager {
    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            100
        );
        this.statusBarItem.command = 'ai-agent-sync.timerMenu';
        this.currentTask = null;
        this.timerSeconds = 0;
        this.timerRunning = false;
        this.timerInterval = null;
    }

    show() {
        this.statusBarItem.show();
    }

    hide() {
        this.statusBarItem.hide();
    }

    updateTask(taskInfo) {
        if (taskInfo) {
            this.currentTask = taskInfo;
            this.statusBarItem.text = `$(checklist) ${taskInfo.label}`;
            this.statusBarItem.tooltip = `Task: ${taskInfo.label}\nPersona: ${taskInfo.persona}\nClick to switch task`;
        } else {
            this.currentTask = null;
            this.statusBarItem.text = '$(add) Select Task';
            this.statusBarItem.tooltip = 'Click to select a task';
        }
    }

    getCurrentTask() {
        return this.currentTask;
    }

    // Pomodoro Timer Methods
    startTimer(duration = 25 * 60) {
        this.timerSeconds = duration;
        this.timerRunning = true;

        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        this.timerInterval = setInterval(() => {
            if (this.timerSeconds > 0) {
                this.timerSeconds--;
                this.updateDisplay();
            } else {
                this.stopTimer();
                vscode.window.showInformationMessage('⏰ Pomodoro completed! Time for a break! 🎉');
            }
        }, 1000);

        this.updateDisplay();
    }

    stopTimer() {
        this.timerRunning = false;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        this.updateDisplay();
    }

    resetTimer() {
        this.timerSeconds = 0;
        this.timerRunning = false;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        this.updateDisplay();
    }

    updateDisplay() {
        if (this.currentTask) {
            let text = `$(checklist) ${this.currentTask.label}`;

            if (this.timerRunning || this.timerSeconds > 0) {
                const minutes = Math.floor(this.timerSeconds / 60);
                const seconds = this.timerSeconds % 60;
                const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                text = `$(watch) ${timeStr} | ${this.currentTask.label}`;
            }

            this.statusBarItem.text = text;
            this.statusBarItem.tooltip = `Task: ${this.currentTask.label}\nPersona: ${this.currentTask.persona}\nClick for timer menu`;
        } else {
            this.statusBarItem.text = '$(add) Select Task';
            this.statusBarItem.tooltip = 'Click to select a task';
        }
    }

    isTimerRunning() {
        return this.timerRunning;
    }
}

/**
 * Activate extension
 */
function activate(context) {
    console.log('AI Agent IDE Context Sync extension activated!');

    // Initialize i18n
    const i18n = new I18n(context.extensionPath);

    // Initialize Smart Notifications
    const notifications = new SmartNotifications(context, i18n);
    const aiWorkspacePath = getAiWorkspacePath();
    if (aiWorkspacePath) {
        notifications.start(aiWorkspacePath);
    }

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

    // Initialize Status Bar
    const statusBarManager = new StatusBarManager();
    statusBarManager.show();
    context.subscriptions.push(statusBarManager.statusBarItem);

    // Register Commands
    registerCommands(context, personasProvider, statusProvider, analyticsProvider, statusBarManager);
}

/**
 * Register all commands
 */
function registerCommands(context, personasProvider, statusProvider, analyticsProvider, statusBarManager) {
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

    // Quick Picker - Fast task navigation
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-agent-sync.quickPicker', async () => {
            const tasks = getAllTasks();

            if (tasks.length === 0) {
                vscode.window.showInformationMessage('No tasks found. Create one first!');
                return;
            }

            // Add "Create New Task" option at the top
            const items = [
                {
                    label: '$(add) Create New Task',
                    description: '',
                    detail: 'Create a new task for a persona',
                    isCreateNew: true
                },
                { label: '', kind: vscode.QuickPickItemKind.Separator },
                ...tasks
            ];

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select a task or create new',
                matchOnDescription: true,
                matchOnDetail: true
            });

            if (!selected) return;

            if (selected.isCreateNew) {
                // Trigger create task command
                vscode.commands.executeCommand('ai-agent-sync.createTask');
            } else {
                // Open task and update status bar
                const doc = await vscode.workspace.openTextDocument(selected.path);
                await vscode.window.showTextDocument(doc);
                statusBarManager.updateTask(selected);
            }
        })
    );

    // Search in tasks
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-agent-sync.searchTasks', async () => {
            const searchTerm = await vscode.window.showInputBox({
                prompt: 'Search in tasks and checklists',
                placeHolder: 'Enter search term...'
            });

            if (!searchTerm) return;

            const tasks = getAllTasks();
            const results = [];

            for (const task of tasks) {
                const content = fs.readFileSync(task.path, 'utf-8');

                // Search in title
                if (task.label.toLowerCase().includes(searchTerm.toLowerCase())) {
                    results.push({
                        ...task,
                        matchType: 'Title'
                    });
                    continue;
                }

                // Search in checklist items
                const lines = content.split('\n');
                const matchingLines = lines.filter(line =>
                    line.includes('- [') && line.toLowerCase().includes(searchTerm.toLowerCase())
                );

                if (matchingLines.length > 0) {
                    results.push({
                        ...task,
                        matchType: `${matchingLines.length} checklist item(s)`,
                        detail: matchingLines[0].trim()
                    });
                }
            }

            if (results.length === 0) {
                vscode.window.showInformationMessage(`No results found for "${searchTerm}"`);
                return;
            }

            const selected = await vscode.window.showQuickPick(
                results.map(r => ({
                    label: r.label,
                    description: `${r.persona} - Match in: ${r.matchType}`,
                    detail: r.detail,
                    path: r.path
                })),
                {
                    placeHolder: `${results.length} result(s) for "${searchTerm}"`
                }
            );

            if (selected) {
                const doc = await vscode.workspace.openTextDocument(selected.path);
                await vscode.window.showTextDocument(doc);
            }
        })
    );

    // Clear active task from status bar
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-agent-sync.clearActiveTask', () => {
            statusBarManager.updateTask(null);
            vscode.window.showInformationMessage('Active task cleared');
        })
    );

    // Open Dashboard
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-agent-sync.openDashboard', () => {
            const panel = vscode.window.createWebviewPanel(
                'aiAgentDashboard',
                '📊 AI Agent Dashboard',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            // Load HTML
            const htmlPath = path.join(context.extensionPath, 'dashboard.html');
            let html = fs.readFileSync(htmlPath, 'utf-8');
            panel.webview.html = html;

            // Collect and send data
            function sendDashboardData() {
                const aiWorkspacePath = getAiWorkspacePath();
                if (!aiWorkspacePath) {
                    panel.webview.postMessage({
                        totalPersonas: 0,
                        activeTasks: 0,
                        completedTasks: 0,
                        completionRate: 0,
                        personaData: [],
                        progressData: {},
                        personaProgress: []
                    });
                    return;
                }

                // Collect data
                const personasPath = path.join(aiWorkspacePath, 'personas');
                const activeTasksPath = path.join(aiWorkspacePath, 'tasks', 'active');
                const archiveTasksPath = path.join(aiWorkspacePath, 'tasks', 'archive');

                let totalPersonas = 0;
                let activeTasks = 0;
                let completedTasks = 0;
                let totalItems = 0;
                let completedItems = 0;
                const personaData = [];
                const personaProgress = [];

                // Count personas
                if (fs.existsSync(personasPath)) {
                    const personas = fs.readdirSync(personasPath)
                        .filter(f => f.endsWith('.md') && f.startsWith('AI-'));
                    totalPersonas = personas.length;

                    // Count tasks per persona
                    personas.forEach(personaFile => {
                        const personaName = personaFile.replace('.md', '');
                        let taskCount = 0;
                        let personaTotalItems = 0;
                        let personaCompletedItems = 0;

                        if (fs.existsSync(activeTasksPath)) {
                            const tasks = fs.readdirSync(activeTasksPath)
                                .filter(f => f.startsWith(personaName) && f.endsWith('.md'));

                            taskCount = tasks.length;

                            tasks.forEach(taskFile => {
                                const content = fs.readFileSync(
                                    path.join(activeTasksPath, taskFile),
                                    'utf-8'
                                );
                                const total = (content.match(/^- \[[ x]\]/gm) || []).length;
                                const done = (content.match(/^- \[x\]/gm) || []).length;
                                personaTotalItems += total;
                                personaCompletedItems += done;
                            });
                        }

                        if (taskCount > 0) {
                            personaData.push({
                                name: personaName,
                                tasks: taskCount
                            });

                            personaProgress.push({
                                name: personaName,
                                total: personaTotalItems,
                                completed: personaCompletedItems
                            });
                        }

                        totalItems += personaTotalItems;
                        completedItems += personaCompletedItems;
                    });
                }

                // Count active tasks
                if (fs.existsSync(activeTasksPath)) {
                    activeTasks = fs.readdirSync(activeTasksPath)
                        .filter(f => f.endsWith('.md')).length;
                }

                // Count completed tasks
                if (fs.existsSync(archiveTasksPath)) {
                    completedTasks = fs.readdirSync(archiveTasksPath)
                        .filter(f => f.endsWith('.md')).length;
                }

                const completionRate = totalItems > 0
                    ? Math.round((completedItems / totalItems) * 100)
                    : 0;

                panel.webview.postMessage({
                    totalPersonas,
                    activeTasks,
                    completedTasks,
                    completionRate,
                    personaData,
                    progressData: {
                        total: totalItems,
                        completed: completedItems
                    },
                    personaProgress
                });
            }

            // Handle messages from webview
            panel.webview.onDidReceiveMessage(
                message => {
                    if (message.command === 'requestData') {
                        sendDashboardData();
                    }
                },
                undefined,
                context.subscriptions
            );

            // Send initial data
            sendDashboardData();

            // Refresh data every 5 seconds
            const interval = setInterval(() => {
                sendDashboardData();
            }, 5000);

            panel.onDidDispose(() => {
                clearInterval(interval);
            });
        })
    );

    // Timer Menu
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-agent-sync.timerMenu', async () => {
            if (!statusBarManager.getCurrentTask()) {
                vscode.commands.executeCommand('ai-agent-sync.quickPicker');
                return;
            }

            const options = statusBarManager.isTimerRunning()
                ? ['⏸️ Pause Timer', '🔄 Reset Timer', '🍅 Start 25min Pomodoro', '☕ Start 5min Break']
                : ['▶️ Start Timer', '🍅 Start 25min Pomodoro', '☕ Start 5min Break', '⏱️ Custom Duration'];

            const selected = await vscode.window.showQuickPick(options, {
                placeHolder: 'Timer Controls'
            });

            if (!selected) return;

            if (selected.includes('Pause')) {
                statusBarManager.stopTimer();
            } else if (selected.includes('Reset')) {
                statusBarManager.resetTimer();
            } else if (selected.includes('25min')) {
                statusBarManager.startTimer(25 * 60);
                vscode.window.showInformationMessage('🍅 Pomodoro started! 25 minutes');
            } else if (selected.includes('5min')) {
                statusBarManager.startTimer(5 * 60);
                vscode.window.showInformationMessage('☕ Break started! 5 minutes');
            } else if (selected.includes('Custom')) {
                const input = await vscode.window.showInputBox({
                    prompt: 'Enter duration in minutes',
                    placeHolder: '25',
                    validateInput: (value) => {
                        const num = parseInt(value);
                        if (isNaN(num) || num <= 0) {
                            return 'Please enter a valid number';
                        }
                        return null;
                    }
                });

                if (input) {
                    const minutes = parseInt(input);
                    statusBarManager.startTimer(minutes * 60);
                    vscode.window.showInformationMessage(`⏱️ Timer started! ${minutes} minutes`);
                }
            } else if (selected.includes('Start Timer')) {
                statusBarManager.startTimer(25 * 60);
                vscode.window.showInformationMessage('⏱️ Timer started! 25 minutes');
            }
        })
    );

    // Export Tasks
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-agent-sync.exportTasks', async () => {
            const aiWorkspacePath = getAiWorkspacePath();
            if (!aiWorkspacePath) {
                vscode.window.showErrorMessage('No .ai-workspace found');
                return;
            }

            const format = await vscode.window.showQuickPick(
                ['📄 Markdown', '📊 JSON', '📋 Plain Text'],
                { placeHolder: 'Select export format' }
            );

            if (!format) return;

            const tasks = getAllTasks();
            let content = '';
            let extension = '.md';

            if (format.includes('Markdown')) {
                content = '# AI Agent Tasks Export\n\n';
                content += `Generated: ${new Date().toLocaleString()}\n\n`;

                const personaGroups = {};
                tasks.forEach(task => {
                    if (!personaGroups[task.persona]) {
                        personaGroups[task.persona] = [];
                    }
                    personaGroups[task.persona].push(task);
                });

                for (const [persona, personaTasks] of Object.entries(personaGroups)) {
                    content += `## ${persona}\n\n`;
                    personaTasks.forEach(task => {
                        content += `### ${task.label}\n`;
                        content += `**Progress**: ${task.description}\n\n`;

                        // Read checklist
                        const taskContent = fs.readFileSync(task.path, 'utf-8');
                        const checklistMatch = taskContent.match(/## Checklist([\\s\\S]*?)(?=##|$)/);
                        if (checklistMatch) {
                            content += checklistMatch[0] + '\n\n';
                        }
                    });
                }
            } else if (format.includes('JSON')) {
                extension = '.json';
                content = JSON.stringify(tasks.map(t => ({
                    title: t.label,
                    persona: t.persona,
                    progress: t.description,
                    file: t.detail
                })), null, 2);
            } else {
                extension = '.txt';
                content = 'AI AGENT TASKS EXPORT\n';
                content += '='.repeat(50) + '\n\n';
                tasks.forEach(task => {
                    content += `${task.label} (${task.persona})\n`;
                    content += `Progress: ${task.description}\n`;
                    content += '-'.repeat(50) + '\n';
                });
            }

            const defaultPath = path.join(aiWorkspacePath, `tasks-export-${Date.now()}${extension}`);
            const uri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(defaultPath),
                filters: {
                    'All Files': ['*']
                }
            });

            if (uri) {
                fs.writeFileSync(uri.fsPath, content);
                vscode.window.showInformationMessage(`✅ Tasks exported to ${path.basename(uri.fsPath)}`);

                const open = await vscode.window.showInformationMessage(
                    'Export complete!',
                    'Open File'
                );

                if (open) {
                    const doc = await vscode.workspace.openTextDocument(uri);
                    await vscode.window.showTextDocument(doc);
                }
            }
        })
    );

    // Customize Persona
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-agent-sync.customizePersona', async (personaName) => {
            const aiWorkspacePath = getAiWorkspacePath();
            if (!aiWorkspacePath) {
                vscode.window.showErrorMessage('No .ai-workspace found');
                return;
            }

            // Load or create settings file
            const settingsPath = path.join(aiWorkspacePath, '.persona-settings.json');
            let settings = {};

            if (fs.existsSync(settingsPath)) {
                settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
            }

            const panel = vscode.window.createWebviewPanel(
                'customizePersona',
                `🎨 Customize ${personaName}`,
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            // Load HTML
            const htmlPath = path.join(context.extensionPath, 'customize-persona.html');
            panel.webview.html = fs.readFileSync(htmlPath, 'utf-8');

            // Handle messages
            panel.webview.onDidReceiveMessage(
                message => {
                    if (message.command === 'ready') {
                        panel.webview.postMessage({
                            persona: {
                                name: personaName,
                                color: settings[personaName]?.color,
                                icon: settings[personaName]?.icon
                            }
                        });
                    } else if (message.command === 'save') {
                        settings[personaName] = {
                            color: message.color,
                            icon: message.icon
                        };

                        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
                        vscode.window.showInformationMessage(`✅ ${personaName} customized!`);

                        // Refresh views
                        personasProvider.refresh();
                        panel.dispose();
                    }
                },
                undefined,
                context.subscriptions
            );
        })
    );

    // Load persona settings helper
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-agent-sync.getPersonaSettings', (personaName) => {
            const aiWorkspacePath = getAiWorkspacePath();
            if (!aiWorkspacePath) return {};

            const settingsPath = path.join(aiWorkspacePath, '.persona-settings.json');
            if (!fs.existsSync(settingsPath)) return {};

            const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
            return settings[personaName] || {};
        })
    );
}

function deactivate() { }

module.exports = {
    activate,
    deactivate
};
