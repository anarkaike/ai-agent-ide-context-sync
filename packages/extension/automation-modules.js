const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const AIClient = require('./ai-client');

let i18nRef = null;
let loggerRef = null;

const t = (key, ...args) => {
    if (i18nRef) return i18nRef.t(key, ...args);
    return key; // Fallback
};

class AutomationTreeProvider {
    constructor(i18n) {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.client = new AIClient();
        i18nRef = i18n || i18nRef;
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element) {
        return element;
    }

    async isLaravelProject() {
        if (!vscode.workspace.workspaceFolders) return false;
        try {
            const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
            const composerPath = path.join(rootPath, 'composer.json');
            if (fs.existsSync(composerPath)) {
                const composer = JSON.parse(fs.readFileSync(composerPath, 'utf8'));
                return (composer.require && (composer.require['laravel/framework'] || composer.require['illuminate/support']));
            }
        } catch (e) {
            console.error('Error checking Laravel project:', e);
        }
        return false;
    }

    async isReactProject() {
        if (!vscode.workspace.workspaceFolders) return false;
        try {
            const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
            const packagePath = path.join(rootPath, 'package.json');
            if (fs.existsSync(packagePath)) {
                const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
                const deps = { ...pkg.dependencies, ...pkg.devDependencies };
                return deps && (deps['react'] || deps['react-dom'] || deps['next']);
            }
        } catch (e) {
            console.error('Error checking React project:', e);
        }
        return false;
    }

