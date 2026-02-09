/**
 * Delta Compression Engine
 * 
 * Sistema otimizado de compressão delta para sincronização eficiente
 */

const crypto = require('crypto');
const zlib = require('zlib');

class DeltaCompressionEngine {
    constructor(options = {}) {
        // Configurações
        this.minDeltaSize = options.minDeltaSize || 100; // 100 bytes
        this.compressionLevel = options.compressionLevel || 6;
        this.maxDeltaAge = options.maxDeltaAge || 300000; // 5 minutos
        this.enableAdaptiveCompression = options.enableAdaptiveCompression || true;
        
        // Estado
        this.deltaCache = new Map(); // key -> [delta operations]
        this.compressionStats = new Map(); // key -> stats
        this.adaptiveThresholds = new Map(); // key -> threshold
        
        console.log('[DeltaCompression] Delta Compression Engine initialized');
    }
    
    /**
     * Comprime dados usando delta se aplicável
     */
    async compress(key, currentData, previousData = null) {
        const startTime = Date.now();
        
        try {
            if (!previousData) {
                // Primeira versão, usa compressão normal
                return await this._fullCompress(currentData);
            }
            
            // Calcula delta
            const delta = await this._calculateDelta(previousData, currentData);
            
            // Verifica se delta é vantajoso
            const currentSize = JSON.stringify(currentData).length;
            const deltaSize = JSON.stringify(delta).length;
            
            if (deltaSize < currentSize * 0.3 && deltaSize > this.minDeltaSize) {
                // Usa delta compressão
                const compressedDelta = await this._compressData(JSON.stringify(delta));
                
                // Atualiza estatísticas
                this._updateStats(key, 'delta', currentSize, compressedDelta.length);
                
                // Armazena delta para referência futura
                this._storeDelta(key, delta);
                
                const duration = Date.now() - startTime;
                
                return {
                    type: 'delta',
                    data: compressedDelta,
                    originalSize: currentSize,
                    compressedSize: compressedDelta.length,
                    compressionRatio: (currentSize - compressedDelta.length) / currentSize,
                    savings: currentSize - compressedDelta.length,
                    duration
                };
            } else {
                // Usa compressão normal
                const result = await this._fullCompress(currentData);
                result.duration = Date.now() - startTime;
                
                this._updateStats(key, 'full', result.originalSize, result.compressedSize);
                
                return result;
            }
        } catch (error) {
            console.error(`[DeltaCompression] Failed to compress ${key}:`, error);
            
            // Fallback para compressão normal
            const result = await this._fullCompress(currentData);
            result.fallback = true;
            return result;
        }
    }
    
    /**
     * Descomprime dados (delta ou full)
     */
    async decompress(key, compressedData, type, baseData = null) {
        const startTime = Date.now();
        
        try {
            if (type === 'delta') {
                if (!baseData) {
                    throw new Error('Base data required for delta decompression');
                }
                
                // Descomprime delta
                const decompressedDelta = await this._decompressData(compressedData);
                const delta = JSON.parse(decompressedDelta);
                
                // Aplica delta
                const result = this._applyDelta(baseData, delta);
                
                const duration = Date.now() - startTime;
                
                return {
                    data: result,
                    type: 'delta',
                    duration
                };
            } else {
                // Descomprime normal
                const decompressed = await this._decompressData(compressedData);
                const result = JSON.parse(decompressed);
                
                const duration = Date.now() - startTime;
                
                return {
                    data: result,
                    type: 'full',
                    duration
                };
            }
        } catch (error) {
            console.error(`[DeltaCompression] Failed to decompress ${key}:`, error);
            throw error;
        }
    }
    
    /**
     * Calcula delta otimizado entre dois dados
     */
    async _calculateDelta(oldData, newData) {
        const oldStr = JSON.stringify(oldData);
        const newStr = JSON.stringify(newData);
        
        // Usa algoritmo de diff otimizado
        const diff = this._optimizedDiff(oldStr, newStr);
        
        return {
            algorithm: 'optimized-diff',
            version: '1.0',
            operations: diff.operations,
            metadata: {
                originalSize: oldStr.length,
                newSize: newStr.length,
                operationCount: diff.operations.length,
                timestamp: Date.now()
            }
        };
    }
    
