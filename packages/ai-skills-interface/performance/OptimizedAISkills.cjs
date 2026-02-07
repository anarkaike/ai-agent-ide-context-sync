/**
 * AI Skills Interface Otimizada
 * Versão com cache, métricas e execução paralela
 */

const CacheManager = require('./CacheManager.cjs');
const MetricsCollector = require('./MetricsCollector.cjs');
const ParallelExecutor = require('./ParallelExecutor.cjs');

class OptimizedAISkills {
  constructor(options = {}) {
    this.cache = new CacheManager(options.cache);
    this.metrics = new MetricsCollector();
    this.executor = new ParallelExecutor(options.executor);
    
    this.skills = new Map();
    this.initialized = false;
    
    // Configuração de otimizações
    this.config = {
      enableCache: options.enableCache !== false,
      enableMetrics: options.enableMetrics !== false,
      enableParallel: options.enableParallel !== false,
      autoCleanup: options.autoCleanup !== false,
      cleanupInterval: options.cleanupInterval || 5 * 60 * 1000 // 5 minutos
    };
    
    // Iniciar cleanup automático
    if (this.config.autoCleanup) {
      this.startCleanupTimer();
    }
  }

  /**
   * Inicialização otimizada
   */
  async initialize() {
    if (this.initialized) {
      return this.getSkillsSummary();
    }
    
    const startTime = Date.now();
    
    try {
      // Carregar skills com cache
      await this.loadSkills();
      
      this.initialized = true;
      const initTime = Date.now() - startTime;
      
      this.metrics.recordExecution('system', 'initialization', initTime, true);
      
      return this.getSkillsSummary();
    } catch (error) {
      const initTime = Date.now() - startTime;
      this.metrics.recordExecution('system', 'initialization', initTime, false);
      this.metrics.recordError('system', 'initialization', error);
      throw error;
    }
  }

  /**
   * Carrega skills com cache
   */
  async loadSkills() {
    const cacheKey = 'skills:registry';
    
    let skills = this.cache.get(cacheKey);
    
    if (!skills) {
      // Carregar do sistema de arquivos
      const AISkillsInterface = require('../index.cjs');
      const baseInterface = new AISkillsInterface();
      const summary = await baseInterface.initialize();
      
      skills = new Map();
      
      // Carregar cada skill
      for (const skillName of summary.skills) {
        const skill = baseInterface.getSkill(skillName);
        skills.set(skillName, skill);
      }
      
      // Cache por 10 minutos
      this.cache.set(cacheKey, skills, 10 * 60 * 1000);
    }
    
    this.skills = skills;
  }

  /**
   * Executa skill com otimizações
   */
  async executeSkill(skillName, params = {}) {
    const startTime = Date.now();
    
    try {
      // Verificar cache para resultados
      const cacheKey = this.generateCacheKey(skillName, params);
      
      if (this.config.enableCache) {
        const cached = this.cache.get(cacheKey);
        if (cached) {
          this.metrics.recordExecution(skillName, 'cache_hit', Date.now() - startTime, true);
          return cached;
        }
      }
      
      // Obter skill
      const skill = this.skills.get(skillName);
      if (!skill) {
        throw new Error(`Skill não encontrada: ${skillName}`);
      }
      
      // Executar skill
      const result = await skill.execute(params);
      
      // Cache de resultados (se sucesso)
      if (this.config.enableCache && result.success) {
        const ttl = this.calculateTTL(skillName, params);
        this.cache.set(cacheKey, result, ttl);
      }
      
      // Registrar métricas
      const executionTime = Date.now() - startTime;
      this.metrics.recordExecution(skillName, params.action || 'unknown', executionTime, result.success);
      
      // Registrar performance
      if (this.config.enableMetrics) {
        this.metrics.recordPerformance(skillName, {
          responseTime: executionTime,
          memoryUsage: process.memoryUsage().heapUsed
        });
      }
      
      return result;
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.metrics.recordExecution(skillName, params.action || 'unknown', executionTime, false);
      this.metrics.recordError(skillName, params.action || 'unknown', error);
      throw error;
    }
  }

  /**
   * Executa múltiplas skills em paralelo
   */
  async executeParallel(tasks) {
    if (!this.config.enableParallel) {
      // Execução sequencial
      const results = [];
      for (const task of tasks) {
        try {
          const result = await this.executeSkill(task.skillName, task.params);
          results.push({ id: task.id, success: true, data: result });
        } catch (error) {
          results.push({ id: task.id, success: false, error: error.message });
        }
      }
      return results;
    }
    
    // Converter tasks para formato do executor
    const executorTasks = tasks.map(task => ({
      id: task.id,
      skill: this.skills.get(task.skillName),
      action: task.params.action || 'unknown',
      params: task.params
    }));
    
    const results = await this.executor.executeParallel(executorTasks);
    
    return results.map(result => ({
      id: result.value?.id,
      success: result.value?.success || false,
      data: result.value?.data,
      error: result.value?.error
    }));
  }

  /**
   * Gera chave de cache
   */
  generateCacheKey(skillName, params) {
    const paramsHash = this.hashObject(params);
    return `${skillName}:${paramsHash}`;
  }

  /**
   * Calcula hash simples de objeto
   */
  hashObject(obj) {
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Calcula TTL baseado no tipo de skill
   */
  calculateTTL(skillName, params) {
    // Skills de análise podem ter cache mais longo
    if (skillName === 'context-management' && params.action === 'extract') {
      return 10 * 60 * 1000; // 10 minutos
    }
    
    // Skills de configuração podem ter cache muito longo
    if (params.action === 'list-ides' || params.action === 'setup-ide') {
      return 60 * 60 * 1000; // 1 hora
    }
    
    // Default: 5 minutos
    return 5 * 60 * 1000;
  }

  /**
   * Obtém skills disponíveis
   */
  listSkills() {
    const skills = [];
    
    for (const [name, skill] of this.skills) {
      skills.push({
        name,
        description: skill.description,
        category: skill.category,
        capabilities: skill.capabilities || []
      });
    }
    
    return skills;
  }

  /**
   * Obtém skill específica
   */
  getSkill(name) {
    return this.skills.get(name);
  }

  /**
   * Obtém resumo das skills
   */
  getSkillsSummary() {
    const categories = {};
    
    for (const [name, skill] of this.skills) {
      const category = skill.category || 'general';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(name);
    }
    
    return {
      total: this.skills.size,
      skills: Array.from(this.skills.keys()),
      categories,
      optimized: true,
      features: {
        cache: this.config.enableCache,
        metrics: this.config.enableMetrics,
        parallel: this.config.enableParallel,
        autoCleanup: this.config.autoCleanup
      }
    };
  }

  /**
   * Obtém relatório completo de performance
   */
  getPerformanceReport() {
    return {
      timestamp: Date.now(),
      cache: this.cache.getMetrics(),
      metrics: this.metrics.getReport(),
      executor: this.executor.getMetrics(),
      config: this.config
    };
  }

  /**
   * Limpa caches e métricas
   */
  cleanup() {
    this.cache.cleanup();
    this.metrics.cleanup();
    this.executor.clearMetrics();
  }

  /**
   * Inicia timer de cleanup automático
   */
  startCleanupTimer() {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Para timer de cleanup
   */
  stopCleanupTimer() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Destrói instância
   */
  destroy() {
    this.stopCleanupTimer();
    this.cleanup();
    this.cache.clear();
    this.skills.clear();
    this.initialized = false;
  }
}

module.exports = OptimizedAISkills;
