# @ai-agent/core

**Core Intelligence Layer for AI Agent Ecosystem**

The unified foundation that eliminates complexity and provides resilient, secure, and scalable AI agent operations.

## 🎯 Purpose

This package addresses the core architectural problems identified in the ecosystem analysis:

- **Eliminates AIClient duplication** between extension and CLI
- **Provides resilient rollback** with Write-Ahead Logging (WAL)
- **Implements security-first architecture** with sandbox and encryption
- **Manages intelligent memory** with NÚCLEUS and SBT integration
- **Enables agent mesh networking** foundation

## 🏗️ Architecture

```
@ai-agent/core/
├── src/
│   ├── client/          # Unified AI Client
│   │   ├── AIClient.js      # Main client with security & tone
│   │   └── ToneConfigManager.js  # Context-aware tone management
│   ├── memory/          # Memory & Transaction System
│   │   ├── MemoryManager.js    # NÚCLEUS & SBT management
│   │   └── WALManager.js       # Write-Ahead Logging for rollback
│   ├── security/        # Security Layer
│   │   └── SecuritySandbox.js  # Zero-trust execution environment
│   └── index.js         # Core initialization & exports
```

## 🚀 Features

### 🔒 Security-First
- **Input/Output Sanitization**: Prevents injection attacks
- **Command Sandboxing**: Whitelisted command execution
- **Encryption**: AES-256 for sensitive data
- **Digital Signatures**: HMAC-SHA256 for integrity
- **Path Validation**: Prevents directory traversal

### 💾 Resilient Memory
- **Write-Ahead Logging**: Atomic operations with rollback
- **Checkpoint System**: Automatic recovery points
- **NÚCLEUS Integration**: Consciousness management
- **SBT Management**: Soulbound Token creation and validation
- **Mycelium Network**: Distributed memory connections

### 🧠 Intelligent Client
- **Context-Aware Tone**: Automatic adaptation to project context
- **Performance Metrics**: Request tracking and optimization
- **Caching**: Intelligent response caching
- **Retry Logic**: Exponential backoff for resilience
- **CLI Integration**: Unified command execution

## 📦 Installation

```bash
# Install as dependency
npm install @ai-agent/core

# Development installation
npm install --workspace=@ai-agent/core
```

## 🔧 Quick Start

```javascript
import { initializeCore } from '@ai-agent/core';

// Initialize the core system
const core = await initializeCore({
  security: {
    enableSandbox: true,
    enableEncryption: true
  },
  memory: {
    enableWAL: true,
    checkpointInterval: 60000
  }
});

// Use the unified client
const response = await core.client.complete('Help me debug this issue', {
  context: 'debugging'
});

// Create resilient transactions
await core.wal.beginTransaction('file_operation');
await core.wal.addOperation('FILE_WRITE', { path: 'file.txt', content: 'data' });
await core.wal.commitTransaction();

// Manage memory
await core.memory.addMemory('INSIGHT', ' discovered new pattern', {
  type: 'technical',
  importance: 'high'
});

// Cleanup when done
await core.shutdown();
```

## 🎛️ Configuration

### Security Options
```javascript
security: {
  enableSandbox: true,      // Enable command sandboxing
  enableEncryption: true,   // Enable data encryption
  enableSigning: true,      // Enable digital signatures
  allowedPaths: [...],      // Allowed file paths
  maxInputSize: 1048576,    // Max input size (1MB)
  maxOutputSize: 10485760   // Max output size (10MB)
}
```

### Memory Options
```javascript
memory: {
  enableWAL: true,              // Enable write-ahead logging
  checkpointInterval: 60000,    // Checkpoint interval (ms)
  maxJournalSize: 1000,         // Max journal entries
  autoBackup: true,             // Enable automatic backups
  backupInterval: 300000        // Backup interval (ms)
}
```

### Client Options
```javascript
client: {
  timeout: 30000,           // Request timeout (ms)
  maxRetries: 3,            // Maximum retry attempts
  enableCaching: true,      // Enable response caching
  enableMetrics: true       // Enable performance metrics
}
```

## 🔍 API Reference

### Core Initialization

#### `initializeCore(options)`
Initialize the core system with all components.

**Parameters:**
- `options` (Object): Configuration options

