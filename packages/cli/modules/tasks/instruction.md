---
type: action
---

<!-- AI-DOC:CORE_START -->
- Colete título, objetivo e (se aplicável) persona; avance com defaults quando usuário disser “siga/ok”.
- Evite duplicidade: busque tasks/análises existentes antes de criar algo novo.
- Sempre gere checklist atômico e critérios de pronto (DoD).
- Mapeie contexto do projeto (docs, análises, tasks e arquivos foco) dentro da task.
- Ao concluir e sincronizar, remova o arquivo local e registre a evidência no sistema externo.
<!-- AI-DOC:CORE_END -->

<!-- AI-DOC:FULL_START -->

# 📝 Protocolo: Criar Nova Task

> **ID**: `NOVA-TASK`
> **Objetivo**: Guiar o Agente de IA na criação de uma nova task de desenvolvimento seguindo os padrões do projeto.
> **Contexto**: O usuário deseja iniciar um trabalho novo.

---

## 🤖 Instruções para o Agente de IA

Ao ser acionado para criar uma nova task, siga este fluxo rigorosamente:

### 1. 📋 Coleta de Dados (Entrevista)

Pergunte ao usuário as seguintes informações (uma pergunta por vez ou em bloco, conforme a preferência do usuário):

1.  **Título da Task**: Um nome curto e descritivo (ex: "Implementar Login Social").
2.  **Objetivo Principal**: O que deve ser alcançado?
3.  **Persona (Opcional)**: Qual IA deve assumir a task?
    *   *Instrução*: Liste as opções via `npm run ai:list-ids` (SSoT: `~/.ai-doc/data/identity/identities.json`).
    *   *Opção Extra*: Adicione uma última opção "Criar Nova IA" (Se escolhida, sugira executar a action `CRIAR IA NOVA`).
    *   *Sugestão*: Se não informado, sugira com base no tipo da task (ex: Sasuke para Backend/Segurança).
4.  **Tipo de Task**: Feature, Bugfix, Refactor, Test, Docs?
5.  **   *Epic Relacionado (Opcional)*: Se fizer parte de um epic ativo, registrar `epic_id` ou link para o arquivo em `.ai-workspace/epics/`.

#### 🤖 Sugestão Automática (quando o usuário apenas disser “siga”)

Se qualquer um dos campos acima não for respondido explicitamente:

1. Consulte o histórico recente (`.ai-workspace/tasks/`, `project-state.json`, `lint-report.md`) para inferir o título/objetivo mais provável.
2. Proponha valores default com justificativa curta (ex.: “Título sugerido: PoC Vitest 4 — mantendo alinhamento com a task-mãe AI-INUYASHA…”).
3. Caso o usuário apenas confirme com “siga/ok”, use os valores sugeridos e registre essa decisão no histórico da nova task.

> Meta: nunca travar a criação de tasks por falta de resposta; ofereça um caminho padrão e avance após confirmação simples.

### 2. 🕵️ Verificação de Duplicidade e Contexto

Antes de criar o arquivo, verifique se a task já existe ou se há material de análise prévio:

1.  **Busca**: Pesquise por palavras-chave do título/objetivo na pasta raiz `.ai-workspace/tasks/`.
2.  **Cenário A: Encontrado em Backlog ou Análises**
    *   **Onde**: `.ai-workspace/analysis/findings/` (procure por arquivos recentes)
    *   **Ação**: **NÃO CRIE** um arquivo duplicado se for apenas uma evolução direta.
    *   **Procedimento**:
        1.  Crie a nova task normalmente (passo 3).
        2.  **Copie** todo o conteúdo útil do arquivo de análise.
        3.  Insira esse conteúdo em uma nova seção na nova task chamada `## 📚 Contexto Herdado (Análise)`.
        4.  Adicione link reverso na Análise: "Migrado para [Link da Nova Task]".

3.  **Cenário B: Encontrado Task Ativa**
65→    *   *Onde*: `.ai-workspace/tasks/` (arquivos soltos).
    *   *Ação**: **NÃO CRIE** um novo arquivo.
    *   *Procedimento*:
        1.  Leia o arquivo existente.
        2.  Compare o objetivo da nova solicitação com o conteúdo atual.
        3.  **Se for o mesmo escopo**: Atualize o arquivo existente.
        4.  **Se for uma extensão**: Adicione uma nova seção `## 🔄 Atualização {DATA}`.

### 3. 🗺️ Mapeamento de Contexto (Obrigatório)

Durante a criação da task, você **DEVE** buscar conexões em todo o projeto e adicionar as seguintes seções ao corpo do arquivo:

```markdown
## 🗺️ Mapa de Contexto do Projeto

**📚 Documentação Relacionada:**
- [Título do Doc](caminho) - *Breve explicação da relação*

**🔬 Análises Prévias:**
- [Título da Análise](caminho) - *Link para análise se houver*

**📋 Tasks Relacionadas:**
- [ID/Nome Task](caminho) (Status: In-Dev) - *O que tem a ver?*

**💻 Arquivos de Código Principais (Foco):**
- [Nome do Arquivo](caminho) - *O que é?*
- [Nome do Arquivo](caminho) - *O que é?*
```

### 4.  Definição de Caminho

Se a task não existir (ou for criada a partir de backlog/análise), defina o nome do arquivo na raiz de `.ai-workspace/tasks/`:

*   **Padrão**: `.ai-workspace/tasks/AI-{PERSONA}--TASK-{YYYYMMDD}--{TITULO-SLUG}.md`
*   **Exemplo**: `.ai-workspace/tasks/AI-SASUKE--TASK-20251228--implementar-login-social.md`

### 5. 📄 Geração do Arquivo

Crie o arquivo usando o template padrão: `~/.ai-doc/kernel/modules/tasks/templates/template.md`.

**Conteúdo Obrigatório no Frontmatter:**
```yaml
---
type: task
status: in_progress
priority: medium
owner: AI-{PERSONA} ({USER_NAME})
start_date: {YYYY-MM-DD}
epic_id: EPIC-slug # opcional, mas recomendado quando aplicável
---
```

**Seções Obrigatórias:**
1.  **Contexto**: Resumo do objetivo.
2.  **Mapa de Contexto**: As 4 seções mapeadas no passo 3.
3.  **Passo a Passo (Checklist)**: Quebre a task em passos atômicos.
4.  **Definição de Pronto (DoD)**: Critérios para finalizar.

### 6. 🚀 Próximos Passos

Após criar o arquivo:
1.  Confirme a criação para o usuário com o link do arquivo.
2.  Pergunte: *"Deseja que eu comece a executar o primeiro item do checklist agora?"*

### 7. 🧼 Pós-Conclusão e Sincronização

1.  Ao concluir a task e sincronizá-la com o ClickUp (card criado/atualizado, evidências anexadas), **remova o arquivo local correspondente de `.ai-workspace/tasks/`**.
2.  Registre essa remoção no comentário final do ClickUp e (se aplicável) nas seções de histórico da task-mãe/analysis.
3.  Mantenha somente tasks ativas em disco; tasks concluídas devem existir apenas como histórico no ClickUp/sistemas externos.

## 📜 Histórico de Alterações

| Data | Autor | Descrição |
| :--- | :--- | :--- |
| 2025-12-30 | AI System | Padronização automática de estrutura e metadados. |
| 2026-01-07 | AI-JAY | Regra adicionada: remover arquivos locais após sincronizar tasks concluídas com o ClickUp. |

<!-- AI-DOC:FULL_END -->
