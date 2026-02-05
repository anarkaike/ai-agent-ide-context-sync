const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

/**
 * 📔 ExecutionJournal
 * Garante atomicidade e rastreabilidade de operações críticas.
 * Implementa o padrão Write-Ahead Logging (WAL) simplificado para recuperação de falhas.
 */
class ExecutionJournal {
    constructor(workspacePath) {
        this.workspacePath = workspacePath || process.cwd();
        this.journalDir = path.join(this.workspacePath, '.ai-workspace', 'journal');
        this.ensureJournalDir();
    }

    ensureJournalDir() {
        if (!fs.existsSync(this.journalDir)) {
            fs.mkdirSync(this.journalDir, { recursive: true });
        }
    }

    /**
     * Inicia uma nova operação e registra no journal.
     * @param {string} type - Tipo da operação (ex: 'TASK_EXECUTION', 'FILE_EDIT')
     * @param {string} description - Descrição legível
     * @param {Object} metadata - Dados contextuais (args, timestamp, user)
     * @returns {string} operationId - ID único da operação iniciada
     */
    startOperation(type, description, metadata = {}) {
        const operationId = `OP-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
        return this.createOperation(operationId, type, description, metadata);
    }

    /**
     * Cria uma operação com um ID específico (útil para IDs externos ou passados via flag).
     */
    createOperation(operationId, type, description, metadata = {}) {
        const entry = {
            id: operationId,
            status: 'STARTED',
            type,
            description,
            started_at: new Date().toISOString(),
            metadata
        };

        this.writeEntry(operationId, entry);
        return operationId;
    }

    /**
     * Garante que uma operação existe; se não, cria.
     */
    ensureOperation(operationId, type = 'UNKNOWN', description = 'Auto-created operation') {
        if (!this.readEntry(operationId)) {
            return this.createOperation(operationId, type, description);
        }
        return operationId;
    }

    /**
     * Marca uma operação como concluída com sucesso.
     * @param {string} operationId 
     * @param {Object} result 
     */
    completeOperation(operationId, result = {}) {
        const entry = this.readEntry(operationId);
        if (!entry) return;

        entry.status = 'COMPLETED';
        entry.completed_at = new Date().toISOString();
        entry.result = result;

        this.writeEntry(operationId, entry);
        // Opcional: Mover para arquivo de histórico compactado ou deletar se for efêmero
    }

    /**
     * Marca uma operação como falha.
     * @param {string} operationId 
     * @param {Error|string} error 
     */
    failOperation(operationId, error) {
        const entry = this.readEntry(operationId);
        if (!entry) return;

        entry.status = 'FAILED';
        entry.failed_at = new Date().toISOString();
        entry.error = error.message || error;

        this.writeEntry(operationId, entry);
    }

    /**
     * Atualiza o progresso ou estado intermediário.
     * @param {string} operationId 
     * @param {Object} data 
     */
    updateState(operationId, data) {
        const entry = this.readEntry(operationId);
        if (!entry) return;

        entry.state = { ...entry.state, ...data };
        entry.updated_at = new Date().toISOString();

        this.writeEntry(operationId, entry);
    }

    /**
     * Registra que um arquivo foi criado pela operação, para que o rollback possa deletá-lo.
     * @param {string} operationId 
     * @param {string} filePath 
     */
    trackFileCreation(operationId, filePath) {
        this.updateState(operationId, {
            snapshots: [
                ...(this.readEntry(operationId)?.state?.snapshots || []),
                { original: filePath, action: 'created', timestamp: new Date().toISOString() }
            ]
        });
    }

    /**
     * Cria um snapshot de arquivo para permitir rollback.
     * @param {string} operationId 
     * @param {string} filePath 
     */
    snapshotFile(operationId, filePath) {
        if (!fs.existsSync(filePath)) return null;

        const content = fs.readFileSync(filePath, 'utf-8');
        const snapshotDir = path.join(this.journalDir, 'snapshots', operationId);
        
        if (!fs.existsSync(snapshotDir)) {
            fs.mkdirSync(snapshotDir, { recursive: true });
        }

        const fileName = path.basename(filePath);
        const snapshotPath = path.join(snapshotDir, fileName);
        fs.writeFileSync(snapshotPath, content, 'utf-8');

        this.updateState(operationId, {
            snapshots: [
                ...(this.readEntry(operationId)?.state?.snapshots || []),
                { original: filePath, snapshot: snapshotPath, timestamp: new Date().toISOString() }
            ]
        });

        return snapshotPath;
    }

    /**
     * Reverte edições feitas em uma operação usando snapshots.
     * @param {string} operationId 
     */
    async rollback(operationId) {
        const entry = this.readEntry(operationId);
        if (!entry || !entry.state || !entry.state.snapshots) return false;

        console.log(`↺ Rolling back operation ${operationId}...`);
        
        // Revert in reverse order
        const snapshots = entry.state.snapshots.reverse();
        
        for (const snap of snapshots) {
            try {
                if (snap.action === 'created') {
                    if (fs.existsSync(snap.original)) {
                        fs.unlinkSync(snap.original);
                        console.log(`   Deleted (Undo Create): ${path.basename(snap.original)}`);
                    }
                } else if (fs.existsSync(snap.snapshot)) {
                    const content = fs.readFileSync(snap.snapshot, 'utf-8');
                    fs.writeFileSync(snap.original, content, 'utf-8');
                    console.log(`   Restored: ${path.basename(snap.original)}`);
                }
            } catch (e) {
                console.error(`   Failed to restore ${snap.original}: ${e.message}`);
            }
        }
        
        this.failOperation(operationId, 'Rolled back by user/system');
        return true;
    }

    writeEntry(operationId, data) {
        const filePath = path.join(this.journalDir, `${operationId}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    }

    readEntry(operationId) {
        const filePath = path.join(this.journalDir, `${operationId}.json`);
        if (!fs.existsSync(filePath)) return null;
        try {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (e) {
            return null;
        }
    }

    /**
     * Lista operações que foram interrompidas (STARTED mas não COMPLETED/FAILED).
     */
    getInterruptedOperations() {
        const files = fs.readdirSync(this.journalDir).filter(f => f.endsWith('.json'));
        const interrupted = [];

        for (const file of files) {
            try {
                const content = fs.readFileSync(path.join(this.journalDir, file), 'utf8');
                const entry = JSON.parse(content);
                
                if (entry.status === 'STARTED') {
                    interrupted.push(entry);
                }
            } catch (e) {
                // Arquivo corrompido ou bloqueado
            }
        }

        return interrupted;
    }
}

module.exports = ExecutionJournal;
