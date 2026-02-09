const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { initializeCore } = require('@ai-agent/core');
const Logger = require('./modules/Logger');
const { I18n, SmartNotifications } = require('./modules');
const { KanbanManager, AdvancedAnalytics, ThemeManager, CloudSyncManager } = require('./advanced-modules');
const { AutomationTreeProvider, handleGeneratePrompt, handleRunWorkflow, handleLaravelAnalyze, handleLaravelCreateLayer, handleLaravelListEntities, handleReactCreateComponent, handleReactCreateHook, handleGenerateCommitMessage, handleGeneratePRDescription, handleGitCodeReview, handleContextSnap, setAutomationI18n, setAutomationLogger } = require('./automation-modules');
const { SwarmTreeDataProvider, handleSwarmConnect } = require('./swarm-modules');
const { SoulTreeDataProvider, handleSoulMint, handleSoulResonate } = require('./soul-modules');
const { SecurityTreeDataProvider, handleApproveTask, handleRejectTask } = require('./security-modules');
const cp = require('child_process');
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

// Core System Instance
let coreSystem = null;

/**
 * Initialize the unified core system
 */
async function initializeCoreSystem() {
    try {
        coreSystem = await initializeCore({
            security: {
                enableSandbox: true,
                enableEncryption: true,
                enableSigning: true,
                allowedPaths: [
                    vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd(),
                    path.join(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd(), '.ai-workspace')
                ]
            },
            memory: {
                enableWAL: true,
                checkpointInterval: 60000,
                autoBackup: true
            },
            client: {
                timeout: 30000,
                maxRetries: 3,
                enableCaching: true,
                enableMetrics: true
            }
        });
        
        console.log('[Extension] Core system initialized successfully');
        return coreSystem;
    } catch (error) {
        console.error('[Extension] Failed to initialize core system:', error);
        vscode.window.showErrorMessage(`Failed to initialize core system: ${error.message}`);
        throw error;
    }
}

/**
 * Get the core AI client
 */
function getAIClient() {
    if (!coreSystem) {
        throw new Error('Core system not initialized');
    }
    return coreSystem.client;
}

/**
 * Legacy AIClient wrapper for backward compatibility
 */
class LegacyAIClientWrapper {
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
        this.core = null;
    }

    async initialize() {
        if (!this.core) {
            this.core = await initializeCoreSystem();
        }
    }

    async execute(args) {
        await this.initialize();
        return await this.core.client.executeCLI(args);
    }

    async complete(prompt, options = {}) {
        await this.initialize();
        return await this.core.client.complete(prompt, options);
    }
}

// Export the wrapper for modules that still expect the old AIClient
module.exports = LegacyAIClientWrapper;
