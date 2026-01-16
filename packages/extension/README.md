# AI Agent IDE Context Sync - VS Code Extension

Visual interface for managing universal AI agent context directly from VS Code.

## Features

- **Build Context**: One-click build of universal context for all AI agents
- **Status View**: See kernel version, heuristics count, and workspace info
- **Heuristics Explorer**: Browse learned patterns and optimizations

## Commands

- `AI Agent Sync: Build Context` - Compile and sync context to all IDEs
- `AI Agent Sync: Show Status` - Display current kernel and workspace status
- `AI Agent Sync: View Heuristics` - List all learned heuristics

## Requirements

Requires `ai-agent-ide-context-sync` CLI to be installed globally:

```bash
npm install -g ai-agent-ide-context-sync
```

## Extension Settings

This extension contributes the following settings:

* `ai-agent-sync.autoSync`: Enable/disable automatic context sync on file save

## Release Notes

### 0.1.0

Initial release with basic commands and status view.