**Returns:** Promise<Object> - Core components instance

### AIClient

#### `complete(prompt, options)`
Execute a completion request with security and tone management.

**Parameters:**
- `prompt` (string): Input prompt
- `options` (Object): Request options

**Returns:** Promise<Object> - Response with content and metadata

#### `executeCLI(args)`
Execute CLI command with security validation.

**Parameters:**
- `args` (string[]): Command arguments

**Returns:** Promise<string> - Command output

### WALManager

#### `beginTransaction(type, metadata)`
Begin a new transaction.

**Parameters:**
- `type` (string): Transaction type
- `metadata` (Object): Transaction metadata

**Returns:** Promise<string> - Transaction ID

#### `commitTransaction()`
Commit the current transaction.

**Returns:** Promise<Object> - Transaction result

#### `rollbackTransaction(reason)`
Rollback the current transaction.

**Parameters:**
- `reason` (string): Rollback reason

**Returns:** Promise<Object> - Rollback result

### MemoryManager

#### `addMemory(type, content, metadata)`
Add memory to NÚCLEUS.

**Parameters:**
- `type` (string): Memory type
- `content` (string): Memory content
- `metadata` (Object): Memory metadata

**Returns:** Promise<string> - Memory ID

#### `mintSBT(type, data)`
Create new Soulbound Token.

**Parameters:**
- `type` (string): SBT type
- `data` (Object): SBT data

**Returns:** Promise<string> - SBT ID

### SecuritySandbox

#### `sanitizeInput(input)`
Sanitize and validate input.

**Parameters:**
- `input` (string): Raw input

**Returns:** Promise<string> - Sanitized input

#### `executeInSandbox(args, options)`
Execute command in sandbox.

**Parameters:**
- `args` (string[]): Command arguments
- `options` (Object): Execution options

**Returns:** Promise<Object> - Execution result

## 🧪 Testing

```bash
# Run all tests
npm run core:test

# Run specific test file
node --test packages/core/src/client/AIClient.test.js

# Run with coverage
node --test --experimental-test-coverage packages/core/src/
```

## 📊 Metrics & Monitoring

The core system provides comprehensive metrics:

```javascript
// Get client metrics
const metrics = core.client.getMetrics();
console.log(`Average latency: ${metrics.averageLatency}ms`);
console.log(`Cache hit rate: ${metrics.cacheHitRate}`);

// Get memory statistics
const stats = core.memory.getStats();
console.log(`NÚCLEUS state: ${stats.nucleusState}`);
console.log(`SBT count: ${stats.sbtCount}`);

// Get WAL statistics
const walStats = core.wal.getStats();
console.log(`Journal size: ${walStats.journalSize}`);
```

## 🔐 Security Considerations

- **Zero-Trust Architecture**: All inputs are validated and sanitized
- **Principle of Least Privilege**: Minimal permissions for operations
- **Defense in Depth**: Multiple layers of security validation
- **Secure by Default**: Encryption and signing enabled by default
- **Audit Trail**: All operations logged in WAL for forensic analysis

## 🚨 Error Handling

The core system provides detailed error information:

```javascript
try {
  await core.client.complete(prompt);
} catch (error) {
  console.error('Request failed:', error.message);
  console.error('Request ID:', error.requestId);
  console.error('Timestamp:', error.timestamp);
  
  if (error.originalError) {
    console.error('Original error:', error.originalError);
  }
}
```

## 🔄 Migration Guide

### From Extension AIClient
```javascript
// Before
const client = new AIClient(projectRoot);
const response = await client.execute(args);

// After
import { initializeCore } from '@ai-agent/core';
const core = await initializeCore();
const response = await core.client.executeCLI(args);
```

### From CLI AIClient
```javascript
// Before
const client = new AIClient(projectRoot);
const result = await client.complete(prompt, options);

// After
import { initializeCore } from '@ai-agent/core';
const core = await initializeCore();
const result = await core.client.complete(prompt, options);
```

## 🤝 Contributing

1. Follow the security-first principles
2. Add comprehensive tests for new features
3. Update documentation for API changes
4. Ensure backward compatibility when possible

## 📄 License

MIT License - see LICENSE file for details

---

**Built with ❤️ for the AI Agent Ecosystem**