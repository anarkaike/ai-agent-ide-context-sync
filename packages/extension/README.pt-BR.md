# AI Agent IDE Context Sync - Extensão VS Code

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.10-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![VS Code](https://img.shields.io/badge/VS%20Code-1.80.0+-purple.svg)

**Gestão Completa do AI Kernel** diretamente no VS Code!

Gerencie suas personas de IA, tasks e contexto do projeto sem sair do editor.

[Funcionalidades](#-funcionalidades) • [Instalação](#-instalação) • [Uso](#-uso) • [Changelog](#-changelog)

> 🇺🇸 English version: [README.md](./README.md)

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
Basta **clicar em um item de checklist** para marcar como concluído/não concluído!

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

## 📦 Changelog

- English: [CHANGELOG.md](./CHANGELOG.md)
- Português (Brasil): [CHANGELOG.pt-BR.md](./CHANGELOG.pt-BR.md)

---

<div align="center">

**Pare de gerenciar contexto de IA manualmente. Use a interface visual!** 🚀

Feito com ❤️ por [Junio](https://github.com/anarkaike)

</div>