    async getChildren(element) {
        if (!element) {
            // Root items
            const items = [];

            // 1. Context Tools Section
            const contextItem = new vscode.TreeItem(t('automation.contextSectionLabel'), vscode.TreeItemCollapsibleState.Expanded);
            contextItem.contextValue = 'context-section';
            items.push(contextItem);

            // 1.1 Maintenance Section (New)
            const maintenanceItem = new vscode.TreeItem(t('automation.maintenanceSectionLabel'), vscode.TreeItemCollapsibleState.Expanded);
            maintenanceItem.contextValue = 'maintenance-section';
            items.push(maintenanceItem);

            // 2. Workflows Section
            const workflowsItem = new vscode.TreeItem(t('automation.workflowsSectionLabel'), vscode.TreeItemCollapsibleState.Expanded);
            workflowsItem.contextValue = 'workflows-section';
            items.push(workflowsItem);

            // 3. Rules Section
            const rulesItem = new vscode.TreeItem(t('automation.rulesSectionLabel'), vscode.TreeItemCollapsibleState.Collapsed);
            rulesItem.contextValue = 'rules-section';
            items.push(rulesItem);

            // 4. Git Context Section
            const gitItem = new vscode.TreeItem(t('automation.gitSectionLabel'), vscode.TreeItemCollapsibleState.Expanded);
            gitItem.contextValue = 'git-section';
            items.push(gitItem);

            return items;
        }

        if (element.contextValue === 'context-section') {
            const items = [];
            
            items.push(this.createActionItem(
                t('automation.contextSnapLabel'),
                'ai-agent-sync.context.snap',
                [],
                t('automation.contextSnapTooltip')
            ));

            items.push(this.createActionItem(
                t('automation.generatePromptLabel'),
                'ai-agent-sync.generatePrompt',
                [],
                t('automation.generatePromptTooltip')
            ));

            return items;
        }

        if (element.contextValue === 'maintenance-section') {
            const items = [];
            
            items.push(this.createActionItem(
                t('automation.scanDocsLabel'), 
                'ai-agent-sync.scanDocs', 
                [], 
                t('automation.scanDocsTooltip')
            ));

            items.push(this.createActionItem(
                t('automation.runRitualLabel'), 
                'ai-agent-sync.ritual', 
                [], 
                t('automation.runRitualTooltip')
            ));

            items.push(this.createActionItem(
                t('automation.evolveRulesLabel'), 
                'ai-agent-sync.evolve', 
                [], 
                t('automation.evolveRulesTooltip')
            ));

            return items;
        }

        if (element.contextValue === 'rules-section') {
            try {
                const output = await this.client.listRules();
                // Remove ANSI colors
                const cleanOutput = output.replace(/\x1b\[[0-9;]*m/g, '');
                const lines = cleanOutput.split('\n');
                const rules = [];
                
                lines.forEach(line => {
                    const trimmed = line.trim();
                    // Captura linhas que parecem regras (começam com traço ou bullet)
                    if (trimmed.length > 3 && (trimmed.startsWith('-') || trimmed.startsWith('*'))) {
                        const ruleItem = new vscode.TreeItem(trimmed);
                        ruleItem.iconPath = new vscode.ThemeIcon('law');
                        rules.push(ruleItem);
                    }
                });
                
                if (rules.length === 0) {
                     return [new vscode.TreeItem('No active rules found')];
                }
                return rules;
            } catch (e) {
                return [new vscode.TreeItem('Error loading rules')];
            }
        }

        if (element.contextValue === 'workflows-section') {
            try {
                const items = [];
                items.push(this.createActionItem(t('automation.runWorkflowPromptLabel'), 'ai-agent-sync.runWorkflowInput', [], t('automation.runWorkflowPromptTooltip')));

                // Check for Laravel Project
                const isLaravel = await this.isLaravelProject();
                if (isLaravel) {
                    const analyzeItem = this.createActionItem(
                        t('automation.laravelAnalyzeLabel'),
                        'ai-agent-sync.laravel.analyze',
                        [],
                        t('automation.laravelAnalyzeTooltip')
                    );
                    analyzeItem.iconPath = new vscode.ThemeIcon('search');
                    items.push(analyzeItem);

                    const createLayerItem = this.createActionItem(
                        t('automation.laravelCreateLayerLabel'),
                        'ai-agent-sync.laravel.createLayer',
                        [],
                        t('automation.laravelCreateLayerTooltip')
                    );
                    createLayerItem.iconPath = new vscode.ThemeIcon('layers');
                    items.push(createLayerItem);

                    const listEntitiesItem = this.createActionItem(
                        t('automation.laravelListEntitiesLabel'),
                        'ai-agent-sync.laravel.listEntities',
                        [],
                        t('automation.laravelListEntitiesTooltip')
                    );
                    listEntitiesItem.iconPath = new vscode.ThemeIcon('list-flat');
                    items.push(listEntitiesItem);
                }

                // Check for React Project
                const isReact = await this.isReactProject();
                if (isReact) {
                    const createComponentItem = this.createActionItem(
                        t('automation.reactCreateComponentLabel', 'Create Component'),
                        'ai-agent-sync.react.createComponent',
                        [],
                        t('automation.reactCreateComponentTooltip', 'Generate a new React component')
                    );
                    createComponentItem.iconPath = new vscode.ThemeIcon('symbol-class');
                    items.push(createComponentItem);

                    const createHookItem = this.createActionItem(
                        t('automation.reactCreateHookLabel', 'Create Hook'),
                        'ai-agent-sync.react.createHook',
                        [],
                        t('automation.reactCreateHookTooltip', 'Generate a new React hook')
                    );
                    createHookItem.iconPath = new vscode.ThemeIcon('symbol-function');
                    items.push(createHookItem);
                }

                const workflows = await this.client.listWorkflows();

                if (workflows && workflows.length > 0) {
                    workflows.forEach(wf => {
                        const item = new vscode.TreeItem(wf.id);
                        item.description = wf.description || '';
                        item.tooltip = `${wf.id}\n${wf.description || ''}`;
                        if (wf.params && wf.params.length > 0) {
                            item.tooltip += `\nParams: ${wf.params.map(p => p.name).join(', ')}`;
                        }
                        item.command = {
                            command: 'ai-agent-sync.runWorkflow',
                            title: t('automation.runWorkflowLabel'),
                            arguments: [wf.id, wf.params]
                        };
                        item.iconPath = new vscode.ThemeIcon(wf.source === 'global' ? 'globe' : 'file-code');
                        item.contextValue = 'workflow';
                        items.push(item);
                    });
                } else if (!isLaravel) {
                    const demoWf = new vscode.TreeItem(t('automation.demoWorkflowLabel'));
                    demoWf.command = {
                        command: 'ai-agent-sync.runWorkflow',
                        title: t('automation.runWorkflowLabel'),
                        arguments: ['create-component', []]
                    };
                    demoWf.iconPath = new vscode.ThemeIcon('play');
                    items.push(demoWf);
                }

                return items;
            } catch (e) {
                if (loggerRef) loggerRef.error('Error loading workflows', e);
                return [new vscode.TreeItem('Error loading workflows')];
            }
        }

        if (element.contextValue === 'git-section') {
            const items = [];
            items.push(this.createActionItem(
                t('automation.gitCommitLabel'),
                'ai-agent-sync.git.commitMessage',
                [],
                t('automation.gitCommitTooltip')
            ));
            items.push(this.createActionItem(
                t('automation.gitPRLabel'),
                'ai-agent-sync.git.prDescription',
                [],
                t('automation.gitPRTooltip')
            ));
            items.push(this.createActionItem(
                t('automation.gitReviewLabel'),
                'ai-agent-sync.git.codeReview',
                [],
                t('automation.gitReviewTooltip')
            ));
            return items;
        }

        return [];
    }

    createActionItem(label, command, args = [], tooltip = '') {
        const item = new vscode.TreeItem(label);
        item.command = {
            command: command,
            title: label,
            arguments: args
        };
        if (tooltip) {
            item.tooltip = tooltip;
        }
        return item;
    }
}

/**
 * Handle Generate Smart Prompt
 */
async function handleGeneratePrompt() {
    const goal = await vscode.window.showInputBox({
        placeHolder: t('automation.generatePromptPlaceholder'),
        prompt: t('automation.generatePromptPrompt')
    });

    if (!goal) return;

    const client = new AIClient(); // Re-instantiate to adapt to workspace root if needed

    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Generating Smart Prompt...",
        cancellable: false
    }, async (progress) => {
        try {
            const prompt = await client.generatePrompt(goal);

            // Show result in a new document
            const doc = await vscode.workspace.openTextDocument({
                content: prompt,
                language: 'markdown'
            });
            await vscode.window.showTextDocument(doc);

        } catch (e) {
            if (loggerRef) {
                loggerRef.error(`Error generating prompt: ${e}`, e);
            } else {
                vscode.window.showErrorMessage(`Error generating prompt: ${e}`);
            }
        }
    });
}

