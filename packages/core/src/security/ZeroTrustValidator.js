import SafetyFilter from '../../../../cli/core/security/SafetyFilter.js';
import TrustSystem from '../../../cli/core/swarm/TrustSystem.js';
import SecuritySandbox from '../../security/SecuritySandbox.js';

/**
 * Zero Trust Validator - Combina múltiplas camadas de segurança
 * "Never trust, always verify" para cada operação
 */
class ZeroTrustValidator {
    constructor(options = {}) {
        this.options = {
            requireMFA: options.requireMFA || false,
            maxFailedAttempts: options.maxFailedAttempts || 3,
            lockoutDuration: options.lockoutDuration || 5 * 60 * 1000, // 5 minutos
            ...options
        };

        this.safetyFilter = new SafetyFilter();
        this.trustSystem = new TrustSystem();
        this.securitySandbox = new SecuritySandbox();

        // Estado de segurança
        this.failedAttempts = new Map(); // agentId -> { count, lastAttempt }
        this.lockedAccounts = new Map(); // agentId -> unlockedAt
    }

    /**
     * Validação completa Zero Trust para uma operação
     * @param {Object} context - Contexto da operação
     * @param {string} context.agentId - ID do agente
     * @param {string} context.operation - Tipo de operação
     * @param {string} context.resource - Recurso sendo acessado
     * @param {any} context.payload - Dados da operação
     * @param {string} context.token - Token de autenticação
     * @param {string} [context.requiredLevel] - Nível de trust requerido
     * @returns {Object} Resultado da validação
     */
    async validate(context) {
        const {
            agentId,
            operation,
            resource,
            payload,
            token,
            requiredLevel = 'PEER'
        } = context;

        // 1. Verificar se conta está bloqueada
        if (this.isAccountLocked(agentId)) {
            return {
                allowed: false,
                reason: 'ACCOUNT_LOCKED',
                details: `Account locked until ${new Date(this.lockedAccounts.get(agentId)).toISOString()}`,
                risk: 'CRITICAL'
            };
        }

        // 2. Validar identidade e trust
        const trustResult = await this.validateIdentity(agentId, token, requiredLevel);
        if (!trustResult.allowed) {
            this.recordFailedAttempt(agentId);
            return trustResult;
        }

        // 3. Sanitizar e validar payload
        const safetyResult = await this.validatePayload(payload, operation);
        if (!safetyResult.safe) {
            this.recordFailedAttempt(agentId);
            return {
                allowed: false,
                reason: 'UNSAFE_PAYLOAD',
                details: safetyResult.threats,
                risk: safetyResult.score > 0.8 ? 'CRITICAL' : 'HIGH'
            };
        }

        // 4. Verificar permissões específicas da operação
        const permissionResult = this.validateOperation(agentId, operation, resource, trustResult.level);
        if (!permissionResult.allowed) {
            this.recordFailedAttempt(agentId);
            return permissionResult;
        }

        // 5. Para operações críticas, requerer aprovação adicional
        if (this.isCriticalOperation(operation)) {
            const approvalResult = await this.requireApproval(agentId, operation, payload);
            if (!approvalResult.approved) {
                return {
                    allowed: false,
                    reason: 'APPROVAL_REQUIRED',
                    details: approvalResult.details,
                    risk: 'HIGH'
                };
            }
        }

        // Sucesso na validação - reset failed attempts
        this.resetFailedAttempts(agentId);

        return {
            allowed: true,
            reason: 'ZERO_TRUST_VALIDATED',
            trustLevel: trustResult.level,
            risk: safetyResult.score > 0.6 ? 'MEDIUM' : 'LOW',
            validatedAt: new Date().toISOString(),
            checks: {
                identity: true,
                payload: true,
                permissions: true,
                approval: !this.isCriticalOperation(operation) || true
            }
        };
    }

