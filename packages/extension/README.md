# AI Agent IDE Context Sync - VS Code Extension

**🌐 Language navigation**

- [English](#lang-en-ext)
- [Português](#lang-pt-ext)
- [Español](#lang-es-ext)
- [Italiano](#lang-it-ext)
- [Français](#lang-fr-ext)
- [日本語](#lang-ja-ext)
- [中文](#lang-zh-ext)
- [العربية](#lang-ar-ext)
- [हिन्दी](#lang-hi-ext)

<a id="lang-en-ext"></a>

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.10-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![VS Code](https://img.shields.io/badge/VS%20Code-1.80.0+-purple.svg)

**Visual AI Workspace Management inside VS Code.**

Manage your AI agents, tasks, and project context without leaving your editor.

<br>

<img src="./assets/ai-agent-context-cover.png" alt="AI Agent IDE Context Sync - VS Code extension visual cover" width="100%" />

<br>

<img src="./assets/ai-agent-context-kanban.png" alt="Kanban board powered by the AI Agent IDE Context Sync extension" width="85%" />

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
#### 🌟 If this extension helps you, consider giving it a star
###### It is still evolving. Contributions are very welcome — open an issue to suggest features, report bugs, or share how you are using it.
#### 🌟 Se esta extensão te ajudar, considera deixar uma estrela
###### Ainda está em evolução. Contribuições são muito bem‑vindas — abra uma issue para sugerir funcionalidades, relatar bugs ou contar como está usando.
#### 🌟 Si esta extensión te ayuda, considera dejar una estrella
###### Todavía está en evolución. Se agradecen mucho las contribuciones: abre un issue para sugerir funcionalidades, reportar errores o comentar cómo la estás usando.
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

Made with ❤️ by [Junio de Almeida Vitorino](https://github.com/anarkaike)  <br>
Siga-me / Follow-me: https://www.linkedin.com/in/junioalmeida/

<br>

<img src="./assets/maintainer-photo.jpg" alt="Portrait of the extension maintainer sitting on a chair" width="180" />
<img src="./assets/maintainer-avatar.png" alt="Stylized avatar illustration of the extension maintainer" width="180" />
</div>

---
---

<a id="lang-pt-ext"></a>

<div align="center">

# AI Agent IDE Context Sync - Extensão VS Code

![Version](https://img.shields.io/badge/version-2.0.10-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![VS Code](https://img.shields.io/badge/VS%20Code-1.80.0+-purple.svg)

**Gestão visual do AI Kernel diretamente no VS Code.**

Gerencie suas personas de IA, tasks e contexto do projeto sem sair do editor.

</div>

---

## ✨ Funcionalidades

### 👥 Gestão de Personas de IA e Tasks
- **Criar/Editar/Excluir Personas**: Gerencie seus agentes de IA com uma interface visual
- **Gestão de Tasks**: Crie, edite, arquive e exclua tasks
- **Checklists Interativos**: Clique para marcar itens como concluídos/não concluídos
- **Visão Hierárquica**: Personas → Tasks → Itens de Checklist
- **Ações Rápidas**: Menus de contexto para operações comuns

### 🎨 Customização Visual
- **16 Cores Pré-definidas**: Paleta de cores vibrante e bonita
- **Seletor de Cor Customizada**: Escolha qualquer cor que quiser
- **24 Emojis de Ícone**: Robôs, animais, símbolos e muito mais
- **Pré-visualização em Tempo Real**: Veja as mudanças ao vivo
- **Configurações Persistentes**: Salvas por workspace

### ⏱️ Timer Pomodoro
- **Pomodoro de 25 Minutos**: Modo foco com contagem regressiva
- **Intervalos de 5 Minutos**: Timer para pequenas pausas
- **Duração Customizada**: Defina seu próprio tempo
- **Pausar/Retomar**: Controle completo do timer
- **Integração na Status Bar**: Contagem regressiva em tempo real
- **Notificações de Conclusão**: Aviso quando o tempo acabar

### 📊 Dashboard de Analytics
- **Estatísticas em Tempo Real**: Acompanhe personas, tasks e taxa de conclusão
- **Gráficos Interativos**: Gráficos de rosca e barras com Chart.js
- **Monitoramento de Progresso**: Veja quantos itens de checklist foram concluídos
- **Acompanhamento de Arquivo**: Monitore tasks concluídas
- **Auto-atualização**: Atualiza a cada 5 segundos

### 🔍 Navegação Rápida
- **Quick Picker** (`Ctrl+Shift+T`): Navegação rápida entre tasks com fuzzy search
- **Busca Global** (`Ctrl+Shift+F`): Busca em tasks e itens de checklist
- **Status Bar**: Mostra a task ativa com atalho de clique para trocar

### 📤 Exportar Tasks
- **Formato Markdown**: Agrupado por persona com checklists
- **Formato JSON**: Dados estruturados para processamento
- **Texto Simples**: Formato legível e enxuto
- **Abertura Automática**: Abre o arquivo exportado automaticamente

### ⚙️ Status do Kernel
- **Status em Tempo Real**: Veja versão e configuração do kernel
- **Build Rápido**: Build de contexto com um clique
- **Status de Sincronização**: Monitore o estado de sync entre IDEs

---

## 🚀 Instalação

### Pelo Open VSX Registry

1. Abra o VS Code
2. Pressione `Ctrl+Shift+X` (ou `Cmd+Shift+X` no Mac)
3. Pesquise por "AI Agent IDE Context Sync"
4. Clique em Install

### A partir do Arquivo VSIX

1. Baixe o `.vsix` mais recente em [Releases](https://github.com/anarkaike/ai-agent-ide-context-sync/releases)
2. Abra o VS Code
3. Pressione `Ctrl+Shift+P` (ou `Cmd+Shift+P` no Mac)
4. Digite "Install from VSIX"
5. Selecione o arquivo baixado

### Requisitos

- **VS Code**: 1.80.0 ou superior
- **CLI ai-agent-ide-context-sync**: Instalar globalmente
  ```bash
  npm install -g ai-agent-ide-context-sync
  ```

---

## 📋 Uso

### Primeiros Passos

1. **Inicializar Workspace**
   - Clique no ícone do AI Agent Sync na Activity Bar
   - Clique em "Initialize Workspace" se necessário
   - Isso cria a pasta `.ai-workspace/` no seu projeto

2. **Criar Sua Primeira Persona**
   - Clique no ícone ➕ na view "AI Agents & Tasks"
   - Informe o nome da persona (ex.: `AI-NARUTO`)
   - O arquivo da persona será aberto automaticamente para edição

3. **Customizar Sua Persona**
   - Clique com o botão direito na persona
   - Selecione "🎨 Customize Persona"
   - Escolha uma cor e um ícone
   - Clique em Save

### Gestão de Tasks

#### Criar uma Task
1. Expanda uma persona na árvore
2. Clique em ➕ ao lado de "📋 Tasks"
3. Informe o título da task
4. Edite o arquivo da task para adicionar itens de checklist

#### Alternar Itens da Checklist
Basta **clicar em um item de checklist** para marcar como concluído/não concluído.

#### Arquivar Tasks
1. Clique com o botão direito em uma task
2. Selecione "Archive Task"
3. A task é movida para `.ai-workspace/tasks/archive/`

### Usando o Timer

1. **Selecione uma Task** (via Quick Picker ou sidebar)
2. **Clique na Status Bar** – abre o menu do timer
3. **Escolha um modo**:
   - 🍅 Pomodoro de 25min
   - ☕ Pausa de 5min
   - ⏱️ Duração Customizada
   - ▶️ Start Timer

4. **Durante o Timer**:
   - 📊 Contagem regressiva em tempo real na status bar
   - ⏸️ Pause quando precisar
   - 🔄 Reset para recomeçar
   - 🔔 Notificação ao concluir

### Quick Picker

Pressione `Ctrl+Shift+T` (ou `Cmd+Shift+T` no Mac):
- Veja todas as tasks de todas as personas
- Digite para filtrar
- Pressione Enter para abrir

### Busca Global

Pressione `Ctrl+Shift+F` (ou `Cmd+Shift+F` no Mac):
- Busque em títulos de tasks
- Busque em itens de checklist
- Veja a contagem de matches por task

### Dashboard

1. Abra a Command Palette (`Ctrl+Shift+P`)
2. Digite: `AI Agent Sync: Open Dashboard`
3. Veja estatísticas e gráficos em tempo real

### Exportar Tasks

1. Abra a Command Palette
2. Digite: `AI Agent Sync: Export Tasks`
3. Escolha o formato (Markdown, JSON ou Texto Simples)
4. Escolha o local de salvamento
5. O arquivo é aberto automaticamente

---

## 🎨 Customização

### Cores de Persona

Escolha entre 16 cores pré-definidas ou use o seletor de cor customizada:

- 🟣 Roxo (#667eea) – Backend/APIs
- 🟣 Roxo Escuro (#764ba2) – Banco de Dados
- 🌸 Rosa (#f093fb) – Frontend/UI
- 🔵 Azul (#4facfe) – DevOps
- 🟢 Verde (#43e97b) – Testes
- 🔴 Vermelho (#fa709a) – Segurança
- 🟡 Amarelo (#fee140) – Documentação
- 🔷 Ciano (#30cfd0) – Integração

### Ícones de Persona

24 emojis disponíveis:
- 🤖 Tech: Robô, Alien, Alvo, Raio
- 🔥 Energia: Fogo, Diamante, Estrela, Foguete
- 🎨 Criativo: Paleta, Máscara, Circo, Cinema
- 🎮 Diversão: Jogo, Dado, Alvo, Circo
- 🦄 Animais: Unicórnio, Borboleta, Dragão, Águia, Raposa, Lobo, Leão, Tigre

---

## ⌨️ Atalhos de Teclado

| Atalho | Ação |
|--------|------|
| `Ctrl+Shift+T` | Quick Task Picker |
| `Ctrl+Shift+F` | Buscar em Tasks |
| Clique na Status Bar | Menu do Timer |

---

## 📊 Visão de Analytics

A view de Analytics mostra:
- 👥 Número de personas
- 📋 Contagem de tasks ativas
- ✅ Tasks concluídas
- 📊 Total de itens de checklist
- ✓ Itens concluídos
- 📈 Taxa geral de conclusão

---

## 🔄 Auto-Refresh

A extensão atualiza automaticamente quando você:
- Cria/edita/exclui arquivos em `.ai-workspace/`
- Alterna itens de checklist
- Arquiva ou exclui tasks
- Customiza personas

---

## 📁 Estrutura de Arquivos

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

## 🤝 Contribuindo

Encontrou um bug ou tem uma sugestão de funcionalidade?  
[Abra uma issue](https://github.com/anarkaike/ai-agent-ide-context-sync/issues)

---

## 📄 Licença

MIT © Junio de Almeida Vitorino

---

## 🔗 Links

- **Pacote NPM**: [ai-agent-ide-context-sync](https://www.npmjs.com/package/ai-agent-ide-context-sync)
- **GitHub**: [anarkaike/ai-agent-ide-context-sync](https://github.com/anarkaike/ai-agent-ide-context-sync)
- **Open VSX**: [Página da Extensão](https://open-vsx.org/extension/junio-de-almeida-vitorino/ai-agent-ide-context-sync-vscode)

---

## 🔍 Palavras‑chave relacionadas

AI coding assistant, AI code assistant, AI coding agent, AI pair programmer,
ferramentas de IA para VS Code, produtividade de desenvolvimento, VS Code extension,
IDE plugin, universal context hub, context sync, Kanban board, task management,
AI kernel, AI workspace, AI agents, personas de IA, Pomodoro timer, analytics dashboard.

---

<a id="lang-es-ext"></a>

<div align="center">

# AI Agent IDE Context Sync - Extensión VS Code

![Version](https://img.shields.io/badge/version-2.0.10-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![VS Code](https://img.shields.io/badge/VS%20Code-1.80.0+-purple.svg)

**Gestión visual del AI Kernel directamente en VS Code.**

Administra tus agentes de IA, tareas y contexto de proyecto sin salir del editor.

</div>

---

## ✨ Funcionalidades

### 👥 Gestión de Agentes de IA y Tareas
- **Crear/Editar/Eliminar Personas**: Administra tus agentes de IA con una interfaz visual
- **Gestión de Tareas**: Crea, edita, archiva y elimina tareas
- **Checklists Interactivos**: Haz clic para marcar ítems como completados/no completados
- **Vista Jerárquica**: Personas → Tareas → Ítems de checklist
- **Acciones Rápidas**: Menús contextuales para operaciones frecuentes

### 🎨 Personalización Visual
- **16 Colores Predefinidos**: Paleta de colores moderna y vibrante
- **Selector de Color Personalizado**: Elige cualquier color que necesites
- **24 Iconos Emoji**: Robots, animales, símbolos y más
- **Vista Previa en Vivo**: Observa los cambios en tiempo real
- **Configuraciones Persistentes**: Guardadas por workspace

### ⏱️ Temporizador Pomodoro
- **Pomodoro de 25 Minutos**: Modo foco con cuenta regresiva
- **Pausas de 5 Minutos**: Descansos cortos entre bloques de foco
- **Duración Personalizada**: Define tu propio tiempo
- **Pausar/Reanudar**: Control total del temporizador
- **Integración en la Status Bar**: Tiempo restante visible siempre
- **Notificaciones de Finalización**: Aviso cuando termina el ciclo

### 📊 Panel de Analytics
- **Estadísticas en Tiempo Real**: Personas, tareas y tasa de finalización
- **Gráficos Interactivos**: Gráficos donut y de barras con Chart.js
- **Monitoreo de Progreso**: Ítems de checklist completados por tarea
- **Historial de Archivo**: Seguimiento de tareas archivadas
- **Auto‑refresh**: Actualización automática cada pocos segundos

### 🔍 Navegación Rápida
- **Quick Picker** (`Ctrl+Shift+T`): Navegación rápida entre tareas con fuzzy search
- **Búsqueda Global** (`Ctrl+Shift+F`): Búsqueda en tareas e ítems de checklist
- **Status Bar**: Muestra la tarea activa con acceso rápido al temporizador

### 📤 Exportar Tareas
- **Formato Markdown**: Agrupadas por persona con checklists
- **Formato JSON**: Datos estructurados para integraciones
- **Texto Plano**: Formato simple y legible
- **Apertura Automática**: Abre el archivo exportado al finalizar

### ⚙️ Estado del Kernel
- **Estado en Vivo**: Versión y configuración del kernel
- **Build Rápido**: Construcción de contexto con un clic
- **Estado de Sincronización**: Visión general de la sync entre IDEs

---

## 🚀 Instalación

### Desde Open VSX Registry

1. Abre VS Code
2. Pulsa `Ctrl+Shift+X` (o `Cmd+Shift+X` en Mac)
3. Busca "AI Agent IDE Context Sync"
4. Haz clic en Install

### Desde Archivo VSIX

1. Descarga el `.vsix` más reciente desde [Releases](https://github.com/anarkaike/ai-agent-ide-context-sync/releases)
2. Abre VS Code
3. Pulsa `Ctrl+Shift+P` (o `Cmd+Shift+P` en Mac)
4. Escribe "Install from VSIX"
5. Selecciona el archivo descargado

### Requisitos

- **VS Code**: 1.80.0 o superior
- **CLI ai-agent-ide-context-sync**: Instalar globalmente
  ```bash
  npm install -g ai-agent-ide-context-sync
  ```

---

## 📋 Uso

### Primeros Pasos

1. **Inicializar Workspace**
   - Haz clic en el ícono de AI Agent Sync en la Activity Bar
   - Haz clic en "Initialize Workspace" si es necesario
   - Esto crea la carpeta `.ai-workspace/` en tu proyecto

2. **Crear tu Primera Persona**
   - Haz clic en el ícono ➕ en la vista "AI Agents & Tasks"
   - Escribe el nombre de la persona (ej.: `AI-NARUTO`)
   - El archivo de la persona se abre automáticamente para edición

3. **Personalizar tu Persona**
   - Haz clic derecho sobre la persona
   - Selecciona "🎨 Customize Persona"
   - Elige un color y un icono
   - Haz clic en Save

### Gestión de Tareas

#### Crear una Tarea
1. Expande una persona en el árbol
2. Haz clic en ➕ junto a "📋 Tasks"
3. Escribe el título de la tarea
4. Edita el archivo de la tarea para añadir ítems de checklist

#### Alternar Ítems de Checklist
Haz simplemente **clic en un ítem de checklist** para marcarlo como completado/no completado.

#### Archivar Tareas
1. Haz clic derecho en una tarea
2. Selecciona "Archive Task"
3. La tarea se mueve a `.ai-workspace/tasks/archive/`

### Uso del Temporizador

1. **Selecciona una Tarea** (Quick Picker o sidebar)
2. **Haz clic en la Status Bar** – abre el menú del temporizador
3. **Elige un modo**:
   - 🍅 Pomodoro de 25min
   - ☕ Pausa de 5min
   - ⏱️ Duración Personalizada
   - ▶️ Start Timer

4. **Durante el Temporizador**:
   - 📊 Cuenta regresiva en la status bar
   - ⏸️ Pausar cuando sea necesario
   - 🔄 Reset para reiniciar
   - 🔔 Notificación al finalizar

### Quick Picker

Pulsa `Ctrl+Shift+T` (o `Cmd+Shift+T` en Mac):
- Lista de todas las tareas de todas las personas
- Escribe para filtrar
- Pulsa Enter para abrir

### Búsqueda Global

Pulsa `Ctrl+Shift+F` (o `Cmd+Shift+F` en Mac):
- Busca en títulos de tareas
- Busca en ítems de checklist
- Visualiza el número de coincidencias por tarea

### Dashboard

1. Abre la Command Palette (`Ctrl+Shift+P`)
2. Escribe: `AI Agent Sync: Open Dashboard`
3. Consulta estadísticas y gráficos en tiempo real

### Exportar Tareas

1. Abre la Command Palette
2. Escribe: `AI Agent Sync: Export Tasks`
3. Elige el formato (Markdown, JSON o Texto Plano)
4. Elige la carpeta de destino
5. El archivo se abre automáticamente

---

## 🎨 Personalización

### Colores de Persona

Elige entre 16 colores predefinidos o usa el selector de color personalizado:

- 🟣 Morado (#667eea) – Backend/APIs
- 🟣 Morado Oscuro (#764ba2) – Base de Datos
- 🌸 Rosa (#f093fb) – Frontend/UI
- 🔵 Azul (#4facfe) – DevOps
- 🟢 Verde (#43e97b) – Tests
- 🔴 Rojo (#fa709a) – Seguridad
- 🟡 Amarillo (#fee140) – Documentación
- 🔷 Cian (#30cfd0) – Integración

### Iconos de Persona

24 emojis disponibles:
- 🤖 Tech: Robot, Alien, Diana, Rayo
- 🔥 Energía: Fuego, Diamante, Estrella, Cohete
- 🎨 Creativo: Paleta, Máscara, Circo, Cine
- 🎮 Diversión: Juego, Dado, Diana, Circo
- 🦄 Animales: Unicornio, Mariposa, Dragón, Águila, Zorro, Lobo, León, Tigre

---

## ⌨️ Atajos de Teclado

| Atajo | Acción |
|-------|--------|
| `Ctrl+Shift+T` | Quick Task Picker |
| `Ctrl+Shift+F` | Buscar en Tareas |
| Clic en la Status Bar | Menú del Temporizador |

---

## 📊 Vista de Analytics

La vista de Analytics muestra:
- 👥 Número de personas
- 📋 Cantidad de tareas activas
- ✅ Tareas completadas
- 📊 Total de ítems de checklist
- ✓ Ítems completados
- 📈 Tasa general de finalización

---

## 🔄 Auto‑Refresh

La extensión se actualiza automáticamente cuando:
- Creas/editas/eliminás archivos en `.ai-workspace/`
- Alternas ítems de checklist
- Archivas o eliminas tareas
- Personalizas personas

---

## 📁 Estructura de Archivos

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

## 🤝 Contribución

¿Encontraste un bug o tienes una idea de mejora?  
[Abre un issue](https://github.com/anarkaike/ai-agent-ide-context-sync/issues)

---

## 📄 Licencia

MIT © Junio de Almeida Vitorino

---

## 🔗 Enlaces

- **Paquete NPM**: [ai-agent-ide-context-sync](https://www.npmjs.com/package/ai-agent-ide-context-sync)
- **GitHub**: [anarkaike/ai-agent-ide-context-sync](https://github.com/anarkaike/ai-agent-ide-context-sync)
- **Open VSX**: [Página de la Extensión](https://open-vsx.org/extension/junio-de-almeida-vitorino/ai-agent-ide-context-sync-vscode)

---

## 🔍 Palabras clave relacionadas

AI coding assistant, AI code assistant, AI coding agent, AI pair programmer,
herramientas de IA para VS Code, productividad de desarrollo, VS Code extension,
IDE plugin, universal context hub, context sync, Kanban board, task management,
AI kernel, AI workspace, AI agents, personas de IA, Pomodoro timer, analytics dashboard.

---

<a id="lang-it-ext"></a>

<div align="center">

# AI Agent IDE Context Sync - Estensione VS Code

![Version](https://img.shields.io/badge/version-2.0.10-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![VS Code](https://img.shields.io/badge/VS%20Code-1.80.0+-purple.svg)

**Gestione visiva dell’AI Kernel direttamente in VS Code.**

Gestisci le tue personas di IA, le task e il contesto del progetto senza uscire dall’editor.

</div>

---

## ✨ Funzionalità

### 👥 Gestione di Agenti IA e Task
- **Crea/Modifica/Elimina Personas**: Gestisci i tuoi agenti IA con un’interfaccia visuale
- **Gestione Task**: Crea, modifica, archivia ed elimina task
- **Checklist Interattive**: Clicca per segnare gli elementi come completati/non completati
- **Vista Gerarchica**: Personas → Task → Elementi di checklist
- **Azioni Rapide**: Menu contestuali per le operazioni più comuni

### 🎨 Personalizzazione Visiva
- **16 Colori Predefiniti**: Palette di colori moderna e vibrante
- **Selettore Colore Personalizzato**: Scegli qualsiasi colore
- **24 Icone Emoji**: Robot, animali, simboli e altro
- **Anteprima Live**: Vedi le modifiche in tempo reale
- **Impostazioni Persistenti**: Salvate per workspace

### ⏱️ Timer Pomodoro
- **Pomodoro da 25 Minuti**: Modalità focus con conto alla rovescia
- **Pause da 5 Minuti**: Brevi intervalli tra le sessioni
- **Durata Personalizzata**: Imposta il tuo tempo ideale
- **Pausa/Ripresa**: Controllo completo del timer
- **Integrazione nella Status Bar**: Tempo residuo sempre visibile
- **Notifiche di Completamento**: Avviso al termine del ciclo

### 📊 Dashboard Analytics
- **Statistiche in Tempo Reale**: Personas, task e tasso di completamento
- **Grafici Interattivi**: Grafici a ciambella e a barre con Chart.js
- **Monitoraggio Progresso**: Elementi di checklist completati per task
- **Storico Archivio**: Stato delle task archiviate
- **Aggiornamento Automatico**: Refresh periodico dei dati

### 🔍 Navigazione Rapida
- **Quick Picker** (`Ctrl+Shift+T`): Navigazione rapida tra le task con fuzzy search
- **Ricerca Globale** (`Ctrl+Shift+F`): Ricerca in task ed elementi di checklist
- **Status Bar**: Mostra la task attiva e apre il menu del timer

### 📤 Esportazione Task
- **Formato Markdown**: Raggruppate per persona con checklist
- **Formato JSON**: Dati strutturati per integrazioni
- **Testo Semplice**: Formato leggibile e minimale
- **Apertura Automatica**: Apre il file esportato al termine

### ⚙️ Stato del Kernel
- **Stato Live**: Versione e configurazione del kernel
- **Build Rapida**: Costruzione del contesto con un clic
- **Stato di Sincronizzazione**: Panoramica della sync tra IDE

---

## 🚀 Installazione

### Da Open VSX Registry

1. Apri VS Code
2. Premi `Ctrl+Shift+X` (o `Cmd+Shift+X` su Mac)
3. Cerca "AI Agent IDE Context Sync"
4. Clicca su Install

### Da File VSIX

1. Scarica l’ultimo `.vsix` da [Releases](https://github.com/anarkaike/ai-agent-ide-context-sync/releases)
2. Apri VS Code
3. Premi `Ctrl+Shift+P` (o `Cmd+Shift+P` su Mac)
4. Digita "Install from VSIX"
5. Seleziona il file scaricato

### Requisiti

- **VS Code**: 1.80.0 o superiore
- **CLI ai-agent-ide-context-sync**: Installare globalmente
  ```bash
  npm install -g ai-agent-ide-context-sync
  ```

---

## 📋 Utilizzo

### Primi Passi

1. **Inizializza il Workspace**
   - Clicca sull’icona AI Agent Sync nella Activity Bar
   - Clicca su "Initialize Workspace" se necessario
   - Viene creata la cartella `.ai-workspace/` nel tuo progetto

2. **Crea la tua Prima Persona**
   - Clicca sull’icona ➕ nella vista "AI Agents & Tasks"
   - Inserisci il nome della persona (es.: `AI-NARUTO`)
   - Il file della persona si apre automaticamente per la modifica

3. **Personalizza la Persona**
   - Clic destro sulla persona
   - Seleziona "🎨 Customize Persona"
   - Scegli un colore e un’icona
   - Clicca su Save

### Gestione Task

#### Creare una Task
1. Espandi una persona nell’albero
2. Clicca su ➕ accanto a "📋 Tasks"
3. Inserisci il titolo della task
4. Modifica il file per aggiungere gli elementi di checklist

#### Alternare Elementi di Checklist
Fai semplicemente **clic su un elemento di checklist** per segnarlo come completato/non completato.

#### Archiviare Task
1. Clic destro su una task
2. Seleziona "Archive Task"
3. La task viene spostata in `.ai-workspace/tasks/archive/`

### Uso del Timer

1. **Seleziona una Task** (Quick Picker o sidebar)
2. **Clic sulla Status Bar** – apre il menu del timer
3. **Scegli una modalità**:
   - 🍅 Pomodoro da 25min
   - ☕ Pausa da 5min
   - ⏱️ Durata Personalizzata
   - ▶️ Start Timer

4. **Durante il Timer**:
   - 📊 Conto alla rovescia in tempo reale nella status bar
   - ⏸️ Pausa quando serve
   - 🔄 Reset per ricominciare
   - 🔔 Notifica al termine

### Quick Picker

Premi `Ctrl+Shift+T` (o `Cmd+Shift+T` su Mac):
- Vedi tutte le task di tutte le personas
- Digita per filtrare
- Premi Invio per aprire

### Ricerca Globale

Premi `Ctrl+Shift+F` (o `Cmd+Shift+F` su Mac):
- Cerca nei titoli delle task
- Cerca negli elementi di checklist
- Vedi il numero di match per task

### Dashboard

1. Apri la Command Palette (`Ctrl+Shift+P`)
2. Digita: `AI Agent Sync: Open Dashboard`
3. Vedi statistiche e grafici in tempo reale

### Esportare Task

1. Apri la Command Palette
2. Digita: `AI Agent Sync: Export Tasks`
3. Scegli il formato (Markdown, JSON o Testo Semplice)
4. Seleziona la destinazione
5. Il file esportato si apre automaticamente

---

## 🎨 Personalizzazione

### Colori Persona

Scegli tra 16 colori predefiniti o usa il selettore colore personalizzato:

- 🟣 Viola (#667eea) – Backend/APIs
- 🟣 Viola Scuro (#764ba2) – Database
- 🌸 Rosa (#f093fb) – Frontend/UI
- 🔵 Blu (#4facfe) – DevOps
- 🟢 Verde (#43e97b) – Test
- 🔴 Rosso (#fa709a) – Sicurezza
- 🟡 Giallo (#fee140) – Documentazione
- 🔷 Ciano (#30cfd0) – Integrazione

### Icone Persona

24 emoji disponibili:
- 🤖 Tech: Robot, Alieno, Bersaglio, Fulmine
- 🔥 Energia: Fuoco, Diamante, Stella, Razzo
- 🎨 Creativo: Tavolozza, Maschera, Circo, Cinema
- 🎮 Divertimento: Gioco, Dado, Bersaglio, Circo
- 🦄 Animali: Unicorno, Farfalla, Drago, Aquila, Volpe, Lupo, Leone, Tigre

---

## ⌨️ Scorciatoie da Tastiera

| Scorciatoia | Azione |
|-------------|--------|
| `Ctrl+Shift+T` | Quick Task Picker |
| `Ctrl+Shift+F` | Cerca nelle Task |
| Clic sulla Status Bar | Menu Timer |

---

## 📊 Vista Analytics

La vista Analytics mostra:
- 👥 Numero di personas
- 📋 Conteggio delle task attive
- ✅ Task completate
- 📊 Totale elementi di checklist
- ✓ Elementi completati
- 📈 Tasso di completamento complessivo

---

## 🔄 Auto‑Refresh

L’estensione si aggiorna automaticamente quando:
- Crei/modifichi/elimini file in `.ai-workspace/`
- Alterni elementi di checklist
- Archivi o elimini task
- Personalizzi personas

---

## 📁 Struttura File

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

## 🤝 Contributo

Hai trovato un bug o hai una proposta di funzionalità?  
[Apri una issue](https://github.com/anarkaike/ai-agent-ide-context-sync/issues)

---

## 📄 Licenza

MIT © Junio de Almeida Vitorino

---

## 🔗 Link

- **Pacchetto NPM**: [ai-agent-ide-context-sync](https://www.npmjs.com/package/ai-agent-ide-context-sync)
- **GitHub**: [anarkaike/ai-agent-ide-context-sync](https://github.com/anarkaike/ai-agent-ide-context-sync)
- **Open VSX**: [Pagina dell’Estensione](https://open-vsx.org/extension/junio-de-almeida-vitorino/ai-agent-ide-context-sync-vscode)

---

## 🔍 Parole chiave correlate

AI coding assistant, AI code assistant, AI coding agent, AI pair programmer,
strumenti di IA per VS Code, produttività degli sviluppatori, VS Code extension,
IDE plugin, universal context hub, context sync, Kanban board, task management,
AI kernel, AI workspace, AI agents, personas di IA, Pomodoro timer, analytics dashboard.

---

<a id="lang-fr-ext"></a>

<div align="center">

# AI Agent IDE Context Sync - Extension VS Code

![Version](https://img.shields.io/badge/version-2.0.10-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![VS Code](https://img.shields.io/badge/VS%20Code-1.80.0+-purple.svg)

**Gestion visuelle de l’AI Kernel directement dans VS Code.**

Gérez vos personas IA, vos tâches et le contexte de votre projet sans quitter l’éditeur.

</div>

---

## ✨ Fonctionnalités

### 👥 Gestion des Agents IA et des Tâches
- **Créer/Modifier/Supprimer des Personas**: Gérez vos agents IA via une interface visuelle
- **Gestion des Tâches**: Créez, éditez, archivez et supprimez des tâches
- **Checklists Interactives**: Cliquez pour marquer les éléments comme faits/non faits
- **Vue Hiérarchique**: Personas → Tâches → Éléments de checklist
- **Actions Rapides**: Menus contextuels pour les opérations fréquentes

### 🎨 Personnalisation Visuelle
- **16 Couleurs Prédéfinies**: Palette moderne et contrastée
- **Sélecteur de Couleur Personnalisée**: Choisissez n’importe quelle couleur
- **24 Icônes Emoji**: Robots, animaux, symboles, etc.
- **Aperçu en Direct**: Visualisez les changements en temps réel
- **Paramètres Persistants**: Sauvegardés par workspace

### ⏱️ Timer Pomodoro
- **Pomodoro 25 Minutes**: Mode focus avec compte à rebours
- **Pauses 5 Minutes**: Petites pauses entre les sessions
- **Durée Personnalisée**: Adaptez la durée à votre rythme
- **Pause / Reprise**: Contrôle complet sur le timer
- **Intégration Status Bar**: Temps restant toujours visible
- **Notifications de Fin**: Alerte lorsque la session se termine

### 📊 Dashboard Analytics
- **Statistiques en Temps Réel**: Personas, tâches et taux de complétion
- **Graphiques Interactifs**: Graphiques donut et barres (Chart.js)
- **Suivi de Progrès**: Éléments de checklist complétés
- **Suivi d’Archivage**: Historique des tâches archivées
- **Rafraîchissement Automatique**: Actualisation régulière des données

---

## 🚀 Installation

### Depuis Open VSX Registry

1. Ouvrez VS Code
2. Appuyez sur `Ctrl+Shift+X` (ou `Cmd+Shift+X` sur Mac)
3. Recherchez "AI Agent IDE Context Sync"
4. Cliquez sur Install

### Depuis un Fichier VSIX

1. Téléchargez le `.vsix` le plus récent depuis [Releases](https://github.com/anarkaike/ai-agent-ide-context-sync/releases)
2. Ouvrez VS Code
3. Appuyez sur `Ctrl+Shift+P` (ou `Cmd+Shift+P` sur Mac)
4. Tapez "Install from VSIX"
5. Sélectionnez le fichier téléchargé

### Prérequis

- **VS Code**: 1.80.0 ou supérieur
- **CLI ai-agent-ide-context-sync**: À installer globalement
  ```bash
  npm install -g ai-agent-ide-context-sync
  ```

---

## 📋 Utilisation

### Premiers Pas

1. **Initialiser le Workspace**
   - Cliquez sur l’icône AI Agent Sync dans la Activity Bar
   - Cliquez sur "Initialize Workspace" si nécessaire
   - Crée le dossier `.ai-workspace/` dans votre projet

2. **Créer votre Première Persona**
   - Cliquez sur l’icône ➕ dans la vue "AI Agents & Tasks"
   - Saisissez le nom de la persona (ex.: `AI-NARUTO`)
   - Le fichier de la persona s’ouvre automatiquement

3. **Personnaliser la Persona**
   - Clic droit sur la persona
   - Sélectionnez "🎨 Customize Persona"
   - Choisissez une couleur et une icône
   - Cliquez sur Save

### Gestion des Tâches

#### Créer une Tâche
1. Déployez une persona dans l’arborescence
2. Cliquez sur ➕ à côté de "📋 Tasks"
3. Saisissez le titre de la tâche
4. Modifiez le fichier pour ajouter les éléments de checklist

#### Basculer les Éléments de Checklist
Cliquez simplement **sur un élément de checklist** pour le marquer comme fait/non fait.

#### Archiver des Tâches
1. Clic droit sur une tâche
2. Sélectionnez "Archive Task"
3. La tâche est déplacée vers `.ai-workspace/tasks/archive/`

---

## 🎨 Personnalisation

### Couleurs de Persona

Choisissez parmi 16 couleurs prédéfinies ou utilisez le sélecteur personnalisé:

- 🟣 Violet (#667eea) – Backend/APIs
- 🟣 Violet Foncé (#764ba2) – Base de Données
- 🌸 Rose (#f093fb) – Frontend/UI
- 🔵 Bleu (#4facfe) – DevOps
- 🟢 Vert (#43e97b) – Tests
- 🔴 Rouge (#fa709a) – Sécurité
- 🟡 Jaune (#fee140) – Documentation
- 🔷 Cyan (#30cfd0) – Intégration

### Icônes de Persona

24 emojis disponibles:
- 🤖 Tech: Robot, Alien, Cible, Éclair
- 🔥 Énergie: Feu, Diamant, Étoile, Fusée
- 🎨 Créatif: Palette, Masque, Cirque, Cinéma
- 🎮 Fun: Jeu, Dé, Cible, Cirque
- 🦄 Animaux: Licorne, Papillon, Dragon, Aigle, Renard, Loup, Lion, Tigre

---

## ⌨️ Raccourcis Clavier

| Raccourci | Action |
|-----------|--------|
| `Ctrl+Shift+T` | Quick Task Picker |
| `Ctrl+Shift+F` | Recherche dans les Tâches |
| Clic sur la Status Bar | Menu du Timer |

---

## 📊 Vue Analytics

La vue Analytics affiche:
- 👥 Nombre de personas
- 📋 Nombre de tâches actives
- ✅ Tâches complétées
- 📊 Total d’éléments de checklist
- ✓ Éléments complétés
- 📈 Taux global de complétion

---

## 🔄 Auto‑Refresh

L’extension se met à jour automatiquement lorsque:
- Vous créez/modifiez/supprimez des fichiers dans `.ai-workspace/`
- Vous basculez des éléments de checklist
- Vous archivez ou supprimez des tâches
- Vous personnalisez des personas

---

## 📁 Structure des Fichiers

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

## 🤝 Contribution

Vous avez trouvé un bug ou une idée d’amélioration ?  
[Ouvrez une issue](https://github.com/anarkaike/ai-agent-ide-context-sync/issues)

---

## 📄 Licence

MIT © Junio de Almeida Vitorino

---

## 🔗 Liens

- **Paquet NPM**: [ai-agent-ide-context-sync](https://www.npmjs.com/package/ai-agent-ide-context-sync)
- **GitHub**: [anarkaike/ai-agent-ide-context-sync](https://github.com/anarkaike/ai-agent-ide-context-sync)
- **Open VSX**: [Page de l’Extension](https://open-vsx.org/extension/junio-de-almeida-vitorino/ai-agent-ide-context-sync-vscode)

---

## 🔍 Mots‑clés liés

AI coding assistant, AI code assistant, AI coding agent, AI pair programmer,
outils IA pour VS Code, productivité développeur, VS Code extension,
IDE plugin, universal context hub, context sync, Kanban board, task management,
AI kernel, AI workspace, agents IA, personas IA, Pomodoro timer, analytics dashboard.

---

<a id="lang-ja-ext"></a>

<div align="center">

# AI Agent IDE Context Sync - VS Code 拡張機能

![Version](https://img.shields.io/badge/version-2.0.10-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![VS Code](https://img.shields.io/badge/VS%20Code-1.80.0+-purple.svg)

**VS Code 内で AI Workspace をビジュアル管理。**

エディタから離れずに、AI ペルソナ、タスク、プロジェクトコンテキストをまとめて管理できます。

</div>

---

## ✨ 機能

### 👥 AI ペルソナとタスク管理
- **ペルソナの作成/編集/削除**: ビジュアルな UI で AI エージェントを管理
- **タスク管理**: タスクの作成、編集、アーカイブ、削除
- **インタラクティブなチェックリスト**: クリックで完了/未完了をトグル
- **階層ビュー**: Personas → Tasks → Checklist Items
- **クイックアクション**: コンテキストメニューからよく使う操作へ即アクセス

### 🎨 ビジュアルカスタマイズ
- **16 種類のプリセットカラー**: モダンで鮮やかなカラーパレット
- **カスタムカラーピッカー**: 好きな色を自由に選択
- **24 種類の絵文字アイコン**: ロボット、動物、シンボルなど
- **ライブプレビュー**: 変更内容をリアルタイム表示
- **永続設定**: ワークスペース単位で保存

### ⏱️ ポモドーロタイマー
- **25 分ポモドーロ**: 集中モード用カウントダウン
- **5 分休憩**: 短いブレイク用タイマー
- **カスタム時間**: 自分好みの時間を設定
- **一時停止/再開**: タイマーを柔軟にコントロール
- **ステータスバー連携**: 残り時間を常に表示
- **完了通知**: セッション終了時に通知

### 📊 アナリティクスダッシュボード
- **リアルタイム統計**: ペルソナ数、タスク数、完了率
- **インタラクティブチャート**: Chart.js を使った円グラフ・棒グラフ
- **進捗モニタリング**: チェックリスト完了状況を可視化
- **アーカイブトラッキング**: 完了済みタスクの履歴確認
- **自動更新**: 数秒ごとに自動リフレッシュ

---

## 🚀 インストール

### Open VSX Registry から

1. VS Code を開く
2. `Ctrl+Shift+X`（Mac は `Cmd+Shift+X`）を押す
3. 「AI Agent IDE Context Sync」で検索
4. Install をクリック

### VSIX ファイルから

1. 最新の `.vsix` を [Releases](https://github.com/anarkaike/ai-agent-ide-context-sync/releases) からダウンロード
2. VS Code を開く
3. `Ctrl+Shift+P`（Mac は `Cmd+Shift+P`）を押す
4. 「Install from VSIX」と入力
5. ダウンロードしたファイルを選択

### 必要環境

- **VS Code**: 1.80.0 以上
- **ai-agent-ide-context-sync CLI**: グローバルインストール
  ```bash
  npm install -g ai-agent-ide-context-sync
  ```

---

## 📋 使い方

### はじめに

1. **Workspace を初期化**
   - Activity Bar の AI Agent Sync アイコンをクリック
   - 必要に応じて "Initialize Workspace" を実行
   - プロジェクト内に `.ai-workspace/` ディレクトリが作成されます

2. **最初のペルソナを作成**
   - "AI Agents & Tasks" ビューの ➕ アイコンをクリック
   - ペルソナ名を入力（例: `AI-NARUTO`）
   - ペルソナファイルが自動的に開きます

3. **ペルソナをカスタマイズ**
   - ペルソナを右クリック
   - "🎨 Customize Persona" を選択
   - 色とアイコンを選び、Save をクリック

---

## 🎨 カスタマイズ

### ペルソナカラー

16 種類のプリセットカラー、またはカスタムカラーピッカーから選択:

- 🟣 パープル (#667eea) – Backend/APIs
- 🟣 ディープパープル (#764ba2) – データベース
- 🌸 ピンク (#f093fb) – フロントエンド/UI
- 🔵 ブルー (#4facfe) – DevOps
- 🟢 グリーン (#43e97b) – テスト
- 🔴 レッド (#fa709a) – セキュリティ
- 🟡 イエロー (#fee140) – ドキュメント
- 🔷 シアン (#30cfd0) – インテグレーション

### ペルソナアイコン

24 種類の絵文字:
- 🤖 Tech: ロボット、エイリアン、ターゲット、稲妻
- 🔥 Energy: 炎、ダイヤモンド、星、ロケット
- 🎨 Creative: パレット、マスク、サーカス、シネマ
- 🎮 Fun: ゲーム、サイコロ、ターゲット、サーカス
- 🦄 Animals: ユニコーン、バタフライ、ドラゴン、イーグル、フォックス、ウルフ、ライオン、タイガー

---

## ⌨️ キーボードショートカット

| ショートカット | アクション |
|----------------|-----------|
| `Ctrl+Shift+T` | Quick Task Picker |
| `Ctrl+Shift+F` | タスク検索 |
| ステータスバーをクリック | タイマーメニュー |

---

## 📊 Analytics ビュー

Analytics ビューでは次を確認できます:
- 👥 ペルソナ数
- 📋 アクティブなタスク数
- ✅ 完了したタスク
- 📊 チェックリスト項目の合計
- ✓ 完了済みの項目
- 📈 全体の完了率

---

## 🔄 Auto‑Refresh

拡張機能は次の操作で自動的に更新されます:
- `.ai-workspace/` 内のファイル作成/編集/削除
- チェックリスト項目のトグル
- タスクのアーカイブ/削除
- ペルソナのカスタマイズ

---

## 📁 ファイル構成

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

## 🤝 コントリビュート

バグ報告や機能提案がありますか？  
[GitHub で Issue を作成](https://github.com/anarkaike/ai-agent-ide-context-sync/issues)

---

## 📄 ライセンス

MIT © Junio de Almeida Vitorino

---

## 🔗 リンク

- **NPM パッケージ**: [ai-agent-ide-context-sync](https://www.npmjs.com/package/ai-agent-ide-context-sync)
- **GitHub**: [anarkaike/ai-agent-ide-context-sync](https://github.com/anarkaike/ai-agent-ide-context-sync)
- **Open VSX**: [拡張機能ページ](https://open-vsx.org/extension/junio-de-almeida-vitorino/ai-agent-ide-context-sync-vscode)

---

## 🔍 関連キーワード

AI coding assistant, AI code assistant, AI coding agent, AI pair programmer,
VS Code 向け AI ツール, 開発者プロダクティビティ, VS Code extension,
IDE plugin, universal context hub, context sync, Kanban board, task management,
AI kernel, AI workspace, AI agents, AI personas, Pomodoro timer, analytics dashboard.

---

<a id="lang-zh-ext"></a>

<div align="center">

# AI Agent IDE Context Sync - VS Code 扩展

![Version](https://img.shields.io/badge/version-2.0.10-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![VS Code](https://img.shields.io/badge/VS%20Code-1.80.0+-purple.svg)

**在 VS Code 中可视化管理 AI Kernel。**

无需离开编辑器，即可管理你的 AI Personas、任务和项目上下文。

</div>

---

## ✨ 功能亮点

### 👥 AI 代理与任务管理
- **创建/编辑/删除 Personas**：通过可视化界面管理 AI 代理
- **任务管理**：创建、编辑、归档和删除任务
- **交互式清单**：点击即可切换完成/未完成状态
- **层级视图**：Personas → Tasks → Checklist Items
- **快捷操作**：常用操作通过右键菜单一键触达

### 🎨 可视化自定义
- **16 种预置颜色**：现代且高对比度的色彩方案
- **自定义颜色选择器**：选择任意你需要的颜色
- **24 个 Emoji 图标**：机器人、动物、符号等
- **实时预览**：修改效果实时呈现
- **持久化设置**：按 workspace 保存

---

## 🚀 安装

### 通过 Open VSX Registry

1. 打开 VS Code
2. 按 `Ctrl+Shift+X`（Mac 为 `Cmd+Shift+X`）
3. 搜索 “AI Agent IDE Context Sync”
4. 点击 Install

### 通过 VSIX 文件

1. 从 [Releases](https://github.com/anarkaike/ai-agent-ide-context-sync/releases) 下载最新 `.vsix`
2. 打开 VS Code
3. 按 `Ctrl+Shift+P`（Mac 为 `Cmd+Shift+P`）
4. 输入 “Install from VSIX”
5. 选择下载的文件

---

## 📋 使用方法

### 快速上手

1. **初始化 Workspace**
   - 点击 Activity Bar 中的 AI Agent Sync 图标
   - 如有需要，点击 "Initialize Workspace"
   - 在项目中创建 `.ai-workspace/` 目录

2. **创建首个 Persona**
   - 在 "AI Agents & Tasks" 视图中点击 ➕
   - 输入 persona 名称（例如：`AI-NARUTO`）
   - Persona 文件会自动打开

---

## 🎨 自定义

### Persona 颜色

可从 16 种预置颜色中选择，或使用自定义色板：

- 🟣 紫色 (#667eea) – Backend/APIs
- 🟣 深紫 (#764ba2) – 数据库
- 🌸 粉色 (#f093fb) – 前端/UI
- 🔵 蓝色 (#4facfe) – DevOps
- 🟢 绿色 (#43e97b) – 测试
- 🔴 红色 (#fa709a) – 安全
- 🟡 黄色 (#fee140) – 文档
- 🔷 青色 (#30cfd0) – 集成

### Persona 图标

24 个可选 emoji：
- 🤖 Tech：机器人、外星人、靶心、闪电
- 🔥 Energy：火焰、钻石、星星、火箭
- 🎨 Creative：调色板、面具、马戏、电影
- 🎮 Fun：游戏、骰子、靶心、马戏
- 🦄 Animals：独角兽、蝴蝶、龙、鹰、狐狸、狼、狮子、老虎

---

## ⌨️ 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+Shift+T` | Quick Task Picker |
| `Ctrl+Shift+F` | 任务搜索 |
| 点击状态栏 | 打开定时器菜单 |

---

## 🔍 相关关键词

AI coding assistant, AI code assistant, AI coding agent, AI pair programmer,
VS Code AI 工具, 开发者效率提升, VS Code extension,
IDE plugin, universal context hub, context sync, Kanban board, task management,
AI kernel, AI workspace, AI agents, AI personas, Pomodoro timer, analytics dashboard.

---

<a id="lang-ar-ext"></a>

<div align="center">

# AI Agent IDE Context Sync - إضافة VS Code

![Version](https://img.shields.io/badge/version-2.0.10-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![VS Code](https://img.shields.io/badge/VS%20Code-1.80.0+-purple.svg)

**إدارة بصرية للـ AI Kernel من داخل VS Code.**

تحكّم في الـ Personas، والمهام، وسياق المشروع دون مغادرة المحرّر.

</div>

---

## ✨ المميزات

### 👥 إدارة وكلاء الذكاء الاصطناعي والمهام
- **إنشاء/تعديل/حذف Personas**: إدارة الوكلاء بواجهة رسومية واضحة
- **إدارة المهام**: إنشاء، تعديل، أرشفة وحذف المهام
- **Checklists تفاعلية**: نقرة واحدة لتبديل حالة الإكمال
- **عرض هرمي**: Personas → Tasks → عناصر Checklist
- **إجراءات سريعة**: قوائم سياقية لأكثر العمليات شيوعاً

---

## 🚀 التثبيت

### عبر Open VSX Registry

1. افتح VS Code
2. اضغط `Ctrl+Shift+X` (أو `Cmd+Shift+X` على Mac)
3. ابحث عن "AI Agent IDE Context Sync"
4. اضغط Install

### من خلال ملف VSIX

1. حمّل آخر ملف `.vsix` من [Releases](https://github.com/anarkaike/ai-agent-ide-context-sync/releases)
2. افتح VS Code
3. اضغط `Ctrl+Shift+P` (أو `Cmd+Shift+P` على Mac)
4. اكتب "Install from VSIX"
5. اختر الملف الذي قمت بتنزيله

---

## 📋 طريقة الاستخدام

### البداية

1. **تهيئة الـ Workspace**
   - اضغط على أيقونة AI Agent Sync في الـ Activity Bar
   - اختر "Initialize Workspace" عند الحاجة
   - سيتم إنشاء مجلد `.ai-workspace/` داخل مشروعك

2. **إنشاء أول Persona**
   - اضغط على أيقونة ➕ في عرض "AI Agents & Tasks"
   - أدخل اسم الـ Persona (مثال: `AI-NARUTO`)
   - يُفتح ملف الـ Persona تلقائياً للتحرير

---

## 🎨 التخصيص

### ألوان الـ Persona

اختر من بين 16 لوناً جاهزاً أو استخدم منتقي الألوان المخصص:

- 🟣 بنفسجي (#667eea) – Backend/APIs
- 🟣 بنفسجي داكن (#764ba2) – قواعد البيانات
- 🌸 وردي (#f093fb) – Frontend/UI
- 🔵 أزرق (#4facfe) – DevOps
- 🟢 أخضر (#43e97b) – الاختبارات
- 🔴 أحمر (#fa709a) – الأمان
- 🟡 أصفر (#fee140) – التوثيق
- 🔷 سماوي (#30cfd0) – التكامل

---

## 🔍 كلمات مفتاحية مرتبطة

AI coding assistant, AI code assistant, AI coding agent, AI pair programmer,
أدوات ذكاء اصطناعي لـ VS Code، إنتاجية المطورين، VS Code extension،
IDE plugin, universal context hub, context sync, Kanban board, task management,
AI kernel, AI workspace, AI agents, personas, Pomodoro timer, analytics dashboard.

---

<a id="lang-hi-ext"></a>

<div align="center">

# AI Agent IDE Context Sync - VS Code एक्सटेंशन

![Version](https://img.shields.io/badge/version-2.0.10-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![VS Code](https://img.shields.io/badge/VS%20Code-1.80.0+-purple.svg)

**VS Code के अंदर आपका विज़ुअल AI Workspace मैनेजर।**

एडिटर छोड़े बिना AI personas, tasks और प्रोजेक्ट context को मैनेज करें।

</div>

---

## ✨ फ़ीचर्स

### 👥 AI Personas और Tasks मैनेजमेंट
- **Persona Create/Edit/Delete**: विज़ुअल इंटरफ़ेस से AI एजेंट्स मैनेज करें
- **Task Management**: tasks बनाएं, एडिट करें, archive करें, delete करें
- **Interactive Checklists**: क्लिक कर के आइटम done/undone करें
- **Hierarchical View**: Personas → Tasks → Checklist Items
- **Quick Actions**: कॉन्टेक्स्ट मेन्यू से कॉमन ऑपरेशन्स तक फास्ट एक्सेस

---

## 🚀 Installation

### Open VSX Registry से

1. VS Code खोलें
2. `Ctrl+Shift+X` (या Mac पर `Cmd+Shift+X`) दबाएँ
3. "AI Agent IDE Context Sync" सर्च करें
4. Install पर क्लिक करें

### VSIX फ़ाइल से

1. नवीनतम `.vsix` [Releases](https://github.com/anarkaike/ai-agent-ide-context-sync/releases) से डाउनलोड करें
2. VS Code खोलें
3. `Ctrl+Shift+P` (या `Cmd+Shift+P`) दबाएँ
4. "Install from VSIX" टाइप करें
5. डाउनलोड की गई फ़ाइल चुनें

---

## 📋 Usage

1. Activity Bar में AI Agent Sync आइकन पर क्लिक करें
2. ज़रूरत हो तो "Initialize Workspace" चलाएँ
3. "AI Agents & Tasks" व्यू से अपनी पहली persona और tasks बनाएँ

---

## 🔍 Related Keywords (Hindi)

AI coding assistant, AI code assistant, AI coding agent, AI pair programmer,
AI tools for VS Code, developer productivity, VS Code extension,
IDE plugin, universal context hub, context sync, Kanban board, task management,
AI kernel, AI workspace, AI agents, AI personas, Pomodoro timer, analytics dashboard.