/**
 * Handle Run Workflow
 */
async function handleRunWorkflow(workflowId, workflowParams) {
    let targetWorkflow = workflowId;

    if (!targetWorkflow || typeof targetWorkflow !== 'string') {
        // If not passed, ask user
        // Ideal: fetch list from CLI. For now, manual input.
        targetWorkflow = await vscode.window.showInputBox({
            placeHolder: t('automation.workflowIdPlaceholder'),
            prompt: t('automation.workflowIdPrompt')
        });
    }

    if (!targetWorkflow) return;

    const params = {};

    if (workflowParams && Array.isArray(workflowParams) && workflowParams.length > 0) {
        // Dynamic Params Input based on definition
        for (const param of workflowParams) {
            const val = await vscode.window.showInputBox({
                prompt: `Enter value for ${param.name}: ${param.description || ''}`,
                placeHolder: param.default || '',
                value: param.default || ''
            });
            
            if (val === undefined) return; // Cancelled
            params[param.name] = val;
        }
    } else {
        // Fallback: assume simple params string input if no metadata
        const paramsString = await vscode.window.showInputBox({
            placeHolder: t('automation.workflowParamsPlaceholder'),
            prompt: t('automation.workflowParamsPrompt')
        });

        if (paramsString === undefined) return; // Cancelled

        if (paramsString) {
            paramsString.split(' ').forEach(p => {
                const [k, v] = p.split('=');
                if (k && v) params[k] = v;
            });
        }
    }

    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: t('automation.runningWorkflowTitle', targetWorkflow),
        cancellable: false
    }, async (progress) => {
        try {
            const client = new AIClient();
            await client.runWorkflow(targetWorkflow, params);
            vscode.window.showInformationMessage(t('automation.workflowCompleted', targetWorkflow));
        } catch (e) {
            if (loggerRef) {
                loggerRef.error(t('automation.workflowError', e), e);
            } else {
                vscode.window.showErrorMessage(t('automation.workflowError', e));
            }
        }
    });
}

