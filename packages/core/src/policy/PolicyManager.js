import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import chokidar from 'chokidar';
import { EventEmitter } from 'events';
import os from 'os';

/**
 * Policy Engine - Gerenciamento centralizado de políticas
 * Suporta hot-reload e validação de schemas
 */
class PolicyManager extends EventEmitter {
    constructor(options = {}) {
        super();
        this.options = {
            configDir: options.configDir || path.join(os.homedir(), '.ai-workspace', 'config'),
            policyFile: options.policyFile || 'policy.yaml',
            enableHotReload: options.enableHotReload !== false,
            ...options
        };

        this.policyPath = path.join(this.options.configDir, this.options.policyFile);
        this.policies = {};
        this.schema = this.getPolicySchema();
        this.watcher = null;

        this.loadPolicies();

        if (this.options.enableHotReload) {
            this.setupHotReload();
        }
    }

    /**
     * Schema de validação de políticas
     */
    getPolicySchema() {
        return {
            security: {
                zero_trust: { type: 'boolean', default: false },
                require_approval_for: { type: 'array', items: 'string', default: [] },
                max_failed_attempts: { type: 'number', default: 3 },
                lockout_duration_minutes: { type: 'number', default: 5 },
                encryption_enabled: { type: 'boolean', default: true },
                sanitize_payloads: { type: 'boolean', default: true }
            },
            observability: {
                enabled: { type: 'boolean', default: true },
                sample_rate: { type: 'number', min: 0, max: 1, default: 1.0 },
                retention_days: { type: 'number', default: 30 },
                console_output: { type: 'boolean', default: true }
            },
            sync: {
                auto_sync: { type: 'boolean', default: true },
                sync_interval_seconds: { type: 'number', default: 30 },
                max_queue_size: { type: 'number', default: 1000 },
                conflict_resolution: {
                    type: 'string',
                    enum: ['manual', 'latest_wins', 'local_wins', 'remote_wins'],
                    default: 'manual'
                }
            },
            budget: {
                enabled: { type: 'boolean', default: false },
                daily_token_limit: { type: 'number', default: 100000 },
                cost_alert_threshold: { type: 'number', default: 0.8 },
                auto_approve_under_cost: { type: 'number', default: 100 }
            },
            skills: {
                allow_remote_install: { type: 'boolean', default: true },
                require_signature: { type: 'boolean', default: true },
                trusted_sources: { type: 'array', items: 'string', default: [] },
                auto_update: { type: 'boolean', default: false }
            },
            governance: {
                require_approval: { type: 'array', items: 'string', default: [] },
                auto_approve: {
                    risk_level: { type: 'string', enum: ['low', 'medium', 'high'], default: 'low' },
                    trust_score_min: { type: 'number', min: 0, max: 1, default: 0.9 }
                },
                timeout_hours: { type: 'number', default: 24 },
                approval_chain_required_for: { type: 'array', items: 'string', default: [] }
            },
            mesh: {
                enabled: { type: 'boolean', default: false },
                max_peers: { type: 'number', default: 10 },
                heartbeat_interval_seconds: { type: 'number', default: 30 },
                discovery_enabled: { type: 'boolean', default: true }
            },
            nanobot: {
                enabled: { type: 'boolean', default: false },
                trust_network_url: { type: 'string', default: 'https://trust-network.nanobot.ai' },
                knowledge_base_url: { type: 'string', default: 'https://kb.nanobot.ai' },
                share_learning: { type: 'boolean', default: true }
            },
            i18n: {
                locale: { type: 'string', enum: ['en', 'pt'], default: 'en' },
                auto_detect: { type: 'boolean', default: true }
            },
            autopruner: {
                enabled: { type: 'boolean', default: true },
                max_checkpoints: { type: 'number', default: 10 },
                max_cache_entries: { type: 'number', default: 1000 },
                cleanup_interval_hours: { type: 'number', default: 6 },
                retention_days: {
                    checkpoints: { type: 'number', default: 7 },
                    cache: { type: 'number', default: 1 },
                    journal: { type: 'number', default: 30 }
                }
            }
        };
    }

