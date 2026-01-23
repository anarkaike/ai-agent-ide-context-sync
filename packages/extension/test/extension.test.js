const assert = require('assert');
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

suite('AI Agent IDE Context Sync Extension Tests', () => {
    vscode.window.showInformationMessage('Starting extension tests...');

    suite('Extension Activation', () => {
        test('Extension should be present', () => {
            assert.ok(vscode.extensions.getExtension('junio-de-almeida-vitorino.ai-agent-ide-context-sync-vscode'));
        });

        test('Extension should activate', async () => {
            const ext = vscode.extensions.getExtension('junio-de-almeida-vitorino.ai-agent-ide-context-sync-vscode');
            await ext.activate();
            assert.ok(ext.isActive);
        });
    });

    suite('Commands Registration', () => {
        const commands = [
            'ai-agent-sync.init',
            'ai-agent-sync.build',
            'ai-agent-sync.status',
            'ai-agent-sync.createPersona',
            'ai-agent-sync.editPersona',
            'ai-agent-sync.deletePersona',
            'ai-agent-sync.createTask',
            'ai-agent-sync.archiveTask',
            'ai-agent-sync.deleteTask',
            'ai-agent-sync.viewPersonaDetails',
            'ai-agent-sync.showTaskDetails',
            'ai-agent-sync.generatePrompt',
            'ai-agent-sync.runWorkflow',
            'ai-agent-sync.runWorkflowInput',
            'ai-agent-sync.scanDocs',
            'ai-agent-sync.ritual',
            'ai-agent-sync.evolve',
            'ai-agent-sync.showKernelInfo',
            'ai-agent-sync.quickPicker',
            'ai-agent-sync.searchTasks',
            'ai-agent-sync.clearActiveTask',
            'ai-agent-sync.openDashboard',
            'ai-agent-sync.timerMenu',
            'ai-agent-sync.exportTasks',
            'ai-agent-sync.customizePersona',
            'ai-agent-sync.openKanban',
            'ai-agent-sync.selectTheme',
            'ai-agent-sync.weeklyReport',
            'ai-agent-sync.monthlyReport',
            'ai-agent-sync.exportBackup',
            'ai-agent-sync.cloudSync',
            'ai-agent-sync.showActiveTasks',
            'ai-agent-sync.showPersonas',
            'ai-agent-sync.showChecklistItems',
            'ai-agent-sync.showCompletionDetails',
            'ai-agent-sync.showHeuristics'
        ];

        commands.forEach(command => {
            test(`Command ${command} should be registered`, async () => {
                const allCommands = await vscode.commands.getCommands(true);
                assert.ok(allCommands.includes(command), `Command ${command} not found`);
            });
        });
    });

    suite('i18n Module', () => {
        let I18n;

        suiteSetup(() => {
            const modules = require('../modules');
            I18n = modules.I18n;
        });

        test('Should load English translations', () => {
            const ext = vscode.extensions.getExtension('junio-de-almeida-vitorino.ai-agent-ide-context-sync-vscode');
            const i18n = new I18n(ext.extensionPath);
            i18n.setLocale('en');

            const message = i18n.t('messages.workspaceInitialized');
            assert.strictEqual(message, '✅ Workspace initialized!');
        });

        test('Should load Portuguese translations', () => {
            const ext = vscode.extensions.getExtension('junio-de-almeida-vitorino.ai-agent-ide-context-sync-vscode');
            const i18n = new I18n(ext.extensionPath);
            i18n.setLocale('pt-BR');

            const message = i18n.t('messages.workspaceInitialized');
            assert.strictEqual(message, '✅ Workspace inicializado!');
        });

        test('Should replace placeholders', () => {
            const ext = vscode.extensions.getExtension('junio-de-almeida-vitorino.ai-agent-ide-context-sync-vscode');
            const i18n = new I18n(ext.extensionPath);
            i18n.setLocale('en');

            const message = i18n.t('messages.personaCreated', 'AI-TEST');
            assert.strictEqual(message, '✅ Persona AI-TEST created!');
        });

        test('Should fallback to key if translation not found', () => {
            const ext = vscode.extensions.getExtension('junio-de-almeida-vitorino.ai-agent-ide-context-sync-vscode');
            const i18n = new I18n(ext.extensionPath);

            const message = i18n.t('nonexistent.key');
            assert.strictEqual(message, 'nonexistent.key');
        });
    });

    suite('Smart Notifications', () => {
        let SmartNotifications;
        let notifications;

        suiteSetup(() => {
            const modules = require('../modules');
            SmartNotifications = modules.SmartNotifications;
            const I18n = modules.I18n;

            const ext = vscode.extensions.getExtension('junio-de-almeida-vitorino.ai-agent-ide-context-sync-vscode');
            const i18n = new I18n(ext.extensionPath);
            notifications = new SmartNotifications({ globalState: { get: () => [], update: () => { } } }, i18n);
        });

        test('Should initialize without errors', () => {
            assert.ok(notifications);
        });

        test('Should track notification history', () => {
            const key = 'test-notification';
            assert.strictEqual(notifications.wasNotified(key), false);
        });
    });

    suite('File Operations', () => {
        test('Should have locales directory', () => {
            const ext = vscode.extensions.getExtension('junio-de-almeida-vitorino.ai-agent-ide-context-sync-vscode');
            const localesPath = path.join(ext.extensionPath, 'locales');
            assert.ok(fs.existsSync(localesPath));
        });

        test('Should have English translation file', () => {
            const ext = vscode.extensions.getExtension('junio-de-almeida-vitorino.ai-agent-ide-context-sync-vscode');
            const enPath = path.join(ext.extensionPath, 'locales', 'en.json');
            assert.ok(fs.existsSync(enPath));
        });

        test('Should have Portuguese translation file', () => {
            const ext = vscode.extensions.getExtension('junio-de-almeida-vitorino.ai-agent-ide-context-sync-vscode');
            const ptPath = path.join(ext.extensionPath, 'locales', 'pt-BR.json');
            assert.ok(fs.existsSync(ptPath));
        });

        test('Translation files should be valid JSON', () => {
            const ext = vscode.extensions.getExtension('junio-de-almeida-vitorino.ai-agent-ide-context-sync-vscode');
            const enPath = path.join(ext.extensionPath, 'locales', 'en.json');
            const ptPath = path.join(ext.extensionPath, 'locales', 'pt-BR.json');

            assert.doesNotThrow(() => {
                JSON.parse(fs.readFileSync(enPath, 'utf-8'));
                JSON.parse(fs.readFileSync(ptPath, 'utf-8'));
            });
        });

        test('Should contain all new automation tooltips', () => {
            const ext = vscode.extensions.getExtension('junio-de-almeida-vitorino.ai-agent-ide-context-sync-vscode');
            const en = JSON.parse(fs.readFileSync(path.join(ext.extensionPath, 'locales', 'en.json'), 'utf-8'));
            const pt = JSON.parse(fs.readFileSync(path.join(ext.extensionPath, 'locales', 'pt-BR.json'), 'utf-8'));

            const keys = [
                'automation.scanDocsTooltip',
                'automation.runRitualTooltip',
                'automation.evolveRulesTooltip'
            ];

            keys.forEach(key => {
                const parts = key.split('.');
                const enValue = parts.reduce((obj, k) => obj && obj[k], en);
                const ptValue = parts.reduce((obj, k) => obj && obj[k], pt);

                assert.ok(enValue, `Missing EN translation for ${key}`);
                assert.ok(ptValue, `Missing PT-BR translation for ${key}`);
            });
        });
    });

    suite('Automation Tree Provider', () => {
        let AutomationTreeProvider;
        let provider;
        let mockI18n;

        suiteSetup(() => {
            const modules = require('../automation-modules');
            AutomationTreeProvider = modules.AutomationTreeProvider;
            
            mockI18n = {
                t: (key) => key // simple mock that returns the key
            };
            
            provider = new AutomationTreeProvider(mockI18n);
        });

        test('Should have maintenance section', async () => {
            const children = await provider.getChildren();
            const maintenanceSection = children.find(c => c.contextValue === 'maintenance-section');
            assert.ok(maintenanceSection, 'Maintenance section not found');
            assert.strictEqual(maintenanceSection.label, 'automation.maintenanceSectionLabel');
        });

        test('Should have maintenance items with tooltips', async () => {
            const maintenanceSection = { contextValue: 'maintenance-section' };
            const children = await provider.getChildren(maintenanceSection);
            
            assert.strictEqual(children.length, 3);
            
            const scanDocs = children.find(c => c.command.command === 'ai-agent-sync.scanDocs');
            assert.ok(scanDocs);
            assert.strictEqual(scanDocs.tooltip, 'automation.scanDocsTooltip');
            
            const ritual = children.find(c => c.command.command === 'ai-agent-sync.ritual');
            assert.ok(ritual);
            assert.strictEqual(ritual.tooltip, 'automation.runRitualTooltip');
            
            const evolve = children.find(c => c.command.command === 'ai-agent-sync.evolve');
            assert.ok(evolve);
            assert.strictEqual(evolve.tooltip, 'automation.evolveRulesTooltip');
        });
    });
});