    /**
     * Algoritmo de diff otimizado
     */
    _optimizedDiff(oldStr, newStr) {
        const operations = [];
        let oldPos = 0;
        let newPos = 0;
        
        while (oldPos < oldStr.length || newPos < newStr.length) {
            // Encontra próxima sequência igual
            const match = this._findLongestMatch(oldStr, oldPos, newStr, newPos);
            
            if (match && match.length > 3) {
                // Adiciona operação para diferença antes do match
                if (match.oldPos > oldPos || match.newPos > newPos) {
                    operations.push({
                        type: 'replace',
                        oldPos,
                        oldLength: match.oldPos - oldPos,
                        newPos,
                        newLength: match.newPos - newPos,
                        oldText: oldStr.substring(oldPos, match.oldPos),
                        newText: newStr.substring(newPos, match.newPos)
                    });
                }
                
                // Adiciona operação de cópia
                operations.push({
                    type: 'copy',
                    oldPos: match.oldPos,
                    newPos: match.newPos,
                    length: match.length
                });
                
                oldPos = match.oldPos + match.length;
                newPos = match.newPos + match.length;
            } else {
                // Fim do diff
                if (oldPos < oldStr.length || newPos < newStr.length) {
                    operations.push({
                        type: 'replace',
                        oldPos,
                        oldLength: oldStr.length - oldPos,
                        newPos,
                        newLength: newStr.length - newPos,
                        oldText: oldStr.substring(oldPos),
                        newText: newStr.substring(newPos)
                    });
                }
                break;
            }
        }
        
        // Otimiza operações
        const optimizedOps = this._optimizeOperations(operations);
        
        return {
            operations: optimizedOps
        };
    }
    
    /**
     * Encontra maior sequência igual entre duas strings
     */
    _findLongestMatch(oldStr, oldStart, newStr, newStart) {
        let bestMatch = null;
        let maxMatch = Math.min(oldStr.length - oldStart, newStr.length - newStart);
        
        // Limita busca para performance
        maxMatch = Math.min(maxMatch, 1000);
        
        for (let len = maxMatch; len > 3; len--) {
            for (let oldOffset = 0; oldOffset <= Math.min(100, oldStr.length - oldStart - len); oldOffset++) {
                const oldPos = oldStart + oldOffset;
                const oldSegment = oldStr.substring(oldPos, oldPos + len);
                
                const newOffset = newStr.indexOf(oldSegment, newStart);
                if (newOffset !== -1) {
                    return {
                        oldPos,
                        newPos: newOffset,
                        length: len
                    };
                }
            }
        }
        
        return bestMatch;
    }
    
    /**
     * Otimiza operações de diff
     */
    _optimizeOperations(operations) {
        const optimized = [];
        
        for (let i = 0; i < operations.length; i++) {
            const current = operations[i];
            
            // Merge de operações adjacentes do mesmo tipo
            if (current.type === 'replace' && i + 1 < operations.length) {
                const next = operations[i + 1];
                
                if (next.type === 'replace' && 
                    current.oldPos + current.oldLength === next.oldPos &&
                    current.newPos + current.newLength === next.newPos) {
                    
                    // Merge das operações
                    optimized.push({
                        type: 'replace',
                        oldPos: current.oldPos,
                        oldLength: current.oldLength + next.oldLength,
                        newPos: current.newPos,
                        newLength: current.newLength + next.newLength,
                        oldText: current.oldText + next.oldText,
                        newText: current.newText + next.newText
                    });
                    
                    i++; // Pula a próxima operação
                    continue;
                }
            }
            
            optimized.push(current);
        }
        
        return optimized;
    }
    
    /**
     * Aplica delta aos dados
     */
    _applyDelta(baseData, delta) {
        const baseStr = JSON.stringify(baseData);
        let result = '';
        
        let oldPos = 0;
        let newPos = 0;
        
        for (const op of delta.operations) {
            switch (op.type) {
                case 'copy':
                    // Copia segmento
                    result += baseStr.substring(op.oldPos, op.oldPos + op.length);
                    oldPos = op.oldPos + op.length;
                    newPos = op.newPos + op.length;
                    break;
                    
                case 'replace':
                    // Adiciona novo texto
                    result += op.newText;
                    oldPos = op.oldPos + op.oldLength;
                    newPos = op.newPos + op.newLength;
                    break;
            }
        }
        
        try {
            return JSON.parse(result);
        } catch (error) {
            console.error('[DeltaCompression] Failed to apply delta, returning base data');
            return baseData;
        }
    }
    
    /**
     * Compressão full normal
     */
    async _fullCompress(data) {
        const serialized = JSON.stringify(data);
        const compressed = await this._compressData(serialized);
        
        return {
            type: 'full',
            data: compressed,
            originalSize: serialized.length,
            compressedSize: compressed.length,
            compressionRatio: (serialized.length - compressed.length) / serialized.length,
            savings: serialized.length - compressed.length
        };
    }
    
