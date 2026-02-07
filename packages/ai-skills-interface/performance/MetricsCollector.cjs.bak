/**
 * Coletor de Métricas em Tempo Real
 * Monitora performance das AI Skills
 */

class MetricsCollector {
  constructor() {
    this.metrics = {
      executions: new Map(),
      errors: new Map(),
      performance: new Map(),
      system: {
        startTime: Date.now(),
        uptime: 0,
        memoryUsage: 0
      }
    };
    this.alerts = [];
    this.thresholds = {
      maxResponseTime: 5000, // 5s
      maxErrorRate: 10, // 10%
      maxMemoryUsage: 500 * 1024 * 1024 // 500MB
    };
  }

  /**
   * Registra execução de skill
   */
  recordExecution(skillName, action, duration, success = true) {
    const key = `${skillName}:${action}`;
    
    if (!this.metrics.executions.has(key)) {
      this.metrics.executions.set(key, {
        total: 0,
        successful: 0,
        failed: 0,
        totalDuration: 0,
        avgDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        lastExecution: null
      });
    }
    
    const exec = this.metrics.executions.get(key);
    exec.total++;
    exec.totalDuration += duration;
    exec.avgDuration = exec.totalDuration / exec.total;
    exec.minDuration = Math.min(exec.minDuration, duration);
    exec.maxDuration = Math.max(exec.maxDuration, duration);
    exec.lastExecution = Date.now();
    
    if (success) {
      exec.successful++;
    } else {
      exec.failed++;
      this.recordError(skillName, action, 'execution_failed');
    }
    
    // Verificar alertas
    this.checkAlerts(key, duration, success);
  }

  /**
   * Registra erro
   */
  recordError(skillName, action, error) {
    const key = `${skillName}:${action}`;
    
    if (!this.metrics.errors.has(key)) {
      this.metrics.errors.set(key, {
        total: 0,
        types: new Map(),
        lastError: null
      });
    }
    
    const errorData = this.metrics.errors.get(key);
    errorData.total++;
    errorData.lastError = {
      error,
      timestamp: Date.now()
    };
    
    // Contar tipos de erro
    const errorType = error.name || 'unknown';
    if (!errorData.types.has(errorType)) {
      errorData.types.set(errorType, 0);
    }
    errorData.types.set(errorType, errorData.types.get(errorType) + 1);
  }

  /**
   * Registra métricas de performance
   */
  recordPerformance(skillName, metrics) {
    const key = skillName;
    
    if (!this.metrics.performance.has(key)) {
      this.metrics.performance.set(key, {
        memoryUsage: [],
        cpuUsage: [],
        responseTime: [],
        timestamp: []
      });
    }
    
    const perf = this.metrics.performance.get(key);
    perf.memoryUsage.push(metrics.memoryUsage || 0);
    perf.cpuUsage.push(metrics.cpuUsage || 0);
    perf.responseTime.push(metrics.responseTime || 0);
    perf.timestamp.push(Date.now());
    
    // Manter apenas últimas 100 medições
    if (perf.memoryUsage.length > 100) {
      perf.memoryUsage.shift();
      perf.cpuUsage.shift();
      perf.responseTime.shift();
      perf.timestamp.shift();
    }
  }

  /**
   * Atualiza métricas do sistema
   */
  updateSystemMetrics() {
    const now = Date.now();
    this.metrics.system.uptime = now - this.metrics.system.startTime;
    this.metrics.system.memoryUsage = process.memoryUsage();
  }