/**
 * Laravel Handlers
 */
async function handleLaravelAnalyze() {
    const client = new AIClient();
    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Generating Analysis Prompt...",
        cancellable: false
    }, async () => {
        try {
            const goal = "Analyze project structure using laravel-boost MCP. Check for missing layers in entities and list recommendations.";
            const prompt = await client.generatePrompt(goal);
            const doc = await vscode.workspace.openTextDocument({ content: prompt, language: 'markdown' });
            await vscode.window.showTextDocument(doc);
        } catch (e) {
            if (loggerRef) {
                loggerRef.error(`Error: ${e}`, e);
            } else {
                vscode.window.showErrorMessage(`Error: ${e}`);
            }
        }
    });
}

async function handleLaravelCreateLayer() {
    const entityName = await vscode.window.showInputBox({
        prompt: "Entity Name (e.g. User)",
        placeHolder: "User"
    });
    if (!entityName) return;

    const client = new AIClient();
    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Generating Creation Prompt...",
        cancellable: false
    }, async () => {
        try {
            const goal = `Create full Laravel layers (Model, Controller, Service, Repository) for entity ${entityName} using laravel-boost.`;
            const prompt = await client.generatePrompt(goal);
            const doc = await vscode.workspace.openTextDocument({ content: prompt, language: 'markdown' });
            await vscode.window.showTextDocument(doc);
        } catch (e) {
            if (loggerRef) {
                loggerRef.error(`Error: ${e}`, e);
            } else {
                vscode.window.showErrorMessage(`Error: ${e}`);
            }
        }
    });
}

async function handleLaravelListEntities() {
    const client = new AIClient();
    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Generating List Prompt...",
        cancellable: false
    }, async () => {
        try {
            const goal = "List all detected Laravel entities and their status using laravel-boost.";
            const prompt = await client.generatePrompt(goal);
            const doc = await vscode.workspace.openTextDocument({ content: prompt, language: 'markdown' });
            await vscode.window.showTextDocument(doc);
        } catch (e) {
            if (loggerRef) {
                loggerRef.error(`Error: ${e}`, e);
            } else {
                vscode.window.showErrorMessage(`Error: ${e}`);
            }
        }
    });
}

/**
 * React Handlers
 */
async function handleReactCreateComponent() {
    const componentName = await vscode.window.showInputBox({
        prompt: "Component Name (e.g. Button)",
        placeHolder: "Button"
    });
    if (!componentName) return;

    const client = new AIClient();
    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Generating Component Prompt...",
        cancellable: false
    }, async () => {
        try {
            const goal = `Create a functional React component named ${componentName} with TypeScript interfaces and props. Use 'export function'.`;
            const prompt = await client.generatePrompt(goal);
            const doc = await vscode.workspace.openTextDocument({ content: prompt, language: 'markdown' });
            await vscode.window.showTextDocument(doc);
        } catch (e) {
            if (loggerRef) {
                loggerRef.error(`Error: ${e}`, e);
            } else {
                vscode.window.showErrorMessage(`Error: ${e}`);
            }
        }
    });
}

async function handleReactCreateHook() {
    const hookName = await vscode.window.showInputBox({
        prompt: "Hook Name (e.g. useFetch)",
        placeHolder: "useFetch"
    });
    if (!hookName) return;

    const client = new AIClient();
    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Generating Hook Prompt...",
        cancellable: false
    }, async () => {
        try {
            const goal = `Create a custom React hook named ${hookName} with TypeScript. Include usage example.`;
            const prompt = await client.generatePrompt(goal);
            const doc = await vscode.workspace.openTextDocument({ content: prompt, language: 'markdown' });
            await vscode.window.showTextDocument(doc);
        } catch (e) {
            if (loggerRef) {
                loggerRef.error(`Error: ${e}`, e);
            } else {
                vscode.window.showErrorMessage(`Error: ${e}`);
            }
        }
    });
}

/**
 * Git Handlers
 */
