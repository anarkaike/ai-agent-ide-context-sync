---
title: Snapshot de Contexto - Restauração de Estado (Adaptive Tone & Swarm)
status: active
priority: high
created_at: 2026-02-06
tags: [context, snapshot, restoration, adaptive-tone, swarm, sbt]
---

# 📸 Snapshot de Contexto: Adaptive Tone, Swarm & Risk UI

> **Objetivo**: Este arquivo serve como um ponto de restauração completo para o Agente. Ao ler este arquivo, o Agente deve ser capaz de retomar o desenvolvimento exatamente de onde parou, com todo o contexto técnico e decisional preservado.

## 1. 🧠 Estado Atual do Desenvolvimento

Estamos no meio da implementação de um sistema de **"Adaptive Tone" (Tom Adaptativo)** que conecta a análise emocional/psicológica do agente à UI, CLI e parâmetros do LLM. Também estamos avançando na **Delegação via Swarm** e **Rastreamento via SBT (Soulbound Tokens)**.

### 1.1. Funcionalidades Implementadas (Recentemente)

#### 🎭 Adaptive Tone System
- **Conceito**: O agente muda de "Tom" (Neutral, Focused, Creative, Urgent, Cautious) baseado no contexto.
- **Persistência**: O estado do tom é salvo em `.ai-workspace/live-state/ui-tone.json`.
- **UI (Desktop/Dashboard)**: `App.jsx` lê esse estado e altera cores/bordas/emojis da interface.
- **CLI**: Script `ai-tone.sh` e comandos `ai-doc tone set <mode>` alteram a cor do prompt do terminal.
- **LLM Parameters (Em Progresso)**: Criamos `ToneConfigManager.js` para mapear tons para `temperature`, `max_tokens` e `model_hint`.

#### 🚦 Botões de Risco (Risk-Based Approval)
- **Lógica Refinada**: A UI de aprovação agora muda os labels baseada no risco.
  - **Alto Risco**: `[Aprovar Este]`, `[Reprovar Todos]`, `[Aprovar Somente]`, `[Reprovar Exceto]`.
  - **Baixo Risco**: `[Aprovar Todos]`, `[Reprovar Este]`, `[Aprovar Exceto]`, `[Reprovar Somente]`.
- **Objetivo**: Forçar consciência do usuário em ações perigosas.

#### 🐝 Swarm Delegation
- **Comando**: `ai-doc swarm delegate <agent-id> <message>`.
- **Mecanismo**: O CLI executa comandos no diretório do agente alvo.
- **Segurança**: Implementamos `SafetyFilter` e `TrustSystem` (em `task.js`) para interceptar tarefas remotas e marcar como `pending_approval` se a confiança for baixa (<50).

#### 💎 SBT (Soulbound Tokens) & Vault
- **Vault Global**: SBTs são armazenados em um Vault global (simulado ou real) para persistência entre projetos.
- **Visualização**: Dashboard (`dashboard.html`) e TreeView (`extension.js`) exibem os SBTs com ícones baseados no tipo (Achievement, Skill, Security).
- **Rollback (WAL)**: `ExecutionJournal.js` implementa Write-Ahead Logging para permitir rollback atômico de operações de arquivo.

## 2. 📂 Arquivos Chave Modificados

| Arquivo | Caminho Relativo | Responsabilidade |
| :--- | :--- | :--- |
| **ToneConfigManager.js** | `packages/cli/core/ToneConfigManager.js` | Mapeia tons para parâmetros de LLM (temp, model). **(Recém criado/limpo)** |
| **PromptGenerator.js** | `packages/cli/core/PromptGenerator.js` | Injeta instruções de tom nos prompts gerados. |
| **ai-doc.js** | `packages/cli/cli/ai-doc.js` | CLI Entrypoint. Comandos `tone` e `swarm`. |
| **App.jsx** | `packages/desktop-ui/src/App.jsx` | UI React. Gerencia estado global de tom e botões de risco. |
| **task.js** | `packages/cli/cli/commands/task.js` | Lógica de Tasks. Interceptação de segurança Swarm. |
| **verify-tone-params.js** | `packages/cli/tests/verify-tone-params.js` | Script de teste para validar a integração Tone -> LLM. |
| **Registry.js** | `packages/cli/core/swarm/Registry.js` | Registro global de agentes Swarm. |

## 3. 🚀 Próximos Passos (Roadmap Imediato)

1.  **Validar Integração Tone -> LLM**:
    *   Certificar que `AIClient` no VS Code (ou CLI) está realmente usando os parâmetros do `ToneConfigManager` ao chamar a API de LLM.
    *   *Status*: `ToneConfigManager` criado, mas a injeção dinâmica nos requests do `AIClient` precisa ser verificada/finalizada.

2.  **Validar Delegação Swarm**:
    *   Testar o comando `ai-doc swarm delegate` em um cenário real entre dois projetos/agentes locais.
    *   Verificar se a tarefa aparece como "Intercepted/Pending Approval" no agente destino.

3.  **Refinar Modulação Emocional**:
    *   Expandir a lógica de "min/max chars" nas respostas do agente conforme a "paciência" (simulada pelo tom).

## 4. 📝 Instruções de Restauração

**Se você é o Agente lendo isso no futuro:**

1.  Leia `packages/cli/core/ToneConfigManager.js` para entender a lógica de mapeamento de LLM.
2.  Verifique `.ai-workspace/live-state/ui-tone.json` para saber o último estado emocional.
3.  Execute `node packages/cli/tests/verify-tone-params.js` para confirmar que os parâmetros estão sendo gerados corretamente.
4.  Continue a implementação focando em **conectar o ToneConfigManager ao AIClient** (se ainda não estiver 100% acoplado).

---
*Snapshot gerado em: 2026-02-06*
