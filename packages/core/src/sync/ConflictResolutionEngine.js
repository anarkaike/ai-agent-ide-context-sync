/**
 * Conflict Resolution Engine
 * 
 * Sistema avançado de resolução de conflitos para sincronização
 */

import crypto from 'crypto';

class ConflictResolutionEngine {
    constructor(options = {}) {
        this.strategies = {
            'latest-wins': this._latestWins.bind(this),
            'local-wins': this._localWins.bind(this),
            'remote-wins': this._remoteWins.bind(this),
            'merge': this._merge.bind(this),
            'semantic-merge': this._semanticMerge.bind(this),
            'voting': this._voting.bind(this),
            'manual': this._manual.bind(this)
        };

        this.defaultStrategy = options.defaultStrategy || 'latest-wins';
        this.conflictHistory = new Map(); // key -> [conflicts]
        this.resolutionRules = new Map(); // pattern -> strategy

        // Configurações
        this.maxHistorySize = options.maxHistorySize || 100;
        this.autoResolveThreshold = options.autoResolveThreshold || 0.8;

        console.log('[ConflictEngine] Conflict Resolution Engine initialized');
    }

    /**
     * Resolve conflito usando estratégia especificada
     */
    async resolveConflict(conflict, strategy = null) {
        const resolutionStrategy = strategy || this._selectBestStrategy(conflict);
        const strategyFunc = this.strategies[resolutionStrategy];

        if (!strategyFunc) {
            throw new Error(`Unknown conflict resolution strategy: ${resolutionStrategy}`);
        }

        try {
            const result = await strategyFunc(conflict);

            // Registra histórico
            this._recordConflict(conflict, resolutionStrategy, result);

            console.log(`[ConflictEngine] Resolved conflict using ${resolutionStrategy}`);

            return {
                resolved: true,
                strategy: resolutionStrategy,
                result,
                confidence: result.confidence || 1.0,
                metadata: result.metadata || {}
            };
        } catch (error) {
            console.error(`[ConflictEngine] Failed to resolve conflict:`, error);
            throw error;
        }
    }

    /**
     * Seleciona melhor estratégia baseada no contexto
     */
    _selectBestStrategy(conflict) {
        // Verifica regras personalizadas
        for (const [pattern, strategy] of this.resolutionRules) {
            if (this._matchesPattern(conflict.key, pattern)) {
                return strategy;
            }
        }

        // Analisa tipo de dado
        const dataType = this._analyzeDataType(conflict.local.data, conflict.remote.data);

        switch (dataType) {
            case 'primitive':
                return 'latest-wins';
            case 'array':
                return 'merge';
            case 'object':
                return conflict.complexity > 0.7 ? 'semantic-merge' : 'merge';
            case 'text':
                return conflict.similarity > 0.5 ? 'merge' : 'latest-wins';
            default:
                return this.defaultStrategy;
        }
    }

    /**
     * Estratégia: Latest Wins
     */
    async _latestWins(conflict) {
        const winner = conflict.local.timestamp > conflict.remote.timestamp
            ? 'local' : 'remote';

        return {
            data: winner === 'local' ? conflict.local.data : conflict.remote.data,
            winner,
            reason: `${winner} data has latest timestamp`,
            confidence: 0.9
        };
    }

    /**
     * Estratégia: Local Wins
     */
    async _localWins(conflict) {
        return {
            data: conflict.local.data,
            winner: 'local',
            reason: 'Local data takes precedence',
            confidence: 1.0
        };
    }

    /**
     * Estratégia: Remote Wins
     */
    async _remoteWins(conflict) {
        return {
            data: conflict.remote.data,
            winner: 'remote',
            reason: 'Remote data takes precedence',
            confidence: 1.0
        };
    }

