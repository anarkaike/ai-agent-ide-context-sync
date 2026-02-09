/**
 * Security Sandbox - Zero-Trust Execution Environment
 * 
 * Provides comprehensive security for AI agent operations:
 * - Input sanitization and validation
 * - Command execution sandboxing
 * - Cryptographic primitives
 * - Path validation and access control
 */

import crypto from 'crypto';
import fs from 'fs-extra';
import path from 'path';
import { execFile, exec } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);

export class SecuritySandbox {
  constructor(options = {}) {
    this.options = {
      enableEncryption: true,
      enableSigning: true,
      enableSandbox: true,
      allowedPaths: [
        process.cwd(),
        path.join(process.cwd(), '.ai-workspace'),
        path.join(process.cwd(), 'packages')
      ],
      blockedCommands: [
        'rm -rf',
        'sudo',
        'su',
        'chmod 777',
        'chown',
        'dd',
        'mkfs',
        'fdisk',
        'passwd',
        'curl.*|.*sh',
        'wget.*|.*sh',
        'eval',
        'exec'
      ],
      maxInputSize: 1024 * 1024, // 1MB
      maxOutputSize: 10 * 1024 * 1024, // 10MB
      ...options
    };

    this.encryptionKey = null;
    this.isInitialized = false;
    this.commandWhitelist = new Set([
      'node', 'npm', 'git', 'ls', 'cat', 'head', 'tail', 'grep',
      'find', 'mkdir', 'cp', 'mv', 'echo', 'pwd', 'whoami'
    ]);
  }

