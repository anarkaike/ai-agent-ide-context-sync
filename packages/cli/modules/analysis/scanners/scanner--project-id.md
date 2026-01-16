---
type: scanner
name: scanner--project-id
description: Scanner primário para fingerprint do projeto antes de executar análises específicas.
---

# 🕵️ Scanner: Identificação de Projeto (Fingerprinting)
> **Objetivo**: mapear rapidamente stack backend/frontend, linguagem dominante e topologia de arquitetura.  
> **Contexto**: rodar ao entrar em um novo repositório ou quando houver suspeita de mudança estrutural (mudança de framework, migração infra, etc.).

---

## 🧩 Identificação
- **ID**: `scanner--project-id.md`
- **Categoria**: core
- **Dependências**:
  - Scripts: `node .ai-doc/kernel/scripts/reports/analyze-project.js`
  - Ferramentas MCP: FileSystem (listar/ler arquivos), code_search
  - Arquivos de cache: `.ai-doc/data/analysis/active-state.json` (se inexistente, inicialize com `templates/tech-profile.json`)

---

## ⚙️ Pré-Requisitos
1. Workspace sincronizado com branch alvo.
2. `composer.json`, `package.json` e arquivos de infraestrutura acessíveis.
3. (Opcional) Ter rodado `npm install`/`composer install` se precisar inspecionar lockfiles.

---

## 🛰️ Fluxo de Execução
1. **Fingerprint**
   - `ls -a` para confirmar presença de manifestos (composer.json, package.json, Dockerfile).
   - Output esperado: lista de arquivos-chave para as próximas etapas.
2. **Coleta Primária**
   - `cat composer.json | jq '.require'`
   - `cat package.json | jq '.dependencies'`
   - Validar: se frameworks principais estão presentes e versões coerentes.
3. **Análise**
   1. Classificar backend (PHP/Laravel, Node, etc.) a partir do manifesto.
   2. Mapear frontend (Vue/React/etc.) e toolchain (Vite/Webpack).
   3. Checar infraestrutura mínima: Dockerfile, docker-compose, `.github/workflows`, `.env.example`.
4. **Síntese & Ações**
   - Atualize `.ai-doc/data/analysis/active-state.json` com `tech_stack` e `architecture` (crie a partir do template se não existir).
   - Gerar finding curto em `.ai-doc/data/analysis/findings/analysis--fingerprint--YYYYMMDD.md`.
   - Se detectar inconsistências (ex.: falta de manifesto), abrir task em `___tasks`.

> **Dica**: priorize leitura direta dos manifestos atuais. Se detectar divergência entre lockfiles e manifests, registrar no relatório.

---

## 📤 Saídas Esperadas
- `.ai-doc/data/analysis/findings/analysis--fingerprint--YYYYMMDD.md`
- `.ai-doc/data/analysis/active-state.json` atualizado
- Comentário/log no quadro de tasks ativo descrevendo mudanças relevantes.

---

## ✅ DoD (Definition of Done)
1. Stack backend/frontend documentada com versões.
2. Arquitetura (monólito/API/microservices) identificada com justificativa.
3. Dependências críticas e gaps de infra (CI, Docker, env) listados.

---

## 🧪 Troubleshooting
| Sintoma | Causa comum | Correção |
| :--- | :--- | :--- |
| Manifesto ausente (`composer.json` ou `package.json`) | Repo parcial/módulo específico | Verificar subpastas (`api/`, `frontend/`) e rodar scanner nelas. |
| Versões inconsistentes entre `composer.json` e `composer.lock` | Instalação desatualizada | Rodar `composer install` ou atualizar lock antes de concluir. |
| Arquitetura não conclusiva | Repositório híbrido ou incompleto | Complementar com leitura de `docs/40--tech-manual` ou arquivos infra. |

---

## 📚 Referências
- `.ai-doc/ai-modules/___analysis/templates/tmp--analytics--scanner.md`
- `docs/40--tech-manual/20--project-architecture-patterns/README.md`

---

## 📜 Histórico
| Data | Autor | Mudança |
| :--- | :--- | :--- |
| 2026-01-05 | AI Agent | Migração para template padronizado. |

---

## 🎯 Objetivos do Scanner
1. Identificar linguagem e frameworks principais (backend/frontend).
2. Determinar padrões de arquitetura e componentes infra obrigatórios.
3. Referenciar arquivos que direcionam scanners específicos (Laravel/Vue/etc.).

## ⚙️ Trigger / Quando rodar
- [ ] Novo repositório ou branch com stack desconhecida.
- [ ] Antes de qualquer scanner especializado (Laravel, Vue, Infra).

## 📋 Checklist de Preparação
1. Confirmar contexto atualizado em `.ai-doc/data/analysis/active-state.json`.
2. Verificar se existe relatório prévio relacionado em `.ai-doc/data/analysis/findings/`.
3. (Opcional) Conferir tasks abertas vinculadas (linkar IDs).

## 🔬 Pontos de Análise
### 1. Backend & Linguagem
- [ ] Verificar `composer.json` → dependências e versão PHP.
- [ ] Procurar `requirements.txt`, `pyproject.toml`, `Gemfile`, `go.mod` para stacks alternativas.

### 2. Frontend & JS Ecosystem
- [ ] Inspecionar `package.json` para frameworks, meta-frameworks e build tools.
- [ ] Checar existência de `tsconfig.json`, `vite.config.*`, `webpack.config.*`.

### 3. Infraestrutura & DevOps
- [ ] Confirmar presença de `Dockerfile`, `docker-compose.yml`.
- [ ] Validar pipeline em `.github/workflows`.
- [ ] Verificar `.env.example` e scripts de provisionamento.

## 🧪 Evidências Necessárias
| Fonte | Comando/Arquivo | O que coletar |
| --- | --- | --- |
| Manifesto backend | `composer.json`, `composer.lock` | Framework, versão PHP, pacotes chave |
| Manifesto frontend | `package.json`, `pnpm-lock.yaml` | Framework, bundler, libs UI |
| Infra | `Dockerfile`, `.github/workflows/*.yml` | Deploy, build, CI |

## 🧠 Conexões com outros kernels
- **Docs**: atualizar `docs/40--tech-manual/00--lookups.md` se surgirem novos stacks.
- **Tasks**: abrir task se faltar manifesto crítico ou houver divergência grave em active-state.
- **Reports**: incorporar resumo em health-checks solicitados.
- **___laravel**: se detectar Laravel, encaminhe imediatamente para `___laravel` para usar o MCP (Laravel Boost) antes dos scanners especializados.

## 📝 Saída Esperada (JSON Fragment)
```json
{
  "stack": {
    "backend": "Laravel 10",
    "frontend": "Vue 3",
    "database": "MySQL (deduzido de config)",
    "language": "PHP 8.2"
  },
  "architecture": {
    "type": "Monolith | API Only | Microservices",
    "is_headless": false
  }
}
```

## ✅ Pós-execução
1. Atualize o arquivo em `.ai-doc/data/analysis/findings/analysis--fingerprint--{{YYYYMMDD}}.md`.
2. Caso tenha atualizado estado perene, sincronize `active-state.json`.
3. Informe stakeholders (task/comment) com principais achados.
