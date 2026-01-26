# Changelog

All notable changes to the "AI Agent IDE Context Sync" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Other languages:
- Português (Brasil): [CHANGELOG.pt-BR.md](./CHANGELOG.pt-BR.md)

Related docs:
- Extension README (EN): [README.md](./README.md)
- Extension README (PT-BR): [README.pt-BR.md](./README.pt-BR.md)

## [2.0.31] - 2026-01-26
### Added
- 📸 **Context Snap**: New feature to capture current workspace state (files, git diff, errors) into a Markdown snapshot.
- 🗂️ **Context Tools Section**: Reorganized automation sidebar to include a dedicated section for context tools.

## [2.0.30] - 2026-01-26
### Added
- 🕵️ **Git Code Review**: New command to analyze staged changes for bugs, security issues, and best practices.

## [2.0.29] - 2026-01-26
### Added
- 🌿 **Git Context Automation**: New automation section for Git operations.
  - 📝 **Commit Message Generation**: Generates Conventional Commits from staged changes.
  - 🔀 **PR Description Generation**: Generates PR descriptions from branch diffs.

## [2.0.28] - 2026-01-26

### Added
- 📊 **Trend Analysis**: New "30-Day Trend" card in Web Dashboard showing productivity changes.
- 🩺 **Diagnostic Info**: New command `Copy Diagnostic Info` to help troubleshooting.
- ⚙️ **Status Dashboard Improvements**:
  - Displays Environment Info (Node, VS Code, OS).
  - Quick Actions buttons (Start Task, View Logs).
  - Better error handling for Kernel Status.

### Fixed
- **Web Dashboard**: Fixed crash when loading dashboard template.
- **Trend Calculation**: Fixed logic to return percentage difference instead of string.

## [2.0.24] - 2026-01-264
### Added
- **React Support**: Context-aware detection for React/Next.js projects.
- **React Workflows**: New automation actions to "Create Component" and "Create Hook".
- **Fix**: Fixed missing registration of Laravel and React automation commands.

## [2.0.23] - 2026-01-24

### Added
- 🤖 **Context Automation Module**: New dedicated sidebar section for running workflows and generating smart prompts.
- 🚀 **Laravel Boost Integration**: Auto-detects Laravel projects and offers specific automation workflows (Analyze, Create Layer, List Entities).
- 🧩 **Dynamic Workflow Parameters**: Intelligent UI prompts for workflow inputs instead of raw JSON editing.
- 🌐 **Context-Aware Workflows**: Workflows are now filtered based on the active project stack (e.g., Laravel commands only appear in Laravel projects).

### Changed
- 📝 Updated documentation and README with Automation module details.
- 🐛 Fixed workflow visibility issues in localized versions (PT-BR).

## [2.0.14] - 2026-01-23

### Added
- 🛠️ Dedicated "Maintenance & Context" section in sidebar (Scan Docs, Run Ritual, Evolve Rules)
- 🌐 Bilingual tooltips (EN/PT-BR) for all sidebar actions
- 🧪 Comprehensive unit test coverage for core logic modules

### Fixed
- 🐛 i18n support in RitualScheduler action buttons

## [2.0.13] - 2026-01-18

### Changed
- Updated kernel integration docs and stack playbooks for Node/TS/React/Vue

## [2.0.12] - 2026-01-17

### Changed
- New core icon design emphasizing sync, AI kernel and OS-like core

## [2.0.11] - 2026-01-17

### Added
- 📋 Interactive checklist subforms for persona list-like frontmatter (stack, goals, specialties)

### Changed
- More compact layout for small frontmatter fields in persona webview
- Improved grid layout for frontmatter fields to avoid full-width inputs

## [2.0.10] - 2026-01-17

### Added
- ✏️ Edição direta das seções markdown das personas via webview

### Changed
- Sincronização das seções `##` do corpo com o formulário da persona
- Melhor alinhamento entre frontmatter e conteúdo detalhado da persona

## [2.0.9] - 2026-01-17

### Added
- 🧩 Dynamic persona form webview com suporte completo ao frontmatter
- 📋 Task form webview com selects editáveis de status e persona
- 🗓️ Edição direta de deadline da task via webview
- 📚 Visualização das seções do markdown das tasks em cards read-only

### Changed
- Atualização do frontmatter de tasks e personas diretamente a partir dos formulários
- Melhor consistência entre frontmatter e conteúdo exibido nas webviews

### Fixed
- Formulário de persona não carregando todos os campos do template markdown
- Select de status da task desabilitado e persona exibida apenas como texto

## [2.0.8] - 2026-01-17

