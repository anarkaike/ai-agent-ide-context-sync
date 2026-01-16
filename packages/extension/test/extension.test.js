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
            'ai-agent-sync.quickPicker',
            'ai-agent-sync.searchTasks',
            'ai-agent-sync.openDashboard',
            'ai-agent-sync.timerMenu',
            'ai-agent-sync.exportTasks',
            'ai-agent-sync.customizePersona'
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
    });
});
