const vscode = require('vscode');
const { execSync } = require('child_process');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('AI Agent IDE Context Sync extension is now active!');

    // Command: Build Context
    let buildCommand = vscode.commands.registerCommand('ai-agent-sync.build', function () {
        vscode.window.showInformationMessage('Building AI Agent Context...');

        try {
            const output = execSync('ai-doc build', { encoding: 'utf-8' });
            vscode.window.showInformationMessage('✅ Context built successfully!');
            console.log(output);
        } catch (error) {
            vscode.window.showErrorMessage(`❌ Build failed: ${error.message}`);
        }
    });

    // Command: Show Status
    let statusCommand = vscode.commands.registerCommand('ai-agent-sync.status', function () {
        try {
            const output = execSync('ai-doc status', { encoding: 'utf-8' });

            // Create output channel to show status
            const outputChannel = vscode.window.createOutputChannel('AI Agent Sync');
            outputChannel.clear();
            outputChannel.appendLine(output);
            outputChannel.show();
        } catch (error) {
            vscode.window.showErrorMessage(`❌ Status check failed: ${error.message}`);
        }
    });

    // Command: View Heuristics
    let heuristicsCommand = vscode.commands.registerCommand('ai-agent-sync.heuristics', function () {
        try {
            const output = execSync('ai-doc heuristics', { encoding: 'utf-8' });

            const outputChannel = vscode.window.createOutputChannel('AI Agent Sync - Heuristics');
            outputChannel.clear();
            outputChannel.appendLine(output);
            outputChannel.show();
        } catch (error) {
            vscode.window.showErrorMessage(`❌ Heuristics check failed: ${error.message}`);
        }
    });

    context.subscriptions.push(buildCommand);
    context.subscriptions.push(statusCommand);
    context.subscriptions.push(heuristicsCommand);
}

function deactivate() { }

module.exports = {
    activate,
    deactivate
}
