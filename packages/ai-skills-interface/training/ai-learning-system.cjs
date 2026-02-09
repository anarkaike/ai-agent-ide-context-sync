/**
 * Sistema de Aprendizagem Automática para AI Skills
 * Adapta skills baseado em padrões de uso
 */

class AILearningSystem {
  constructor() {
    this.patterns = new Map();
    this.usageHistory = [];
    this.adaptations = new Map();
    this.learningEnabled = true;
  }

  /**
   * Registra uso de skill
   */
  recordUsage(skillName, action, params, result, duration) {
    if (!this.learningEnabled) return;

    const usage = {
      timestamp: Date.now(),
      skillName,
      action,
      params: this.sanitizeParams(params),
      result: this.sanitizeResult(result),
      duration,
      success: result.success
    };

    this.usageHistory.push(usage);
    this.analyzePattern(skillName, action, usage);
    
    // Manter apenas últimos 1000 usos
    if (this.usageHistory.length > 1000) {
      this.usageHistory.shift();
    }
  }

  /**
   * Analisa padrões de uso
   */
  analyzePattern(skillName, action, usage) {
    const key = `${skillName}:${action}`;
    
    if (!this.patterns.has(key)) {
      this.patterns.set(key, {
        count: 0,
        avgDuration: 0,
        successRate: 0,
        commonParams: new Map(),
        lastUsed: null,
        adaptations: []
      });
    }
    
    const pattern = this.patterns.get(key);
    pattern.count++;
    pattern.lastUsed = usage.timestamp;
    
    // Atualizar média de duração
    pattern.avgDuration = (pattern.avgDuration * (pattern.count - 1) + usage.duration) / pattern.count;
    
    // Atualizar taxa de sucesso
    const successfulUsages = this.usageHistory.filter(u => 
      u.skillName === skillName && u.action === action && u.success
    ).length;
    pattern.successRate = (successfulUsages / pattern.count) * 100;
    
    // Analisar parâmetros comuns
    for (const [param, value] of Object.entries(usage.params)) {
      if (!pattern.commonParams.has(param)) {
        pattern.commonParams.set(param, new Map());
      }
      const paramValues = pattern.commonParams.get(param);
      paramValues.set(JSON.stringify(value), (paramValues.get(JSON.stringify(value)) || 0) + 1);
    }
  }

  /**
   * Sugerir otimizações
   */
  suggestOptimizations(skillName, action) {
    const key = `${skillName}:${action}`;
    const pattern = this.patterns.get(key);
    
    if (!pattern || pattern.count < 5) {
      return { suggestions: [], confidence: 0 };
    }
    
    const suggestions = [];
    
    // Sugerir parâmetros mais comuns
    for (const [param, values] of pattern.commonParams) {
      const mostCommon = Array.from(values.entries())
        .sort((a, b) => b[1] - a[1])[0];
      
      if (mostCommon[1] / pattern.count > 0.7) {
        suggestions.push({
          type: 'parameter_optimization',
          parameter: param,
          suggestedValue: JSON.parse(mostCommon[0]),
          confidence: mostCommon[1] / pattern.count,
          reason: `Usado em ${(mostCommon[1] / pattern.count * 100).toFixed(1)}% das execuções`
        });
      }
    }
    
    // Sugerir cache se execuções repetidas
    if (pattern.count > 10 && pattern.successRate > 90) {
      suggestions.push({
        type: 'cache_recommendation',
        action: 'enable_cache',
        confidence: 0.8,
        reason: 'Alta taxa de sucesso com execuções repetidas'
      });
    }
    
    // Sugerir timeout se duração alta
    if (pattern.avgDuration > 5000) {
      suggestions.push({
        type: 'performance_optimization',
        action: 'increase_timeout',
        suggestedValue: Math.ceil(pattern.avgDuration * 1.5),
        confidence: 0.9,
        reason: `Duração média alta: ${Math.round(pattern.avgDuration)}ms`
      });
    }
    
    return {
      suggestions,
      confidence: suggestions.length > 0 ? 
        suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length : 0
    };
  }

  /**
   * Gerar relatório de aprendizagem
   */
  generateLearningReport() {
    const report = {
      timestamp: Date.now(),
      totalUsages: this.usageHistory.length,
      patterns: {},
      topSkills: [],
      adaptations: Array.from(this.adaptations.entries()),
      recommendations: []
    };
    
    // Analisar padrões
    for (const [key, pattern] of this.patterns) {
      report.patterns[key] = {
        usageCount: pattern.count,
        avgDuration: Math.round(pattern.avgDuration),
        successRate: pattern.successRate.toFixed(2) + '%',
        lastUsed: new Date(pattern.lastUsed).toISOString()
      };
    }
    
    // Top skills mais usadas
    const skillCounts = new Map();
    for (const usage of this.usageHistory) {
      skillCounts.set(usage.skillName, (skillCounts.get(usage.skillName) || 0) + 1);
    }
    
    report.topSkills = Array.from(skillCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
    
    return report;
  }

  /**
   * Sanitizar parâmetros para análise
   */
  sanitizeParams(params) {
    const sanitized = {};
    
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' && value.length > 100) {
        sanitized[key] = value.substring(0, 100) + '...';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = '[object]';
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  /**
   * Sanitizar resultado para análise
   */
  sanitizeResult(result) {
    return {
      success: result.success,
      hasData: !!result.data,
      dataKeys: result.data ? Object.keys(result.data) : [],
      error: result.error ? result.error.substring(0, 100) : null
    };
  }
}

module.exports = AILearningSystem;