    /**
     * Carrega políticas do arquivo
     */
    loadPolicies() {
        try {
            if (fs.existsSync(this.policyPath)) {
                const content = fs.readFileSync(this.policyPath, 'utf8');
                const loaded = yaml.load(content);

                // Validar e aplicar defaults
                this.policies = this.validateAndApplyDefaults(loaded);

                console.log(`[PolicyManager] Loaded policies from ${this.policyPath}`);
                this.emit('policies:loaded', this.policies);
            } else {
                // Criar arquivo com defaults
                this.createDefaultPolicyFile();
            }
        } catch (error) {
            console.error('[PolicyManager] Failed to load policies:', error.message);
            // Usar defaults em caso de erro
            this.policies = this.getDefaultPolicies();
        }
    }

    /**
     * Valida e aplica defaults
     */
    validateAndApplyDefaults(policies) {
        const defaults = this.getDefaultPolicies();
        const validated = this.deepMerge(defaults, policies || {});

        // Validar tipos e valores
        return this.validatePolicyTypes(validated);
    }

    /**
     * Obtém políticas padrão
     */
    getDefaultPolicies() {
        const defaults = {};

        for (const [section, config] of Object.entries(this.schema)) {
            defaults[section] = {};

            for (const [key, rule] of Object.entries(config)) {
                if (key !== 'type' && key !== 'items' && key !== 'enum' && key !== 'min' && key !== 'max') {
                    defaults[section][key] = rule.default;
                }
            }
        }

        return defaults;
    }

    /**
     * Valida tipos de política
     */
    validatePolicyTypes(policies) {
        const validated = JSON.parse(JSON.stringify(policies)); // Deep clone

        for (const [section, config] of Object.entries(this.schema)) {
            if (!validated[section]) continue;

            for (const [key, rule] of Object.entries(config)) {
                if (key === 'type' || key === 'items' || key === 'enum' || key === 'min' || key === 'max') {
                    continue;
                }

                const value = validated[section][key];
                const expectedType = rule.type;

                // Validar tipo
                if (value !== undefined && !this.validateType(value, expectedType, rule)) {
                    console.warn(`[PolicyManager] Invalid type for ${section}.${key}: expected ${expectedType}, got ${typeof value}`);
                    validated[section][key] = rule.default;
                }
            }
        }

        return validated;
    }

    /**
     * Valida tipo específico
     */
    validateType(value, type, rule) {
        switch (type) {
            case 'boolean':
                return typeof value === 'boolean';
            case 'number':
                return typeof value === 'number' && !isNaN(value) &&
                    (rule.min === undefined || value >= rule.min) &&
                    (rule.max === undefined || value <= rule.max);
            case 'string':
                return typeof value === 'string' &&
                    (!rule.enum || rule.enum.includes(value));
            case 'array':
                return Array.isArray(value) &&
                    (!rule.items || value.every(item => typeof item === rule.items));
            default:
                return true;
        }
    }

    /**
     * Deep merge de objetos
     */
    deepMerge(target, source) {
        const result = { ...target };

        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }

