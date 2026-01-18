# Changelog (pt-BR)

Todas as mudanças relevantes da extensão "AI Agent IDE Context Sync" serão documentadas neste arquivo em português.

O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/)
e o versionamento adota [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Outros idiomas e documentos relacionados:
- English changelog: [CHANGELOG.md](./CHANGELOG.md)
- README (EN): [README.md](./README.md)
- README (PT-BR): [README.pt-BR.md](./README.pt-BR.md)

## [2.0.13] - 2026-01-18

### Alterado
- Atualização das instruções de kernel e playbooks de stack para Node/TS/React/Vue

## [2.0.12] - 2026-01-17

### Alterado
- Novo ícone principal destacando sync, kernel de IA e núcleo de sistema

## [2.0.11] - 2026-01-17

### Adicionado
- 📋 Subformulários interativos de checklist para campos de lista do frontmatter da persona (stack, goals, especialidades)

### Alterado
- Layout mais compacto para campos pequenos de frontmatter no webview de persona
- Grade de frontmatter reorganizada para evitar inputs ocupando a largura completa

## [2.0.10] - 2026-01-17

### Adicionado
- ✏️ Edição direta das seções markdown das personas via webview

### Alterado
- Sincronização das seções `##` do corpo com o formulário da persona
- Melhor alinhamento entre frontmatter e conteúdo detalhado da persona

## [2.0.9] - 2026-01-17

### Adicionado
- 🧩 Webview de formulário de persona com suporte completo ao frontmatter
- 📋 Webview de formulário de task com selects editáveis de status e persona
- 🗓️ Edição direta do deadline da task via webview
- 📚 Visualização das seções do markdown das tasks em cards (somente leitura)

### Alterado
- Atualização do frontmatter de tasks e personas diretamente a partir dos formulários
- Maior consistência entre frontmatter e conteúdo exibido nas webviews

### Corrigido
- Formulário de persona não carregando todos os campos do template markdown
- Select de status da task desabilitado e persona exibida apenas como texto

## [2.0.8] - 2026-01-17

### Adicionado
- 🧠 Integração do AI Kernel com a CLI global `ai-doc`
- 🗂️ Gestão de personas e tasks ciente do AI Workspace
- 🧱 Kanban Board com colunas `todo`, `in-progress`, `review` e `done`
- 🔗 Drag & drop com persistência de status no frontmatter das tasks
- 📈 Webview de Kernel Status com resumo estruturado do `ai-doc status`
- 💡 Webview de Heurísticas Aprendidas conectada ao motor global de heurísticas
- 👁️ Ação inline de "View Full Details" para personas
- 🧾 Tooltips ricas para personas com descrição e progresso de checklist

### Alterado
- Melhorias visuais no painel de Kernel Status
- Layout das heurísticas com contexto de tipo e stack
- Árvore de personas com ações inline (editar, excluir, customizar, visualizar)
- Melhor feedback de erros quando o workspace `.ai-workspace` não existe

### Corrigido
- Kanban deixando de mostrar tasks após mudança de status
- Fallback de status inválido para `todo` ao ler tasks antigas
- Sincronização entre personas globais e workspace local

## [2.0.1] - 2026-01-16

### Corrigido
- 🧩 Registro do comando do Kanban e comportamento em workspaces reais
- 📊 Itens de Analytics e Kernel Status clicáveis a partir da árvore lateral

### Alterado
- Melhor integração entre Kanban, Analytics e Kernel Status

## [2.0.0] - 2026-01-16

### Adicionado
- 🧱 **Kanban Board Avançado**
  - Webview dedicada `kanban.html`
  - Colunas `todo`, `in-progress`, `review` e `done`
  - Integração com `advanced-modules.js` para leitura de tasks
- 🌐 **Suporte a 12 idiomas**
  - Arquivos de locale em `packages/extension/locales/*.json`
  - Traduções para `ar`, `de`, `es`, `fi`, `fr`, `hi`, `it`, `ja`, `ko`, `zh-CN` e outros
- 🎨 **Temas**
  - Configuração de temas em `themes.json`
  - Paletas visuais para Kanban e dashboards
- 📊 **Analytics Avançado**
  - Métricas derivadas das tasks do Kanban
  - Base para relatórios semanais/mensais

### Alterado
- Estrutura interna ajustada para suportar Kanban, temas e múltiplos idiomas

## [1.6.0] - 2026-01-16

### Adicionado
- 🌐 **i18n básico**
  - Locales `en` e `pt-BR` para textos da extensão
  - Arquivos `locales/en.json` e `locales/pt-BR.json`
- 🔔 **Smart Notifications (fundação)**
  - Módulo central em `modules.js` para notificações inteligentes
  - Hooks para futura integração com tarefas e prazos
- 🧪 **Testes Automatizados**
  - Testes em `packages/extension/test/extension.test.js`
  - Runner em `packages/extension/test/runTest.js`

### Técnico
- Atualização de `package.json` com scripts de teste
- Empacotamento da versão `ai-agent-ide-context-sync-vscode-1.6.0.vsix`

## [1.5.0] - 2026-01-16

### Adicionado
- 🎨 **Customização de Persona**: Interface visual para customizar personas
  - 16 cores vibrantes pré-definidas
  - Seletor de cor customizada para opções ilimitadas
  - 24 emojis de ícone para escolher
  - Pré-visualização em tempo real
  - Configurações persistentes em `.persona-settings.json`
- Opção de menu de contexto para customizar personas
- Webview `customize-persona.html` para customização visual
- Comando helper de settings para carregar configurações de persona

### Alterado
- Exibição de personas aprimorada com cores e ícones customizados (quando configurados)
- Feedback visual melhorado na interface de customização

## [1.4.0] - 2026-01-16

### Adicionado
- ⏱️ **Timer Pomodoro** integrado na status bar
  - Modo Pomodoro de 25 minutos
  - Modo de pausa de 5 minutos
  - Suporte a duração customizada
  - Controles de Pausar/Retomar
  - Função de Reset
  - Contagem regressiva em tempo real na status bar
  - Notificações ao concluir
- 📤 **Exportar Tasks**: Funcionalidade de exportação com múltiplos formatos
  - Formato Markdown (agrupado por persona)
  - Formato JSON (dados estruturados)
  - Texto simples
  - Abertura automática do arquivo exportado
  - Inclui itens de checklist e progresso

### Alterado
- A status bar passa a mostrar a contagem regressiva do timer quando ativo
- Comando da status bar alterado para `timerMenu` para melhor UX
- StatusBarManager aprimorado com gestão de estado do timer

## [1.3.0] - 2026-01-16

### Corrigido
- 🎨 **Ícone da Sidebar**: Design do ícone aprimorado
  - Ícone de cérebro de IA no lugar do círculo simples
  - Adição de conexões de rede neural
  - Gradiente roxo de fundo (#667eea)
  - Melhor visibilidade em temas claro e escuro

## [1.2.0] - 2026-01-16

### Adicionado
- 📊 **Dashboard Interativo**: Analytics em tempo real com Chart.js
  - Gráfico de rosca mostrando distribuição de tasks por persona
  - Gráfico de barras mostrando progresso de conclusão de checklist
  - Lista de progresso por persona com barras visuais
  - Estatísticas de taxa global de conclusão
  - Auto-refresh a cada 5 segundos
  - Design moderno e responsivo alinhado ao tema do VS Code

### Alterado
- View de analytics aprimorada com gráficos visuais
- Agregação de dados melhorada para o dashboard

## [1.1.0] - 2026-01-16

### Adicionado
- ⚡ **Quick Picker** (`Ctrl+Shift+T`): Navegação rápida entre tasks
  - Busca fuzzy em todas as tasks
  - Opção para criar nova task
  - Mostra indicadores de progresso
  - Atualiza a status bar ao selecionar
- 🔍 **Busca Global** (`Ctrl+Shift+F`): Busca em tasks e checklists
  - Busca em títulos de tasks
  - Busca em itens de checklist
  - Mostra contagem de matches e localização
  - Preview das linhas com match
- 📊 **Status Bar**: Exibe a task ativa
  - Mostra a task atual na status bar
  - Clique para abrir o Quick Picker
  - Tooltip com detalhes da task
  - Comando para limpar a task ativa

### Alterado
- Workflow mais orientado a teclado
- Capacidades de busca aprimoradas

## [1.0.1] - 2026-01-16

### Corrigido
- ❌ Removidos ícones \"+\" duplicados em itens de ação
- 📄 Correções na exibição do Kernel Status
  - Remoção de códigos de cor ANSI
  - Parsing estruturado da saída de status
  - Ícones adequados para cada item de status
  - Legibilidade aprimorada

### Alterado
- UI mais limpa com uso adequado de ícones
- Melhor apresentação das informações de status

## [1.0.0] - 2026-01-16

### Adicionado
- 👥 **Gestão de Personas**: CRUD completo de personas
  - Criar novos agentes de IA
  - Editar arquivos de persona
  - Excluir personas
  - Ver detalhes completos
- 📋 **Gestão de Tasks**: Ciclo de vida completo de tasks
  - Criar tasks com templates
  - Editar arquivos de task
  - Excluir tasks
  - Arquivar tasks concluídas
  - Checklist interativo com toggle
- 📊 **View de Analytics**: Estatísticas em tempo real
  - Contagem de personas
  - Contagem de tasks ativas
  - Contagem de tasks concluídas
  - Taxa de conclusão de checklists
- ⚙️ **Kernel Status**: Monitoramento em tempo real do kernel
  - Informações de versão
  - Contagem de heurísticas
  - Informações do projeto
  - Status de inicialização
- 🎨 **UI Moderna**: Interface profissional
  - Tree view hierárquica
  - Menus de contexto
  - Ícones e cores
  - Auto-refresh em mudanças de arquivo
- 🔨 **Build & Sync**: Gestão de contexto
  - Comando para construir contexto
  - Inicialização do workspace
  - Monitoramento de status de sync

### Técnico
- Data providers de árvore para Personas, Status e Analytics
- Watchers de sistema de arquivos para auto-refresh
- Integração com Command Palette
- Ícone na Activity Bar
- Três views de sidebar

---

## Histórico de Versões

- **2.0.10** – Edição de seções markdown das personas pelo webview
- **2.0.9** – Webviews de Persona e Task com edição completa de frontmatter
- **2.0.8** – Integração com AI Kernel, Kanban e Webviews
- **2.0.1** – Correções do Kanban e views clicáveis
- **2.0.0** – Edição Enterprise (Kanban, 12 idiomas, temas e analytics avançado)
- **1.6.0** – i18n, Smart Notifications e suíte de testes
- **1.5.0** – Customização de Persona
- **1.4.0** – Timer e Export
- **1.3.0** – Melhorias de ícone
- **1.2.0** – Dashboard interativo
- **1.1.0** – Quick Picker e Busca
- **1.0.1** – Correções de UI
- **1.0.0** – Lançamento inicial

---

## Funcionalidades Futuras

### Smart Notifications Roadmap
- 🔔 Lembretes automáticos para tasks paradas
- 📅 Alertas de deadline
- 🎉 Celebrações de conclusão
- 📈 Insights de produtividade
