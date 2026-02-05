const vscode = require('vscode');
const cp = require('child_process');
const path = require('path');

class SoulTreeDataProvider {
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

        return this.getSBTs();
    }

    async getSBTs() {
        return new Promise((resolve) => {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                return resolve([new vscode.TreeItem('No workspace open')]);
            }

            const rootPath = workspaceFolders[0].uri.fsPath;
            const cliPath = path.join(rootPath, 'packages', 'cli', 'cli', 'ai-doc.js');

            cp.exec(`node "${cliPath}" soul resonate --json`, { cwd: rootPath }, (err, stdout, stderr) => {
                if (err) {
                    // Fail silently or show generic empty state if CLI not found
                    const emptyItem = new vscode.TreeItem('Soul Vault Empty');
                    emptyItem.iconPath = new vscode.ThemeIcon('circle-outline');
                    return resolve([emptyItem]);
                }

                try {
                    const sbts = JSON.parse(stdout);
                    if (sbts.length === 0) {
                        return resolve([new vscode.TreeItem('No SBTs minted yet')]);
                    }

                    const items = sbts.map(sbt => {
                        const item = new vscode.TreeItem(sbt.title);
                        item.description = sbt.type;
                        item.tooltip = `${sbt.description}\n\nID: ${sbt.id}\nIssued: ${sbt.timestamp}`;
                        
                        // Icons based on type
                        if (sbt.type === 'ACHIEVEMENT') item.iconPath = new vscode.ThemeIcon('trophy');
                        else if (sbt.type === 'SKILL') item.iconPath = new vscode.ThemeIcon('tools');
                        else if (sbt.type === 'REPUTATION') item.iconPath = new vscode.ThemeIcon('star');
                        else item.iconPath = new vscode.ThemeIcon('circle-filled');

                        return item;
                    });

                    resolve(items);
                } catch (e) {
                    resolve([new vscode.TreeItem('Failed to parse Soul data')]);
                }
            });
        });
    }
}

async function handleSoulMint() {
    const title = await vscode.window.showInputBox({ prompt: 'SBT Title (e.g., Python Master)' });
    if (!title) return;

    const type = await vscode.window.showQuickPick(['ACHIEVEMENT', 'SKILL', 'REPUTATION', 'IDENTITY'], { placeHolder: 'Select SBT Type' });
    if (!type) return;

    const description = await vscode.window.showInputBox({ prompt: 'Description', value: `Awarded for ${title}` });
    
    const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
    const cliPath = path.join(rootPath, 'packages', 'cli', 'cli', 'ai-doc.js');

    const command = `node "${cliPath}" soul mint "${title}" --type="${type}" --desc="${description || ''}"`;
    
    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Minting SBT...",
        cancellable: false
    }, async (progress) => {
        return new Promise((resolve) => {
            cp.exec(command, { cwd: rootPath }, (err, stdout) => {
                if (err) {
                    vscode.window.showErrorMessage(`Mint failed: ${err.message}`);
                } else {
                    vscode.window.showInformationMessage(`✨ SBT "${title}" minted successfully!`);
                    vscode.commands.executeCommand('ai-agent-sync.soul.refresh');
                }
                resolve();
            });
        });
    });
}

async function handleSoulResonate() {
    const token = await vscode.window.showInputBox({ prompt: 'Paste SBT Token String to Resonate (Import)' });
    if (!token) return;

    const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
    const cliPath = path.join(rootPath, 'packages', 'cli', 'cli', 'ai-doc.js');

    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Resonating with Soul...",
        cancellable: false
    }, async (progress) => {
        return new Promise((resolve) => {
            cp.exec(`node "${cliPath}" soul resonate "${token}"`, { cwd: rootPath }, (err, stdout) => {
                if (err) {
                    vscode.window.showErrorMessage(`Resonance failed: ${err.message}`);
                } else {
                    vscode.window.showInformationMessage(`✨ Soul Resonance established! Token imported.`);
                    vscode.commands.executeCommand('ai-agent-sync.soul.refresh');
                }
                resolve();
            });
        });
    });
}

module.exports = {
    SoulTreeDataProvider,
    handleSoulMint,
    handleSoulResonate
};
