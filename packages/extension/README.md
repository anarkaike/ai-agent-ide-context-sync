# AI Agent IDE Context Sync - VS Code Extension

**Complete AI Kernel Management** directly from VS Code!

Manage your AI agents, tasks, and project context without leaving your editor.

## ✨ Features

### 👥 AI Agents & Tasks Management
- **Create/Edit/Delete Personas**: Manage your AI agents with a visual interface
- **Task Management**: Create, edit, archive, and delete tasks
- **Interactive Checklists**: Click to toggle checklist items as done/undone
- **Hierarchical View**: Personas → Tasks → Checklist Items
- **Quick Actions**: Context menus for common operations

### 📊 Analytics Dashboard
- **Real-time Statistics**: Track personas, tasks, and completion rates
- **Progress Monitoring**: See how many checklist items are completed
- **Archive Tracking**: Monitor completed tasks

### ⚙️ Kernel Status
- **Live Status**: See kernel version and configuration
- **Quick Build**: One-click context building
- **Sync Status**: Monitor sync state across IDEs

## 🚀 Quick Start

1. **Install the Extension**
2. **Open a Project**
3. **Click the AI Agent Sync icon** in the Activity Bar
4. **Initialize Workspace**: Click "Initialize Workspace" if needed
5. **Create Your First Persona**: Click the ➕ button

## 📋 Commands

| Command | Description |
|---------|-------------|
| `AI Agent Sync: Initialize Workspace` | Set up .ai-workspace in your project |
| `AI Agent Sync: Build Context` | Compile and sync context to all IDEs |
| `AI Agent Sync: Show Status` | Display kernel status in output panel |
| `Create New Persona` | Add a new AI agent |
| `Create New Task` | Add a task to a persona |

## 🎯 Usage

### Creating a Persona

1. Click the ➕ icon in the "AI Agents & Tasks" view
2. Enter persona name (e.g., `AI-NARUTO`)
3. Enter description
4. The persona file opens automatically for editing

### Managing Tasks

1. Expand a persona in the tree
2. Click ➕ next to "📋 Tasks"
3. Enter task title
4. Edit the task file to add checklist items

### Toggling Checklist Items

Simply **click on a checklist item** to mark it as done/undone!

### Archiving Tasks

1. Right-click on a task
2. Select "Archive Task"
3. Task moves to `.ai-workspace/tasks/archive/`

## 📊 Analytics View

The Analytics view shows:
- 👥 Number of personas
- 📋 Active tasks count
- ✅ Completed tasks
- 📊 Total checklist items
- ✓ Completed items
- 📈 Overall completion rate

## 🔄 Auto-Refresh

The extension automatically refreshes when you:
- Create/edit/delete files in `.ai-workspace/`
- Toggle checklist items
- Archive or delete tasks

## 📦 Requirements

- **VS Code**: 1.80.0 or higher
- **ai-agent-ide-context-sync CLI**: Install globally
  ```bash
  npm install -g ai-agent-ide-context-sync
  ```

## 🎨 Interface

The extension adds a new Activity Bar icon with three views:

1. **👥 AI Agents & Tasks**: Manage personas and their tasks
2. **📊 Analytics**: View statistics and progress
3. **⚙️ Kernel Status**: Monitor kernel state

## 🤝 Contributing

Found a bug or have a feature request? 
[Open an issue](https://github.com/anarkaike/ai-agent-ide-context-sync/issues)

## 📄 License

MIT © Junio

---

**Stop managing AI context manually. Start using the visual interface!** 🚀