  /**
   * Verifica alertas
   */
  checkAlerts(key, duration, success) {
    const exec = this.metrics.executions.get(key);
    
    // Alerta de performance
    if (duration > this.thresholds.maxResponseTime) {
      this.addAlert('performance', {
        key,
        message: `Tempo de resposta alto: ${duration}ms`,
        threshold: this.thresholds.maxResponseTime,
        timestamp: Date.now()
      });
    }
    
    // Alerta de taxa de erro
    const errorRate = (exec.failed / exec.total) * 100;
    if (errorRate > this.thresholds.maxErrorRate) {
      this.addAlert('error_rate', {
        key,
        message: `Taxa de erro alta: ${errorRate.toFixed(2)}%`,
        threshold: this.thresholds.maxErrorRate,
        timestamp: Date.now()
      });
    }
    
    // Alerta de memória
    this.updateSystemMetrics();
    if (this.metrics.system.memoryUsage.heapUsed > this.thresholds.maxMemoryUsage) {
      this.addAlert('memory', {
        message: `Uso de memória alto: ${(this.metrics.system.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        threshold: this.thresholds.maxMemoryUsage / 1024 / 1024,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Adiciona alerta
   */
  addAlert(type, data) {
    // Evitar alertas duplicadas em 5 minutos
    const recentAlerts = this.alerts.filter(alert => 
      alert.type === type && 
      alert.key === data.key && 
      (Date.now() - alert.timestamp < 5 * 60 * 1000)
    );
    
    if (recentAlerts.length === 0) {
      this.alerts.push({
        type,
        ...data,
        id: Date.now()
      });
      
      // Manter apenas últimos 50 alertas
      if (this.alerts.length > 50) {
        this.alerts.shift();
      }
    }
  }

  /**
   * Obtém relatório completo
   */
  getReport() {
    this.updateSystemMetrics();
    
    const report = {
      timestamp: Date.now(),
      system: this.metrics.system,
      executions: {},
      errors: {},
      performance: {},
      alerts: this.alerts.slice(-10), // Últimos 10 alertas
      summary: this.generateSummary()
    };
    
    // Formatar execuções
    for (const [key, data] of this.metrics.executions) {
      const errorRate = data.total > 0 ? (data.failed / data.total) * 100 : 0;
      report.executions[key] = {
        ...data,
        errorRate: errorRate.toFixed(2) + '%',
        successRate: ((data.successful / data.total) * 100).toFixed(2) + '%'
      };
    }
    
    // Formatar erros
    for (const [key, data] of this.metrics.errors) {
      report.errors[key] = {
        ...data,
        types: Object.fromEntries(data.types)
      };
    }
    
    // Formatar performance
    for (const [key, data] of this.metrics.performance) {
      report.performance[key] = {
        avgMemoryUsage: data.memoryUsage.length > 0 
          ? data.memoryUsage.reduce((a, b) => a + b, 0) / data.memoryUsage.length 
          : 0,
        avgCpuUsage: data.cpuUsage.length > 0 
          ? data.cpuUsage.reduce((a, b) => a + b, 0) / data.cpuUsage.length 
          : 0,
        avgResponseTime: data.responseTime.length > 0 
          ? data.responseTime.reduce((a, b) => a + b, 0) / data.responseTime.length 
          : 0,
        samples: data.memoryUsage.length
      };
    }
    
    return report;
  }

  /**
   * Gera resumo das métricas
   */
  generateSummary() {
    let totalExecutions = 0;
    let totalSuccessful = 0;
    let totalFailed = 0;
    let avgResponseTime = 0;
    
    for (const data of this.metrics.executions.values()) {
      totalExecutions += data.total;
      totalSuccessful += data.successful;
      totalFailed += data.failed;
      avgResponseTime += data.avgDuration;
    }
    
    const overallSuccessRate = totalExecutions > 0 
      ? (totalSuccessful / totalExecutions) * 100 
      : 0;
    
    const overallAvgResponseTime = this.metrics.executions.size > 0 
      ? avgResponseTime / this.metrics.executions.size 
      : 0;
    
    return {
      totalExecutions,
      totalSuccessful,
      totalFailed,
      overallSuccessRate: overallSuccessRate.toFixed(2) + '%',
      overallAvgResponseTime: Math.round(overallAvgResponseTime) + 'ms',
      activeAlerts: this.alerts.length,
      uptime: this.formatUptime(this.metrics.system.uptime)
    };
  }

  /**
   * Formata uptime
   */
  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else {
      return `${minutes}m ${seconds % 60}s`;
    }
  }

  /**
   * Limpa métricas antigas
   */
  cleanup() {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 horas
    
    // Limpar alertas antigos
    this.alerts = this.alerts.filter(alert => alert.timestamp > cutoff);
    
    // Limpar métricas de performance antigas
    for (const data of this.metrics.performance.values()) {
      const validIndexes = data.timestamp.map((time, index) => 
        time > cutoff ? index : -1
      ).filter(index => index >= 0);
      
      if (validIndexes.length < data.timestamp.length) {
        // Manter apenas dados recentes
        const keepCount = validIndexes.length;
        data.memoryUsage = data.memoryUsage.slice(-keepCount);
        data.cpuUsage = data.cpuUsage.slice(-keepCount);
        data.responseTime = data.responseTime.slice(-keepCount);
        data.timestamp = data.timestamp.slice(-keepCount);
      }
    }
  }
}

module.exports = MetricsCollector;
