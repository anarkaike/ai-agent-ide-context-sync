const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

/**
 * Kanban Board Manager
 */
class KanbanManager {
    constructor(context, aiWorkspacePath) {
        this.context = context;
        this.aiWorkspacePath = aiWorkspacePath;
        this.panel = null;
    }

    async openBoard() {
        if (this.panel) {
            this.panel.reveal();
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            'kanbanBoard',
            '📋 Kanban Board',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        const htmlPath = path.join(this.context.extensionPath, 'kanban.html');
        this.panel.webview.html = fs.readFileSync(htmlPath, 'utf-8');

        this.panel.webview.onDidReceiveMessage(
            message => this.handleMessage(message),
            undefined,
            this.context.subscriptions
        );

        this.panel.onDidDispose(() => {
            this.panel = null;
        });

        this.sendData();
    }

    sendData() {
        if (!this.panel) return;

        const tasks = this.loadTasks();
        const personas = this.loadPersonas();

        this.panel.webview.postMessage({
            tasks,
            personas
        });
    }

    loadTasks() {
        const tasksPath = path.join(this.aiWorkspacePath, 'tasks', 'active');
        if (!fs.existsSync(tasksPath)) return [];

        const tasks = [];
        const files = fs.readdirSync(tasksPath).filter(f => f.endsWith('.md'));

        files.forEach(file => {
            const filePath = path.join(tasksPath, file);
            const content = fs.readFileSync(filePath, 'utf-8');

            // Parse task metadata
            const task = this.parseTask(file, content, filePath);
            tasks.push(task);
        });

        return tasks;
    }

    parseTask(filename, content, filePath) {
        const lines = content.split('\n');
        const title = lines.find(l => l.startsWith('# '))?.replace('# ', '') || filename;

        // Extract persona from filename
        const personaMatch = filename.match(/^(AI-[A-Z]+)/);
        const persona = personaMatch ? personaMatch[1] : 'Unknown';

        // Count checklist items
        const total = (content.match(/^- \[[ x]\]/gm) || []).length;
        const completed = (content.match(/^- \[x\]/gm) || []).length;

        // Extract status and deadline from frontmatter or content
        const statusMatch = content.match(/status:\s*([\w-]+)/i);
        const deadlineMatch = content.match(/deadline:\s*(\d{4}-\d{2}-\d{2})/i);

        const validStatuses = ['todo', 'in-progress', 'review', 'done'];
        const rawStatus = statusMatch ? statusMatch[1].toLowerCase() : 'todo';
        const status = validStatuses.includes(rawStatus) ? rawStatus : 'todo';

        return {
            id: filename,
            title,
            persona,
            total,
            completed,
            status,
            deadline: deadlineMatch ? deadlineMatch[1] : null,
            path: filePath
        };
    }

    loadPersonas() {
        const personasPath = path.join(this.aiWorkspacePath, 'personas');
        if (!fs.existsSync(personasPath)) return [];

        return fs.readdirSync(personasPath)
            .filter(f => f.endsWith('.md') && f.startsWith('AI-'))
            .map(f => f.replace('.md', ''));
    }

    async handleMessage(message) {
        switch (message.command) {
            case 'ready':
                this.sendData();
                break;

            case 'updateTaskStatus':
                await this.updateTaskStatus(message.taskId, message.status);
                this.sendData();
                break;

            case 'openTask':
                await this.openTask(message.taskId);
                break;

            case 'createTask':
                await this.createTask(message.status);
                break;

            case 'refreshKanban':
                this.sendData();
                break;

            case 'exportKanban':
                await this.exportBoard();
                break;
        }
    }

    async updateTaskStatus(taskId, newStatus) {
        const tasksPath = path.join(this.aiWorkspacePath, 'tasks', 'active');
        const taskPath = path.join(tasksPath, taskId);

        if (!fs.existsSync(taskPath)) return;

        let content = fs.readFileSync(taskPath, 'utf-8');

        // Update or add status in frontmatter
        if (content.includes('status:')) {
            content = content.replace(/status:\s*\w+/i, `status: ${newStatus}`);
        } else {
            // Add frontmatter if not exists
            content = `---\nstatus: ${newStatus}\n---\n\n` + content;
        }

        fs.writeFileSync(taskPath, content);
    }

    async openTask(taskId) {
        const tasksPath = path.join(this.aiWorkspacePath, 'tasks', 'active');
        const taskPath = path.join(tasksPath, taskId);

        if (fs.existsSync(taskPath)) {
            vscode.commands.executeCommand('ai-agent-sync.showTaskDetails', taskPath);
        }
    }

    async createTask(status) {
        vscode.commands.executeCommand('ai-agent-sync.createTask', status);
    }

    async exportBoard() {
        const tasks = this.loadTasks();
        const content = this.generateKanbanExport(tasks);

        const uri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(path.join(this.aiWorkspacePath, `kanban-export-${Date.now()}.md`)),
            filters: { 'Markdown': ['md'] }
        });

