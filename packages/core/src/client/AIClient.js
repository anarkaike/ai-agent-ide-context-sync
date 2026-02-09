/**
 * Unified AI Client - Core Intelligence Interface
 * 
 * Provides a unified interface for LLM interactions with:
 * - Context-aware tone management
 * - Security sandbox integration
 * - Resilient error handling
 * - Performance monitoring
 */

import { execFile, exec } from 'child_process';
import { promisify } from 'util';
import crypto from 'crypto';

const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);

export class AIClient {
  constructor(toneManager, securitySandbox, options = {}) {
    this.toneManager = toneManager;
    this.security = securitySandbox;
    this.options = {
      timeout: 30000,
      maxRetries: 3,
      enableCaching: true,
      enableMetrics: true,
      ...options
    };
    
    // Performance metrics
    this.metrics = {
      requestCount: 0,
      totalLatency: 0,
      errorCount: 0,
      cacheHits: 0
    };
    
    // Request cache
    this.cache = new Map();
    this.cacheMaxSize = 1000;
  }

  /**
   * Initialize the client
   */
  async initialize() {
    if (!this.toneManager) {
      throw new Error('ToneManager is required');
    }
    
    if (!this.security) {
      throw new Error('SecuritySandbox is required');
    }

    await this.toneManager.initialize();
    await this.security.initialize();
    
    // Auto-adapt tone based on project context
    await this.toneManager.autoAdapt();
  }

  /**
   * Execute a completion request with full security and tone management
   * @param {string} prompt - The prompt to process
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response with content and metadata
   */
  async complete(prompt, options = {}) {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();
    
    try {
      // Validate and sanitize input
      const sanitizedPrompt = await this.security.sanitizeInput(prompt);
      
      // Get tone configuration
      const context = options.context || 'default';
      const toneConfig = this.toneManager.getToneParameters(context);
      
      // Merge with request options
      const config = {
        ...toneConfig,
        ...options,
        temperature: options.temperature ?? toneConfig.temperature,
        max_tokens: options.maxTokens ?? toneConfig.max_tokens,
        model: options.model ?? toneConfig.model_hint,
        system_instruction: options.systemInstruction ?? toneConfig.instruction
      };

      // Check cache first
      if (this.options.enableCaching) {
        const cacheKey = this.generateCacheKey(sanitizedPrompt, config);
        const cached = this.cache.get(cacheKey);
        if (cached) {
          this.metrics.cacheHits++;
          return cached;
        }
      }

      // Execute request with retry logic
      const response = await this.executeWithRetry(sanitizedPrompt, config);
      
      // Sanitize output
      const sanitizedResponse = await this.security.sanitizeOutput(response);
      
      // Cache response
      if (this.options.enableCaching) {
        this.cacheResponse(cacheKey, sanitizedResponse);
      }
      
      // Update metrics
      this.updateMetrics(startTime);
      
      return {
        ...sanitizedResponse,
        requestId,
        tone_used: toneConfig.tone,
        latency: Date.now() - startTime,
        cached: false
      };

    } catch (error) {
      this.metrics.errorCount++;
      throw this.enhanceError(error, requestId);
    }
  }

  /**
   * Execute CLI command with security validation
   * @param {string[]} args - Command arguments
   * @returns {Promise<string>} Command output
   */
  async executeCLI(args) {
    const startTime = Date.now();
    
    try {
      // Validate command arguments
      await this.security.validateCommand(args);
      
      // Execute command
      const result = await this.executeCommand(args);
      
      // Sanitize output
      const sanitized = await this.security.sanitizeOutput(result);
      
      return sanitized.stdout || sanitized;

    } catch (error) {
      throw new Error(`CLI execution failed: ${error.message}`);
    }
  }

  /**
   * Generate intelligent prompt based on goal
   * @param {string} goal - User goal
   * @param {Object} options - Generation options
   * @returns {Promise<string>} Generated prompt
   */
  async generatePrompt(goal, options = {}) {
    if (!goal || typeof goal !== 'string') {
      throw new Error('Goal is required and must be a string');
    }

    // Sanitize goal
    const sanitizedGoal = await this.security.sanitizeInput(goal);
    
    // Build prompt generation request
    const promptTemplate = `Generate a structured, intelligent prompt for the following goal:
Goal: ${sanitizedGoal}

Requirements:
- Be specific and actionable
- Include relevant context
- Suggest appropriate tools or approaches
- Consider security best practices
- Adapt tone to the goal type

Output only the generated prompt, no explanations.`;

    const response = await this.complete(promptTemplate, {
      context: 'prompt_generation',
      temperature: 0.3, // Lower temperature for consistency
      max_tokens: 1024
    });

    return response.content;
  }

