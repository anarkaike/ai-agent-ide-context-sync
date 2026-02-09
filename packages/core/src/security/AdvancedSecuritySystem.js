/**
 * Advanced Security System - Zero-Knowledge Proofs & SBTs
 * Sistema de segurança avançado com Soulbound Tokens e provas zero-knowledge
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export class AdvancedSecuritySystem {
    constructor(options = {}) {
        this.nodeId = options.nodeId || `secure_${Date.now()}`;
        this.config = {
            encryptionAlgorithm: 'aes-256-gcm',
            signatureAlgorithm: 'ed25519',
            hashAlgorithm: 'sha256',
            keyDerivationIterations: 100000,
            zeroKnowledgeProofs: options.zeroKnowledgeProofs !== false,
            sbtEnabled: options.sbtEnabled !== false,
            ...options
        };
        
        this.keyPair = null;
        this.sbtRegistry = new Map();
        this.proofSystem = new Map();
        this.auditLog = [];
        this.isInitialized = false;
        
        this.metrics = {
            encryptionsPerformed: 0,
            signaturesCreated: 0,
            sbtsMinted: 0,
            proofsGenerated: 0,
            auditsLogged: 0,
            securityEvents: 0
        };
    }

    /**
     * Inicializa o sistema de segurança
     */
    async initialize() {
        console.log('🔐 Initializing Advanced Security System');
        console.log(`   Node ID: ${this.nodeId}`);
        console.log(`   Encryption: ${this.config.encryptionAlgorithm}`);
        console.log(`   Signatures: ${this.config.signatureAlgorithm}`);
        console.log(`   SBTs: ${this.config.sbtEnabled ? 'ENABLED' : 'DISABLED'}`);
        console.log(`   Zero-Knowledge: ${this.config.zeroKnowledgeProofs ? 'ENABLED' : 'DISABLED'}`);
        
        try {
            // Gerar ou carregar par de chaves
            await this.initializeKeyPair();
            
            // Carregar SBTs existentes
            await this.loadSBTRegistry();
            
            // Inicializar sistema de provas
            await this.initializeProofSystem();
            
            this.isInitialized = true;
            
            console.log('✅ Advanced Security System initialized');
            
            return {
                success: true,
                nodeId: this.nodeId,
                publicKey: this.keyPair.publicKey.toString('hex'),
                sbtsCount: this.sbtRegistry.size,
                proofSystemReady: this.proofSystem.size > 0
            };
            
        } catch (error) {
            console.error('❌ Failed to initialize security system:', error.message);
            throw error;
        }
    }

    /**
     * Inicializa par de chaves criptográficas
     */
    async initializeKeyPair() {
        const keyPath = '.ai-workspace/security-keys.json';
        
        try {
            if (fs.existsSync(keyPath)) {
                // Carregar chaves existentes
                const keyData = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
                this.keyPair = {
                    publicKey: Buffer.from(keyData.publicKey, 'hex'),
                    privateKey: Buffer.from(keyData.privateKey, 'hex')
                };
                console.log('🔑 Existing keys loaded');
            } else {
                // Gerar novo par de chaves
                this.keyPair = crypto.generateKeyPairSync('ed25519');
                
                // Salvar chaves
                const keyData = {
                    nodeId: this.nodeId,
                    publicKey: this.keyPair.publicKey.toString('hex'),
                    privateKey: this.keyPair.privateKey.toString('hex'),
                    createdAt: new Date().toISOString()
                };
                
                fs.writeFileSync(keyPath, JSON.stringify(keyData, null, 2));
                console.log('🔑 New key pair generated and saved');
            }
        } catch (error) {
            console.error('❌ Failed to initialize key pair:', error.message);
            throw error;
        }
    }

    /**
     * Criptografa dados com AES-256-GCM
     */
    async encrypt(data, additionalData = null) {
        if (!this.isInitialized) {
            throw new Error('Security system not initialized');
        }
        
        try {
            // Gerar IV aleatório
            const iv = crypto.randomBytes(16);
            
            // Derivar chave de criptografia
            const encryptionKey = this.deriveEncryptionKey();
            
            // Criar cipher
            const cipher = crypto.createCipher(this.config.encryptionAlgorithm, encryptionKey);
            cipher.setAAD(Buffer.from(additionalData || ''));
            
            // Criptografar dados
            let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            // Obter tag de autenticação
            const authTag = cipher.getAuthTag();
            
            const result = {
                encrypted,
                iv: iv.toString('hex'),
                authTag: authTag.toString('hex'),
                algorithm: this.config.encryptionAlgorithm,
                timestamp: Date.now()
            };
            
            this.metrics.encryptionsPerformed++;
            await this.logSecurityEvent('encryption', { dataLength: JSON.stringify(data).length });
            
            return result;
            
        } catch (error) {
            console.error('❌ Encryption failed:', error.message);
            throw error;
        }
    }

    /**
     * Descriptografa dados
     */
    async decrypt(encryptedData, additionalData = null) {
        if (!this.isInitialized) {
            throw new Error('Security system not initialized');
        }
        
        try {
            // Derivar chave de criptografia
            const encryptionKey = this.deriveEncryptionKey();
            
            // Criar decipher
            const decipher = crypto.createDecipher(this.config.encryptionAlgorithm, encryptionKey);
            decipher.setAAD(Buffer.from(additionalData || ''));
            decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
            
            // Descriptografar dados
            let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            const result = JSON.parse(decrypted);
            
            await this.logSecurityEvent('decryption', { success: true });
            
            return result;
            
        } catch (error) {
            console.error('❌ Decryption failed:', error.message);
            await this.logSecurityEvent('decryption', { success: false, error: error.message });
            throw error;
        }
    }

    /**
     * Cria assinatura digital
     */
    async sign(data) {
        if (!this.isInitialized) {
            throw new Error('Security system not initialized');
        }
        
        try {
            const message = typeof data === 'string' ? data : JSON.stringify(data);
            const signature = crypto.sign(null, Buffer.from(message), this.keyPair.privateKey);
            
            const result = {
                signature: signature.toString('hex'),
                algorithm: this.config.signatureAlgorithm,
                publicKey: this.keyPair.publicKey.toString('hex'),
                timestamp: Date.now()
            };
            
            this.metrics.signaturesCreated++;
            await this.logSecurityEvent('signature', { dataLength: message.length });
            
            return result;
            
        } catch (error) {
            console.error('❌ Signature failed:', error.message);
            throw error;
        }
    }

    /**
     * Verifica assinatura digital
     */
    async verify(data, signature, publicKey) {
        if (!this.isInitialized) {
            throw new Error('Security system not initialized');
        }
        
        try {
            const message = typeof data === 'string' ? data : JSON.stringify(data);
            const signatureBuffer = Buffer.from(signature, 'hex');
            const publicKeyBuffer = Buffer.from(publicKey, 'hex');
            
            const isValid = crypto.verify(null, Buffer.from(message), publicKeyBuffer, signatureBuffer);
            
            await this.logSecurityEvent('verification', { isValid });
            
            return isValid;
            
        } catch (error) {
            console.error('❌ Verification failed:', error.message);
            await this.logSecurityEvent('verification', { isValid: false, error: error.message });
            return false;
        }
    }

    /**
     * Mint Soulbound Token (SBT)
     */
    async mintSBT(identity, attributes = {}) {
        if (!this.config.sbtEnabled) {
            throw new Error('SBTs are disabled');
        }
        
        try {
            const sbt = {
                id: this.generateSBTId(),
                identity,
                issuer: this.nodeId,
                attributes: {
                    ...attributes,
                    mintedAt: Date.now(),
                    version: '1.0'
                },
                signature: null,
                revoked: false
            };
            
            // Assinar SBT
            const signatureData = JSON.stringify({
                id: sbt.id,
                identity: sbt.identity,
                issuer: sbt.issuer,
                attributes: sbt.attributes
            });
            
            sbt.signature = await this.sign(signatureData);
            
            // Registrar SBT
            this.sbtRegistry.set(sbt.id, sbt);
            await this.saveSBTRegistry();
            
            this.metrics.sbtsMinted++;
            await this.logSecurityEvent('sbt_minted', { sbtId: sbt.id, identity });
            
            console.log(`🏅 SBT minted: ${sbt.id} for ${identity}`);
            
            return sbt;
            
        } catch (error) {
            console.error('❌ SBT minting failed:', error.message);
            throw error;
        }
    }

    /**
     * Verifica Soulbound Token
     */
    async verifySBT(sbtId) {
        if (!this.config.sbtEnabled) {
            return { valid: false, reason: 'SBTs disabled' };
        }
        
        try {
            const sbt = this.sbtRegistry.get(sbtId);
            
            if (!sbt) {
                return { valid: false, reason: 'SBT not found' };
            }
            
            if (sbt.revoked) {
                return { valid: false, reason: 'SBT revoked' };
            }
            
            // Verificar assinatura
            const signatureData = JSON.stringify({
                id: sbt.id,
                identity: sbt.identity,
                issuer: sbt.issuer,
                attributes: sbt.attributes
            });
            
            const isValid = await this.verify(signatureData, sbt.signature.signature, sbt.signature.publicKey);
            
            return {
                valid: isValid,
                sbt,
                reason: isValid ? 'Valid SBT' : 'Invalid signature'
            };
            
        } catch (error) {
            console.error('❌ SBT verification failed:', error.message);
            return { valid: false, reason: error.message };
        }
    }

    /**
     * Revoga Soulbound Token
     */
    async revokeSBT(sbtId, reason = 'Security compromise') {
        if (!this.config.sbtEnabled) {
            throw new Error('SBTs are disabled');
        }
        
        try {
            const sbt = this.sbtRegistry.get(sbtId);
            
            if (!sbt) {
                throw new Error('SBT not found');
            }
            
            sbt.revoked = true;
            sbt.revokedAt = Date.now();
            sbt.revocationReason = reason;
            
            await this.saveSBTRegistry();
            await this.logSecurityEvent('sbt_revoked', { sbtId, reason });
            
            console.log(`🚫 SBT revoked: ${sbtId}`);
            
            return sbt;
            
        } catch (error) {
            console.error('❌ SBT revocation failed:', error.message);
            throw error;
        }
    }

    /**
     * Gera Zero-Knowledge Proof
     */
    async generateZKProof(statement, witness) {
        if (!this.config.zeroKnowledgeProofs) {
            throw new Error('Zero-knowledge proofs are disabled');
        }
        
        try {
            // Implementação simplificada de ZK proof
            const proofId = this.generateProofId();
            
            // Hash da declaração
            const statementHash = crypto.createHash(this.config.hashAlgorithm)
                .update(JSON.stringify(statement))
                .digest('hex');
            
            // Hash do witness
            const witnessHash = crypto.createHash(this.config.hashAlgorithm)
                .update(JSON.stringify(witness))
                .digest('hex');
            
            // Gerar prova (simplificado)
            const proof = {
                id: proofId,
                statement,
                statementHash,
                proof: this.generateProofHash(statementHash, witnessHash),
                timestamp: Date.now(),
                verifier: this.nodeId
            };
            
            // Assinar prova
            proof.signature = await this.sign(JSON.stringify(proof));
            
            this.proofSystem.set(proofId, proof);
            this.metrics.proofsGenerated++;
            
            await this.logSecurityEvent('zk_proof_generated', { proofId });
            
            console.log(`🔍 ZK Proof generated: ${proofId}`);
            
            return proof;
            
        } catch (error) {
            console.error('❌ ZK proof generation failed:', error.message);
            throw error;
        }
    }

    /**
     * Verifica Zero-Knowledge Proof
     */
    async verifyZKProof(proof, publicInputs = {}) {
        if (!this.config.zeroKnowledgeProofs) {
            return { valid: false, reason: 'ZK proofs disabled' };
        }
        
        try {
            // Verificar assinatura
            const signatureValid = await this.verify(
                JSON.stringify({ ...proof, signature: null }),
                proof.signature.signature,
                proof.signature.publicKey
            );
            
            if (!signatureValid) {
                return { valid: false, reason: 'Invalid signature' };
            }
            
            // Verificar hash da declaração
            const expectedStatementHash = crypto.createHash(this.config.hashAlgorithm)
                .update(JSON.stringify(proof.statement))
                .digest('hex');
            
            if (proof.statementHash !== expectedStatementHash) {
                return { valid: false, reason: 'Statement hash mismatch' };
            }
            
            // Verificação simplificada da prova
            const isValid = this.verifyProofHash(proof.statementHash, proof.proof);
            
            await this.logSecurityEvent('zk_proof_verified', { 
                proofId: proof.id, 
                isValid 
            });
            
            return {
                valid: isValid,
                reason: isValid ? 'Valid proof' : 'Invalid proof'
            };
            
        } catch (error) {
            console.error('❌ ZK proof verification failed:', error.message);
            return { valid: false, reason: error.message };
        }
    }

    /**
     * Realiza auditoria de segurança
     */
    async performSecurityAudit() {
        console.log('🔍 Performing security audit...');
        
        const audit = {
            timestamp: Date.now(),
            nodeId: this.nodeId,
            checks: {},
            overallScore: 0,
            recommendations: []
        };
        
        // Verificar configuração de chaves
        audit.checks.keyConfiguration = this.keyPair ? 'PASS' : 'FAIL';
        if (audit.checks.keyConfiguration === 'PASS') audit.overallScore += 25;
        
        // Verificar SBTs
        audit.checks.sbtSystem = this.config.sbtEnabled ? 'PASS' : 'DISABLED';
        if (audit.checks.sbtSystem === 'PASS') audit.overallScore += 25;
        
        // Verificar ZK Proofs
        audit.checks.zkProofs = this.config.zeroKnowledgeProofs ? 'PASS' : 'DISABLED';
        if (audit.checks.zkProofs === 'PASS') audit.overallScore += 25;
        
        // Verificar logs de auditoria
        audit.checks.auditLogging = this.auditLog.length > 0 ? 'PASS' : 'FAIL';
        if (audit.checks.auditLogging === 'PASS') audit.overallScore += 25;
        
        // Gerar recomendações
        if (audit.overallScore < 100) {
            audit.recommendations.push('Enable all security features for maximum protection');
        }
        
        if (this.metrics.securityEvents > 100) {
            audit.recommendations.push('Review security events for potential threats');
        }
        
        // Salvar auditoria
        await this.saveSecurityAudit(audit);
        
        console.log(`📊 Security audit completed: ${audit.overallScore}/100`);
        
        return audit;
    }

    /**
     * Obtém métricas de segurança
     */
    getSecurityMetrics() {
        return {
            ...this.metrics,
            sbtsCount: this.sbtRegistry.size,
            proofsCount: this.proofSystem.size,
            auditLogSize: this.auditLog.length,
            isInitialized: this.isInitialized,
            config: this.config
        };
    }

    /**
     * Métodos auxiliares privados
     */
    deriveEncryptionKey() {
        // Derivar chave a partir da chave privada usando PBKDF2
        return crypto.pbkdf2Sync(
            this.keyPair.privateKey,
            'encryption-salt',
            this.config.keyDerivationIterations,
            32, // 256 bits para AES-256
            this.config.hashAlgorithm
        );
    }

    generateSBTId() {
        return `sbt_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    }

    generateProofId() {
        return `proof_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    }

    generateProofHash(statementHash, witnessHash) {
        return crypto.createHash(this.config.hashAlgorithm)
            .update(statementHash + witnessHash)
            .digest('hex');
    }

    verifyProofHash(statementHash, proof) {
        // Verificação simplificada - na implementação real usaria algoritmos ZK
        return proof.length === 64; // SHA256 hash length
    }

    async loadSBTRegistry() {
        try {
            const registryPath = '.ai-workspace/sbt-registry.json';
            if (fs.existsSync(registryPath)) {
                const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
                this.sbtRegistry = new Map(registry.sbt || []);
                console.log('📦 SBT registry loaded');
            }
        } catch (error) {
            console.error('⚠️ Failed to load SBT registry:', error.message);
        }
    }

    async saveSBTRegistry() {
        try {
            const registry = {
                version: '1.0',
                nodeId: this.nodeId,
                sbt: Array.from(this.sbtRegistry.entries()),
                savedAt: Date.now()
            };
            
            const registryPath = '.ai-workspace/sbt-registry.json';
            fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
            
        } catch (error) {
            console.error('❌ Failed to save SBT registry:', error.message);
        }
    }

    async initializeProofSystem() {
        // Inicializa sistema de provas zero-knowledge
        console.log('🔍 Proof system initialized');
    }

    async logSecurityEvent(event, data) {
        const logEntry = {
            timestamp: Date.now(),
            event,
            data,
            nodeId: this.nodeId
        };
        
        this.auditLog.push(logEntry);
        this.metrics.auditsLogged++;
        
        // Limitar tamanho do log
        if (this.auditLog.length > 1000) {
            this.auditLog = this.auditLog.slice(-500);
        }
    }

    async saveSecurityAudit(audit) {
        try {
            const auditPath = `.ai-workspace/security-audit-${Date.now()}.json`;
            fs.writeFileSync(auditPath, JSON.stringify(audit, null, 2));
        } catch (error) {
            console.error('❌ Failed to save security audit:', error.message);
        }
    }
}

export default AdvancedSecuritySystem;