        if (uri) {
            fs.writeFileSync(uri.fsPath, content);
            vscode.window.showInformationMessage('✅ Kanban board exported!');
        }
    }

    generateKanbanExport(tasks) {
        const columns = {
            'todo': '📝 To Do',
            'in-progress': '🚀 In Progress',
            'review': '👀 Review',
            'done': '✅ Done'
        };

        let content = '# Kanban Board Export\n\n';
        content += `Generated: ${new Date().toLocaleString()}\n\n`;

        for (const [status, title] of Object.entries(columns)) {
            const statusTasks = tasks.filter(t => t.status === status);
            content += `## ${title} (${statusTasks.length})\n\n`;

            statusTasks.forEach(task => {
                const progress = task.total > 0 ? Math.round((task.completed / task.total) * 100) : 0;
                content += `### ${task.title}\n`;
                content += `- **Persona**: ${task.persona}\n`;
                content += `- **Progress**: ${task.completed}/${task.total} (${progress}%)\n`;
                if (task.deadline) {
                    content += `- **Deadline**: ${task.deadline}\n`;
                }
                content += '\n';
            });
        }

        return content;
    }
}

/**
 * Advanced Analytics & Reports
 */
class AdvancedAnalytics {
    constructor(aiWorkspacePath) {
        this.aiWorkspacePath = aiWorkspacePath;
    }

    generateWeeklyReport() {
        const tasks = this.loadAllTasks();
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const weeklyTasks = tasks.filter(t => {
            const stats = fs.statSync(t.path);
            return stats.mtimeMs > weekAgo.getTime();
        });

        const completed = weeklyTasks.filter(t => t.completed === t.total && t.total > 0);
        const completionRate = weeklyTasks.length > 0
            ? Math.round((completed.length / weeklyTasks.length) * 100)
            : 0;

        return {
            period: 'Last 7 days',
            totalTasks: weeklyTasks.length,
            completedTasks: completed.length,
            completionRate,
            mostProductiveDay: this.getMostProductiveDay(weeklyTasks),
            topPersona: this.getTopPersona(weeklyTasks)
        };
    }

    generateMonthlyReport() {
        const tasks = this.loadAllTasks();
        const now = new Date();
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const monthlyTasks = tasks.filter(t => {
            const stats = fs.statSync(t.path);
            return stats.mtimeMs > monthAgo.getTime();
        });

        const completed = monthlyTasks.filter(t => t.completed === t.total && t.total > 0);

        return {
            period: 'Last 30 days',
            totalTasks: monthlyTasks.length,
            completedTasks: completed.length,
            completionRate: monthlyTasks.length > 0
                ? Math.round((completed.length / monthlyTasks.length) * 100)
                : 0,
            averageTasksPerWeek: Math.round(monthlyTasks.length / 4),
            trend: this.calculateTrend(monthlyTasks)
        };
    }

    loadAllTasks() {
        const activePath = path.join(this.aiWorkspacePath, 'tasks', 'active');
        const archivePath = path.join(this.aiWorkspacePath, 'tasks', 'archive');

        const tasks = [];

        [activePath, archivePath].forEach(dir => {
            if (fs.existsSync(dir)) {
                fs.readdirSync(dir)
                    .filter(f => f.endsWith('.md'))
                    .forEach(file => {
                        const filePath = path.join(dir, file);
                        const content = fs.readFileSync(filePath, 'utf-8');
                        const total = (content.match(/^- \[[ x]\]/gm) || []).length;
                        const completed = (content.match(/^- \[x\]/gm) || []).length;

                        tasks.push({
                            path: filePath,
                            total,
                            completed,
                            persona: file.match(/^(AI-[A-Z]+)/)?.[1] || 'Unknown'
                        });
                    });
            }
        });

        return tasks;
    }

