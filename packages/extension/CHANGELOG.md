# Changelog

All notable changes to the "AI Agent IDE Context Sync" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

- **1.5.0** - Persona Customization
- **1.4.0** - Timer & Export
- **1.3.0** - Icon Improvements
- **1.2.0** - Interactive Dashboard
- **1.1.0** - Quick Picker & Search
- **1.0.1** - UI Fixes
- **1.0.0** - Initial Release

---

## Upcoming Features

### v1.6.0 - Smart Notifications (Planned)
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

[1.5.0]: https://github.com/anarkaike/ai-agent-ide-context-sync/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/anarkaike/ai-agent-ide-context-sync/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/anarkaike/ai-agent-ide-context-sync/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/anarkaike/ai-agent-ide-context-sync/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/anarkaike/ai-agent-ide-context-sync/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/anarkaike/ai-agent-ide-context-sync/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/anarkaike/ai-agent-ide-context-sync/releases/tag/v1.0.0
