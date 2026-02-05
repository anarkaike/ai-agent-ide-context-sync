# Release Notes v2.0.32 - The Sovereign Agent Era

## 🚀 Major Features

### 1. Sovereign Agent & Desktop UI
- **New Electron App**: A standalone chat interface (`packages/desktop-ui`) that runs on macOS, Windows, and Linux.
- **Realtime Visibility**: Monitors the agent's evolution and all registered projects in realtime.
- **Cross-Project Dashboard**: View all "watched" projects from a single interface.

### 2. Cross-Project Visibility
- **Global Registry**: Projects are now tracked in `~/.ai-doc/registry.json`.
- **Auto-Registration**: The VS Code extension automatically registers the active workspace.
- **CLI Command**: New `ai-doc project register <path>` and `ai-doc project list` commands.

### 3. "Clone & Chat" Onboarding
- **Zero Friction**: Cloning the repository and opening it in VS Code now triggers an immediate "Hello" from the agent.
- **Setup Flag**: Uses `~/.ai-doc/setup_complete` to track onboarding status.

### 4. Security & Trust
- **SBT Integration**: Foundation for "Soul Bound Tokens" to represent agent skills (e.g., "Mestre em Python").
- **Swarm Protocol**: Infrastructure for Agent-to-Agent task delegation (A -> B).
- **Security Interception**: Low-friction approval flows for sensitive actions.

## 📦 Version Updates
- **Extension**: v2.0.32
- **CLI**: v2.0.7
- **Desktop UI**: v1.0.0

## 🛠️ Build & Publish
- **NPM**: Ready for `@ai-doc/cli` publish.
- **VS Marketplace**: Ready for `ai-agent-ide-context-sync` extension publish.
- **Open VSX**: Compatible with Open VSX registry.

## 📝 Usage
1. **Install CLI**: `npm link packages/cli`
2. **Run Desktop UI**: `cd packages/desktop-ui && npm start`
3. **Register Projects**: `ai-doc project register /path/to/project`