  /**
   * Execute command with security validation
   * @param {string[]} args - Command arguments
   * @returns {Promise<Object>} Execution result
   */
  async executeCommand(args) {
    // Detect if we should use local CLI or global
    const cliPath = this.detectCLILocation();
    const useLocal = cliPath && await this.security.validatePath(cliPath);
    
    const command = useLocal ? 'node' : 'ai-doc';
    const commandArgs = useLocal ? [cliPath, ...args] : args;

    // Execute with timeout
    const result = await execFileAsync(command, commandArgs, {
      timeout: this.options.timeout,
      cwd: process.cwd()
    });

    return {
      stdout: result.stdout,
      stderr: result.stderr,
      command: `${command} ${commandArgs.join(' ')}`
    };
  }

  /**
   * Detect CLI location (local vs global)
   * @returns {string|null} Path to local CLI or null
   */
  detectCLILocation() {
    const possiblePaths = [
      './packages/cli/cli/ai-doc.js',
      '../cli/cli/ai-doc.js',
      '../../cli/cli/ai-doc.js'
    ];

    for (const path of possiblePaths) {
      try {
        const resolvedPath = require.resolve(path);
        return resolvedPath;
      } catch {
        // Continue searching
      }
    }

    return null;
  }

  /**
   * Execute request with retry logic
   * @param {string} prompt - Sanitized prompt
   * @param {Object} config - Request configuration
   * @returns {Promise<Object>} Response
   */
  async executeWithRetry(prompt, config) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.options.maxRetries; attempt++) {
      try {
        // Simulate LLM API call (replace with actual implementation)
        const response = await this.simulateLLMRequest(prompt, config);
        return response;
        
      } catch (error) {
        lastError = error;
        
        if (attempt === this.options.maxRetries) {
          throw error;
        }
        
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  /**
   * Simulate LLM request (replace with actual API integration)
   * @param {string} prompt - Input prompt
   * @param {Object} config - Configuration
   * @returns {Promise<Object>} Simulated response
   */
  async simulateLLMRequest(prompt, config) {
    // This is a mock implementation
    // In production, integrate with OpenAI, Anthropic, or other LLM providers
    
    const response = `[Response generated with temperature=${config.temperature}, model=${config.model}]\n\nProcessed prompt: ${prompt.substring(0, 100)}...`;
    
    return {
      content: response,
      usage: {
        prompt_tokens: Math.ceil(prompt.length / 4),
        completion_tokens: Math.ceil(response.length / 4),
        total_tokens: Math.ceil((prompt.length + response.length) / 4)
      },
      model: config.model,
      config_used: config
    };
  }

  /**
   * Generate cache key for request
   * @param {string} prompt - Input prompt
   * @param {Object} config - Configuration
   * @returns {string} Cache key
   */
  generateCacheKey(prompt, config) {
    const keyData = {
      prompt: prompt.substring(0, 500), // Truncate for efficiency
      temperature: config.temperature,
      max_tokens: config.max_tokens,
      model: config.model
    };
    
    return crypto.createHash('sha256')
      .update(JSON.stringify(keyData))
      .digest('hex');
  }

  /**
   * Cache response if within size limits
   * @param {string} key - Cache key
   * @param {Object} response - Response to cache
   */
  cacheResponse(key, response) {
    if (this.cache.size >= this.cacheMaxSize) {
      // Remove oldest entry (simple FIFO)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, response);
  }

  /**
   * Update performance metrics
   * @param {number} startTime - Request start time
   */
  updateMetrics(startTime) {
    if (!this.options.enableMetrics) return;
    
    this.metrics.requestCount++;
    this.metrics.totalLatency += Date.now() - startTime;
  }

  /**
   * Get performance metrics
   * @returns {Object} Current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      averageLatency: this.metrics.requestCount > 0 
        ? this.metrics.totalLatency / this.metrics.requestCount 
        : 0,
      cacheHitRate: this.metrics.requestCount > 0 
        ? this.metrics.cacheHits / this.metrics.requestCount 
        : 0
    };
  }

  /**
   * Enhance error with additional context
   * @param {Error} error - Original error
   * @param {string} requestId - Request ID
   * @returns {Error} Enhanced error
   */
  enhanceError(error, requestId) {
    const enhanced = new Error(error.message);
    enhanced.name = error.name;
    enhanced.requestId = requestId;
    enhanced.timestamp = new Date().toISOString();
    enhanced.originalError = error;
    return enhanced;
  }

  /**
   * Clear cache and reset metrics
   */
  reset() {
    this.cache.clear();
    this.metrics = {
      requestCount: 0,
      totalLatency: 0,
      errorCount: 0,
      cacheHits: 0
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    this.cache.clear();
    
    if (this.toneManager) {
      await this.toneManager.cleanup();
    }
    
    if (this.security) {
      await this.security.cleanup();
    }
  }
}