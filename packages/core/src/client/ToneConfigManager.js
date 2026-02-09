/**
 * Tone Configuration Manager
 * 
 * Manages agent tone/personality configuration with context awareness
 * and automatic adaptation based on project and user preferences.
 */

import fs from 'fs-extra';
import path from 'path';
import os from 'os';

export class ToneConfigManager {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.tonePath = path.join(os.homedir(), '.ai-workspace', 'live-state', 'ui-tone.json');
    this.config = null;
    this.watchers = [];
  }

  /**
   * Initialize tone manager
   */
  async initialize() {
    await this.loadToneConfig();
    this.setupWatcher();
  }

  /**
   * Load tone configuration from file system
   */
  async loadToneConfig() {
    try {
      if (await fs.pathExists(this.tonePath)) {
        const data = await fs.readJson(this.tonePath);
        this.config = this.normalizeConfig(data);
      } else {
        this.config = this.getDefaultConfig();
        await this.saveToneConfig();
      }
    } catch (error) {
      console.warn('[ToneConfigManager] Failed to load config, using defaults:', error.message);
      this.config = this.getDefaultConfig();
    }
  }

  /**
   * Get current tone configuration
   * @returns {Object} Current tone config
   */
  getConfig() {
    return this.config || this.getDefaultConfig();
  }

  /**
   * Set tone configuration
   * @param {Object} newConfig - New tone configuration
   */
  async setConfig(newConfig) {
    this.config = this.normalizeConfig(newConfig);
    await this.saveToneConfig();
    this.notifyWatchers();
  }

  /**
   * Get tone-specific parameters for LLM requests
   * @param {string} context - Context for tone adaptation
   * @returns {Object} Tone parameters
   */
  getToneParameters(context = 'default') {
    const config = this.getConfig();
    const baseParams = {
      temperature: config.temperature,
      max_tokens: config.max_tokens,
      model_hint: config.model_hint,
      instruction: config.instruction,
      min_chars: config.min_chars || 0
    };

    // Context-specific adaptations
    switch (context) {
      case 'debugging':
        return {
          ...baseParams,
          temperature: Math.max(0.1, config.temperature - 0.2),
          instruction: `${config.instruction}\n\nFocus on precision and step-by-step analysis.`
        };
      
      case 'creative':
        return {
          ...baseParams,
          temperature: Math.min(1.0, config.temperature + 0.2),
          max_tokens: Math.min(4096, config.max_tokens + 512)
        };
      
      case 'urgent':
        return {
          ...baseParams,
          temperature: Math.max(0.1, config.temperature - 0.3),
          max_tokens: Math.min(1024, config.max_tokens),
          instruction: `${config.instruction}\n\nBe concise and action-oriented.`
        };
      
      default:
        return baseParams;
    }
  }

  /**
   * Normalize configuration object
   * @param {Object} config - Raw config
   * @returns {Object} Normalized config
   */
  normalizeConfig(config) {
    const defaults = this.getDefaultConfig();
    
    return {
      tone: config.tone || defaults.tone,
      temperature: Math.max(0.1, Math.min(1.0, config.temperature || defaults.temperature)),
      max_tokens: Math.max(256, Math.min(4096, config.max_tokens || defaults.max_tokens)),
      model_hint: config.model_hint || defaults.model_hint,
      instruction: config.instruction || defaults.instruction,
      min_chars: config.min_chars || defaults.min_chars,
      // Extended tone properties
      formality: config.formality || defaults.formality,
      verbosity: config.verbosity || defaults.verbosity,
      creativity: config.creativity || defaults.creativity,
      // Context awareness
      context_sensitive: config.context_sensitive !== false,
      auto_adapt: config.auto_adapt !== false
    };
  }

  /**
   * Get default tone configuration
   * @returns {Object} Default config
   */
  getDefaultConfig() {
    return {
      tone: 'neutral',
      temperature: 0.7,
      max_tokens: 2048,
      model_hint: 'gpt-4o',
      instruction: 'You are a helpful AI assistant specialized in software development and problem-solving.',
      min_chars: 0,
      formality: 'professional',
      verbosity: 'balanced',
      creativity: 'moderate',
      context_sensitive: true,
      auto_adapt: true
    };
  }

  /**
   * Save tone configuration to file
   */
  async saveToneConfig() {
    try {
      await fs.ensureDir(path.dirname(this.tonePath));
      await fs.writeJson(this.tonePath, this.config, { spaces: 2 });
    } catch (error) {
      console.error('[ToneConfigManager] Failed to save config:', error);
    }
  }

  /**
   * Setup file watcher for automatic updates
   */
  setupWatcher() {
    if (typeof fs.watch !== 'function') return;

    try {
      const watcher = fs.watch(this.tonePath, async (eventType) => {
        if (eventType === 'change') {
          await this.loadToneConfig();
          this.notifyWatchers();
        }
      });
      
      this.watchers.push(watcher);
    } catch (error) {
      console.warn('[ToneConfigManager] Failed to setup watcher:', error.message);
    }
  }

  /**
   * Notify all watchers of config changes
   */
  notifyWatchers() {
    // Implementation for notifying dependent components
    // This would be used by AIClient and other components
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    this.watchers.forEach(watcher => {
      try {
        watcher.close();
      } catch (error) {
        // Ignore cleanup errors
      }
    });
    this.watchers = [];
  }

  /**
   * Detect project context and suggest tone adaptation
   * @returns {Object} Suggested tone modifications
   */
  detectProjectContext() {
    const suggestions = {};

    // Check for project type indicators
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    const composerJsonPath = path.join(this.projectRoot, 'composer.json');
    const cargoTomlPath = path.join(this.projectRoot, 'Cargo.toml');

    try {
      if (fs.existsSync(packageJsonPath)) {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        if (pkg.dependencies?.react || pkg.dependencies?.vue) {
          suggestions.tone = 'creative';
          suggestions.creativity = 'high';
        }
        if (pkg.dependencies?.express || pkg.dependencies?.fastify) {
          suggestions.tone = 'focused';
          suggestions.formality = 'technical';
        }
      }

      if (fs.existsSync(composerJsonPath)) {
        suggestions.tone = 'focused';
        suggestions.formality = 'professional';
        suggestions.verbosity = 'concise';
      }

      if (fs.existsSync(cargoTomlPath)) {
        suggestions.tone = 'precise';
        suggestions.formality = 'technical';
        suggestions.creativity = 'low';
      }
    } catch (error) {
      // Ignore detection errors
    }

    return suggestions;
  }

  /**
   * Auto-adapt tone based on project context
   */
  async autoAdapt() {
    if (!this.config?.auto_adapt) return;

    const suggestions = this.detectProjectContext();
    if (Object.keys(suggestions).length > 0) {
      const adaptedConfig = { ...this.config, ...suggestions };
      await this.setConfig(adaptedConfig);
    }
  }
}