### Added
- 🧠 AI Kernel integration with the global `ai-doc` CLI
- 🗂️ AI Workspace-aware personas and tasks management
- 🧱 Kanban Board com colunas `todo`, `in-progress`, `review` e `done`
- 🔗 Drag & drop com persistência em frontmatter das tasks
- 📈 Kernel Status webview com resumo estruturado do `ai-doc status`
- 💡 Heurísticas Aprendidas webview conectado ao motor global de heurísticas
- 👁️ Ação inline de "View Full Details" para personas
- 🧾 Tooltips ricas para personas com descrição e progresso de checklist

### Changed
- Melhorias visuais no painel de Kernel Status
- Layout das heurísticas com contexto de tipo e stack
- Árvore de personas com ações inline (editar, excluir, customizar, visualizar)
- Melhor feedback de erros quando o workspace `.ai-workspace` não existe

### Fixed
- Kanban deixando de mostrar tasks após mudança de status
- Fallback de status inválido para `todo` ao ler tasks antigas
- Sincronização entre personas globais e workspace local

## [2.0.1] - 2026-01-16

### Fixed
- 🧩 Kanban command registration e comportamento em workspaces reais
- 📊 Itens de Analytics e Kernel Status clicáveis a partir da árvore lateral

### Changed
- Melhor integração entre Kanban, Analytics e Kernel Status

## [2.0.0] - 2026-01-16

### Added
- 🧱 **Kanban Board Avançado**
  - Webview dedicada `kanban.html`
  - Colunas `todo`, `in-progress`, `review` e `done`
  - Integração com `advanced-modules.js` para leitura de tasks
- 🌐 **Suporte a 12 idiomas**
  - Arquivos de locale em `packages/extension/locales/*.json`
  - Traduções para `ar`, `de`, `es`, `fi`, `fr`, `hi`, `it`, `ja`, `ko`, `zh-CN` e outros
- 🎨 **Themes**
  - Configuração de temas em `themes.json`
  - Paletas visuais para Kanban e dashboards
- 📊 **Analytics Avançado**
  - Métricas derivadas das tasks do Kanban
  - Base para relatórios semanais/mensais

### Changed
- Estrutura interna ajustada para suportar Kanban, temas e múltiplos idiomas

## [1.6.0] - 2026-01-16

### Added
- 🌐 **i18n básico**
  - Locales `en` e `pt-BR` para textos da extensão
  - Arquivos `locales/en.json` e `locales/pt-BR.json`
- 🔔 **Smart Notifications (fundação)**
  - Módulo central em `modules.js` para notificações inteligentes
  - Hooks para futura integração com tarefas e prazos
- 🧪 **Testing Suite**
  - Testes em `packages/extension/test/extension.test.js`
  - Runner em `packages/extension/test/runTest.js`

### Technical
- Atualização de `package.json` com scripts de teste
- Empacotamento da versão `ai-agent-ide-context-sync-vscode-1.6.0.vsix`

## [1.5.0] - 2026-01-16

### Added
- 🎨 **Persona Customization**: Visual interface for customizing personas
  - 16 predefined vibrant colors
  - Custom color picker for unlimited options
  - 24 emoji icons to choose from
  - Live preview of changes
  - Persistent settings in `.persona-settings.json`
- Context menu option to customize personas
- `customize-persona.html` webview for visual customization
- Settings helper command for loading persona configurations

### Changed
- Enhanced persona display with custom colors and icons (when configured)
- Improved visual feedback in customization interface

## [1.4.0] - 2026-01-16

### Added
- ⏱️ **Pomodoro Timer**: Integrated timer in status bar
  - 25-minute Pomodoro mode
  - 5-minute break mode
  - Custom duration support
  - Pause/Resume controls
  - Reset functionality
  - Live countdown in status bar
  - Completion notifications
- 📤 **Export Tasks**: Export functionality with multiple formats
  - Markdown format (grouped by persona)
  - JSON format (structured data)
  - Plain text format
  - Auto-open exported file
  - Includes checklist items and progress

### Changed
- Status bar now shows timer countdown when active
- Status bar command changed to `timerMenu` for better UX
- Enhanced StatusBarManager with timer state management

## [1.3.0] - 2026-01-16