    /**
     * Comprime dados usando zlib
     */
    async _compressData(data) {
        return new Promise((resolve, reject) => {
            zlib.gzip(data, { level: this.compressionLevel }, (err, compressed) => {
                if (err) reject(err);
                else resolve(compressed.toString('base64'));
            });
        });
    }
    
    /**
     * Descomprime dados usando zlib
     */
    async _decompressData(compressedData) {
        return new Promise((resolve, reject) => {
            const buffer = Buffer.from(compressedData, 'base64');
            zlib.gunzip(buffer, (err, decompressed) => {
                if (err) reject(err);
                else resolve(decompressed.toString());
            });
        });
    }
    
    /**
     * Armazena delta para referência
     */
    _storeDelta(key, delta) {
        if (!this.deltaCache.has(key)) {
            this.deltaCache.set(key, []);
        }
        
        const deltas = this.deltaCache.get(key);
        deltas.push({
            delta,
            timestamp: Date.now()
        });
        
        // Limpa deltas antigos
        const cutoff = Date.now() - this.maxDeltaAge;
        while (deltas.length > 0 && deltas[0].timestamp < cutoff) {
            deltas.shift();
        }
        
        // Limita tamanho
        if (deltas.length > 10) {
            deltas.shift();
        }
    }
    
    /**
     * Atualiza estatísticas de compressão
     */
    _updateStats(key, type, originalSize, compressedSize) {
        if (!this.compressionStats.has(key)) {
            this.compressionStats.set(key, {
                totalCompressions: 0,
                totalOriginalSize: 0,
                totalCompressedSize: 0,
                deltaCompressions: 0,
                fullCompressions: 0,
                avgCompressionRatio: 0
            });
        }
        
        const stats = this.compressionStats.get(key);
        stats.totalCompressions++;
        stats.totalOriginalSize += originalSize;
        stats.totalCompressedSize += compressedSize;
        
        if (type === 'delta') {
            stats.deltaCompressions++;
        } else {
            stats.fullCompressions++;
        }
        
        stats.avgCompressionRatio = (stats.totalOriginalSize - stats.totalCompressedSize) / stats.totalOriginalSize;
        
        // Ajusta threshold adaptativo
        if (this.enableAdaptiveCompression) {
            this._adjustAdaptiveThreshold(key, stats);
        }
    }
    
    /**
     * Ajusta threshold adaptativo
     */
    _adjustAdaptiveThreshold(key, stats) {
        if (stats.totalCompressions < 10) return; // Precisa de mais dados
        
        const deltaEfficiency = stats.deltaCompressions / stats.totalCompressions;
        
        if (deltaEfficiency > 0.7) {
            // Delta está funcionando bem, diminui threshold
            this.adaptiveThresholds.set(key, Math.max(50, this.minDeltaSize * 0.8));
        } else if (deltaEfficiency < 0.3) {
            // Delta não está eficiente, aumenta threshold
            this.adaptiveThresholds.set(key, this.minDeltaSize * 1.5);
        }
    }
    
    /**
     * Obtém estatísticas de compressão
     */
    getStats(key = null) {
        if (key) {
            return this.compressionStats.get(key) || null;
        }
        
        // Estatísticas globais
        const globalStats = {
            totalCompressions: 0,
            totalOriginalSize: 0,
            totalCompressedSize: 0,
            totalDeltaCompressions: 0,
            totalFullCompressions: 0,
            avgCompressionRatio: 0,
            keysCount: this.compressionStats.size,
            deltaCacheSize: 0
        };
        
        for (const [k, stats] of this.compressionStats) {
            globalStats.totalCompressions += stats.totalCompressions;
            globalStats.totalOriginalSize += stats.totalOriginalSize;
            globalStats.totalCompressedSize += stats.totalCompressedSize;
            globalStats.totalDeltaCompressions += stats.deltaCompressions;
            globalStats.totalFullCompressions += stats.fullCompressions;
        }
        
        if (globalStats.totalOriginalSize > 0) {
            globalStats.avgCompressionRatio = 
                (globalStats.totalOriginalSize - globalStats.totalCompressedSize) / 
                globalStats.totalOriginalSize;
        }
        
        for (const deltas of this.deltaCache.values()) {
            globalStats.deltaCacheSize += deltas.length;
        }
        
        return globalStats;
    }
    
    /**
     * Limpa cache e estatísticas
     */
    clear() {
        this.deltaCache.clear();
        this.compressionStats.clear();
        this.adaptiveThresholds.clear();
        console.log('[DeltaCompression] Cache and stats cleared');
    }
}

module.exports = DeltaCompressionEngine;
