# Project Architecture & Technical Context
## 1. High-Level Overview
**Extension Name**: AI Agent IDE Context Sync
**Purpose**: To synchronize the AI Agent's context (tasks, personas, analytics, kernel status) with the IDE via VS Code Views and Tree Views.
**Core Mechanism**: Acts as a UI layer over the `ai-doc` CLI and the `.ai-workspace` file system structure.

## 2. Core Architecture Components

### 2.1 Entry Point (`extension.js`)
- **Activation**: Triggered by `onView:ai-agent-sync-*` events.
- **Responsibilities**:
  - Initializes `I18n` (Internationalization).
  - Instantiates Managers (`AIClient`, `RitualScheduler`, `KanbanManager`, `AdvancedAnalytics`).
  - Registers Tree Data Providers.
  - Sets up File System Watchers for `.ai-workspace`.
  - Registers Commands (e.g., `ai-agent-sync.refresh`, `ai-agent-sync.openTask`).

### 2.2 Tree Data Providers
The extension exposes 5 main views, each backed by a specific TreeDataProvider implementation:
1.  **Personas & Tasks** (`PersonasTreeProvider` -> `ai-agent-sync-personas`)
    -   Displays active/completed tasks and persona context.
2.  **Kernel Status** (`StatusTreeProvider` -> `ai-agent-sync-status`)
    -   Monitors system health, drift, and CLI availability.
3.  **Analytics** (`AnalyticsTreeProvider` -> `ai-agent-sync-analytics`)
    -   Visualizes project stats (productivity, task completion).
4.  **Pomodoro & Focus** (`PomodoroTreeProvider` -> `ai-agent-sync-timer`)
    -   Manages focus sessions.
5.  **Automation & AI** (`AutomationTreeProvider` -> `ai-agent-sync-automation`)
    -   Handles workflows and project-specific automations (Laravel/React detection).

### 2.3 Key Modules
-   **AIClient (`ai-client.js`)**: Wrapper around the `ai-doc` CLI. Handles local vs. global binary detection and command execution.
-   **RitualScheduler (`modules/RitualScheduler.js`)**: Runs hourly checks for kernel drift and system health.
-   **SmartNotifications**: Monitors stalled tasks and sends alerts.
-   **I18n**: Loads translations from `locales/` with fallback logic.
-   **AutomationModules**: Detects project type (e.g., checks `composer.json` for Laravel) to offer context-aware workflows.

## 3. Data Flow
1.  **File System -> UI**:
    -   A `vscode.FileSystemWatcher` monitors `.ai-workspace/**/*`.
    -   Changes trigger `provider.refresh()`.
    -   Providers read JSON/Markdown files from `.ai-workspace` and update the Tree View.
2.  **CLI -> Extension**:
    -   Extension calls `aiClient.execute('command')`.
    -   CLI returns JSON output.
    -   Extension processes data (e.g., for Analytics reports).

## 4. Current Investigation Context (Status: In Progress)
**Issue**: "No data provider registered" error appearing in VS Code views.
**Diagnosis Steps Taken**:
-   **Verified `package.json`**: Activation events (`onView:ai-agent-sync-*`) and View IDs match.
-   **Verified `extension.js`**: `activate()` function correctly instantiates and registers all 5 providers.
    ```javascript
    vscode.window.registerTreeDataProvider('ai-agent-sync-personas', personasProvider);
    // ... others registered similarly
    ```
-   **Verified Dependencies**: `AIClient`, `I18n`, and module imports are correct.

**Hypothesis**:
-   The error might be a race condition where the view is accessed before `activate()` completes.
-   Or `AIClient` failing silently during initialization could be aborting the activation flow early.

**Next Steps**:
-   Add debug logging to `extension.js` to trace the exact execution order of registration calls.
-   Verify `AIClient` initialization success/failure.
