# 🔬 Analysis Micro-Kernel

Este sub-kernel define como realizar análises técnicas, diagnósticos de projeto e auditorias de código.
Ele transforma **observação** em **dados estruturados** para tomada de decisão.

## 🔗 Regra de Referência Cruzada (Docs ↔ Código)

1. **Entry points obrigatórios** (jobs, commands, handlers, controllers, services públicos) devem trazer o comentário:
   ```
   // 📘 Docs: docs/40--tech-manual/20--project-architecture-patterns/backend-patterns/<arquivo>.md
   ```
   Ajuste o caminho conforme o capítulo correspondente.
2. **Nova funcionalidade** → crie/atualize o `.md` no Tech Manual **antes** do código e inclua o comentário no PR inicial.
3. **Auditoria**: ao revisar legado, se o comentário estiver ausente ou desatualizado, corrija imediatamente (faz parte do Definition of Done).
4. **Múltiplos docs**: use comentários adicionais (um por linha) quando a classe representar fluxos diferentes.

> Esta regra vale para todos os agentes IA/humanos; sem o link o trabalho é considerado incompleto.

## 🎯 Objetivo
Identificar padrões, tecnologias, dívidas técnicas e lacunas de documentação sem alucinações.
O resultado de uma análise deve ser sempre um **Fato**, não uma opinião.

---

## 🔍 Workflow de Análise
Ao receber uma solicitação de análise ou ao iniciar um novo contexto:

1.  **Identificação (Fingerprinting):**
    *   Execute o `scanner--project-id.md` para entender o que é o projeto.
    *   Isso define quais outros scanners devem ser ativados.

2.  **Execução de Scanners Específicos:**
    *   Se Laravel detectado -> Execute `scanner--laravel.md` e consulte os playbooks do módulo `___laravel` para usar o MCP (Laravel Boost).
    *   Se Vue detectado -> Execute `scanner--vue.md`.
    *   Se Infra detectada -> Execute `scanner--infra.md`.

3.  **Consolidação (Output):**
    *   **Para Estado Perene:** Atualize o arquivo `.ai-doc/data/analysis/active-state.json` usando o template `tech-profile.json`. Se o arquivo não existir, copie o template da pasta `templates/` antes de preencher.
    *   **Para Relatório Pontual:** Crie um arquivo em `.ai-doc/data/analysis/findings/` com o padrão `analysis--[topico]--[data].md`.
4.  **Auto-Consciência (telemetria humana):**
    *   Execute `npm run ai:scan-proactive` (ou scripts equivalentes) para que o sistema registre automaticamente o estado inicial/final no `memory-log` e no Coffee-Break.
    *   Esses registros incluem humor, foco atual e sinais vitais (diferenças detectadas, falhas de scanners, etc.), permitindo auditoria rápida do kernel.

---

## 🛠️ Scanners Disponíveis

| Scanner | Trigger | Foco |
| :--- | :--- | :--- |
| `scanner--project-id.md` | Sempre | Identificar Stack, Linguagens e Frameworks base. |
| `scanner--laravel.md` | `composer.json` tem `laravel/framework` | Estrutura de Pastas, Models, Rotas, Pacotes. |
| `scanner--vue.md` | `package.json` tem `vue` | Components, Stores, Router, Build Tool. |
| `scanner--docs.md` | Sob demanda | Comparar código existente vs documentação em `.ai-doc/`. |
| *Templates* (`templates/`) | Sempre | Use `tmp--analytics--scanner.md` e `tech-profile.json` como base ao criar novos scanners/cache. |

---

## 📤 Integração com Outros Kernels

*   **Analysis -> Tasks:** Se a análise encontrar um bug ou falta de doc crítico:
    1.  Crie uma Task no kernel `___tasks` seguindo o template oficial.
    2.  Adicione link na Task apontando para o relatório de análise (`Contexto Herdado`).
    3.  Atualize o relatório de análise com link para a Task criada.
*   **Analysis -> Reports:** Se a análise for um pedido do usuário ("Como está o projeto?"), gere um Report no kernel `___reports`.
*   **Analysis -> Changelog:** Não interage diretamente.

---

## 🧩 Active State (DNA do Projeto)
O arquivo `active-state.json` na raiz deste módulo deve refletir a **realidade atual** do código.
Se não existir, inicialize a partir de `templates/tech-profile.json`.
Ele serve como "Cache de Contexto" para não precisarmos reler todo o código a cada prompt.

---

## 📁 Estrutura do Módulo
- `scanners/`: scanners padronizados (use o template `tmp--analytics--scanner.md` para novos).
- `tools/`: playbooks de ações (QA Lint, Health Check, etc.).
- `templates/`: modelos de scanners e do `tech-profile`.
- `scripts/`: reservado para utilitários internos (registre README se adicionar scripts).