        return result;
    }

    /**
     * Cria arquivo de política padrão
     */
    createDefaultPolicyFile() {
        const defaultPolicies = this.getDefaultPolicies();

        fs.ensureDirSync(this.options.configDir);

        const yamlContent = yaml.dump(defaultPolicies, {
            indent: 2,
            lineWidth: 120,
            noRefs: true
        });

        const header = `# AI Agent Context Sync - Policy Configuration
# This file defines security, governance, and operational policies
# Changes are automatically reloaded (hot-reload enabled)

`;

        fs.writeFileSync(this.policyPath, header + yamlContent);
        console.log(`[PolicyManager] Created default policy file: ${this.policyPath}`);

        this.policies = defaultPolicies;
        this.emit('policies:created', defaultPolicies);
    }

    /**
     * Setup hot-reload com file watcher
     */
    setupHotReload() {
        this.watcher = chokidar.watch(this.policyPath, {
            persistent: true,
            ignoreInitial: true
        });

        this.watcher.on('change', () => {
            console.log('[PolicyManager] Policy file changed, reloading...');
            this.loadPolicies();
        });

        this.watcher.on('error', (error) => {
            console.error('[PolicyManager] Watcher error:', error);
        });
    }

    /**
     * Obtém valor de política
     * @param {string} path - Caminho da política (ex: "security.zero_trust")
     * @param {any} defaultValue - Valor padrão se não encontrado
     * @returns {any} Valor da política
     */
    get(path, defaultValue = undefined) {
        const keys = path.split('.');
        let value = this.policies;

        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return defaultValue;
            }
        }

        return value;
    }

    /**
     * Define valor de política em runtime
     * @param {string} path - Caminho da política
     * @param {any} value - Novo valor
     */
    set(path, value) {
        const keys = path.split('.');
        let current = this.policies;

        // Navegar até o pai do caminho
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }

        // Definir valor
        const lastKey = keys[keys.length - 1];
        const oldValue = current[lastKey];
        current[lastKey] = value;

        // Validar tipo
        const section = keys[0];
        const key = keys[1];
        if (this.schema[section] && this.schema[section][key]) {
            if (!this.validateType(value, this.schema[section][key].type, this.schema[section][key])) {
                console.warn(`[PolicyManager] Invalid type for ${path}, reverting to old value`);
                current[lastKey] = oldValue;
                return false;
            }
        }

        this.emit('policy:changed', { path, oldValue, newValue: value });
        return true;
    }

    /**
     * Verifica se política está habilitada
     */
    isEnabled(section) {
        return this.get(`${section}.enabled`, false);
    }

    /**
     * Salva políticas atuais no disco
     */
    async save() {
        try {
            const yamlContent = yaml.dump(this.policies, {
                indent: 2,
                lineWidth: 120,
                noRefs: true
            });

            await fs.writeFile(this.policyPath, yamlContent);
            console.log(`[PolicyManager] Saved policies to ${this.policyPath}`);
            return true;
        } catch (error) {
            console.error('[PolicyManager] Failed to save policies:', error.message);
            return false;
        }
    }

    /**
     * Obtém todas as políticas
     */
    getAll() {
        return JSON.parse(JSON.stringify(this.policies)); // Deep clone
    }

    /**
     * Valida se operação requer aprovação
     */
    requiresApproval(operation) {
        const requireList = this.get('governance.require_approval', []);
        return requireList.some(pattern => this.matchPattern(operation, pattern));
    }

    /**
     * Verifica se operação tem auto-aprovação
     */
    canAutoApprove(operation, riskLevel, trustScore) {
        const autoRiskLevel = this.get('governance.auto_approve.risk_level', 'low');
        const minTrustScore = this.get('governance.auto_approve.trust_score_min', 0.9);

        const riskLevels = { low: 0, medium: 1, high: 2 };
        const operationRisk = riskLevels[riskLevel] || 0;
        const allowedRisk = riskLevels[autoRiskLevel] || 0;

        return operationRisk <= allowedRisk && trustScore >= minTrustScore;
    }

    /**
     * Match de padrão para operações
     */
    matchPattern(operation, pattern) {
        if (pattern === '*') return true;
        if (pattern === operation) return true;
        if (pattern.endsWith('*')) {
            const prefix = pattern.slice(0, -1);
            return operation.startsWith(prefix);
        }
        return false;
    }

    /**
     * Limpa recursos
     */
    destroy() {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
        }
        this.removeAllListeners();
    }
}

// Singleton export
const policyManager = new PolicyManager();

export default policyManager;
