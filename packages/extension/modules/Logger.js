const vscode = require('vscode');
const os = require('os');

class Logger {
    constructor(channelName = 'AI Agent Context Sync') {
        this.outputChannel = vscode.window.createOutputChannel(channelName);
        this.logBuffer = [];
        this.maxBufferLines = 1000;
        this.i18n = null;
    }

    setI18n(i18nInstance) {
        this.i18n = i18nInstance;
    }

    _addToBuffer(message) {
        this.logBuffer.push(message);
        if (this.logBuffer.length > this.maxBufferLines) {
            this.logBuffer.shift();
        }
    }

    log(message) {
        const timestamp = new Date().toISOString();
        const formattedMessage = `[${timestamp}] [INFO] ${message}`;
        this.outputChannel.appendLine(formattedMessage);
        this._addToBuffer(formattedMessage);
    }

    warn(message) {
        const timestamp = new Date().toISOString();
        const formattedMessage = `[${timestamp}] [WARN] ${message}`;
        this.outputChannel.appendLine(formattedMessage);
        this._addToBuffer(formattedMessage);
    }

    async error(message, error) {
        const timestamp = new Date().toISOString();
        let fullErrorMessage = `[${timestamp}] [ERROR] ${message}`;
        let stackTrace = '';

        if (error) {
            if (error instanceof Error) {
                fullErrorMessage += `\nMessage: ${error.message}`;
                stackTrace = error.stack;
                fullErrorMessage += `\nStack: ${error.stack}`;
            } else {
                const errorStr = JSON.stringify(error, null, 2);
                fullErrorMessage += `\nDetails: ${errorStr}`;
                stackTrace = errorStr;
            }
        }

        this.outputChannel.appendLine(fullErrorMessage);
        this._addToBuffer(fullErrorMessage);
        
        // Show interactive error message
        const reportTitle = this.i18n ? this.i18n.t('messages.reportIssue') : 'Report Issue';
        const copyTitle = this.i18n ? this.i18n.t('messages.copyError') : 'Copy Error';
        
        const action = await vscode.window.showErrorMessage(
            `AI Agent Sync: ${message}`,
            reportTitle,
            copyTitle
        );
        
        if (action === reportTitle) {
            this.reportIssue(message, stackTrace || fullErrorMessage);
        } else if (action === copyTitle) {
            await vscode.env.clipboard.writeText(fullErrorMessage);
            const copiedMsg = this.i18n ? this.i18n.t('messages.logsCopied') : 'Logs copied to clipboard!';
            vscode.window.showInformationMessage(copiedMsg);
        }
    }

    reportIssue(message, errorDetails) {
        const title = encodeURIComponent(`Bug: ${message}`);
        const bodyContent = `
**Describe the bug**
${message}

**Error Details**
\`\`\`
${errorDetails}
\`\`\`

**Environment**
- OS: ${os.type()} ${os.release()}
- VS Code Version: ${vscode.version}
`;
        const body = encodeURIComponent(bodyContent);
        const url = `https://github.com/anarkaike/ai-agent-ide-context-sync/issues/new?title=${title}&body=${body}`;
        vscode.env.openExternal(vscode.Uri.parse(url));
    }

    show() {
        this.outputChannel.show(true);
    }

    getLogs() {
        return this.logBuffer.join('\n');
    }

    clear() {
        this.outputChannel.clear();
        this.logBuffer = [];
    }

    dispose() {
        this.outputChannel.dispose();
    }
}

module.exports = Logger;