    /**
     * Valida identidade do agente
     */
    async validateIdentity(agentId, token, requiredLevel) {
        try {
            // Verificar token com TrustSystem
            const isValid = await this.trustSystem.validateRequest(agentId, token, requiredLevel);

            if (!isValid) {
                return {
                    allowed: false,
                    reason: 'INVALID_TOKEN',
                    details: `Token validation failed for required level: ${requiredLevel}`,
                    risk: 'HIGH'
                };
            }

            // Obter nível de trust do agente
            const trustLevel = await this.trustSystem.getTrustLevel(agentId);

            return {
                allowed: true,
                level: trustLevel,
                agentId
            };
        } catch (error) {
            return {
                allowed: false,
                reason: 'IDENTITY_VALIDATION_ERROR',
                details: error.message,
                risk: 'HIGH'
            };
        }
    }

    /**
     * Valida payload usando SafetyFilter e SecuritySandbox
     */
    async validatePayload(payload, operation) {
        // Converter payload para string para análise
        const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);

        // Análise de segurança com SafetyFilter
        const safetyAnalysis = this.safetyFilter.analyze(payloadStr);

        // Sanitização com SecuritySandbox
        const sanitized = this.securitySandbox.sanitizeInput(payloadStr);

        // Para operações com comandos, validar adicionalmente
        if (operation.includes('execute') || operation.includes('command')) {
            const commandValidation = this.securitySandbox.validateCommand(payload);
            if (!commandValidation.safe) {
                return {
                    safe: false,
                    threats: [...safetyAnalysis.threats, 'INVALID_COMMAND'],
                    score: 1.0,
                    sanitized
                };
            }
        }

        // Para operações com paths, validar paths
        if (operation.includes('file') || operation.includes('path')) {
            const pathValidation = this.securitySandbox.validatePath(payload);
            if (!pathValidation.safe) {
                return {
                    safe: false,
                    threats: [...safetyAnalysis.threats, 'INVALID_PATH'],
                    score: 1.0,
                    sanitized
                };
            }
        }