### Fixed
- 🎨 **Sidebar Icon**: Improved icon design
  - Replaced simple circle with AI Brain icon
  - Added neural network connections
  - Purple gradient background (#667eea)
  - Better visibility in both light and dark themes

## [1.2.0] - 2026-01-16

### Added
- 📊 **Interactive Dashboard**: Real-time analytics with Chart.js
  - Doughnut chart showing task distribution by persona
  - Bar chart showing checklist completion progress
  - Persona progress list with visual progress bars
  - Global completion rate statistics
  - Auto-refresh every 5 seconds
  - Modern, responsive design matching VS Code theme

### Changed
- Enhanced analytics view with visual charts
- Improved data aggregation for dashboard

## [1.1.0] - 2026-01-16

### Added
- ⚡ **Quick Picker** (`Ctrl+Shift+T`): Fast task navigation
  - Fuzzy search across all tasks
  - Create new task option
  - Shows progress indicators
  - Updates status bar on selection
- 🔍 **Global Search** (`Ctrl+Shift+F`): Search in tasks and checklists
  - Search in task titles
  - Search in checklist items
  - Shows match count and location
  - Preview of matching lines
- 📊 **Status Bar Integration**: Active task display
  - Shows current task in status bar
  - Click to open Quick Picker
  - Tooltip with task details
  - Clear active task command

### Changed
- Improved keyboard-first workflow
- Enhanced search capabilities

## [1.0.1] - 2026-01-16

### Fixed
- ❌ Removed duplicate '+' icons from action items
- 📄 Fixed Kernel Status display
  - Removed ANSI color codes
  - Structured parsing of status output
  - Added proper icons for each status item
  - Improved readability

### Changed
- Cleaner UI with proper icon usage
- Better status information presentation

## [1.0.0] - 2026-01-16

### Added
- 👥 **Persona Management**: Complete CRUD operations
  - Create new AI agents
  - Edit persona files
  - Delete personas
  - View full details
- 📋 **Task Management**: Full task lifecycle
  - Create tasks with templates
  - Edit task files
  - Delete tasks
  - Archive completed tasks
  - Interactive checklist toggle
- 📊 **Analytics View**: Real-time statistics
  - Persona count
  - Active tasks count
  - Completed tasks count
  - Checklist completion rate
- ⚙️ **Kernel Status**: Live kernel monitoring
  - Version information
  - Heuristics count
  - Project information
  - Initialization status
- 🎨 **Modern UI**: Professional interface
  - Hierarchical tree view
  - Context menus
  - Icons and colors
  - Auto-refresh on file changes
- 🔨 **Build & Sync**: Context management
  - Build context command
  - Initialize workspace
  - Sync status monitoring

### Technical
- Tree data providers for Personas, Status, and Analytics
- File system watchers for auto-refresh
- Command palette integration
- Activity bar icon
- Three sidebar views

---

## Version History

- **2.0.10** - Persona markdown sections editing
- **2.0.9** - Persona & Task webviews with full frontmatter editing
- **2.0.8** - AI Kernel Integration, Kanban & Webviews
- **2.0.1** - Kanban fixes & clickable views
- **2.0.0** - Enterprise Edition (Kanban, 12 Languages, Themes & Advanced Analytics)
- **1.6.0** - i18n, Smart Notifications & Testing Suite
- **1.5.0** - Persona Customization
- **1.4.0** - Timer & Export
- **1.3.0** - Icon Improvements
- **1.2.0** - Interactive Dashboard
- **1.1.0** - Quick Picker & Search
- **1.0.1** - UI Fixes
- **1.0.0** - Initial Release

---

## Upcoming Features

### Smart Notifications Roadmap
- 🔔 Automatic reminders for stalled tasks
- 📅 Deadline alerts
- 🎉 Completion celebrations
- 📈 Productivity insights
- 📊 Weekly reports

### Future Enhancements
- 🔄 Sync with ClickUp/Jira
- 📱 Mobile-optimized views
- 🌐 Multi-language support
- 🎯 Task dependencies
- 📈 Advanced analytics

---

[2.0.1]: https://github.com/anarkaike/ai-agent-ide-context-sync/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/anarkaike/ai-agent-ide-context-sync/compare/v1.6.0...v2.0.0
[1.6.0]: https://github.com/anarkaike/ai-agent-ide-context-sync/compare/v1.5.0...v1.6.0
[2.0.9]: https://github.com/anarkaike/ai-agent-ide-context-sync/compare/v2.0.8...v2.0.9
[2.0.8]: https://github.com/anarkaike/ai-agent-ide-context-sync/compare/v2.0.1...v2.0.8
[1.5.0]: https://github.com/anarkaike/ai-agent-ide-context-sync/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/anarkaike/ai-agent-ide-context-sync/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/anarkaike/ai-agent-ide-context-sync/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/anarkaike/ai-agent-ide-context-sync/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/anarkaike/ai-agent-ide-context-sync/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/anarkaike/ai-agent-ide-context-sync/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/anarkaike/ai-agent-ide-context-sync/releases/tag/v1.0.0
