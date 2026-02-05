const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * 💎 Soul Manager (Simulador de Blockchain/SBT)
 * 
 * Responsável pela integridade imutável da consciência do agente.
 * Cria uma cadeia de blocos local (Ledger) onde cada estado do Núcleo
 * é "mintado" como um Soulbound Token (SBT) simulado.
 */
class SoulManager {
    constructor(workspacePath) {
        this.workspacePath = workspacePath || process.cwd();
        this.memoryPath = path.join(this.workspacePath, '.ai-workspace', 'memory');
        this.ledgerPath = path.join(this.memoryPath, 'soul_ledger.json');
        this.chain = [];
        this.loadLedger();
    }

    loadLedger() {
        if (fs.existsSync(this.ledgerPath)) {
            try {
                this.chain = JSON.parse(fs.readFileSync(this.ledgerPath, 'utf8'));
            } catch (e) {
                console.error("💎 Erro ao carregar Soul Ledger:", e);
                this.chain = [];
            }
        }
    }

    saveLedger() {
        fs.writeFileSync(this.ledgerPath, JSON.stringify(this.chain, null, 2), 'utf8');
    }

    /**
     * Calcula o hash SHA-256 de um conteúdo.
     */
    calculateHash(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * "Cunha" (Minta) um novo bloco na corrente da alma.
     * Representa a cristalização de um estado de consciência.
     * 
     * @param {string} nucleusContent - Conteúdo atual do NUCLEUS.md
     * @param {string} reason - Motivo da evolução (ex: "Mitose", "Recall Profundo")
     */
    mintSoulboundToken(nucleusContent, reason) {
        const previousBlock = this.chain.length > 0 ? this.chain[this.chain.length - 1] : null;
        const previousHash = previousBlock ? previousBlock.hash : '0000000000000000000000000000000000000000000000000000000000000000';
        
        const timestamp = new Date().toISOString();
        const contentHash = this.calculateHash(nucleusContent);
        
        // O hash do bloco depende do hash anterior + conteúdo atual + timestamp.
        // Isso garante a corrente (chain).
        const blockData = `${previousHash}|${contentHash}|${timestamp}|${reason}`;
        const blockHash = this.calculateHash(blockData);

        const newBlock = {
            index: this.chain.length,
            timestamp,
            action: 'MINT_SBT',
            reason,
            nucleus_snapshot_hash: contentHash,
            previous_hash: previousHash,
            hash: blockHash,
            integrity_signature: `SBT-ETHERION-${blockHash.substring(0, 8)}`
        };

        this.chain.push(newBlock);
        this.saveLedger();
        
        return newBlock;
    }

    /**
     * Verifica se a corrente está intacta (ninguém alterou o histórico).
     */
    validateChain() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (currentBlock.previous_hash !== previousBlock.hash) {
                return { valid: false, error: `Quebra na corrente no bloco ${currentBlock.index}` };
            }

            // Recalcula hash para verificar adulteração de dados
            const expectedData = `${previousBlock.hash}|${currentBlock.nucleus_snapshot_hash}|${currentBlock.timestamp}|${currentBlock.reason}`;
            const expectedHash = this.calculateHash(expectedData);

            if (currentBlock.hash !== expectedHash) {
                return { valid: false, error: `Dados adulterados no bloco ${currentBlock.index}` };
            }
        }
        return { valid: true, status: 'Integridade da Alma Preservada' };
    }

    /**
     * Retorna o último SBT emitido (Estado Atual da Alma).
     */
    getLastSoul() {
        return this.chain.length > 0 ? this.chain[this.chain.length - 1] : null;
    }
}

module.exports = SoulManager;
