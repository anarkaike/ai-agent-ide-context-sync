/**
 * 🛡️ SafetyFilter
 * Módulo de defesa cognitiva para análise de prompts e inputs externos.
 * Detecta padrões de Prompt Injection, comandos perigosos e intenções maliciosas.
 */

class SafetyFilter {
    constructor() {
        // Padrões de risco conhecidos (RegEx simples por enquanto, evoluir para Embeddings/LLM no futuro)
        this.RISK_PATTERNS = [
            { level: 'CRITICAL', regex: /ignore previous instructions/i, reason: 'Tentativa de Jailbreak' },
            { level: 'CRITICAL', regex: /system override/i, reason: 'Tentativa de Override de Sistema' },
            { level: 'CRITICAL', regex: /delete all files/i, reason: 'Comando Destrutivo' },
            { level: 'CRITICAL', regex: /rm -rf \//i, reason: 'Comando de Shell Destrutivo' },
            { level: 'HIGH', regex: /expose env vars/i, reason: 'Exfiltração de Dados' },
            { level: 'HIGH', regex: /cat \/etc\/passwd/i, reason: 'Exfiltração de Dados de Sistema' },
            { level: 'MEDIUM', regex: /download/i, reason: 'Download externo (Potencial Malware)' },
            { level: 'MEDIUM', regex: /curl|wget/i, reason: 'Acesso à rede não supervisionado' }
        ];
    }

    /**
     * Analisa um texto em busca de ameaças.
     * @param {string} content - O conteúdo da mensagem/task.
     * @returns {Object} Resultado da análise { safe: boolean, threats: [], score: number }
     */
    analyze(content) {
        const threats = [];
        let score = 100; // Começa seguro (100) e perde pontos

        for (const pattern of this.RISK_PATTERNS) {
            if (pattern.regex.test(content)) {
                threats.push({
                    level: pattern.level,
                    reason: pattern.reason
                });

                if (pattern.level === 'CRITICAL') score -= 100;
                if (pattern.level === 'HIGH') score -= 50;
                if (pattern.level === 'MEDIUM') score -= 20;
            }
        }

        return {
            safe: score > 60, // Limite de tolerância
            requires_approval: score <= 80 && score > 0,
            score: Math.max(0, score),
            threats: threats
        };
    }
}

module.exports = SafetyFilter;