    /**
     * Estratégia: Merge
     */
    async _merge(conflict) {
        const localData = conflict.local.data;
        const remoteData = conflict.remote.data;

        // Merge baseado no tipo
        let mergedData;
        let confidence = 0.7;

        if (Array.isArray(localData) && Array.isArray(remoteData)) {
            mergedData = this._mergeArrays(localData, remoteData);
            confidence = 0.8;
        } else if (typeof localData === 'object' && typeof remoteData === 'object') {
            mergedData = this._mergeObjects(localData, remoteData);
            confidence = 0.75;
        } else if (typeof localData === 'string' && typeof remoteData === 'string') {
            mergedData = this._mergeStrings(localData, remoteData);
            confidence = 0.6;
        } else {
            // Fallback para latest-wins
            return this._latestWins(conflict);
        }

        return {
            data: mergedData,
            winner: 'merged',
            reason: 'Data merged successfully',
            confidence,
            metadata: {
                mergeType: typeof mergedData,
                originalTypes: [typeof localData, typeof remoteData]
            }
        };
    }

    /**
     * Estratégia: Semantic Merge
     */
    async _semanticMerge(conflict) {
        const localData = conflict.local.data;
        const remoteData = conflict.remote.data;

        // Análise semântica simplificada
        const semanticAnalysis = this._analyzeSemantics(localData, remoteData);

        if (semanticAnalysis.canMerge) {
            const mergedData = this._semanticMergeData(localData, remoteData, semanticAnalysis);

            return {
                data: mergedData,
                winner: 'semantic-merge',
                reason: 'Semantic merge performed',
                confidence: semanticAnalysis.confidence,
                metadata: {
                    semanticAnalysis,
                    mergeOperations: semanticAnalysis.operations
                }
            };
        }

        // Fallback para merge simples
        return this._merge(conflict);
    }

    /**
     * Estratégia: Voting
     */
    async _voting(conflict) {
        // Simula votação de outros peers
        const votes = await this._collectVotes(conflict);

        const localVotes = votes.filter(v => v.choice === 'local').length;
        const remoteVotes = votes.filter(v => v.choice === 'remote').length;
        const mergeVotes = votes.filter(v => v.choice === 'merge').length;

        let winner, data, reason;

        if (mergeVotes > localVotes && mergeVotes > remoteVotes) {
            const mergeResult = await this._merge(conflict);
            winner = 'voting-merge';
            data = mergeResult.data;
            reason = `Merge selected by peer vote (${mergeVotes}/${votes.length})`;
        } else if (localVotes > remoteVotes) {
            winner = 'voting-local';
            data = conflict.local.data;
            reason = `Local selected by peer vote (${localVotes}/${votes.length})`;
        } else {
            winner = 'voting-remote';
            data = conflict.remote.data;
            reason = `Remote selected by peer vote (${remoteVotes}/${votes.length})`;
        }

        return {
            data,
            winner,
            reason,
            confidence: Math.max(localVotes, remoteVotes, mergeVotes) / votes.length,
            metadata: {
                votes: votes.reduce((acc, v) => {
                    acc[v.choice] = (acc[v.choice] || 0) + 1;
                    return acc;
                }, {}),
                totalVotes: votes.length
            }
        };
    }

    /**
     * Estratégia: Manual
     */
    async _manual(conflict) {
        return {
            data: null, // Precisa ser preenchido manualmente
            winner: 'manual',
            reason: 'Manual resolution required',
            confidence: 0.0,
            metadata: {
                requiresManualIntervention: true,
                conflict: conflict
            }
        };
    }

    /**
     * Adiciona regra de resolução
     */
    addResolutionRule(pattern, strategy) {
        this.resolutionRules.set(pattern, strategy);
        console.log(`[ConflictEngine] Added rule: ${pattern} -> ${strategy}`);
    }

    /**
     * Remove regra de resolução
     */
    removeResolutionRule(pattern) {
        this.resolutionRules.delete(pattern);
        console.log(`[ConflictEngine] Removed rule: ${pattern}`);
    }

    /**
     * Obtém estatísticas de conflitos
     */
    getStats() {
        const stats = {
            totalConflicts: 0,
            resolvedConflicts: 0,
            strategies: {},
            avgConfidence: 0,
            conflictTypes: {}
        };

        for (const [key, conflicts] of this.conflictHistory) {
            stats.totalConflicts += conflicts.length;

            for (const conflict of conflicts) {
                if (conflict.resolved) {
                    stats.resolvedConflicts++;
                    stats.avgConfidence += conflict.confidence;

                    stats.strategies[conflict.strategy] =
                        (stats.strategies[conflict.strategy] || 0) + 1;

                    const type = this._analyzeDataType(
                        conflict.original.local.data,
                        conflict.original.remote.data
                    );
                    stats.conflictTypes[type] = (stats.conflictTypes[type] || 0) + 1;
                }
            }
        }

        if (stats.resolvedConflicts > 0) {
            stats.avgConfidence /= stats.resolvedConflicts;
        }

        return stats;
    }

