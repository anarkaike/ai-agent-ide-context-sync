#!/usr/bin/env node
/**
 * Heuristics Engine - Auto-evolução do Kernel
 * 
 * Este script:
 * 1. Carrega heurísticas existentes
 * 2. Aplica heurísticas relevantes ao contexto atual
 * 3. Aprende novas heurísticas durante execução
 * 4. Salva heurísticas aprendidas
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml'); // Nota: precisa instalar js-yaml

const KERNEL_PATH = path.join(require('os').homedir(), '.ai-doc', 'kernel');
const HEURISTICS_PATH = path.join(KERNEL_PATH, 'heuristics');

class HeuristicsEngine {
    constructor() {
        this.heuristics = {
            navigation: {},
            documentation: {},
            prompts: {},
            analysis: {}
        };
        this.loadAll();
    }

    /**
     * Carrega todas as heurísticas
     */
    loadAll() {
        const types = ['navigation', 'documentation', 'prompts', 'analysis'];

        types.forEach(type => {
            const typePath = path.join(HEURISTICS_PATH, type);
            if (!fs.existsSync(typePath)) return;

            fs.readdirSync(typePath)
                .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
                .forEach(file => {
                    try {
                        const content = fs.readFileSync(path.join(typePath, file), 'utf-8');
                        const data = yaml.load(content);
                        const stack = file.replace(/\.(yaml|yml)$/, '');
                        this.heuristics[type][stack] = data.heuristics || [];
                    } catch (err) {
                        console.error(`Erro ao carregar ${file}:`, err.message);
                    }
                });
        });
    }

    /**
     * Busca heurísticas relevantes para um contexto
     */
    getRelevant(type, stack, minConfidence = 0.8) {
        const stackHeuristics = this.heuristics[type]?.[stack] || [];
        return stackHeuristics.filter(h => h.confidence >= minConfidence);
    }

    /**
     * Aplica uma heurística (incrementa contador)
     */
    apply(type, stack, heuristicId) {
        const heuristics = this.heuristics[type]?.[stack];
        if (!heuristics) return false;

        const h = heuristics.find(h => h.id === heuristicId);
        if (!h) return false;

        h.times_applied = (h.times_applied || 0) + 1;
        h.last_used = new Date().toISOString().split('T')[0];

        this.save(type, stack);
        return true;
    }

    /**
     * Aprende nova heurística
     */
    learn(type, stack, heuristic) {
        if (!this.heuristics[type]) this.heuristics[type] = {};
        if (!this.heuristics[type][stack]) this.heuristics[type][stack] = [];

        // Verifica se já existe
        const exists = this.heuristics[type][stack].find(h => h.id === heuristic.id);
        if (exists) {
            console.log(`Heurística ${heuristic.id} já existe`);
            return false;
        }

        // Adiciona
        this.heuristics[type][stack].push({
            ...heuristic,
            times_applied: 0,
            learned_from: heuristic.learned_from || [],
            created_at: new Date().toISOString().split('T')[0],
            last_used: null
        });

        this.save(type, stack);
        return true;
    }

    /**
     * Salva heurísticas de um tipo/stack
     */
    save(type, stack) {
        const typePath = path.join(HEURISTICS_PATH, type);
        if (!fs.existsSync(typePath)) {
            fs.mkdirSync(typePath, { recursive: true });
        }

        const filePath = path.join(typePath, `${stack}.yaml`);
        const data = {
            heuristics: this.heuristics[type][stack],
            meta: {
                total_heuristics: this.heuristics[type][stack].length,
                last_updated: new Date().toISOString().split('T')[0],
                kernel_version: '2.0.0-alpha.1'
            }
        };

        fs.writeFileSync(filePath, yaml.dump(data, { indent: 2 }));
    }

    /**
     * Estatísticas
     */
    stats() {
        let total = 0;
        let byType = {};

        Object.keys(this.heuristics).forEach(type => {
            byType[type] = 0;
            Object.keys(this.heuristics[type]).forEach(stack => {
                const count = this.heuristics[type][stack].length;
                byType[type] += count;
                total += count;
            });
        });

        return { total, byType };
    }
}

// Exporta para uso em outros scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HeuristicsEngine;
}

// CLI quando executado diretamente
if (require.main === module) {
    const engine = new HeuristicsEngine();
    const stats = engine.stats();

    console.log('\n=== Heurísticas do Kernel ===\n');
    console.log(`Total: ${stats.total} heurísticas`);
    console.log('\nPor tipo:');
    Object.entries(stats.byType).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
    });
    console.log();
}
