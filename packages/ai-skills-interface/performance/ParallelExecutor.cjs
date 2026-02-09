/**
 * Executor Paralelo de Skills
 * Otimiza performance com execução concorrente
 */

class ParallelExecutor {
  constructor(options = {}) {
    this.maxConcurrency = options.maxConcurrency || 5;
    this.timeout = options.timeout || 30000; // 30s
    this.retryAttempts = options.retryAttempts || 3;
    this.metrics = {
      totalExecutions: 0,
      parallelExecutions: 0,
      timeouts: 0,
      retries: 0
    };
  }

  /**
   * Executa múltiplas skills em paralelo
   */
  async executeParallel(tasks) {
    this.metrics.totalExecutions += tasks.length;
    
    // Dividir em batches para controle de concorrência
    const batches = this.createBatches(tasks, this.maxConcurrency);
    const results = [];
    
    for (const batch of batches) {
      const batchResults = await Promise.allSettled(
        batch.map(task => this.executeTask(task))
      );
      
      results.push(...batchResults);
    }
    
    this.metrics.parallelExecutions += tasks.length;
    return results;
  }

  /**
   * Executa task individual com retry e timeout
   */
  async executeTask(task) {
    const { skill, action, params, id } = task;
    
    for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
      try {
        const result = await this.withTimeout(
          skill.execute({ action, ...params }),
          this.timeout
        );
        
        return {
          id,
          success: true,
          data: result,
          attempt: attempt + 1,
          executionTime: Date.now()
        };
      } catch (error) {
        if (attempt === this.retryAttempts - 1) {
          // Última tentativa falhou
          if (error.name === 'TimeoutError') {
            this.metrics.timeouts++;
          }
          
          return {
            id,
            success: false,
            error: error.message,
            attempt: attempt + 1,
            executionTime: Date.now()
          };
        } else {
          this.metrics.retries++;
          await this.delay(1000 * (attempt + 1)); // Exponential backoff
        }
      }
    }
  }

  /**
   * Executa com timeout
   */
  async withTimeout(promise, timeout) {
    return Promise.race([
      promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TimeoutError')), timeout)
      )
    ]);
  }

  /**
   * Cria batches para controle de concorrência
   */
  createBatches(items, batchSize) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Delay para retry
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obtém métricas do executor
   */
  getMetrics() {
    const avgRetries = this.metrics.totalExecutions > 0 
      ? this.metrics.retries / this.metrics.totalExecutions 
      : 0;
    
    const timeoutRate = this.metrics.totalExecutions > 0 
      ? (this.metrics.timeouts / this.metrics.totalExecutions) * 100 
      : 0;
    
    return {
      ...this.metrics,
      avgRetries: avgRetries.toFixed(2),
      timeoutRate: timeoutRate.toFixed(2) + '%',
      parallelEfficiency: this.metrics.totalExecutions > 0 
        ? ((this.metrics.parallelExecutions / this.metrics.totalExecutions) * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Limpa métricas
   */
  clearMetrics() {
    this.metrics = {
      totalExecutions: 0,
      parallelExecutions: 0,
      timeouts: 0,
      retries: 0
    };
  }
}

module.exports = ParallelExecutor;