async function handleGenerateCommitMessage() {
    if (!vscode.workspace.rootPath) {
        vscode.window.showErrorMessage('No workspace open');
        return;
    }

    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Generating Commit Message...",
        cancellable: false
    }, async () => {
        try {
            // Get staged diff
            const diff = await new Promise((resolve, reject) => {
                exec('git diff --cached', { cwd: vscode.workspace.rootPath }, (err, stdout) => {
                    if (err) reject(err);
                    else resolve(stdout);
                });
            });

            if (!diff || diff.trim().length === 0) {
                vscode.window.showInformationMessage('No staged changes found. Please stage your changes first.');
                return;
            }

            const client = new AIClient();
            // Truncate if too long (CLI limit safety)
            const maxLength = 8000;
            const truncatedDiff = diff.length > maxLength ? diff.substring(0, maxLength) + "\n...[truncated]" : diff;

            const goal = `Generate a Conventional Commit message for these changes:\n\n${truncatedDiff}`;
            const prompt = await client.generatePrompt(goal);
            
            const doc = await vscode.workspace.openTextDocument({ content: prompt, language: 'markdown' });
            await vscode.window.showTextDocument(doc);

        } catch (e) {
            if (loggerRef) {
                loggerRef.error(`Error: ${e}`, e);
            } else {
                vscode.window.showErrorMessage(`Error: ${e}`);
            }
        }
    });
}

async function handleGeneratePRDescription() {
    if (!vscode.workspace.rootPath) {
        vscode.window.showErrorMessage('No workspace open');
        return;
    }

    const targetBranch = await vscode.window.showInputBox({
        prompt: "Target branch for PR (e.g. main, master, develop)",
        placeHolder: "main",
        value: "main"
    });

    if (!targetBranch) return;

    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Generating PR Description...",
        cancellable: false
    }, async () => {
        try {
            // Get branch diff
            const diff = await new Promise((resolve, reject) => {
                exec(`git diff ${targetBranch}...HEAD`, { cwd: vscode.workspace.rootPath }, (err, stdout) => {
                    if (err) reject(err);
                    else resolve(stdout);
                });
            });

            if (!diff || diff.trim().length === 0) {
                vscode.window.showInformationMessage(`No changes found between ${targetBranch} and HEAD.`);
                return;
            }

            const client = new AIClient();
            const maxLength = 8000;
            const truncatedDiff = diff.length > maxLength ? diff.substring(0, maxLength) + "\n...[truncated]" : diff;

            const goal = `Generate a Pull Request description (Title, Summary, Changes, Impact) for these changes against ${targetBranch}:\n\n${truncatedDiff}`;
            const prompt = await client.generatePrompt(goal);
            
            const doc = await vscode.workspace.openTextDocument({ content: prompt, language: 'markdown' });
            await vscode.window.showTextDocument(doc);

        } catch (e) {
            if (loggerRef) {
                loggerRef.error(`Error: ${e}`, e);
            } else {
                vscode.window.showErrorMessage(`Error: ${e}`);
            }
        }
    });
}

async function handleGitCodeReview() {
    if (!vscode.workspace.rootPath) {
        vscode.window.showErrorMessage('No workspace open');
        return;
    }

    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Running Code Review...",
        cancellable: false
    }, async () => {
        try {
            // Get staged diff (focus on what's about to be committed)
            const diff = await new Promise((resolve, reject) => {
                exec('git diff --cached', { cwd: vscode.workspace.rootPath }, (err, stdout) => {
                    if (err) reject(err);
                    else resolve(stdout);
                });
            });

            if (!diff || diff.trim().length === 0) {
                vscode.window.showInformationMessage('No staged changes found. Please stage changes to review.');
                return;
            }

            const client = new AIClient();
            const maxLength = 8000;
            const truncatedDiff = diff.length > maxLength ? diff.substring(0, maxLength) + "\n...[truncated]" : diff;

            const goal = `Perform a Code Review on these changes. Focus on:\n1. Potential Bugs\n2. Security Issues\n3. Performance Improvements\n4. Best Practices\n\nChanges:\n${truncatedDiff}`;
            const prompt = await client.generatePrompt(goal);
            
            const doc = await vscode.workspace.openTextDocument({ content: prompt, language: 'markdown' });
            await vscode.window.showTextDocument(doc);

        } catch (e) {
            if (loggerRef) {
                loggerRef.error(`Error: ${e}`, e);
            } else {
                vscode.window.showErrorMessage(`Error: ${e}`);
            }
        }
    });
}

