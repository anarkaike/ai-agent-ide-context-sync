/**
 * Cache Manager Inteligente para AI Skills
 * Otimiza performance com cache LRU e TTL
 */

class CacheManager {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 1000;
    this.defaultTTL = options.defaultTTL || 5 * 60 * 1000; // 5 minutos
    this.cache = new Map();
    this.accessOrder = new Map(); // Para LRU
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalRequests: 0
    };
  }

  /**
   * Obtém item do cache
   */
  get(key) {
    this.metrics.totalRequests++;
    
    const item = this.cache.get(key);
    if (!item) {
      this.metrics.misses++;
      return null;
    }
    
    // Verificar TTL
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      this.metrics.misses++;
      return null;
    }
    
    // Atualizar acesso (LRU)
    this.accessOrder.delete(key);
    this.accessOrder.set(key, Date.now());
    
    this.metrics.hits++;
    return item.data;
  }

  /**
   * Define item no cache
   */
  set(key, data, ttl = this.defaultTTL) {
    // Evitar duplicatas
    if (this.cache.has(key)) {
      this.accessOrder.delete(key);
    }
    
    // Evitar cache se tamanho excedido
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }
    
    const item = {
      data,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttl,
      accessCount: 0
    };
    
    this.cache.set(key, item);
    this.accessOrder.set(key, Date.now());
  }

  /**
   * Remove item mais antigo (LRU)
   */
  evictLRU() {
    if (this.accessOrder.size === 0) return;
    
    let oldestKey = null;
    let oldestTime = Date.now();
    
    for (const [key, time] of this.accessOrder) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.accessOrder.delete(oldestKey);
      this.metrics.evictions++;
    }
  }

  /**
   * Limpa cache expirado
   */
  cleanup() {
    const now = Date.now();
    const expiredKeys = [];
    
    for (const [key, item] of this.cache) {
      if (now > item.expiresAt) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => {
      this.cache.delete(key);
      this.accessOrder.delete(key);
    });
    
    return expiredKeys.length;
  }

  /**
   * Obtém métricas do cache
   */
  getMetrics() {
    const hitRate = this.metrics.totalRequests > 0 
      ? (this.metrics.hits / this.metrics.totalRequests) * 100 
      : 0;
    
    return {
      ...this.metrics,
      hitRate: hitRate.toFixed(2) + '%',
      cacheSize: this.cache.size,
      maxSize: this.maxSize,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Estima uso de memória
   */
  estimateMemoryUsage() {
    let totalSize = 0;
    
    for (const [key, item] of this.cache) {
      // Estimativa simples: tamanho da chave + dados
      totalSize += key.length * 2; // UTF-16
      totalSize += JSON.stringify(item.data).length * 2;
    }
    
    return {
      estimatedBytes: totalSize,
      estimatedMB: (totalSize / 1024 / 1024).toFixed(2)
    };
  }

  /**
   * Limpa todo o cache
   */
  clear() {
    this.cache.clear();
    this.accessOrder.clear();
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalRequests: 0
    };
  }

  /**
   * Cache com fallback assíncrono
   */
  async getOrSet(key, fetchFn, ttl = this.defaultTTL) {
    let data = this.get(key);
    
    if (data === null) {
      data = await fetchFn();
      this.set(key, data, ttl);
    }
    
    return data;
  }
}

module.exports = CacheManager;
