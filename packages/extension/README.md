# AI Agent IDE Context Sync - VS Code Extension

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.10-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![VS Code](https://img.shields.io/badge/VS%20Code-1.80.0+-purple.svg)

**Complete AI Kernel Management** directly from VS Code!

Manage your AI agents, tasks, and project context without leaving your editor.

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Changelog](#-changelog)

> 🇧🇷 Leia também em português: [README.pt-BR.md](./README.pt-BR.md)

</div>

---

## ✨ Features

### 👥 AI Agents & Tasks Management
- **Create/Edit/Delete Personas**: Manage your AI agents with a visual interface
- **Task Management**: Create, edit, archive, and delete tasks
- **Interactive Checklists**: Click to toggle checklist items as done/undone
- **Hierarchical View**: Personas → Tasks → Checklist Items
- **Quick Actions**: Context menus for common operations

### 🎨 Visual Customization
- **16 Predefined Colors**: Beautiful, vibrant color palette
- **Custom Color Picker**: Choose any color you want
- **24 Emoji Icons**: Robots, animals, symbols, and more
- **Live Preview**: See changes in real-time
- **Persistent Settings**: Saved per workspace

### ⏱️ Pomodoro Timer
- **25-Minute Pomodoro**: Focus mode with countdown
- **5-Minute Breaks**: Short break timer
- **Custom Duration**: Set your own time
- **Pause/Resume**: Full control over your timer
- **Status Bar Integration**: Live countdown display
- **Completion Notifications**: Get notified when time's up

### 📊 Analytics Dashboard
- **Real-time Statistics**: Track personas, tasks, and completion rates
- **Interactive Charts**: Doughnut and bar charts with Chart.js
- **Progress Monitoring**: See how many checklist items are completed
- **Archive Tracking**: Monitor completed tasks
- **Auto-refresh**: Updates every 5 seconds

### 🔍 Quick Navigation
- **Quick Picker** (`Ctrl+Shift+T`): Fast task navigation with fuzzy search
- **Global Search** (`Ctrl+Shift+F`): Search in tasks and checklist items
- **Status Bar**: Shows active task with click-to-switch functionality

### 📤 Export Tasks
- **Markdown Format**: Grouped by persona with checklists
- **JSON Format**: Structured data for processing
- **Plain Text**: Simple, readable format
- **Auto-open**: Opens exported file automatically

### ⚙️ Kernel Status
- **Live Status**: See kernel version and configuration
- **Quick Build**: One-click context building
- **Sync Status**: Monitor sync state across IDEs

---
#### 🌟 :)  SE GOSTOU, ME DA UMA ESTRELINHA NA EXTENSÃO  :) 🌟 
###### Ainda está em processo de amadurecimento. Contribuições são bem vindas. Por favor, abra uma issue para discutir qualquer funcionalidade, bug ou simplesmente para comentar o que achou.
#### 🌟 :) IF YOU LIKED IT, GIVE ME A STAR IN THE EXTENSION :) 🌟
###### It's still in the process of maturing. Contributions are welcome. Please open an issue to discuss any functionality, bug, or simply to comment on what you thought.
#### 🌟 :) SI TE GUSTÓ, DAME UNA ESTRELLA EN LA EXTENSIÓN :) 🌟
###### Todavía está en desarrollo. Se agradecen las contribuciones. Por favor, abre un problema para comentar cualquier funcionalidad, error o simplemente para comentar qué te pareció.
---

## 🚀 Installation

### From Open VSX Registry

1. Open VS Code
2. Press `Ctrl+Shift+X` (or `Cmd+Shift+X` on Mac)
3. Search for "AI Agent IDE Context Sync"
4. Click Install

### From VSIX File

1. Download the latest `.vsix` file from [Releases](https://github.com/anarkaike/ai-agent-ide-context-sync/releases)
2. Open VS Code
3. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
4. Type "Install from VSIX"
5. Select the downloaded file

### Requirements

- **VS Code**: 1.80.0 or higher
- **ai-agent-ide-context-sync CLI**: Install globally
  ```bash
  npm install -g ai-agent-ide-context-sync
  ```

---

## 📋 Usage

### Getting Started

1. **Initialize Workspace**
   - Click the AI Agent Sync icon in the Activity Bar
   - Click "Initialize Workspace" if needed
   - This creates `.ai-workspace/` in your project

2. **Create Your First Persona**
   - Click the ➕ icon in the "AI Agents & Tasks" view
   - Enter persona name (e.g., `AI-NARUTO`)
   - The persona file opens automatically for editing

3. **Customize Your Persona**
   - Right-click on the persona
   - Select "🎨 Customize Persona"
   - Choose a color and icon
   - Click Save

### Managing Tasks

#### Create a Task
1. Expand a persona in the tree
2. Click ➕ next to "📋 Tasks"
3. Enter task title
4. Edit the task file to add checklist items

#### Toggle Checklist Items
Simply **click on a checklist item** to mark it as done/undone!

#### Archive Tasks
1. Right-click on a task
2. Select "Archive Task"
3. Task moves to `.ai-workspace/tasks/archive/`

### Using the Timer

1. **Select a Task** (Quick Picker or sidebar)
2. **Click the Status Bar** - Opens timer menu
3. **Choose a mode**:
   - 🍅 25min Pomodoro
   - ☕ 5min Break
   - ⏱️ Custom Duration
   - ▶️ Start Timer

4. **During the Timer**:
   - 📊 Live countdown in status bar
   - ⏸️ Pause when needed
   - 🔄 Reset to restart
   - 🔔 Notification when complete

### Quick Picker

Press `Ctrl+Shift+T` (or `Cmd+Shift+T` on Mac):
- See all tasks from all personas
- Type to filter
- Press Enter to open

### Global Search

Press `Ctrl+Shift+F` (or `Cmd+Shift+F` on Mac):
- Search in task titles
- Search in checklist items
- See match count per task

### Dashboard

1. Open Command Palette (`Ctrl+Shift+P`)
2. Type: `AI Agent Sync: Open Dashboard`
3. View real-time statistics and charts

### Export Tasks

1. Open Command Palette
2. Type: `AI Agent Sync: Export Tasks`
3. Choose format (Markdown, JSON, or Plain Text)
4. Select save location
5. File opens automatically

---

## 🎨 Customization

### Persona Colors

Choose from 16 predefined colors or use the custom color picker:

- 🟣 Purple (#667eea) - Backend/APIs
- 🟣 Deep Purple (#764ba2) - Database
- 🌸 Pink (#f093fb) - Frontend/UI
- 🔵 Blue (#4facfe) - DevOps
- 🟢 Green (#43e97b) - Testing
- 🔴 Red (#fa709a) - Security
- 🟡 Yellow (#fee140) - Documentation
- 🔷 Cyan (#30cfd0) - Integration

### Persona Icons

24 emoji icons available:
- 🤖 Tech: Robot, Alien, Target, Lightning
- 🔥 Energy: Fire, Diamond, Star, Rocket
- 🎨 Creative: Palette, Mask, Circus, Cinema
- 🎮 Fun: Game, Dice, Target, Circus
- 🦄 Animals: Unicorn, Butterfly, Dragon, Eagle, Fox, Wolf, Lion, Tiger

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+T` | Quick Task Picker |
| `Ctrl+Shift+F` | Search in Tasks |
| Click Status Bar | Timer Menu |

---

## 📊 Analytics View

The Analytics view shows:
- 👥 Number of personas
- 📋 Active tasks count
- ✅ Completed tasks
- 📊 Total checklist items
- ✓ Completed items
- 📈 Overall completion rate

---

## 🔄 Auto-Refresh

The extension automatically refreshes when you:
- Create/edit/delete files in `.ai-workspace/`
- Toggle checklist items
- Archive or delete tasks
- Customize personas

---

## 📁 File Structure

```
.ai-workspace/
├── personas/
│   ├── AI-NARUTO.md
│   ├── AI-SAKURA.md
│   └── ...
├── tasks/
│   ├── active/
│   │   ├── AI-NARUTO--TASK-20260116-feature.md
│   │   └── ...
│   └── archive/
│       └── ...
├── analysis/
└── .persona-settings.json
```

---

## 🤝 Contributing

Found a bug or have a feature request? 
[Open an issue](https://github.com/anarkaike/ai-agent-ide-context-sync/issues)

---

## 📄 License

MIT © Junio de Almeida Vitorino

---

## 🔗 Links

- **NPM Package**: [ai-agent-ide-context-sync](https://www.npmjs.com/package/ai-agent-ide-context-sync)
- **GitHub**: [anarkaike/ai-agent-ide-context-sync](https://github.com/anarkaike/ai-agent-ide-context-sync)
- **Open VSX**: [Extension Page](https://open-vsx.org/extension/junio-de-almeida-vitorino/ai-agent-ide-context-sync-vscode)

## 📦 Changelog

- English: [CHANGELOG.md](./CHANGELOG.md)
- Português (Brasil): [CHANGELOG.pt-BR.md](./CHANGELOG.pt-BR.md)

---

<div align="center">

**Stop managing AI context manually. Start using the visual interface!** 🚀

Made with ❤️ by [Junio de Almeida Vitorino](https://github.com/anarkaike)
Siga-me / Follow-me: https://www.linkedin.com/in/junioalmeida/
</div>
