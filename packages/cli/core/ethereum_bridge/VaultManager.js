const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

class VaultManager {
    constructor() {
        this.homeDir = os.homedir();
        // Global storage for Ethereum Bridge
        this.baseDir = path.join(this.homeDir, '.ai-doc', 'ethereum_bridge', 'vault');
        this.indexFile = path.join(this.baseDir, 'index.json');
        
        this.init();
    }

    init() {
        if (!fs.existsSync(this.baseDir)) {
            fs.mkdirSync(this.baseDir, { recursive: true });
        }
        if (!fs.existsSync(this.indexFile)) {
            fs.writeFileSync(this.indexFile, JSON.stringify([], null, 2));
        }
    }

    /**
     * List all SBTs in the local vault
     */
    listSBTs() {
        try {
            if (!fs.existsSync(this.indexFile)) return [];
            return JSON.parse(fs.readFileSync(this.indexFile, 'utf8'));
        } catch (e) {
            console.error('Failed to read vault index:', e);
            return [];
        }
    }

    /**
     * Store an SBT in the vault
     * @param {SBT} sbt 
     */
    storeSBT(sbt) {
        const index = this.listSBTs();
        
        // Check duplication
        const exists = index.find(i => i.id === sbt.id);
        if (exists) {
            return { success: false, message: 'SBT already exists in vault' };
        }

        const sbtData = sbt.toJSON ? sbt.toJSON() : sbt;
        
        // "Encrypt" (Simple encoding for now, real encryption in v0.2)
        const encrypted = Buffer.from(JSON.stringify(sbtData)).toString('base64');
        const filename = `sbt_${sbtData.id}.enc`;
        const filePath = path.join(this.baseDir, filename);
        
        fs.writeFileSync(filePath, encrypted);
        
        // Update Index
        index.push({
            id: sbtData.id,
            title: sbtData.title,
            type: sbtData.type,
            timestamp: sbtData.timestamp,
            filename: filename,
            project_origin: sbtData.issuer?.project_id || 'unknown'
        });
        
        fs.writeFileSync(this.indexFile, JSON.stringify(index, null, 2));
        
        return { success: true, path: filePath };
    }

    /**
     * Retrieve an SBT by ID
     */
    getSBT(id) {
        const index = this.listSBTs();
        const entry = index.find(i => i.id === id);
        
        if (!entry) return null;
        
        const filePath = path.join(this.baseDir, entry.filename);
        if (!fs.existsSync(filePath)) return null;
        
        const encrypted = fs.readFileSync(filePath, 'utf8');
        const decrypted = Buffer.from(encrypted, 'base64').toString('utf8');
        
        return JSON.parse(decrypted);
    }
}

module.exports = VaultManager;