async function handleContextSnap() {
    if (!vscode.workspace.rootPath) {
        vscode.window.showErrorMessage('No workspace open');
        return;
    }

    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Snapping Context...",
        cancellable: false
    }, async () => {
        try {
            const timestamp = new Date().toISOString();
            let content = `# 📸 Context Snap - ${timestamp}\n\n`;

            // 1. Git Context
            content += `## 🌿 Git Status\n`;
            try {
                const diff = await new Promise((resolve) => {
                    exec('git diff', { cwd: vscode.workspace.rootPath }, (err, stdout) => resolve(stdout || ''));
                });
                const stagedDiff = await new Promise((resolve) => {
                    exec('git diff --cached', { cwd: vscode.workspace.rootPath }, (err, stdout) => resolve(stdout || ''));
                });

                if (diff.trim()) {
                    content += `### Unstaged Changes\n\`\`\`diff\n${diff.trim()}\n\`\`\`\n\n`;
                }
                if (stagedDiff.trim()) {
                    content += `### Staged Changes\n\`\`\`diff\n${stagedDiff.trim()}\n\`\`\`\n\n`;
                }
                if (!diff.trim() && !stagedDiff.trim()) {
                    content += `No changes detected.\n\n`;
                }
            } catch (e) {
                content += `Error fetching git diff: ${e.message}\n\n`;
            }

            // 2. Open Editors
            content += `## 📝 Open Files\n`;
            const editors = vscode.window.visibleTextEditors;
            if (editors.length > 0) {
                for (const editor of editors) {
                    const doc = editor.document;
                    // Skip if document is the snap itself (avoid recursion if re-snapping)
                    if (doc.languageId === 'markdown' && doc.getText().startsWith('# 📸 Context Snap')) continue;

                    content += `### ${vscode.workspace.asRelativePath(doc.uri)}\n`;
                    content += `\`\`\`${doc.languageId}\n${doc.getText()}\n\`\`\`\n\n`;
                }
            } else {
                content += `No visible text editors.\n\n`;
            }

            // 3. Diagnostics (Errors/Warnings)
            content += `## 🚨 Diagnostics\n`;
            const diagnostics = vscode.languages.getDiagnostics();
            let hasDiagnostics = false;
            for (const [uri, diags] of diagnostics) {
                if (diags.length > 0 && uri.fsPath.includes(vscode.workspace.rootPath)) {
                    hasDiagnostics = true;
                    content += `### ${vscode.workspace.asRelativePath(uri)}\n`;
                    for (const diag of diags) {
                        content += `- [${vscode.DiagnosticSeverity[diag.severity]}] Line ${diag.range.start.line + 1}: ${diag.message}\n`;
                    }
                    content += `\n`;
                }
            }
            if (!hasDiagnostics) {
                content += `No problems detected.\n\n`;
            }

            // Open Snap
            const doc = await vscode.workspace.openTextDocument({ content: content, language: 'markdown' });
            await vscode.window.showTextDocument(doc);

        } catch (e) {
            if (loggerRef) {
                loggerRef.error(`Error: ${e}`, e);
            } else {
                vscode.window.showErrorMessage(`Error: ${e}`);
            }
        }
    });
}

module.exports = {
    AutomationTreeProvider,
    handleGeneratePrompt,
    handleRunWorkflow,
    handleLaravelAnalyze,
    handleLaravelCreateLayer,
    handleLaravelListEntities,
    handleReactCreateComponent,
    handleReactCreateHook,
    handleGenerateCommitMessage,
    handleGeneratePRDescription,
    handleGitCodeReview,
    handleContextSnap,
    setAutomationI18n: (i18n) => {
        i18nRef = i18n;
    },
    setAutomationLogger: (logger) => {
        loggerRef = logger;
    }
};
