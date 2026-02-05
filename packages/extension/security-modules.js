const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

class SecurityTreeDataProvider {
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
        if (!vscode.workspace.workspaceFolders) return [];
        const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
        const activeTasksPath = path.join(rootPath, '.ai-workspace', 'tasks', 'active');

        if (!fs.existsSync(activeTasksPath)) return [];

        const files = fs.readdirSync(activeTasksPath).filter(f => f.endsWith('.md'));
        const pendingTasks = [];

        files.forEach(file => {
            const content = fs.readFileSync(path.join(activeTasksPath, file), 'utf-8');
            if (content.includes('status: pending_approval')) {
                const titleMatch = content.match(/title: (.*)/);
                const idMatch = content.match(/id: (.*)/);
                const fromMatch = content.match(/from_agent: (.*)/);
                const scoreMatch = content.match(/security_score: (\d+)/);

                if (titleMatch && idMatch) {
                    const item = new vscode.TreeItem(`🛑 ${titleMatch[1]}`);
                    item.description = `Pending Approval`;
                    item.contextValue = 'pendingTask';
                    item.tooltip = `From: ${fromMatch ? fromMatch[1] : 'Unknown'}\nScore: ${scoreMatch ? scoreMatch[1] : 'N/A'}`;
                    item.command = {
                        command: 'vscode.open',
                        arguments: [vscode.Uri.file(path.join(activeTasksPath, file))],
                        title: 'Open Task'
                    };
                    
                    // Add ID to item for command usage
                    item.taskId = idMatch[1].replace('task-', '');
                    
                    pendingTasks.push(item);
                }
            }
        });

        if (pendingTasks.length === 0) {
            return [new vscode.TreeItem("✅ No pending security risks")];
        }

        return pendingTasks;
    }
}

function handleApproveTask(item) {
    if (!item.taskId) return;
    const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
    const cliPath = path.join(rootPath, 'packages', 'cli', 'cli', 'ai-doc.js');

    cp.exec(`node "${cliPath}" task approve ${item.taskId}`, { cwd: rootPath }, (err, stdout) => {
        if (err) {
            vscode.window.showErrorMessage(`Failed to approve: ${err.message}`);
        } else {
            vscode.window.showInformationMessage(`Task ${item.taskId} approved!`);
            vscode.commands.executeCommand('ai-agent-sync.security.refresh');
        }
    });
}

function handleRejectTask(item) {
    if (!item.taskId) return;
    const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
    const cliPath = path.join(rootPath, 'packages', 'cli', 'cli', 'ai-doc.js');

    cp.exec(`node "${cliPath}" task reject ${item.taskId}`, { cwd: rootPath }, (err, stdout) => {
        if (err) {
            vscode.window.showErrorMessage(`Failed to reject: ${err.message}`);
        } else {
            vscode.window.showInformationMessage(`Task ${item.taskId} rejected.`);
            vscode.commands.executeCommand('ai-agent-sync.security.refresh');
        }
    });
}

module.exports = {
    SecurityTreeDataProvider,
    handleApproveTask,
    handleRejectTask
};