        return {
            safe: safetyAnalysis.safe,
            threats: safetyAnalysis.threats,
            score: safetyAnalysis.score,
            sanitized
        };
    }

    /**
     * Valida permissões específicas da operação
     */
    validateOperation(agentId, operation, resource, trustLevel) {
        // Matrix de permissões baseada no nível de trust
        const permissions = {
            STRANGER: ['read', 'query'],
            PEER: ['read', 'query', 'write', 'execute:low_risk'],
            SUB_AGENT: ['read', 'query', 'write', 'execute', 'admin:basic'],
            MENTOR: ['*'], // Acesso total
            MENTEE: ['read', 'query', 'write:own', 'execute:low_risk']
        };

        const allowedOps = permissions[trustLevel] || [];

        // Verificar se operação é permitida
        const isAllowed = allowedOps.some(perm => {
            if (perm === '*') return true;
            if (perm === operation) return true;
            if (perm.endsWith('*') && operation.startsWith(perm.slice(0, -1))) return true;
            if (perm.includes(':') && operation.includes(perm)) return true;
            return false;
        });

        if (!isAllowed) {
            return {
                allowed: false,
                reason: 'INSUFFICIENT_PERMISSIONS',
                details: `Operation '${operation}' not allowed for trust level '${trustLevel}'`,
                risk: 'HIGH'
            };
        }

        // Verificar acesso específico ao recurso
        if (resource && !this.validateResourceAccess(agentId, resource, operation, trustLevel)) {
            return {
                allowed: false,
                reason: 'RESOURCE_ACCESS_DENIED',
                details: `Access to '${resource}' denied for operation '${operation}'`,
                risk: 'MEDIUM'
            };
        }

        return { allowed: true };
    }

    /**
     * Valida acesso a recursos específicos
     */
    validateResourceAccess(agentId, resource, operation, trustLevel) {
        // Regras de acesso por padrão de recurso
        const resourcePatterns = {
            '/admin': ['MENTOR', 'SUB_AGENT'],
            '/policy': ['MENTOR'],
            '/security': ['MENTOR', 'SUB_AGENT'],
            '/budget': ['MENTOR', 'SUB_AGENT'],
            '/agent/[^/]+/persona': ['MENTOR', 'SUB_AGENT', 'PEER'],
            '/agent/[^/]+/data': function (agentId, resource, trustLevel) {
                // Dono do dado ou trust alto
                const ownerId = resource.match(/\/agent\/([^\/]+)\//)?.[1];
                return ownerId === agentId || ['MENTOR', 'SUB_AGENT'].includes(trustLevel);
            }
        };

        for (const [pattern, allowed] of Object.entries(resourcePatterns)) {
            if (new RegExp(pattern).test(resource)) {
                if (typeof allowed === 'function') {
                    return allowed(agentId, resource, trustLevel);
                }
                return allowed.includes(trustLevel);
            }
        }

        // Se não há regra específica, permitir baseado no nível geral
        return !['STRANGER'].includes(trustLevel);
    }

    /**
     * Verifica se operação é crítica e requer aprovação
     */
    isCriticalOperation(operation) {
        const criticalOps = [
            'policy.change',
            'security.modify',
            'admin.delete',
            'budget.reset',
            'persona.set_instruction',
            'mesh.connect',
            'canary.enable',
            'system.shutdown'
        ];

        return criticalOps.some(critical => operation.includes(critical));
    }

    /**
     * Requer aprovação para operações críticas
     */
    async requireApproval(agentId, operation, payload) {
        // Aqui poderia integrar com ApprovalWorkflow
        // Por ora, simula aprovação automática para agentes com trust alto
        const trustLevel = await this.trustSystem.getTrustLevel(agentId);

        if (['MENTOR', 'SUB_AGENT'].includes(trustLevel)) {
            return {
                approved: true,
                details: 'Auto-approved for high trust level'
            };
        }

        return {
            approved: false,
            details: 'Manual approval required - pending review'
        };
    }

    /**
     * Registra tentativa falha
     */
    recordFailedAttempt(agentId) {
        const now = Date.now();
        const current = this.failedAttempts.get(agentId) || { count: 0, lastAttempt: 0 };

        current.count++;
        current.lastAttempt = now;
        this.failedAttempts.set(agentId, current);

        // Bloquear conta se excedeu tentativas
        if (current.count >= this.options.maxFailedAttempts) {
            this.lockedAccounts.set(agentId, now + this.options.lockoutDuration);
        }
    }

    /**
     * Reseta tentativas falhas após sucesso
     */
    resetFailedAttempts(agentId) {
        this.failedAttempts.delete(agentId);
    }

    /**
     * Verifica se conta está bloqueada
     */
    isAccountLocked(agentId) {
        const unlockedAt = this.lockedAccounts.get(agentId);
        if (!unlockedAt) return false;

        if (Date.now() > unlockedAt) {
            this.lockedAccounts.delete(agentId);
            return false;
        }

        return true;
    }

    /**
     * Obtém status de segurança de um agente
     */
    getSecurityStatus(agentId) {
        const failed = this.failedAttempts.get(agentId);
        const locked = this.lockedAccounts.get(agentId);

        return {
            agentId,
            failedAttempts: failed?.count || 0,
            lastFailedAttempt: failed?.lastAttempt,
            isLocked: this.isAccountLocked(agentId),
            lockedUntil: locked || null,
            riskLevel: this.calculateRiskLevel(agentId)
        };
    }

    /**
     * Calcula nível de risco baseado no histórico
     */
    calculateRiskLevel(agentId) {
        const failed = this.failedAttempts.get(agentId);

        if (this.isAccountLocked(agentId)) return 'CRITICAL';
        if (failed && failed.count >= 2) return 'HIGH';
        if (failed && failed.count >= 1) return 'MEDIUM';
        return 'LOW';
    }

    /**
     * Lista todos os agentes com status de segurança
     */
    listAllSecurityStatus() {
        const allAgents = new Set([
            ...this.failedAttempts.keys(),
            ...this.lockedAccounts.keys()
        ]);

        return Array.from(allAgents).map(agentId => this.getSecurityStatus(agentId));
    }
}

export default ZeroTrustValidator;