    /**
     * Merge de arrays
     */
    _mergeArrays(local, remote) {
        const merged = [...local];

        for (const item of remote) {
            if (!merged.includes(item)) {
                merged.push(item);
            }
        }

        return merged;
    }

    /**
     * Merge de objetos
     */
    _mergeObjects(local, remote) {
        const merged = { ...local };

        for (const [key, value] of Object.entries(remote)) {
            if (!(key in merged)) {
                merged[key] = value;
            } else if (typeof merged[key] !== typeof value) {
                // Tipos diferentes, usa o remoto
                merged[key] = value;
            } else if (typeof value === 'object' && value !== null) {
                // Merge recursivo
                merged[key] = this._mergeObjects(merged[key], value);
            }
        }

        return merged;
    }

    /**
     * Merge de strings
     */
    _mergeStrings(local, remote) {
        // Merge simples com marcador
        return `${local}\n\n[MERGED]\n\n${remote}`;
    }

    /**
     * Analisa tipo de dado
     */
    _analyzeDataType(localData, remoteData) {
        if (typeof localData !== typeof remoteData) {
            return 'mixed';
        }

        const type = typeof localData;

        if (type === 'object') {
            if (Array.isArray(localData)) return 'array';
            if (localData === null) return 'primitive';
            return 'object';
        }

        if (type === 'string') return 'text';
        return 'primitive';
    }

    /**
     * Analisa semântica dos dados
     */
    _analyzeSemantics(localData, remoteData) {
        // Implementação simplificada
        const analysis = {
            canMerge: true,
            confidence: 0.7,
            operations: []
        };

        // Verifica se são objetos com estrutura similar
        if (typeof localData === 'object' && typeof remoteData === 'object') {
            const localKeys = Object.keys(localData || {});
            const remoteKeys = Object.keys(remoteData || {});

            const commonKeys = localKeys.filter(k => remoteKeys.includes(k));
            const similarity = commonKeys.length / Math.max(localKeys.length, remoteKeys.length);

            analysis.confidence = similarity;
            analysis.canMerge = similarity > 0.3;

            if (analysis.canMerge) {
                analysis.operations.push({
                    type: 'object-merge',
                    commonKeys: commonKeys.length,
                    localOnly: localKeys.length - commonKeys.length,
                    remoteOnly: remoteKeys.length - commonKeys.length
                });
            }
        }

        return analysis;
    }

    /**
     * Merge semântico de dados
     */
    _semanticMergeData(localData, remoteData, analysis) {
        // Implementação baseada na análise
        if (analysis.operations.some(op => op.type === 'object-merge')) {
            return this._mergeObjects(localData, remoteData);
        }

        // Fallback
        return this._mergeObjects(localData, remoteData);
    }

    /**
     * Coleta votos de outros peers
     */
    async _collectVotes(conflict) {
        // Simulação - em implementação real consultaria outros nós
        const votes = [];
        const numPeers = 3; // Simula 3 peers

        for (let i = 0; i < numPeers; i++) {
            // Voto aleatório para simulação
            const choices = ['local', 'remote', 'merge'];
            const choice = choices[Math.floor(Math.random() * choices.length)];

            votes.push({
                peerId: `peer-${i}`,
                choice,
                reason: 'Simulated vote'
            });
        }

        return votes;
    }

    /**
     * Verifica se pattern corresponde à chave
     */
    _matchesPattern(key, pattern) {
        // Implementação simples de glob
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(key);
    }

    /**
     * Registra conflito no histórico
     */
    _recordConflict(conflict, strategy, result) {
        if (!this.conflictHistory.has(conflict.key)) {
            this.conflictHistory.set(conflict.key, []);
        }

        const history = this.conflictHistory.get(conflict.key);
        history.push({
            timestamp: Date.now(),
            original: conflict,
            strategy,
            result,
            resolved: true
        });

        // Limita tamanho do histórico
        if (history.length > this.maxHistorySize) {
            history.shift();
        }
    }
}

export { ConflictResolutionEngine };
