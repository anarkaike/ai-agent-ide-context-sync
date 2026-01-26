const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const os = require('os');
const AIClient = require('./ai-client');
const Logger = require('./modules/Logger');
const { I18n, SmartNotifications } = require('./modules');
const { KanbanManager, AdvancedAnalytics, ThemeManager, CloudSyncManager } = require('./advanced-modules');
const { AutomationTreeProvider, handleGeneratePrompt, handleRunWorkflow, handleLaravelAnalyze, handleLaravelCreateLayer, handleLaravelListEntities, handleReactCreateComponent, handleReactCreateHook, handleGenerateCommitMessage, handleGeneratePRDescription, handleGitCodeReview, handleContextSnap, setAutomationI18n, setAutomationLogger } = require('./automation-modules');
const RitualScheduler = require('./modules/RitualScheduler');

// Global Management Instances
let logger = null;
let i18n = null;
let notifications = null;
let ritualScheduler = null;
let kanbanManager = null;
let analytics = null;
let themeManager = null;
let cloudSync = null;
let personasProvider = null;
let statusProvider = null;
let analyticsProvider = null;
let statusBarManager = null;
let timerProvider = null;
let automationProvider = null;

/**
 * Ensure that personas existing in the global identity state
 * also have corresponding workspace persona files.
 */
function ensureWorkspacePersonas(aiWorkspacePath) {
    try {
        const identityRoot = path.join(os.homedir(), '.ai-doc', 'data', 'identity');
        const presencePath = path.join(os.homedir(), '.ai-doc', 'data', 'live-state', 'presence.json');
        const identitiesPath = path.join(identityRoot, 'identities.json');

        let personasToEnsure = new Set();

        if (fs.existsSync(presencePath)) {
            try {
                const presence = JSON.parse(fs.readFileSync(presencePath, 'utf-8'));
                if (presence.current_identity && typeof presence.current_identity === 'string') {
                    personasToEnsure.add(presence.current_identity);
                }
            } catch { }
        }

        if (fs.existsSync(identitiesPath)) {
            try {
                const identities = JSON.parse(fs.readFileSync(identitiesPath, 'utf-8'));
                const active = identities.active || [];
                active.forEach(entry => {
                    if (entry && entry.persona) {
                        personasToEnsure.add(entry.persona);
                    }
                });
            } catch { }
        }

        if (personasToEnsure.size === 0) {
            return;
        }

        const personasPath = path.join(aiWorkspacePath, 'personas');
        if (!fs.existsSync(personasPath)) {
            fs.mkdirSync(personasPath, { recursive: true });
        }

        personasToEnsure.forEach(personaName => {
            if (!personaName.startsWith('AI-')) return;
            const filePath = path.join(personasPath, `${personaName}.md`);
            if (fs.existsSync(filePath)) return;

            const content = `---
title: "${personaName}"
description: AI Agent
created: ${new Date().toISOString()}
status: active
---

# ${personaName}

`;
            fs.writeFileSync(filePath, content);
        });
    } catch { }
}

/**
 * Get workspace .ai-workspace path
 */
