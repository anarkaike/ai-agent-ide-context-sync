const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

/**
 * i18n Module - Internationalization Support
 */
class I18n {
    constructor(extensionPath) {
        this.extensionPath = extensionPath;
        this.translations = {};
        this.currentLocale = vscode.env.language || 'en';
        this.loadTranslations();
    }

    loadTranslations() {
        const localesPath = path.join(this.extensionPath, 'locales');
        const localeFile = path.join(localesPath, `${this.currentLocale}.json`);
        const fallbackFile = path.join(localesPath, 'en.json');

        try {
            if (fs.existsSync(localeFile)) {
                this.translations = JSON.parse(fs.readFileSync(localeFile, 'utf-8'));
            } else if (fs.existsSync(fallbackFile)) {
                this.translations = JSON.parse(fs.readFileSync(fallbackFile, 'utf-8'));
            }
        } catch (error) {
            console.error('Failed to load translations:', error);
            this.translations = {};
        }
    }

    t(key, ...args) {
        const keys = key.split('.');
        let value = this.translations;

        for (const k of keys) {
            if (value && typeof value === 'object') {
                value = value[k];
            } else {
                return key;
            }
        }

        if (typeof value === 'string') {
            // Replace placeholders {0}, {1}, etc.
            return value.replace(/\{(\d+)\}/g, (match, index) => {
                return args[index] !== undefined ? args[index] : match;
            });
        }

        return key;
    }

    getLocale() {
        return this.currentLocale;
    }

    setLocale(locale) {
        this.currentLocale = locale;
        this.loadTranslations();
    }
}

/**
 * Smart Notifications Module
 */
class SmartNotifications {
    constructor(context, i18n) {
        this.context = context;
        this.i18n = i18n;
        this.notificationHistory = [];
        this.checkInterval = null;
    }

    start(aiWorkspacePath) {
        this.aiWorkspacePath = aiWorkspacePath;

        // Check every hour
        this.checkInterval = setInterval(() => {
            this.checkStalledTasks();
            this.checkDeadlines();
        }, 60 * 60 * 1000); // 1 hour

        // Initial check after 5 minutes
        setTimeout(() => {
            this.checkStalledTasks();
        }, 5 * 60 * 1000);
    }

    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
    }

    checkStalledTasks() {
        if (!this.aiWorkspacePath) return;

        const tasksPath = path.join(this.aiWorkspacePath, 'tasks', 'active');
        if (!fs.existsSync(tasksPath)) return;

        const tasks = fs.readdirSync(tasksPath).filter(f => f.endsWith('.md'));
        const now = Date.now();
        const threeDays = 3 * 24 * 60 * 60 * 1000;

        tasks.forEach(taskFile => {
            const taskPath = path.join(tasksPath, taskFile);
            const stats = fs.statSync(taskPath);
            const lastModified = stats.mtimeMs;
            const daysSinceModified = Math.floor((now - lastModified) / (24 * 60 * 60 * 1000));

            if (now - lastModified > threeDays) {
                const taskName = taskFile.replace(/\.md$/, '');

                // Check if we already notified about this
                const notificationKey = `stalled-${taskName}`;
                if (!this.wasNotified(notificationKey)) {
                    this.notifyStalledTask(taskName, daysSinceModified, taskPath);
                    this.markAsNotified(notificationKey);
                }
            }
        });
    }

    checkDeadlines() {
        // Placeholder for deadline checking
        // Would require parsing task files for deadline metadata
    }

    notifyStalledTask(taskName, days, taskPath) {
        const message = this.i18n.t('notifications.stalledTask', taskName, days);

        vscode.window.showWarningMessage(
            message,
            this.i18n.t('notifications.viewTask'),
            this.i18n.t('notifications.dismiss')
        ).then(selection => {
            if (selection === this.i18n.t('notifications.viewTask')) {
                vscode.workspace.openTextDocument(taskPath).then(doc => {
                    vscode.window.showTextDocument(doc);
                });
            }
        });
    }

    notifyTaskCompleted(taskName) {
        const message = this.i18n.t('notifications.taskCompleted', taskName);

        vscode.window.showInformationMessage(message, '🎉');
    }

    notifyWeeklyReport(completedCount, completionRate) {
        const message = this.i18n.t('notifications.weeklyReport', completedCount, completionRate);

        vscode.window.showInformationMessage(message);
    }

    notifyProductivityInsight(bestDay) {
        const message = this.i18n.t('notifications.productivityInsight', bestDay);

        vscode.window.showInformationMessage(message, '💡');
    }

    wasNotified(key) {
        const history = this.context.globalState.get('notificationHistory', []);
        return history.includes(key);
    }

    markAsNotified(key) {
        const history = this.context.globalState.get('notificationHistory', []);
        history.push(key);

        // Keep only last 100 notifications
        if (history.length > 100) {
            history.shift();
        }

        this.context.globalState.update('notificationHistory', history);
    }

    clearHistory() {
        this.context.globalState.update('notificationHistory', []);
    }
}

module.exports = {
    I18n,
    SmartNotifications
};