  /**
   * Initialize security sandbox
   */
  async initialize() {
    try {
      // Generate or load encryption key
      await this.initializeEncryption();
      
      // Validate allowed paths
      await this.validateAllowedPaths();
      
      this.isInitialized = true;
      console.log('[SecuritySandbox] Initialized successfully');
      
    } catch (error) {
      console.error('[SecuritySandbox] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize encryption system
   */
  async initializeEncryption() {
    if (!this.options.enableEncryption) return;

    const keyPath = path.join(process.cwd(), '.ai-workspace', '.security-key');
    
    try {
      if (await fs.pathExists(keyPath)) {
        const keyData = await fs.readFile(keyPath);
        this.encryptionKey = keyData;
      } else {
        // Generate new key
        this.encryptionKey = crypto.randomBytes(32);
        await fs.ensureDir(path.dirname(keyPath));
        await fs.writeFile(keyPath, this.encryptionKey, { mode: 0o600 });
      }
    } catch (error) {
      console.error('[SecuritySandbox] Failed to initialize encryption:', error);
      throw error;
    }
  }

  /**
   * Sanitize and validate input
   * @param {string} input - Raw input
   * @returns {Promise<string>} Sanitized input
   */
  async sanitizeInput(input) {
    if (!this.isInitialized) {
      throw new Error('SecuritySandbox not initialized');
    }

    if (typeof input !== 'string') {
      throw new Error('Input must be a string');
    }

    // Size validation
    if (Buffer.byteLength(input, 'utf8') > this.options.maxInputSize) {
      throw new Error('Input size exceeds maximum allowed');
    }

    // Remove dangerous characters and patterns
    let sanitized = input
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
      .replace(/\\x[0-9a-fA-F]{2}/g, '') // Remove hex escape sequences
      .trim();

    // Check for blocked patterns
    for (const pattern of this.options.blockedCommands) {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(sanitized)) {
        throw new Error(`Input contains blocked pattern: ${pattern}`);
      }
    }

    return sanitized;
  }

  /**
   * Sanitize and validate output
   * @param {string|Object} output - Raw output
   * @returns {Promise<string|Object>} Sanitized output
   */
  async sanitizeOutput(output) {
    if (!this.isInitialized) {
      throw new Error('SecuritySandbox not initialized');
    }

    // Handle different output types
    let processedOutput;
    if (typeof output === 'string') {
      processedOutput = output;
    } else if (typeof output === 'object' && output !== null) {
      // For objects, sanitize string values recursively
      processedOutput = await this.sanitizeObject(output);
    } else {
      processedOutput = String(output);
    }

    // Size validation
    if (Buffer.byteLength(processedOutput, 'utf8') > this.options.maxOutputSize) {
      throw new Error('Output size exceeds maximum allowed');
    }

    // Remove potential sensitive information
    processedOutput = this.removeSensitiveInfo(processedOutput);

    return processedOutput;
  }

  /**
   * Validate command arguments for execution
   * @param {string[]} args - Command arguments
   * @returns {Promise<boolean>} Validation result
   */
  async validateCommand(args) {
    if (!Array.isArray(args) || args.length === 0) {
      throw new Error('Command arguments must be a non-empty array');
    }

    const [command, ...commandArgs] = args;

    // Check if command is whitelisted
    if (!this.commandWhitelist.has(command)) {
      throw new Error(`Command not whitelisted: ${command}`);
    }

    // Validate each argument
    for (const arg of commandArgs) {
      const sanitizedArg = await this.sanitizeInput(arg);
      
      // Check for path traversal attempts
      if (arg.includes('..') || arg.includes('~')) {
        throw new Error('Path traversal detected in command arguments');
      }

      // Check for injection attempts
      if (arg.includes('|') || arg.includes('&') || arg.includes(';')) {
        throw new Error('Command injection detected');
      }
    }

    return true;
  }

  /**
   * Validate file path access
   * @param {string} filePath - File path to validate
   * @returns {Promise<boolean>} Validation result
   */
  async validatePath(filePath) {
    if (!filePath || typeof filePath !== 'string') {
      throw new Error('Invalid file path');
    }

    // Resolve to absolute path
    const absolutePath = path.resolve(filePath);

    // Check if path is within allowed directories
    for (const allowedPath of this.options.allowedPaths) {
      const resolvedAllowed = path.resolve(allowedPath);
      if (absolutePath.startsWith(resolvedAllowed)) {
        return true;
      }
    }

    throw new Error(`Path not in allowed directories: ${filePath}`);
  }

  /**
   * Encrypt sensitive data
   * @param {string} data - Data to encrypt
   * @returns {Promise<string>} Encrypted data
   */
  async encrypt(data) {
    if (!this.options.enableEncryption || !this.encryptionKey) {
      return data;
    }

    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('[SecuritySandbox] Encryption failed:', error);
      throw error;
    }
  }

  /**
   * Decrypt sensitive data
   * @param {string} encryptedData - Data to decrypt
   * @returns {Promise<string>} Decrypted data
   */
  async decrypt(encryptedData) {
    if (!this.options.enableEncryption || !this.encryptionKey) {
      return encryptedData;
    }

    try {
      const parts = encryptedData.split(':');
      if (parts.length !== 2) {
        throw new Error('Invalid encrypted data format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      
      const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('[SecuritySandbox] Decryption failed:', error);
      throw error;
    }
  }

  /**
   * Sign data for integrity verification
   * @param {string} data - Data to sign
   * @returns {Promise<string>} Digital signature
   */
  async sign(data) {
    if (!this.options.enableSigning || !this.encryptionKey) {
      return data;
    }

    try {
      const signature = crypto.createHmac('sha256', this.encryptionKey)
        .update(data)
        .digest('hex');
      
      return data + '.' + signature;
    } catch (error) {
      console.error('[SecuritySandbox] Signing failed:', error);
      throw error;
    }
  }

  /**
   * Verify data signature
   * @param {string} signedData - Signed data
   * @returns {Promise<boolean>} Verification result
   */
  async verify(signedData) {
    if (!this.options.enableSigning || !this.encryptionKey) {
      return true;
    }

    try {
      const parts = signedData.split('.');
      if (parts.length !== 2) {
        return false;
      }

      const [data, signature] = parts;
      const expectedSignature = crypto.createHmac('sha256', this.encryptionKey)
        .update(data)
        .digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      console.error('[SecuritySandbox] Verification failed:', error);
      return false;
    }
  }

  /**
   * Execute command in sandbox
   * @param {string[]} args - Command arguments
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Execution result
   */
  async executeInSandbox(args, options = {}) {
    if (!this.options.enableSandbox) {
      throw new Error('Sandbox execution is disabled');
    }

    await this.validateCommand(args);

    const [command, ...commandArgs] = args;
    
    try {
      // Execute with restricted permissions
      const result = await execFileAsync(command, commandArgs, {
        timeout: options.timeout || 30000,
        maxBuffer: this.options.maxOutputSize,
        cwd: process.cwd(),
        env: {
          ...process.env,
          // Remove potentially dangerous environment variables
          PATH: '/usr/local/bin:/usr/bin:/bin',
          NODE_ENV: undefined
        }
      });

      return {
        success: true,
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: 0
      };

    } catch (error) {
      return {
        success: false,
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
        exitCode: error.code || 1
      };
    }
  }

  /**
   * Sanitize object recursively
   * @param {Object} obj - Object to sanitize
   * @returns {Promise<Object>} Sanitized object
   */
  async sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    const sanitized = Array.isArray(obj) ? [] : {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = await this.sanitizeInput(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = await this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Remove sensitive information from text
   * @param {string} text - Text to clean
   * @returns {string} Cleaned text
   */
  removeSensitiveInfo(text) {
    if (typeof text !== 'string') {
      return text;
    }

    // Patterns for sensitive information
    const sensitivePatterns = [
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
      /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, // Credit card
      /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, // IP addresses
      /password[:\s=]+[^\s\n]+/gi, // Passwords
      /token[:\s=]+[^\s\n]+/gi, // Tokens
      /key[:\s=]+[^\s\n]+/gi, // Keys
      /secret[:\s=]+[^\s\n]+/gi // Secrets
    ];

    let cleaned = text;
    
    for (const pattern of sensitivePatterns) {
      cleaned = cleaned.replace(pattern, '[REDACTED]');
    }

    return cleaned;
  }

  /**
   * Validate allowed paths exist and are accessible
   */
  async validateAllowedPaths() {
    for (const allowedPath of this.options.allowedPaths) {
      try {
        const resolvedPath = path.resolve(allowedPath);
        await fs.access(resolvedPath, fs.constants.R_OK | fs.constants.W_OK);
      } catch (error) {
        console.warn(`[SecuritySandbox] Allowed path not accessible: ${allowedPath}`);
      }
    }
  }

  /**
   * Generate security report
   * @returns {Object} Security status report
   */
  getSecurityReport() {
    return {
      initialized: this.isInitialized,
      encryptionEnabled: this.options.enableEncryption,
      signingEnabled: this.options.enableSigning,
      sandboxEnabled: this.options.enableSandbox,
      allowedPathsCount: this.options.allowedPaths.length,
      whitelistedCommandsCount: this.commandWhitelist.size,
      maxInputSize: this.options.maxInputSize,
      maxOutputSize: this.options.maxOutputSize,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Cleanup security resources
   */
  async cleanup() {
    // Clear encryption key from memory
    if (this.encryptionKey) {
      this.encryptionKey.fill(0);
      this.encryptionKey = null;
    }

    this.isInitialized = false;
    console.log('[SecuritySandbox] Cleaned up successfully');
  }
}