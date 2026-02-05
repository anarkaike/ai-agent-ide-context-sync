const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * 🛡️ Leucocyte (Sistema Imunológico)
 * 
 * Responsável pela defesa ativa do sistema.
 * Detecta intrusões (alterações não assinadas) e executa protocolos de resposta:
 * 1. SCAN: Identifica anomalias comparando hashes.
 * 2. DIAGNOSE: Classifica a mudança (Benigna/Maligna).
 * 3. RESPONSE: Aceita (Evolução) ou Rejeita (Expurgo).
 */
class ImmunitySystem {
    constructor(workspacePath, graphManager, soulManager) {
        this.workspacePath = workspacePath || process.cwd();
        this.graph = graphManager;
        this.soul = soulManager;
        this.memoryPath = path.join(this.workspacePath, '.ai-workspace', 'memory');
        this.backupPath = path.join(this.memoryPath, 'backups');
        
        if (!fs.existsSync(this.backupPath)) {
            fs.mkdirSync(this.backupPath, { recursive: true });
        }
    }

    /**
     * Realiza uma varredura completa de integridade.
     */
    scan() {
        const report = {
            status: 'HEALTHY',
            compromised_nodes: [],
            soul_integrity: this.soul.validateChain().valid
        };

        // Verifica integridade de todos os nós registrados no grafo
        for (const nodeId in this.graph.graph.nodes) {
            if (!this.graph.checkIntegrity(nodeId)) {
                report.status = 'INFECTED';
                report.compromised_nodes.push(nodeId);
            }
        }

        if (!report.soul_integrity) {
            report.status = 'CRITICAL'; // Alma corrompida é crítico
        }

        return report;
    }

    /**
     * Cria um ponto de restauração seguro (Célula Tronco).
     */
    createRestorePoint(filePath) {
        if (!fs.existsSync(filePath)) return;
        
        const fileName = path.basename(filePath);
        const backupFile = path.join(this.backupPath, `${fileName}.bak`);
        
        // Copia o arquivo atual para o backup
        fs.copyFileSync(filePath, backupFile);
        
        return backupFile;
    }

    /**
     * Tenta curar uma infecção baseada na estratégia escolhida.
     * @param {string} nodeId - ID do nó comprometido.
     * @param {string} strategy - 'ADAPT' (Aceitar) ou 'PURGE' (Restaurar).
     */
    heal(nodeId, strategy = 'PURGE') {
        const node = this.graph.graph.nodes[nodeId];
        if (!node) return { success: false, message: 'Nó desconhecido.' };

        const filePath = path.join(this.memoryPath, node.path);
        const backupFile = path.join(this.backupPath, `${path.basename(filePath)}.bak`);

        if (strategy === 'ADAPT') {
            // Estratégia: O que não me mata, me fortalece.
            // Aceita a mudança como uma evolução legítima (ex: edição do usuário).
            this.graph.registerNode(filePath, node.type); // Recalcula hash e salva
            
            // Se for o NUCLEUS, emite (minta) um novo SBT para oficializar
            if (nodeId === 'NUCLEUS') {
                const content = fs.readFileSync(filePath, 'utf8');
                this.soul.mintSoulboundToken(content, 'Immune System: Adaptation Response');
            }
            
            return { success: true, message: 'Alteração assimilada. O sistema evoluiu.' };
        }

        if (strategy === 'PURGE') {
            // Estratégia: Rejeição de corpo estranho.
            // Restaura o backup anterior.
            if (fs.existsSync(backupFile)) {
                fs.copyFileSync(backupFile, filePath);
                // Valida se a restauração funcionou (hash deve bater com o antigo)
                if (this.graph.checkIntegrity(nodeId)) {
                    return { success: true, message: 'Intrusão expurgada. Sistema restaurado.' };
                }
                // Se falhar (ex: backup também corrompido), força re-registro do que tem
                return { success: false, message: 'Restauração falhou. Backup incompatível.' };
            }
            return { success: false, message: 'Sem backup viável para expurgo.' };
        }

        return { success: false, message: 'Estratégia desconhecida.' };
    }
}

module.exports = ImmunitySystem;