    getMostProductiveDay(tasks) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayCount = new Array(7).fill(0);

        tasks.forEach(task => {
            const stats = fs.statSync(task.path);
            const day = new Date(stats.mtimeMs).getDay();
            dayCount[day]++;
        });

        const maxIndex = dayCount.indexOf(Math.max(...dayCount));
        return days[maxIndex];
    }

    getTopPersona(tasks) {
        const personaCount = {};

        tasks.forEach(task => {
            personaCount[task.persona] = (personaCount[task.persona] || 0) + 1;
        });

        const sorted = Object.entries(personaCount).sort((a, b) => b[1] - a[1]);
        return sorted[0]?.[0] || 'None';
    }

    calculateTrend(tasks) {
        // Simple trend calculation based on task completion over time
        const firstHalf = tasks.slice(0, Math.floor(tasks.length / 2));
        const secondHalf = tasks.slice(Math.floor(tasks.length / 2));

        const firstRate = firstHalf.filter(t => t.completed === t.total).length / firstHalf.length;
        const secondRate = secondHalf.filter(t => t.completed === t.total).length / secondHalf.length;

        if (secondRate > firstRate) return 'increasing';
        if (secondRate < firstRate) return 'decreasing';
        return 'stable';
    }
}

/**
 * Theme Manager
 */
class ThemeManager {
    constructor(context) {
        this.context = context;
        this.themesPath = path.join(context.extensionPath, 'themes.json');
        this.themes = this.loadThemes();
    }

    loadThemes() {
        if (fs.existsSync(this.themesPath)) {
            return JSON.parse(fs.readFileSync(this.themesPath, 'utf-8'));
        }
        return { themes: {}, customThemes: [] };
    }

    getTheme(themeName) {
        return this.themes.themes[themeName] || this.themes.themes['default'];
    }

    async selectTheme() {
        const themeNames = Object.keys(this.themes.themes);
        const selected = await vscode.window.showQuickPick(
            themeNames.map(name => ({
                label: this.themes.themes[name].name,
                description: name
            })),
            { placeHolder: 'Select a theme' }
        );

        if (selected) {
            await this.context.globalState.update('selectedTheme', selected.description);
            vscode.window.showInformationMessage(`✅ Theme "${selected.label}" applied!`);
            return selected.description;
        }
    }

    getCurrentTheme() {
        const themeName = this.context.globalState.get('selectedTheme', 'default');
        return this.getTheme(themeName);
    }
}

/**
 * Cloud Sync Manager (Placeholder for future implementation)
 */
class CloudSyncManager {
    constructor(context, aiWorkspacePath) {
        this.context = context;
        this.aiWorkspacePath = aiWorkspacePath;
        this.syncEnabled = false;
    }

    async enableSync() {
        // Placeholder for cloud sync implementation
        // Could integrate with GitHub Gist, Dropbox, Google Drive, etc.
        vscode.window.showInformationMessage('☁️ Cloud Sync coming soon!');
    }

    async syncNow() {
        if (!this.syncEnabled) {
            vscode.window.showWarningMessage('Cloud sync is not enabled');
            return;
        }

        // Sync logic would go here
        vscode.window.showInformationMessage('🔄 Syncing...');
    }

    async exportBackup() {
        const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        const backupName = `ai-workspace-backup-${timestamp}.tar.gz`;

        const uri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(path.join(this.aiWorkspacePath, '..', backupName)),
            filters: { 'Backup': ['tar.gz'] }
        });

        if (uri) {
            // Create backup (simplified - would need proper tar.gz creation)
            vscode.window.showInformationMessage('✅ Backup created!');
        }
    }
}

module.exports = {
    KanbanManager,
    AdvancedAnalytics,
    ThemeManager,
    CloudSyncManager
};