function getAiWorkspacePath() {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders) return null;

    // Try to find folder with .ai-workspace
    for (const folder of folders) {
        const p = path.join(folder.uri.fsPath, '.ai-workspace');
        if (fs.existsSync(p)) return p;
    }

    return path.join(folders[0].uri.fsPath, '.ai-workspace');
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
            return [this.createActionItem('➕ Create First Persona', 'ai-agent-sync.createPersona', null, i18n.t('tooltips.createFirstPersona'))];
        }

        const personaFiles = fs.readdirSync(personasPath)
            .filter(f => f.endsWith('.md') && f.startsWith('AI-'));

        if (personaFiles.length === 0) {
            return [this.createActionItem('➕ Create First Persona', 'ai-agent-sync.createPersona', null, i18n.t('tooltips.createFirstPersona'))];
        }

        const settingsPath = path.join(aiWorkspacePath, '.persona-settings.json');
        let personaSettings = {};

        if (fs.existsSync(settingsPath)) {
            try {
                personaSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
            } catch (e) {
                personaSettings = {};
            }
        }

        const personas = personaFiles.map(file => {
            const personaName = file.replace('.md', '');
            const personaPath = path.join(personasPath, file);
            const content = fs.readFileSync(personaPath, 'utf-8');
            const tasksPath = path.join(aiWorkspacePath, 'tasks', 'active');

            let taskCount = 0;
            let totalItems = 0;
            let doneItems = 0;

            if (fs.existsSync(tasksPath)) {
                const taskFiles = fs.readdirSync(tasksPath)
                    .filter(f => f.startsWith(personaName) && f.endsWith('.md'));

                taskCount = taskFiles.length;

                taskFiles.forEach(taskFile => {
                    const taskContent = fs.readFileSync(path.join(tasksPath, taskFile), 'utf-8');
                    const total = (taskContent.match(/^- \[[ x]\]/gm) || []).length;
                    const done = (taskContent.match(/^- \[x\]/gm) || []).length;
                    totalItems += total;
                    doneItems += done;
                });
            }

            const descMatch = content.match(/description:\s*["']?([^"'\n]+)["']?/);
            const description = descMatch ? descMatch[1] : 'AI Agent';
            const settings = personaSettings[personaName] || {};
            const iconEmoji = settings.icon || '';

            const item = new vscode.TreeItem(
                iconEmoji ? `${iconEmoji} ${personaName}` : personaName,
                vscode.TreeItemCollapsibleState.Collapsed
            );
            item.iconPath = new vscode.ThemeIcon('robot', new vscode.ThemeColor('charts.purple'));
            item.contextValue = 'persona';
            item.description = description;
            item.personaName = personaName;
            item.personaPath = personaPath;
            const tooltipLines = [];
            tooltipLines.push(`$(robot) ${personaName}`);
            tooltipLines.push('');
            tooltipLines.push(description);
            tooltipLines.push('');
            tooltipLines.push(`$(checklist) Tasks ativas: ${taskCount}`);
            tooltipLines.push(`$(check) Checklist: ${doneItems}/${totalItems}`);
            const mdTooltip = new vscode.MarkdownString(tooltipLines.join('\n'));
            mdTooltip.isTrusted = false;
            item.tooltip = mdTooltip;

            return item;
        });

        // Add "Create New" button at the end
        personas.push(this.createActionItem('➕ Create New Persona', 'ai-agent-sync.createPersona', null, i18n.t('tooltips.createNewPersona')));

        return personas;
    }

    getPersonaDetails(personaElement) {
        const details = [];

        const tasksItem = new vscode.TreeItem('📋 Tasks', vscode.TreeItemCollapsibleState.Expanded);
        tasksItem.contextValue = 'tasks-section';
        tasksItem.personaName = personaElement.personaName;
        details.push(tasksItem);

        details.push(this.createActionItem('View Full Details', 'ai-agent-sync.viewPersonaDetails', personaElement.personaPath, i18n.t('tooltips.viewPersonaDetails')));

        return details;
    }

    getTasksForPersona(aiWorkspacePath, personaName) {
        const tasksPath = path.join(aiWorkspacePath, 'tasks', 'active');

        if (!fs.existsSync(tasksPath)) {
            return [this.createActionItem('➕ Create Task', 'ai-agent-sync.createTask', personaName, i18n.t('tooltips.createTaskForPersona'))];
        }

        const taskFiles = fs.readdirSync(tasksPath)
            .filter(f => f.startsWith(personaName) && f.endsWith('.md'));

        if (taskFiles.length === 0) {
            return [this.createActionItem('➕ Create Task', 'ai-agent-sync.createTask', personaName, i18n.t('tooltips.createTaskForPersona'))];
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
            item.command = {
                command: 'ai-agent-sync.showTaskDetails',
                title: 'Show Task Details',
                arguments: [taskPath]
            };

            return item;
        });

        tasks.push(this.createActionItem('Create New Task', 'ai-agent-sync.createTask', personaName, i18n.t('tooltips.createTaskForPersona')));

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
        items.push(this.createActionItem('View Full Details', 'ai-agent-sync.showTaskDetails', taskPath, i18n.t('tooltips.viewTaskDetails')));
        items.push(this.createActionItem('Edit Task', 'ai-agent-sync.openFile', taskPath, i18n.t('tooltips.editTask')));
        items.push(this.createActionItem('Archive Task', 'ai-agent-sync.archiveTask', taskPath, i18n.t('tooltips.archiveTask')));
        items.push(this.createActionItem('Delete Task', 'ai-agent-sync.deleteTask', taskPath, i18n.t('tooltips.deleteTask')));

        return items;
    }

    createActionItem(label, command, arg, tooltip) {
        const item = new vscode.TreeItem(label);
        item.command = {
            command: command,
            title: label,
            arguments: arg ? [arg] : []
        };
        item.contextValue = 'action';
        if (tooltip) {
            item.tooltip = tooltip;
        } else {
            item.tooltip = label;
        }

        // Use icons instead of just text
        if (label.includes('Create')) item.iconPath = new vscode.ThemeIcon('add');
        else if (label.includes('Edit')) item.iconPath = new vscode.ThemeIcon('edit');
        else if (label.includes('Delete')) item.iconPath = new vscode.ThemeIcon('trash');
        else if (label.includes('Archive')) item.iconPath = new vscode.ThemeIcon('archive');
        else if (label.includes('Details')) item.iconPath = new vscode.ThemeIcon('info');

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

    async getChildren(element) {
        if (element) {
            if (element.label === '🚀 Quick Actions') {
                const items = [];
                
                const openKanban = new vscode.TreeItem('Open Kanban Board');
                openKanban.command = { command: 'ai-agent-sync.openKanban', title: 'Open Kanban' };
                openKanban.iconPath = new vscode.ThemeIcon('project');
                items.push(openKanban);

                const openDashboard = new vscode.TreeItem('Open Web Dashboard');
                openDashboard.command = { command: 'ai-agent-sync.openDashboard', title: 'Open Dashboard' };
                openDashboard.iconPath = new vscode.ThemeIcon('graph');
                items.push(openDashboard);

                const rebuildContext = new vscode.TreeItem('Rebuild Context');
                rebuildContext.command = { command: 'ai-agent-sync.build', title: 'Rebuild Context' };
                rebuildContext.iconPath = new vscode.ThemeIcon('sync');
                items.push(rebuildContext);

                return items;
            }
            return [];
        }

        const items = [];

        try {
            // 1. Environment Info
            const extension = vscode.extensions.getExtension('junio-de-almeida-vitorino.ai-agent-ide-context-sync-vscode');
            const extensionVersion = extension ? extension.packageJSON.version : 'Unknown';
            
            const envItem = new vscode.TreeItem(`Ext: v${extensionVersion}`);
            envItem.iconPath = new vscode.ThemeIcon('extensions');
            items.push(envItem);

            const osItem = new vscode.TreeItem(`${os.type()} ${os.release()}`);
            osItem.iconPath = new vscode.ThemeIcon('server-environment');
            items.push(osItem);

            const nodeItem = new vscode.TreeItem(`Node: ${process.version}`);
            nodeItem.iconPath = new vscode.ThemeIcon('symbol-event');
            items.push(nodeItem);

            // 2. Quick Actions Group
            const actionsItem = new vscode.TreeItem('🚀 Quick Actions', vscode.TreeItemCollapsibleState.Expanded);
            actionsItem.iconPath = new vscode.ThemeIcon('rocket');
            items.push(actionsItem);

            // 3. Kernel & Workspace Status
            const client = new AIClient();
            let kernelStatus = 'Unknown';
            try {
                const output = await client.getKernelStatus();
                const cleanOutput = output.replace(/\x1b\[[0-9;]*m/g, '');
                
                // Try to find kernel status line
                const kernelLine = cleanOutput.split('\n').find(l => l.toLowerCase().includes('kernel:'));
                if (kernelLine) {
                    kernelStatus = kernelLine.split(':')[1].trim();
                } else {
                    kernelStatus = 'Active'; // Assume active if command succeeded
                }
            } catch (e) {
                kernelStatus = 'Error';
            }

            const kernelItem = new vscode.TreeItem(`Kernel: ${kernelStatus}`);
            kernelItem.iconPath = kernelStatus.toLowerCase().includes('active') || kernelStatus.toLowerCase().includes('ready')
                ? new vscode.ThemeIcon('check', new vscode.ThemeColor('testing.iconPassed'))
                : new vscode.ThemeIcon('warning');
            items.push(kernelItem);

            const aiWorkspacePath = getAiWorkspacePath();
            const isInitialized = aiWorkspacePath && fs.existsSync(aiWorkspacePath);
            
            const wsItem = new vscode.TreeItem(
                isInitialized ? 'Workspace: Active' : 'Workspace: Not Initialized'
            );
            wsItem.iconPath = isInitialized 
                ? new vscode.ThemeIcon('root-folder')
                : new vscode.ThemeIcon('error');
            items.push(wsItem);

            if (isInitialized) {
                 try {
                     const analyticsProvider = new AnalyticsTreeProvider();
                     const stats = analyticsProvider.calculateStats(aiWorkspacePath);
                     
                     const personasItem = new vscode.TreeItem(`Personas: ${stats.personas}`);
                     personasItem.iconPath = new vscode.ThemeIcon('account');
                     items.push(personasItem);
 
                     const activeTasksItem = new vscode.TreeItem(`Active Tasks: ${stats.activeTasks}`);
                     activeTasksItem.iconPath = new vscode.ThemeIcon('flame');
                     items.push(activeTasksItem);
                 } catch (e) { }
            }

            return items;

        } catch (error) {
            if (logger) logger.error('StatusTreeProvider error', error);
            const errorMessage = error.message || String(error);
            const isNotFound = errorMessage.includes('ENOENT') || errorMessage.includes('not found') || errorMessage.includes('não encontrado');

            if (isNotFound) {
                const item = new vscode.TreeItem('❌ ai-doc CLI not found');
                item.description = 'Install: npm install -g ai-agent-ide-context-sync';
                item.command = {
                    command: 'vscode.open',
                    title: 'Open NPM',
                    arguments: [vscode.Uri.parse('https://www.npmjs.com/package/ai-agent-ide-context-sync')]
                };
                return [item];
            }

            const item = new vscode.TreeItem('❌ Kernel Status Error');
            item.description = errorMessage;
            item.tooltip = errorMessage;
            return [item];
        }
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
            const items = [];
            items.push(this.createActionItem(
                '📊 Open Dashboard',
                'ai-agent-sync.openDashboard',
                'Open interactive analytics dashboard.\n\nPT-BR: Abre o dashboard interativo com gráficos em tempo real das suas personas, tasks e progresso.'
            ));
            items.push(this.createActionItem(
                '📆 Weekly Report',
                'ai-agent-sync.weeklyReport',
                'View summarized analytics for the current week.\n\nPT-BR: Exibe um relatório resumido da semana, com foco em produtividade e progresso.'
            ));
            items.push(this.createActionItem(
                '📅 Monthly Report',
                'ai-agent-sync.monthlyReport',
                'View summarized analytics for the current month.\n\nPT-BR: Exibe um relatório mensal de alto nível com tendências de trabalho e conclusão de tasks.'
            ));
            items.push(this.createActionItem(
                '☁️ Cloud Sync',
                'ai-agent-sync.cloudSync',
                'Sync analytics and workspace data with the cloud service configured.\n\nPT-BR: Sincroniza dados do workspace e analytics com o serviço de nuvem configurado (quando disponível).'
            ));
            items.push(this.createActionItem(
                '📦 Export Backup',
                'ai-agent-sync.exportBackup',
                'Export a backup of your workspace and analytics data.\n\nPT-BR: Exporta um backup dos dados do workspace/analytics para arquivamento ou migração.'
            ));
            const stats = this.calculateStats(aiWorkspacePath);
            items.push(this.createStatItem('👥 Personas', stats.personas));
            items.push(this.createStatItem('📋 Active Tasks', stats.activeTasks));
            items.push(this.createStatItem('✅ Completed Tasks', stats.completedTasks));
            items.push(this.createStatItem('📊 Total Checklist Items', stats.totalChecklistItems));
            items.push(this.createStatItem('✓ Completed Items', stats.completedChecklistItems));
            items.push(this.createStatItem('📈 Completion Rate', `${stats.completionRate}%`));
            return items;
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

    createActionItem(label, commandId, tooltip) {
        const item = new vscode.TreeItem(label);
        item.iconPath = new vscode.ThemeIcon('link-external');
        item.command = {
            command: commandId,
            title: label
        };
        item.tooltip = tooltip;
        return item;
    }

    createStatItem(label, value) {
        const item = new vscode.TreeItem(`${label}: ${value}`);
        if (label.includes('Personas')) {
            item.iconPath = new vscode.ThemeIcon('account');
        } else if (label.includes('Active Tasks')) {
            item.iconPath = new vscode.ThemeIcon('flame');
        } else if (label.includes('Completed Tasks')) {
            item.iconPath = new vscode.ThemeIcon(
                'check',
                new vscode.ThemeColor('testing.iconPassed')
            );
        } else if (label.includes('Total Checklist Items')) {
            item.iconPath = new vscode.ThemeIcon(
                'circle-large-outline',
                new vscode.ThemeColor('disabledForeground')
            );
        } else if (label.includes('Completed Items')) {
            item.iconPath = new vscode.ThemeIcon(
                'pass-filled',
                new vscode.ThemeColor('testing.iconPassed')
            );
        } else if (label.includes('Completion Rate')) {
            item.iconPath = new vscode.ThemeIcon('pie-chart');
        } else {
            item.iconPath = new vscode.ThemeIcon('graph');
        }

        if (label.includes('Personas')) {
            item.command = {
                command: 'ai-agent-sync.showPersonas',
                title: 'Show All Personas'
            };
            item.tooltip = 'Click to view all personas';
        } else if (label.includes('Active Tasks')) {
            item.command = {
                command: 'ai-agent-sync.showActiveTasks',
                title: 'Show Active Tasks'
            };
            item.tooltip = 'Click to view active tasks';
        } else if (label.includes('Checklist Items') || label.includes('Completed Items')) {
            item.command = {
                command: 'ai-agent-sync.showChecklistItems',
                title: 'Show Checklist Items'
            };
            item.tooltip = 'Click to view all checklist items';
        } else if (label.includes('Completion Rate')) {
            item.command = {
                command: 'ai-agent-sync.showCompletionDetails',
                title: 'Show Completion Details'
            };
            item.tooltip = 'Baseado em itens de checklist completados em relação ao total';
        }

        return item;
    }
}

class PomodoroTreeProvider {
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
        if (element) {
            return [];
        }

        const items = [];

        const currentTask = statusBarManager ? statusBarManager.getCurrentTask() : null;
        const timerRunning = statusBarManager ? statusBarManager.isTimerRunning() : false;
        const timerSeconds = statusBarManager ? statusBarManager.getTimerSeconds() : 0;

        let timerLabel = 'Timer: Stopped';
        if (timerRunning || timerSeconds > 0) {
            const minutes = Math.floor(timerSeconds / 60);
            const seconds = timerSeconds % 60;
            const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            timerLabel = timerRunning ? `Timer: ${timeStr} (Running)` : `Timer: ${timeStr} (Paused)`;
        }

        const timerItem = new vscode.TreeItem(timerLabel);
        timerItem.iconPath = new vscode.ThemeIcon('watch');
        timerItem.tooltip = 'Pomodoro timer status.\n\nPT-BR: Status do temporizador Pomodoro. Use os controles abaixo para iniciar, pausar ou redefinir sessões de foco e intervalo.';
        items.push(timerItem);

        const taskLabel = currentTask ? `Task: ${currentTask.label}` : 'Task: none selected';
        const taskItem = new vscode.TreeItem(taskLabel);
        taskItem.iconPath = new vscode.ThemeIcon('checklist');
        taskItem.command = {
            command: 'ai-agent-sync.quickPicker',
            title: 'Select Active Task'
        };
        taskItem.tooltip = 'Select or change the active task used by the Pomodoro timer.\n\nPT-BR: Selecione ou troque a task ativa que será usada nas sessões de foco/Pomodoro.';
        items.push(taskItem);

        const controlsItem = new vscode.TreeItem('Open Timer Controls');
        controlsItem.iconPath = new vscode.ThemeIcon('clock');
        controlsItem.command = {
            command: 'ai-agent-sync.timerMenu',
            title: 'Open Timer Controls'
        };
        controlsItem.tooltip = 'Open the timer menu with Pomodoro, break and custom duration options.\n\nPT-BR: Abre o menu do timer com Pomodoro de 25 minutos, pausa de 5 minutos e duração personalizada.';
        items.push(controlsItem);

        let modeLabel = 'Mode: Idle (no active session)';
        if (timerRunning && timerSeconds >= 15 * 60) {
            modeLabel = 'Mode: Focus (Pomodoro)';
        } else if (timerRunning && timerSeconds > 0 && timerSeconds <= 10 * 60) {
            modeLabel = 'Mode: Break';
        } else if (!timerRunning && timerSeconds > 0) {
            modeLabel = 'Mode: Paused session';
        }

        const modeItem = new vscode.TreeItem(modeLabel);
        modeItem.iconPath = new vscode.ThemeIcon('pulse');
        modeItem.tooltip = 'High-level view of the current focus mode.\n\nPT-BR: Visão geral do modo atual (foco, pausa ou inativo) do seu ciclo de Pomodoro.';
        items.push(modeItem);

        return items;
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

    const taskFiles = fs.readdirSync(tasksPath).filter(f => f.endsWith('.md') && f.toLowerCase() !== 'readme.md');

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
        this.updateDisplay();
        this.statusBarItem.show();
    }

    hide() {
        this.statusBarItem.hide();
    }

    updateTask(taskInfo) {
        if (taskInfo) {
            this.currentTask = taskInfo;
            const personaSettings = vscode.commands.executeCommand('ai-agent-sync.getPersonaSettings', taskInfo.persona);
            const personaIcon = personaSettings && personaSettings.icon ? personaSettings.icon : '';
            const prefix = personaIcon ? `${personaIcon} ` : '$(checklist) ';
            this.statusBarItem.text = `${prefix}${taskInfo.label}`;
            this.statusBarItem.tooltip = `Task: ${taskInfo.label}\nPersona: ${taskInfo.persona}\nClick to switch task`;
        } else {
            this.currentTask = null;
            this.statusBarItem.text = '$(add) Select Task';
            this.statusBarItem.tooltip = 'Click to select a task';
        }
        if (timerProvider) {
            timerProvider.refresh();
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
        if (timerProvider) {
            timerProvider.refresh();
        }
    }

    isTimerRunning() {
        return this.timerRunning;
    }

    getTimerSeconds() {
        return this.timerSeconds;
    }
}

/**
 * Activate extension
 */
function activate(context) {
    // Initialize Logger
            logger = new Logger();
            context.subscriptions.push(logger);
            logger.log('AI Agent IDE Context Sync extension activated!');
            
            // Set Logger for AIClient
            AIClient.setLogger(logger);

            // Initialize i18n
            i18n = new I18n(context.extensionPath);
    logger.setI18n(i18n);
    setAutomationI18n(i18n);
    setAutomationLogger(logger);

    // --- Automation Module (New Core) ---
    automationProvider = new AutomationTreeProvider(i18n);
    vscode.window.registerTreeDataProvider('ai-agent-sync-automation', automationProvider);

    context.subscriptions.push(
        vscode.commands.registerCommand('ai-agent-sync.generatePrompt', handleGeneratePrompt),
        vscode.commands.registerCommand('ai-agent-sync.context.snap', handleContextSnap),
        vscode.commands.registerCommand('ai-agent-sync.runWorkflow', handleRunWorkflow),
        vscode.commands.registerCommand('ai-agent-sync.runWorkflowInput', handleRunWorkflow),
        // Laravel Commands
        vscode.commands.registerCommand('ai-agent-sync.laravel.analyze', handleLaravelAnalyze),
        vscode.commands.registerCommand('ai-agent-sync.laravel.createLayer', handleLaravelCreateLayer),
        vscode.commands.registerCommand('ai-agent-sync.laravel.listEntities', handleLaravelListEntities),
        // React Commands
        vscode.commands.registerCommand('ai-agent-sync.react.createComponent', handleReactCreateComponent),
        vscode.commands.registerCommand('ai-agent-sync.react.createHook', handleReactCreateHook),
        // Git Commands
        vscode.commands.registerCommand('ai-agent-sync.git.commitMessage', handleGenerateCommitMessage),
        vscode.commands.registerCommand('ai-agent-sync.git.prDescription', handleGeneratePRDescription),
        vscode.commands.registerCommand('ai-agent-sync.git.codeReview', handleGitCodeReview)
    );
    // -------------------------------------

    // Initialize Smart Notifications
    notifications = new SmartNotifications(context, i18n);
    const aiWorkspacePath = getAiWorkspacePath();
    if (aiWorkspacePath) {
        notifications.start(aiWorkspacePath);
        ensureWorkspacePersonas(aiWorkspacePath);
    }

    // Initialize Ritual Scheduler
    ritualScheduler = new RitualScheduler(context, i18n);
    ritualScheduler.start();
    context.subscriptions.push({ dispose: () => ritualScheduler.stop() });

    // Initialize Advanced Modules
    kanbanManager = aiWorkspacePath ? new KanbanManager(context, aiWorkspacePath) : null;
    analytics = aiWorkspacePath ? new AdvancedAnalytics(aiWorkspacePath) : null;
    themeManager = new ThemeManager(context);
    cloudSync = aiWorkspacePath ? new CloudSyncManager(context, aiWorkspacePath) : null;

    // Register Tree Providers
    personasProvider = new PersonasTreeProvider();
    statusProvider = new StatusTreeProvider();
    analyticsProvider = new AnalyticsTreeProvider();
    timerProvider = new PomodoroTreeProvider();

    vscode.window.registerTreeDataProvider('ai-agent-sync-personas', personasProvider);
    vscode.window.registerTreeDataProvider('ai-agent-sync-status', statusProvider);
    vscode.window.registerTreeDataProvider('ai-agent-sync-analytics', analyticsProvider);
    vscode.window.registerTreeDataProvider('ai-agent-sync-timer', timerProvider);

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
    statusBarManager = new StatusBarManager();
    statusBarManager.show();
    context.subscriptions.push(statusBarManager.statusBarItem);

    // Register Commands
    registerCommands(context);
}

/**
 * Register all commands
 */
function registerCommands(context) {
    // New Commands (v2.1)
    context.subscriptions.push(
        // Logger Commands
        vscode.commands.registerCommand('ai-agent-sync.showLogs', () => {
            if (logger) logger.show();
        }),
        vscode.commands.registerCommand('ai-agent-sync.copyErrorLogs', async () => {
            if (logger) {
                const logs = logger.getLogs();
                await vscode.env.clipboard.writeText(logs);
                vscode.window.showInformationMessage(i18n.t('messages.logsCopied'));
            }
        }),

        vscode.commands.registerCommand('ai-agent-sync.scanDocs', async () => {
            const client = new AIClient();
            try {
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: i18n.t('automation.scanDocsProgress'),
                    cancellable: false
                }, async () => {
                    const output = await client.scanDocs();
                    vscode.window.showInformationMessage(i18n.t('automation.scanDocsCompleted', output));
                });
            } catch (e) {
                if (logger) {
                    logger.error(i18n.t('automation.scanDocsFailed', e), e);
                } else {
                    vscode.window.showErrorMessage(i18n.t('automation.scanDocsFailed', e));
                }
            }
        }),
        vscode.commands.registerCommand('ai-agent-sync.ritual', async () => {
            const client = new AIClient();
            try {
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: i18n.t('automation.runRitualProgress'),
                    cancellable: false
                }, async () => {
                    await client.runRitual();
                    vscode.window.showInformationMessage(i18n.t('automation.runRitualCompleted'));
                    // Refresh status
                    statusProvider.refresh();
                });
            } catch (e) {
                if (logger) {
                    logger.error(i18n.t('automation.runRitualFailed', e), e);
                } else {
                    vscode.window.showErrorMessage(i18n.t('automation.runRitualFailed', e));
                }
            }
        }),
        vscode.commands.registerCommand('ai-agent-sync.evolve', async () => {
            const client = new AIClient();
            try {
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: i18n.t('automation.evolveRulesProgress'),
                    cancellable: false
                }, async () => {
                    const output = await client.evolveRules();
                    vscode.window.showInformationMessage(i18n.t('automation.evolveRulesCompleted', output));
                });
            } catch (e) {
                if (logger) {
                    logger.error(i18n.t('automation.evolveRulesFailed', e), e);
                } else {
                    vscode.window.showErrorMessage(i18n.t('automation.evolveRulesFailed', e));
                }
            }
        })
    );

    // Initialize workspace
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-agent-sync.init', async () => {
            try {
                const client = new AIClient();
                await client.initWorkspace();
                vscode.window.showInformationMessage(i18n.t('messages.workspaceInitialized'));

                // Re-initialize managers with new workspace path
                const newAiWorkspacePath = getAiWorkspacePath();
                if (newAiWorkspacePath) {
                    kanbanManager = new KanbanManager(context, newAiWorkspacePath);
                    analytics = new AdvancedAnalytics(newAiWorkspacePath);
                    cloudSync = new CloudSyncManager(context, newAiWorkspacePath);
                    notifications.start(newAiWorkspacePath);
                }

                personasProvider.refresh();
                statusProvider.refresh();
            } catch (error) {
                const message = typeof error.message === 'string' ? error.message.toLowerCase() : '';
                if (message.includes('ai-doc') || message.includes('not found') || message.includes('command not found')) {
                    const terminal = vscode.window.createTerminal('AI Agent CLI + Init');
                    terminal.show();
                    terminal.sendText('npm install -g ai-agent-ide-context-sync && ai-doc init', true);
                    vscode.window.showInformationMessage(i18n.t('messages.installingCliAndInit'));
                } else {
                    if (logger) {
                        logger.error(i18n.t('messages.initFailed', error.message), error);
                    } else {
                        vscode.window.showErrorMessage(i18n.t('messages.initFailed', error.message));
                    }
                }
            }
        })
    );

    // Kernel info from status view
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-agent-sync.showKernelInfo', async () => {
            try {
                const client = new AIClient();
                const output = await client.getKernelStatus();
                const statusOutput = output.replace(/\x1b\[[0-9;]*m/g, '');

                const lines = statusOutput.split('\n').map(l => l.trim()).filter(Boolean);
                const kernelLine = lines.find(l => l.toLowerCase().includes('ai kernel'));
                const workspaceLine = lines.find(l => l.toLowerCase().includes('ai workspace'));
                const otherLines = lines.filter(l => l !== kernelLine && l !== workspaceLine);

                let statusSection = '';

                if (kernelLine || workspaceLine) {
                    statusSection += `### Kernel Global\n\n`;
                    if (kernelLine) {
                        statusSection += `- ${kernelLine}\n\n`;
                    }
                    statusSection += `### Kernel do Workspace\n\n`;
                    if (workspaceLine) {
                        statusSection += `- ${workspaceLine}\n\n`;
                    }
                }

                if (otherLines.length > 0) {
                    statusSection += `### Saída Completa\n\n\`\`\`\n${otherLines.join('\n')}\n\`\`\`\n`;
                }

                const aiWorkspacePath = getAiWorkspacePath();
                let statsSummary = '';

                if (aiWorkspacePath && fs.existsSync(aiWorkspacePath)) {
                    const analyticsProvider = new AnalyticsTreeProvider();
                    const stats = analyticsProvider.calculateStats(aiWorkspacePath);
                    statsSummary = `
## Workspace Analytics

- Personas: ${stats.personas}
- Active Tasks: ${stats.activeTasks}
- Completed Tasks: ${stats.completedTasks}
- Total Checklist Items: ${stats.totalChecklistItems}
- Completed Items: ${stats.completedChecklistItems}
- Completion Rate: ${stats.completionRate}%
`;
                }

                const content = `# ⚙️ Kernel Status

## ai-doc status

${statusSection}
${statsSummary}

---
Fonte: ai-doc status + leitura da pasta .ai-workspace do projeto atual.
`;

                showWebviewReport(`# ⚙️ Kernel Status`, content);
            } catch (error) {
                if (logger) {
                    logger.error(`Failed to load kernel info: ${error.message}`, error);
                } else {
                    vscode.window.showErrorMessage(`Failed to load kernel info: ${error.message}`);
                }
            }
        })
    );

    // Build context
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-agent-sync.build', async () => {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: i18n.t('messages.buildingContext'),
                cancellable: false
            }, async (progress) => {
                try {
                    progress.report({ increment: 0, message: i18n.t('messages.compilingModules') });
                    const client = new AIClient();
                    await client.buildContext();
                    progress.report({ increment: 100, message: i18n.t('messages.buildDone') });
                    vscode.window.showInformationMessage(i18n.t('messages.contextBuilt'));
                    statusProvider.refresh();
                } catch (error) {
                    if (logger) {
                        logger.error(i18n.t('messages.buildFailed', error.message), error);
                    } else {
                        vscode.window.showErrorMessage(i18n.t('messages.buildFailed', error.message));
                    }
                }
            });
        })
    );

    async function openPersonaForm(mode, filePath) {
        const aiWorkspacePath = getAiWorkspacePath();
        if (!aiWorkspacePath) {
            vscode.window.showErrorMessage(i18n.t('messages.noWorkspaceFound'));
            return;
        }

        let persona = null;
        let sections = [];
        let frontmatter = [];

        if (mode === 'edit' && filePath && fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            const nameMatch = content.match(/title:\s*["']?([^"'\n]+)["']?/);
            const descMatch = content.match(/description:\s*["']?([^"'\n]+)["']?/);

            persona = {
                name: nameMatch ? nameMatch[1] : path.basename(filePath, '.md'),
                description: descMatch ? descMatch[1] : '',
                path: filePath
            };

            const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
            if (fmMatch) {
                const fmLines = fmMatch[1].split('\n');
                fmLines.forEach(line => {
                    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
                    if (m) {
                        let value = m[2].trim();
                        if ((value.startsWith('"') && value.endsWith('"')) ||
                            (value.startsWith('\'') && value.endsWith('\''))) {
                            value = value.substring(1, value.length - 1);
                        }
                        frontmatter.push({
                            key: m[1],
                            value
                        });
                    }
                });
            }

            const parts = content.split('---');
            let body = '';
            if (parts.length >= 3) {
                body = parts.slice(2).join('---');
            } else {
                body = content;
            }

            const lines = body.split('\n');
            let current = null;

            lines.forEach(line => {
                const headingMatch = line.match(/^##\s+(.+)\s*$/);
                if (headingMatch) {
                    if (current) {
                        sections.push({
                            title: current.title,
                            content: current.lines.join('\n').trim()
                        });
                    }
                    current = {
                        title: headingMatch[1],
                        lines: []
                    };
                } else if (current) {
                    current.lines.push(line);
                }
            });

            if (current) {
                sections.push({
                    title: current.title,
                    content: current.lines.join('\n').trim()
                });
            }
        }

        const panel = vscode.window.createWebviewPanel(
            'personaForm',
            mode === 'create' ? '➕ Create Persona' : '👤 Edit Persona',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        const htmlPath = path.join(context.extensionPath, 'persona-form.html');
        panel.webview.html = fs.readFileSync(htmlPath, 'utf-8');

        panel.webview.onDidReceiveMessage(
            async message => {
                if (message.command === 'ready') {
                    panel.webview.postMessage({
                        mode,
                        persona,
                        sections,
                        frontmatter
                    });
                } else if (message.command === 'save') {
                    const name = (message.name || '').trim();
                    const description = (message.description || '').trim();

                    if (!name) {
                        vscode.window.showErrorMessage(i18n.t('messages.personaNameRequired'));
                        return;
                    }

                    if (!name.startsWith('AI-')) {
                        vscode.window.showErrorMessage(i18n.t('messages.personaNamePrefix'));
                        return;
                    }

                    if (!/^AI-[A-Z]+$/.test(name)) {
                        vscode.window.showErrorMessage(i18n.t('messages.personaNameUppercase'));
                        return;
                    }

                    try {
                        if (mode === 'create') {
                            const client = new AIClient();
                            await client.createIdentity(name);
                            ensureWorkspacePersonas(aiWorkspacePath);

                            const personaPath = path.join(aiWorkspacePath, 'personas', `${name}.md`);
                            if (fs.existsSync(personaPath)) {
                                let content = fs.readFileSync(personaPath, 'utf-8');
                                if (content.includes('description:')) {
                                    content = content.replace(/description:\s*["']?([^"'\n]+)["']?/,
                                        `description: "${description || 'AI Agent'}"`);
                                } else {
                                    content = content.replace(/title:\s*["']?([^"'\n]+)["']?/, match => {
                                        return `${match}\ndescription: "${description || 'AI Agent'}"`;
                                    });
                                }
                                fs.writeFileSync(personaPath, content);
                            }

                            vscode.window.showInformationMessage(
                                i18n.t('messages.motivationalPersonaCreated', name),
                                i18n.t('messages.viewPersonaDetails'),
                                i18n.t('messages.openDashboard'),
                                i18n.t('messages.dismiss')
                            ).then(selection => {
                                if (selection === i18n.t('messages.viewPersonaDetails')) {
                                    vscode.commands.executeCommand('ai-agent-sync.viewPersonaDetails', personaPath);
                                } else if (selection === i18n.t('messages.openDashboard')) {
                                    vscode.commands.executeCommand('ai-agent-sync.openDashboard');
                                }
                            });
                        } else if (mode === 'edit' && persona && persona.path) {
                            const personaPath = persona.path;
                            if (fs.existsSync(personaPath)) {
                                let content = fs.readFileSync(personaPath, 'utf-8');

                                if (Array.isArray(message.frontmatter) && message.frontmatter.length > 0) {
                                    const map = {};
                                    message.frontmatter.forEach(f => {
                                        if (f && f.key) {
                                            map[f.key] = (f.value || '').toString();
                                        }
                                    });

                                    map.title = name;
                                    map.description = description || 'AI Agent';

                                    const keys = Object.keys(map);
                                    const lines = keys.map(k => {
                                        const v = map[k];
                                        const needsQuotes = /[\s:]/.test(v);
                                        const safe = needsQuotes ? `"${v.replace(/"/g, '\\"')}"` : v;
                                        return `${k}: ${safe}`;
                                    });

                                    if (content.startsWith('---')) {
                                        content = content.replace(/^---[\s\S]*?---/, `---\n${lines.join('\n')}\n---`);
                                    } else {
                                        content = `---\n${lines.join('\n')}\n---\n\n` + content;
                                    }
                                } else {
                                    if (content.includes('description:')) {
                                        content = content.replace(/description:\s*["']?([^"'\n]+)["']?/,
                                            `description: "${description || 'AI Agent'}"`);
                                    } else {
                                        content = content.replace(/title:\s*["']?([^"'\n]+)["']?/, match => {
                                            return `${match}\ndescription: "${description || 'AI Agent'}"`;
                                        });
                                    }
                                }

                                if (Array.isArray(message.sections) && message.sections.length > 0) {
                                    const bodyLines = [];
                                    message.sections.forEach(sec => {
                                        if (!sec || !sec.title) {
                                            return;
                                        }
                                        bodyLines.push(`## ${sec.title}`);
                                        const contentText = (sec.content || '').trim();
                                        if (contentText) {
                                            bodyLines.push('');
                                            bodyLines.push(contentText);
                                        }
                                        bodyLines.push('');
                                    });

                                    let bodyContent = bodyLines.join('\n');
                                    bodyContent = bodyContent.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';

                                    if (content.startsWith('---')) {
                                        const fmMatch = content.match(/^---[\s\S]*?---/);
                                        if (fmMatch) {
                                            const header = fmMatch[0];
                                            content = `${header}\n\n${bodyContent}`;
                                        } else {
                                            content = bodyContent;
                                        }
                                    } else {
                                        content = bodyContent;
                                    }
                                }

                                fs.writeFileSync(personaPath, content);
                            }

                            vscode.window.showInformationMessage(
                                i18n.t('messages.motivationalPersonaUpdated', persona.name),
                                i18n.t('messages.viewPersonaDetails'),
                                i18n.t('messages.openDashboard'),
                                i18n.t('messages.dismiss')
                            ).then(selection => {
                                if (selection === i18n.t('messages.viewPersonaDetails')) {
                                    vscode.commands.executeCommand('ai-agent-sync.viewPersonaDetails', persona.path);
                                } else if (selection === i18n.t('messages.openDashboard')) {
                                    vscode.commands.executeCommand('ai-agent-sync.openDashboard');
                                }
                            });
                        }

                        personasProvider.refresh();
                        analyticsProvider.refresh();
                        panel.dispose();
                    } catch (error) {
                        vscode.window.showErrorMessage(`❌ Failed to save persona: ${error.message}`);
                    }
                } else if (message.command === 'editMarkdown' && message.path) {
                    const doc = await vscode.workspace.openTextDocument(message.path);
                    await vscode.window.showTextDocument(doc);
                }
            },
            undefined,
            context.subscriptions
        );
    }

    context.subscriptions.push(
        vscode.commands.registerCommand('ai-agent-sync.createPersona', async () => {
            await openPersonaForm('create');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('ai-agent-sync.editPersona', async (arg) => {
            let filePath = null;

            if (typeof arg === 'string') {
                filePath = arg;
            } else if (arg && typeof arg === 'object') {
                if (arg.personaPath) {
                    filePath = arg.personaPath;
                } else if (arg.resourceUri && arg.resourceUri.fsPath) {
                    filePath = arg.resourceUri.fsPath;
                }
            }

            if (!filePath || !fs.existsSync(filePath)) {
                vscode.window.showErrorMessage('Persona file not found');
                return;
            }

            await openPersonaForm('edit', filePath);
        })
    );

    // Delete persona
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-agent-sync.deletePersona', async (arg) => {
            const personaName = typeof arg === 'string' ? arg : (arg?.personaName || arg?.label);

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
        vscode.commands.registerCommand('ai-agent-sync.createTask', async (arg) => {
            let personaName = typeof arg === 'string' ? arg : (arg?.personaName || arg?.label);

            if (!personaName) {
                const aiWorkspacePath = getAiWorkspacePath();
                if (!aiWorkspacePath) {
                    vscode.window.showErrorMessage('No .ai-workspace found');
                    return;
                }

                const personasPath = path.join(aiWorkspacePath, 'personas');
                if (!fs.existsSync(personasPath)) {
                    vscode.window.showErrorMessage('No personas found. Create one first.');
                    return;
                }

                const personaFiles = fs.readdirSync(personasPath)
                    .filter(f => f.endsWith('.md') && f.startsWith('AI-'));

                if (personaFiles.length === 0) {
                    vscode.window.showErrorMessage('No personas found. Create one first.');
                    return;
                }

                const picked = await vscode.window.showQuickPick(
                    personaFiles.map(f => f.replace('.md', '')),
                    { placeHolder: 'Select persona for the new task' }
                );

                if (!picked) return;
                personaName = picked;
            }

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

            vscode.window.showInformationMessage(
                i18n.t('messages.motivationalTaskCreated', title, personaName),
                i18n.t('messages.viewTask'),
                i18n.t('messages.openKanban'),
                i18n.t('messages.openDashboard'),
                i18n.t('messages.dismiss')
            ).then(selection => {
                if (selection === i18n.t('messages.viewTask')) {
                    vscode.commands.executeCommand('ai-agent-sync.showTaskDetails', taskPath);
                } else if (selection === i18n.t('messages.openKanban')) {
                    vscode.commands.executeCommand('ai-agent-sync.openKanban');
                } else if (selection === i18n.t('messages.openDashboard')) {
                    vscode.commands.executeCommand('ai-agent-sync.openDashboard');
                }
            });

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
                const original = lines[lineNumber];

                const totalItems = (content.match(/^- \[[ x]\]/gm) || []).length;
                const doneBefore = (content.match(/^- \[x\]/gm) || []).length;

                lines[lineNumber] = lines[lineNumber].replace(
                    /^- \[[ x]\]/,
                    newState ? '- [x]' : '- [ ]'
                );

                fs.writeFileSync(taskPath, lines.join('\n'));
                personasProvider.refresh();
                analyticsProvider.refresh();

                const contentAfter = lines.join('\n');
                const doneAfter = (contentAfter.match(/^- \[x\]/gm) || []).length;

                const titleMatch = content.match(/title:\s*["']?([^"'\n]+)["']?/);
                const taskTitle = titleMatch ? titleMatch[1] : path.basename(taskPath);

                vscode.window.showInformationMessage(
                    i18n.t(
                        'messages.motivationalChecklistUpdated',
                        taskTitle,
                        doneAfter,
                        totalItems
                    ),
                    i18n.t('messages.viewTask'),
                    i18n.t('messages.openDashboard'),
                    i18n.t('messages.dismiss')
                ).then(selection => {
                    if (selection === i18n.t('messages.viewTask')) {
                        vscode.commands.executeCommand('ai-agent-sync.showTaskDetails', taskPath);
                    } else if (selection === i18n.t('messages.openDashboard')) {
                        vscode.commands.executeCommand('ai-agent-sync.openDashboard');
                    }
                });
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

    context.subscriptions.push(
        vscode.commands.registerCommand('ai-agent-sync.viewPersonaDetails', async (arg) => {
            let filePath = null;

            if (typeof arg === 'string') {
                filePath = arg;
            } else if (arg && typeof arg === 'object') {
                if (arg.personaPath) {
                    filePath = arg.personaPath;
                } else if (arg.resourceUri && arg.resourceUri.fsPath) {
                    filePath = arg.resourceUri.fsPath;
                }
            }

            if (!filePath || !fs.existsSync(filePath)) {
                vscode.window.showErrorMessage('Persona file not found');
                return;
            }

            const doc = await vscode.workspace.openTextDocument(filePath);
            await vscode.window.showTextDocument(doc);
        })
    );

    // Task details webview
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-agent-sync.showTaskDetails', async (taskPath) => {
            if (!taskPath) {
                vscode.window.showErrorMessage('Task path not provided');
                return;
            }

            if (!fs.existsSync(taskPath)) {
                vscode.window.showErrorMessage('Task file not found');
                return;
            }

            const content = fs.readFileSync(taskPath, 'utf-8');

            let frontmatter = [];
            let sections = [];

            const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
            if (fmMatch) {
                const fmLines = fmMatch[1].split('\n');
                fmLines.forEach(line => {
                    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
                    if (m) {
                        let value = m[2].trim();
                        if ((value.startsWith('"') && value.endsWith('"')) ||
                            (value.startsWith('\'') && value.endsWith('\''))) {
                            value = value.substring(1, value.length - 1);
                        }
                        frontmatter.push({
                            key: m[1],
                            value
                        });
                    }
                });
            }

            let body = '';
            if (content.startsWith('---')) {
                const parts = content.split('---');
                if (parts.length >= 3) {
                    body = parts.slice(2).join('---');
                }
            }
            if (!body) {
                body = content;
            }

            const lines = body.split('\n');
            let current = null;

            lines.forEach(line => {
                const headingMatch = line.match(/^##\s+(.+)\s*$/);
                if (headingMatch) {
                    if (current) {
                        sections.push({
                            title: current.title,
                            content: current.lines.join('\n').trim()
                        });
                    }
                    current = {
                        title: headingMatch[1],
                        lines: []
                    };
                } else if (current) {
                    current.lines.push(line);
                }
            });

            if (current) {
                sections.push({
                    title: current.title,
                    content: current.lines.join('\n').trim()
                });
            }

            const titleMatch = content.match(/title:\s*["']?([^"'\n]+)["']?/);
            const personaMatch = content.match(/persona:\s*([^\n]+)/);
            const statusMatch = content.match(/status:\s*([\w-]+)/i);
            const deadlineMatch = content.match(/deadline:\s*(\d{4}-\d{2}-\d{2})/i);

            const totalItems = (content.match(/^- \[[ x]\]/gm) || []).length;
            const doneItems = (content.match(/^- \[x\]/gm) || []).length;

            const validStatuses = ['todo', 'in-progress', 'review', 'done'];
            const rawStatus = statusMatch ? statusMatch[1].toLowerCase() : 'todo';
            const status = validStatuses.includes(rawStatus) ? rawStatus : 'todo';

            const aiWorkspacePath = getAiWorkspacePath();
            let personas = [];

            if (aiWorkspacePath) {
                const personasPath = path.join(aiWorkspacePath, 'personas');
                if (fs.existsSync(personasPath)) {
                    personas = fs.readdirSync(personasPath)
                        .filter(f => f.endsWith('.md') && f.startsWith('AI-'))
                        .map(f => f.replace('.md', ''));
                }
            }

            const task = {
                id: path.basename(taskPath),
                title: titleMatch ? titleMatch[1] : path.basename(taskPath),
                persona: personaMatch ? personaMatch[1].trim() : '',
                status,
                deadline: deadlineMatch ? deadlineMatch[1] : null,
                total: totalItems,
                completed: doneItems,
                path: taskPath
            };

            const panel = vscode.window.createWebviewPanel(
                'taskDetails',
                `📋 ${task.title}`,
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            const htmlPath = path.join(context.extensionPath, 'task-details.html');
            panel.webview.html = fs.readFileSync(htmlPath, 'utf-8');

            panel.webview.onDidReceiveMessage(
                async message => {
                    if (message.command === 'ready') {
                        panel.webview.postMessage({ task, frontmatter, sections, personas });
                    } else if (message.command === 'editMarkdown' && message.path) {
                        const doc = await vscode.workspace.openTextDocument(message.path);
                        await vscode.window.showTextDocument(doc);
                    } else if (message.command === 'save') {
                        try {
                            if (!fs.existsSync(taskPath)) {
                                vscode.window.showErrorMessage('Task file not found');
                                return;
                            }

                            let updatedContent = fs.readFileSync(taskPath, 'utf-8');

                            if (Array.isArray(message.frontmatter) && message.frontmatter.length > 0) {
                                const map = {};
                                message.frontmatter.forEach(f => {
                                    if (f && f.key) {
                                        map[f.key] = (f.value || '').toString();
                                    }
                                });

                                const keys = Object.keys(map);
                                const linesFm = keys.map(k => {
                                    const v = map[k];
                                    const needsQuotes = /[\s:]/.test(v);
                                    const safe = needsQuotes ? `"${v.replace(/"/g, '\\"')}"` : v;
                                    return `${k}: ${safe}`;
                                });

                                if (updatedContent.startsWith('---')) {
                                    updatedContent = updatedContent.replace(
                                        /^---[\s\S]*?---/,
                                        `---\n${linesFm.join('\n')}\n---`
                                    );
                                } else {
                                    updatedContent = `---\n${linesFm.join('\n')}\n---\n\n` + updatedContent;
                                }
                            }

                            if (Array.isArray(message.sections) && message.sections.length > 0) {
                                const bodyLines = [];
                                message.sections.forEach(sec => {
                                    if (!sec || !sec.title) {
                                        return;
                                    }
                                    bodyLines.push(`## ${sec.title}`);
                                    const contentText = (sec.content || '').trim();
                                    if (contentText) {
                                        bodyLines.push('');
                                        bodyLines.push(contentText);
                                    }
                                    bodyLines.push('');
                                });

                                let bodyContent = bodyLines.join('\n');
                                bodyContent = bodyContent.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';

                                if (updatedContent.startsWith('---')) {
                                    const fmBlock = updatedContent.match(/^---[\s\S]*?---/);
                                    if (fmBlock) {
                                        const header = fmBlock[0];
                                        updatedContent = `${header}\n\n${bodyContent}`;
                                    } else {
                                        updatedContent = bodyContent;
                                    }
                                } else {
                                    updatedContent = bodyContent;
                                }
                            }

                            fs.writeFileSync(taskPath, updatedContent);

                            const newContent = fs.readFileSync(taskPath, 'utf-8');

                            const newTitleMatch = newContent.match(/title:\s*["']?([^"'\n]+)["']?/);
                            const newPersonaMatch = newContent.match(/persona:\s*([^\n]+)/);
                            const newStatusMatch = newContent.match(/status:\s*([\w-]+)/i);
                            const newDeadlineMatch = newContent.match(/deadline:\s*(\d{4}-\d{2}-\d{2})/i);

                            const newTotalItems = (newContent.match(/^- \[[ x]\]/gm) || []).length;
                            const newDoneItems = (newContent.match(/^- \[x\]/gm) || []).length;

                            const validStatuses2 = ['todo', 'in-progress', 'review', 'done'];
                            const rawStatus2 = newStatusMatch ? newStatusMatch[1].toLowerCase() : 'todo';
                            const status2 = validStatuses2.includes(rawStatus2) ? rawStatus2 : 'todo';

                            const updatedTask = {
                                id: path.basename(taskPath),
                                title: newTitleMatch ? newTitleMatch[1] : path.basename(taskPath),
                                persona: newPersonaMatch ? newPersonaMatch[1].trim() : '',
                                status: status2,
                                deadline: newDeadlineMatch ? newDeadlineMatch[1] : null,
                                total: newTotalItems,
                                completed: newDoneItems,
                                path: taskPath
                            };

                            let newFrontmatter = [];
                            let newSections = [];

                            const newFmMatch = newContent.match(/^---\n([\s\S]*?)\n---/);
                            if (newFmMatch) {
                                const fmLines2 = newFmMatch[1].split('\n');
                                fmLines2.forEach(line => {
                                    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
                                    if (m) {
                                        let value = m[2].trim();
                                        if ((value.startsWith('"') && value.endsWith('"')) ||
                                            (value.startsWith('\'') && value.endsWith('\''))) {
                                            value = value.substring(1, value.length - 1);
                                        }
                                        newFrontmatter.push({
                                            key: m[1],
                                            value
                                        });
                                    }
                                });
                            }

                            let newBody = '';
                            if (newContent.startsWith('---')) {
                                const parts2 = newContent.split('---');
                                if (parts2.length >= 3) {
                                    newBody = parts2.slice(2).join('---');
                                }
                            }
                            if (!newBody) {
                                newBody = newContent;
                            }

                            const lines2 = newBody.split('\n');
                            let current2 = null;

                            lines2.forEach(line => {
                                const headingMatch = line.match(/^##\s+(.+)\s*$/);
                                if (headingMatch) {
                                    if (current2) {
                                        newSections.push({
                                            title: current2.title,
                                            content: current2.lines.join('\n').trim()
                                        });
                                    }
                                    current2 = {
                                        title: headingMatch[1],
                                        lines: []
                                    };
                                } else if (current2) {
                                    current2.lines.push(line);
                                }
                            });

                            if (current2) {
                                newSections.push({
                                    title: current2.title,
                                    content: current2.lines.join('\n').trim()
                                });
                            }

                            panel.webview.postMessage({
                                task: updatedTask,
                                frontmatter: newFrontmatter,
                                sections: newSections,
                                personas
                            });

                            analyticsProvider.refresh();

                            vscode.window.showInformationMessage(
                                i18n.t(
                                    'messages.motivationalTaskCreated',
                                    updatedTask.title,
                                    updatedTask.persona || 'Unknown'
                                ),
                                i18n.t('messages.viewTask'),
                                i18n.t('messages.openKanban'),
                                i18n.t('messages.openDashboard'),
                                i18n.t('messages.dismiss')
                            ).then(selection => {
                                if (selection === i18n.t('messages.viewTask')) {
                                    vscode.commands.executeCommand('ai-agent-sync.showTaskDetails', taskPath);
                                } else if (selection === i18n.t('messages.openKanban')) {
                                    vscode.commands.executeCommand('ai-agent-sync.openKanban');
                                } else if (selection === i18n.t('messages.openDashboard')) {
                                    vscode.commands.executeCommand('ai-agent-sync.openDashboard');
                                }
                            });
                        } catch (error) {
                            vscode.window.showErrorMessage(`❌ Failed to save task: ${error.message}`);
                        }
                    }
                },
                undefined,
                context.subscriptions
            );
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
                const client = new AIClient();
                const output = await client.getStatus();
                const outputChannel = vscode.window.createOutputChannel(i18n.t('messages.outputChannelTitle'));
                outputChannel.clear();
                outputChannel.appendLine(output);
                outputChannel.show();
            } catch (error) {
                vscode.window.showErrorMessage(i18n.t('messages.statusFailed', error.message));
            }
        })
    );

    // Quick Picker - Fast task navigation
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-agent-sync.quickPicker', async () => {
            const tasks = getAllTasks();

            if (tasks.length === 0) {
                vscode.window.showInformationMessage(i18n.t('messages.noTasksFound'));
                return;
            }

            // Add "Create New Task" option at the top
            const items = [
                {
                    label: i18n.t('quickPicker.createNewTaskLabel'),
                    description: '',
                    detail: i18n.t('quickPicker.createNewTaskDetail'),
                    isCreateNew: true
                },
                { label: '', kind: vscode.QuickPickItemKind.Separator },
                ...tasks
            ];

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: i18n.t('quickPicker.placeHolder'),
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
                prompt: i18n.t('search.prompt'),
                placeHolder: i18n.t('search.placeHolder')
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
                        matchType: i18n.t('search.matchTitle')
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
                        matchType: i18n.t('search.matchChecklistItems', matchingLines.length),
                        detail: matchingLines[0].trim()
                    });
                }
            }

            if (results.length === 0) {
                vscode.window.showInformationMessage(i18n.t('messages.noResultsFound', searchTerm));
                return;
            }

            const selected = await vscode.window.showQuickPick(
                results.map(r => ({
                    label: r.label,
                    description: i18n.t('search.resultDescription', r.persona, r.matchType),
                    detail: r.detail,
                    path: r.path
                })),
                {
                    placeHolder: i18n.t('search.resultsPlaceholder', results.length, searchTerm)
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
            vscode.window.showInformationMessage(i18n.t('messages.activeTaskCleared'));
        })
    );

    // Copy Diagnostic Info
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-agent-sync.copyDiagnosticInfo', async () => {
            try {
                const extension = vscode.extensions.getExtension('junio-de-almeida-vitorino.ai-agent-ide-context-sync-vscode');
                const extensionVersion = extension ? extension.packageJSON.version : 'Unknown';
                const aiWorkspacePath = getAiWorkspacePath();
                const isInitialized = aiWorkspacePath && fs.existsSync(aiWorkspacePath);
                
                let kernelStatus = 'Not Checked';
                try {
                    const client = new AIClient();
                    kernelStatus = await client.getKernelStatus();
                    kernelStatus = kernelStatus.replace(/\x1b\[[0-9;]*m/g, ''); // Clean ANSI
                } catch (e) {
                    kernelStatus = `Error: ${e.message}`;
                }

                const diagnosticInfo = [
                    `--- AI Agent Diagnostic Info ---`,
                    `Date: ${new Date().toISOString()}`,
                    `Extension Version: ${extensionVersion}`,
                    `VS Code Version: ${vscode.version}`,
                    `OS: ${os.type()} ${os.release()} (${os.arch()})`,
                    `Node: ${process.version}`,
                    `Workspace Initialized: ${isInitialized ? 'Yes' : 'No'}`,
                    `Workspace Path: ${aiWorkspacePath || 'N/A'}`,
                    `--- Kernel Status ---`,
                    kernelStatus,
                    `----------------------------`
                ].join('\n');

                await vscode.env.clipboard.writeText(diagnosticInfo);
                vscode.window.showInformationMessage('✅ Diagnostic info copied to clipboard!');
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to copy diagnostic info: ${error.message}`);
            }
        })
    );

    // Open Dashboard
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-agent-sync.openDashboard', () => {
            const panel = vscode.window.createWebviewPanel(
                'aiAgentDashboard',
                i18n.t('dashboard.title'),
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
                        trend: 0,
                        personaData: [],
                        progressData: {},
                        personaProgress: []
                    });
                    return;
                }

                // Calculate trend
                let trend = 0;
                if (analytics) {
                    try {
                        const report = analytics.generateMonthlyReport();
                        trend = report.trend || 0;
                    } catch (e) { console.error('Analytics Error:', e); }
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
                    trend,
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
        vscode.commands.registerCommand('ai-agent-sync.customizePersona', async (arg) => {
            const personaName = typeof arg === 'string' ? arg : (arg?.personaName || arg?.label);

            if (!personaName) {
                vscode.window.showErrorMessage('Could not determine persona name');
                return;
            }

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
                        personasProvider.refresh();
                    } else if (message.command === 'reset') {
                        delete settings[personaName];
                        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
                        vscode.window.showInformationMessage(`✅ ${personaName} reset to default!`);
                        personasProvider.refresh();
                    }
                },
                undefined,
                context.subscriptions
            );
        })
    );

    // Copy Diagnostic Info
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-agent-sync.copyDiagnosticInfo', async () => {
            try {
                const extension = vscode.extensions.getExtension('junio-de-almeida-vitorino.ai-agent-ide-context-sync-vscode');
                const extensionVersion = extension ? extension.packageJSON.version : 'Unknown';
                const aiWorkspacePath = getAiWorkspacePath();
                const isInitialized = aiWorkspacePath && fs.existsSync(aiWorkspacePath);
                
                let kernelStatus = 'Not Checked';
                try {
                    const client = new AIClient();
                    kernelStatus = await client.getKernelStatus();
                    kernelStatus = kernelStatus.replace(/\x1b\[[0-9;]*m/g, ''); // Clean ANSI
                } catch (e) {
                    kernelStatus = `Error: ${e.message}`;
                }

                const diagnosticInfo = [
                    `--- AI Agent Diagnostic Info ---`,
                    `Date: ${new Date().toISOString()}`,
                    `Extension Version: ${extensionVersion}`,
                    `VS Code Version: ${vscode.version}`,
                    `OS: ${os.type()} ${os.release()} (${os.arch()})`,
                    `Node: ${process.version}`,
                    `Workspace Initialized: ${isInitialized ? 'Yes' : 'No'}`,
                    `Workspace Path: ${aiWorkspacePath || 'N/A'}`,
                    `--- Kernel Status ---`,
                    kernelStatus,
                    `----------------------------`
                ].join('\n');

                await vscode.env.clipboard.writeText(diagnosticInfo);
                vscode.window.showInformationMessage('✅ Diagnostic info copied to clipboard!');
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to copy diagnostic info: ${error.message}`);
            }
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

    // Open Kanban Board
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-agent-sync.openKanban', async () => {
            if (kanbanManager) {
                await kanbanManager.openBoard();
            } else {
                if (logger) {
                    logger.error('No .ai-workspace found');
                } else {
                    vscode.window.showErrorMessage('No .ai-workspace found');
                }
            }
        })
    );

    // Select Theme
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-agent-sync.selectTheme', async () => {
            await themeManager.selectTheme();
        })
    );

    // Weekly Report
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-agent-sync.weeklyReport', async () => {
            if (!analytics) {
                if (logger) {
                    logger.error('No .ai-workspace found');
                } else {
                    vscode.window.showErrorMessage('No .ai-workspace found');
                }
                return;
            }

            const report = analytics.generateWeeklyReport();
            const content = `# 📊 Weekly Productivity Report

**Period**: ${report.period}

## Summary
- **Total Tasks**: ${report.totalTasks}
- **Completed**: ${report.completedTasks}
- **Completion Rate**: ${report.completionRate}%

## Insights
- **Most Productive Day**: ${report.mostProductiveDay}
- **Top Persona**: ${report.topPersona}

---
Generated: ${new Date().toLocaleString()}
`;

            showWebviewReport(`# 📊 Weekly Productivity Report`, content);
        })
    );

    // Monthly Report
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-agent-sync.monthlyReport', async () => {
            if (!analytics) {
                if (logger) {
                    logger.error('No .ai-workspace found');
                } else {
                    vscode.window.showErrorMessage('No .ai-workspace found');
                }
                return;
            }

            const report = analytics.generateMonthlyReport();
            const content = `# 📊 Monthly Productivity Report

**Period**: ${report.period}

## Summary
- **Total Tasks**: ${report.totalTasks}
- **Completed**: ${report.completedTasks}
- **Completion Rate**: ${report.completionRate}%
- **Average Tasks/Week**: ${report.averageTasksPerWeek}

## Trend Analysis
- **Trend**: ${report.trend === 'increasing' ? '📈 Increasing' : report.trend === 'decreasing' ? '📉 Decreasing' : '➡️ Stable'}

---
Generated: ${new Date().toLocaleString()}
`;

            showWebviewReport(`# 📊 Monthly Productivity Report`, content);
        })
    );

    // Cloud Sync
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-agent-sync.cloudSync', async () => {
            if (cloudSync) {
                await cloudSync.syncNow();
            } else {
                vscode.window.showInformationMessage('☁️ Cloud Sync coming soon!');
            }
        })
    );

    // Export Backup
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-agent-sync.exportBackup', async () => {
            if (cloudSync) {
                await cloudSync.exportBackup();
            } else {
                vscode.window.showErrorMessage('No .ai-workspace found');
            }
        })
    );

    // Show Active Tasks (clickable from Analytics)
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-agent-sync.showActiveTasks', async () => {
            const aiWorkspacePath = getAiWorkspacePath();
            if (!aiWorkspacePath) return;

            const tasksPath = path.join(aiWorkspacePath, 'tasks', 'active');
            if (!fs.existsSync(tasksPath)) {
                vscode.window.showInformationMessage('No active tasks found');
                return;
            }

            const tasks = fs.readdirSync(tasksPath)
                .filter(f => f.endsWith('.md'))
                .map(f => {
                    const content = fs.readFileSync(path.join(tasksPath, f), 'utf-8');
                    const title = content.split('\n').find(l => l.startsWith('# '))?.replace('# ', '') || f;
                    const total = (content.match(/^- \[[ x]\]/gm) || []).length;
                    const completed = (content.match(/^- \[x\]/gm) || []).length;
                    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

                    return `## ${title}\n- **File**: \`${f}\`\n- **Progress**: ${completed}/${total} (${progress}%)\n`;
                });

            const content = `# 📋 Active Tasks (${tasks.length})

${tasks.join('\n')}

---
Click on a task file to open it.
`;

            showWebviewReport(`# 📋 Active Tasks`, content);
        })
    );

    // Show All Personas (clickable from Analytics)
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-agent-sync.showPersonas', async () => {
            const aiWorkspacePath = getAiWorkspacePath();
            if (!aiWorkspacePath) return;

            const personasPath = path.join(aiWorkspacePath, 'personas');
            if (!fs.existsSync(personasPath)) {
                vscode.window.showInformationMessage('No personas found');
                return;
            }

            const personas = fs.readdirSync(personasPath)
                .filter(f => f.endsWith('.md') && f.startsWith('AI-'))
                .map(f => {
                    const content = fs.readFileSync(path.join(personasPath, f), 'utf-8');
                    const lines = content.split('\n');
                    const description = lines.find(l => l.includes('description:'))?.split(':')[1]?.trim() || 'No description';

                    return `## ${f.replace('.md', '')}\n- **Description**: ${description}\n- **File**: \`${f}\`\n`;
                });

            const content = `# 👥 All Personas (${personas.length})

${personas.join('\n')}

---
Click on a persona file to open it.
`;

            showWebviewReport(`# 👥 All Personas`, content);
        })
    );

    // Show Checklist Items (clickable from Analytics)
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-agent-sync.showChecklistItems', async () => {
            const aiWorkspacePath = getAiWorkspacePath();
            if (!aiWorkspacePath) return;

            const tasksPath = path.join(aiWorkspacePath, 'tasks', 'active');
            if (!fs.existsSync(tasksPath)) {
                vscode.window.showInformationMessage('No tasks found');
                return;
            }

            let allItems = [];
            let totalCompleted = 0;
            let totalItems = 0;

            fs.readdirSync(tasksPath)
                .filter(f => f.endsWith('.md'))
                .forEach(f => {
                    const content = fs.readFileSync(path.join(tasksPath, f), 'utf-8');
                    const rawItems = content.match(/^- \[[ x]\] .+$/gm) || [];
                    const completed = content.match(/^- \[x\] .+$/gm) || [];

                    totalItems += rawItems.length;
                    totalCompleted += completed.length;

                    if (rawItems.length > 0) {
                        const pretty = rawItems.map(line => {
                            if (line.startsWith('- [x] ')) {
                                return `- ✅ ${line.substring(6)}`;
                            }
                            if (line.startsWith('- [ ] ')) {
                                return `- ⬜ ${line.substring(6)}`;
                            }
                            return line;
                        });
                        allItems.push(`\n### ${f}\n${pretty.join('\n')}`);
                    }
                });

            const content = `# ✅ All Checklist Items

**Total Items**: ${totalItems}
**Completed**: ${totalCompleted}

${allItems.join('\n')}

---
✅ = Completed | ⬜ = Pending
`;

            showWebviewReport(`# ✅ All Checklist Items`, content);
        })
    );

    // Show Completion Details (clickable from Analytics)
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-agent-sync.showCompletionDetails', async () => {
            const aiWorkspacePath = getAiWorkspacePath();
            if (!aiWorkspacePath) return;

            const personasPath = path.join(aiWorkspacePath, 'personas');
            const activeTasksPath = path.join(aiWorkspacePath, 'tasks', 'active');

            let totalItems = 0;
            let completedItems = 0;

            if (fs.existsSync(activeTasksPath)) {
                const taskFiles = fs.readdirSync(activeTasksPath).filter(f => f.endsWith('.md'));
                taskFiles.forEach(file => {
                    const content = fs.readFileSync(path.join(activeTasksPath, file), 'utf-8');
                    const total = (content.match(/^- \[[ x]\]/gm) || []).length;
                    const done = (content.match(/^- \[x\]/gm) || []).length;
                    totalItems += total;
                    completedItems += done;
                });
            }

            const rate = totalItems > 0
                ? Math.round((completedItems / totalItems) * 100)
                : 0;

            const personasCount = fs.existsSync(personasPath)
                ? fs.readdirSync(personasPath).filter(f => f.endsWith('.md') && f.startsWith('AI-')).length
                : 0;

            const content = `# 📈 Completion Rate

**Completion Rate**: ${rate}%
**Completed Checklist Items**: ${completedItems}
**Total Checklist Items**: ${totalItems}
**Personas**: ${personasCount}

---
O Completion Rate é calculado como:

\`itens de checklist completos / itens de checklist totais * 100\`

Apenas tarefas ativas em \`.ai-workspace/tasks/active/\` são consideradas.
`;

            showWebviewReport(`# 📈 Completion Rate`, content);
        })
    );

    // Show Heuristics (clickable from Kernel Status)
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-agent-sync.showHeuristics', async () => {
            try {
                const client = new AIClient();
                const output = await client.listHeuristics();

                const lines = output.split('\n').map(l => l.replace(/\x1b\[[0-9;]*m/g, ''));

                const transformed = [];
                let currentType = '';
                let currentStack = '';

                lines.forEach(line => {
                    const trimmed = line.trim();
                    if (!trimmed) {
                        transformed.push('');
                        return;
                    }

                    if (trimmed.startsWith('===') && trimmed.endsWith('===')) {
                        const title = trimmed.replace(/===/g, '').trim();
                        transformed.push(`# ${title}`);
                    } else if (trimmed.startsWith('Total:')) {
                        transformed.push(`**${trimmed}**`);
                    } else if (trimmed.startsWith('--') && trimmed.endsWith('--')) {
                        const t = trimmed.replace(/--/g, '').trim();
                        currentType = t;
                        transformed.push(`## ${t}`);
                    } else if (trimmed.startsWith('Stack:')) {
                        const stackName = trimmed.replace('Stack:', '').trim();
                        currentStack = stackName;
                        transformed.push(`### Stack: ${stackName}`);
                    } else if (trimmed.startsWith('• [')) {
                        const match = trimmed.match(/• \[([^\]]+)\]\s*(.*)/);
                        if (match) {
                            const id = match[1];
                            const desc = match[2] || '';
                            transformed.push(`- 💡 \`${id}\` ${desc}`);
                            const meta = [];
                            if (currentType) meta.push(currentType.toUpperCase());
                            if (currentStack) meta.push(currentStack);
                            if (meta.length > 0) {
                                transformed.push(`  Contexto: ${meta.join(' · ')}`);
                            }
                        } else {
                            transformed.push(`- ${trimmed.substring(1).trim()}`);
                        }
                    } else {
                        transformed.push(trimmed);
                    }
                });

                const md = transformed.join('\n');

                const content = `# ${i18n.t('heuristics.title')}

${md}

---
${i18n.t('heuristics.generated', new Date().toLocaleString())}
`;

                showWebviewReport(`# 💡 Heurísticas Aprendidas`, content);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to load heuristics: ${error.message}`);
            }
        })
    );
}

/**
 * Show results/reports in a styled Webview Panel
 */
function showWebviewReport(title, content) {
    const panel = vscode.window.createWebviewPanel(
        'aiAgentReport',
        title,
        vscode.ViewColumn.One,
        { enableScripts: true }
    );

    // Simple markdown-ish to HTML conversion
    const html = content
        .replace(/^# (.*)/gm, '<h1>$1</h1>')
        .replace(/^## (.*)/gm, '<h2>$1</h2>')
        .replace(/^### (.*)/gm, '<h3>$1</h3>')
        .replace(/^\*\*(.*)\*\*/gm, '<strong>$1</strong>')
        .replace(/^- (.*)/gm, '<li>$1</li>')
        .replace(/\n\n/g, '<div style=\"margin-top:20px\"></div>')
        .replace(/---/g, '<hr>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');

    panel.webview.html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { 
                    font-family: var(--vscode-font-family); 
                    padding: 40px; 
                    color: var(--vscode-foreground); 
                    background: var(--vscode-editor-background); 
                    line-height: 1.6;
                    max-width: 800px;
                    margin: 0 auto;
                }
                h1 { border-bottom: 2px solid var(--vscode-panel-border); padding-bottom: 10px; margin-bottom: 30px; font-weight: 600; }
                h2 { margin-top: 40px; border-left: 4px solid var(--vscode-button-background); padding-left: 15px; font-weight: 500; }
                h3 { margin-top: 25px; font-weight: 500; color: var(--vscode-descriptionForeground); }
                li { margin-bottom: 8px; list-style-type: none; position: relative; padding-left: 20px; }
                li::before { content: "•"; color: var(--vscode-button-background); position: absolute; left: 0; font-weight: bold; }
                .meta { color: var(--vscode-descriptionForeground); font-size: 0.9em; margin-top: 50px; text-align: center; }
                hr { border: 0; border-top: 1px solid var(--vscode-panel-border); margin: 40px 0; }
                code { background: var(--vscode-textCodeBlock-background); padding: 3px 6px; border-radius: 4px; font-family: var(--vscode-editor-font-family); }
                strong { color: var(--vscode-foreground); font-weight: 600; }
            </style>
        </head>
        <body>
            ${html}
            <div class=\"meta\">AI Agent IDE Context Sync - Report Generated via Webview</div>
        </body>
        </html>
    `;
}

function getDashboardHtml(webview, extensionPath, stats, personas, activeTasks) {
    const dashboardPath = path.join(extensionPath, 'dashboard.html');
    if (fs.existsSync(dashboardPath)) {
        return fs.readFileSync(dashboardPath, 'utf-8');
    }
    return `<!DOCTYPE html><html><body><h1>Dashboard file not found</h1></body></html>`;
}

function deactivate() { }

module.exports = {
    activate,
    deactivate
};
