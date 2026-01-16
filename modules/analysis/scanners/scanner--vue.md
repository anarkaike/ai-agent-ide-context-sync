---
type: scanner
name: scanner--vue
description: Scanner voltado ao ecossistema Vue.js quando `package.json` contém dependências `vue`.
---

# 💚 Scanner: Vue.js Ecosystem
> **Objetivo**: identificar versão, padrões arquiteturais e tooling do front-end Vue.  
> **Contexto**: rodar após fingerprint quando `package.json` lista `vue`.

---

## 🧩 Identificação
- **ID**: `scanner--vue.md`
- **Categoria**: frontend
- **Dependências**:
  - Scripts: `npm list vue`, `npx vite --version` (se aplicável)
  - Ferramentas MCP: FileSystem para `resources/js`, `src/`, `package.json`
  - Arquivos de cache: `.ai-doc/data/analysis/active-state.json` (use `templates/tech-profile.json` se precisar criar)

---

## ⚙️ Pré-Requisitos
1. `npm install`/`pnpm install` realizados (para inspecionar lockfiles).
2. Acesso às pastas `resources/js`, `src`, `components`, `stores`.
3. (Opcional) Ambiente com `node` >= versão do projeto para rodar scripts.

---

## 🛰️ Fluxo de Execução
1. **Fingerprint Vue**
   - `cat package.json | jq '.dependencies.vue'`
   - Detectar libs associadas (Pinia, Vuex, Router, Tailwind, UI kits).
2. **Coleta Primária**
   - Listar diretórios `resources/js/Layouts`, `Pages`, `stores`.
   - `ls vite.config.*`/`webpack.mix.js`.
3. **Análise**
   1. Versão e API (Composition, `<script setup>`, Options).
   2. Estado global (Pinia, Vuex, composables).
   3. Router e integração (SPA tradicional, Inertia).
   4. UI toolkit e design system.
4. **Síntese & Ações**
   - Atualizar active-state (`tech_stack.vue`).
   - Registrar finding com recomendações (ex.: migrar Vuex → Pinia).
   - Criar task se houver dívida crítica (ex.: ausência de tipagem em projeto TS).

> **Dica**: observar `resources/js/bootstrap.ts` e `app.js` para detectar mix Laravel+Vue.

---

## 📤 Saídas Esperadas
- `.ai-doc/data/analysis/findings/analysis--vue--{{YYYYMMDD}}.md`
- Bloco `vue` atualizado em `active-state.json`.
- Insights registrados no board (task/comment) se necessário.

---

## ✅ DoD (Definition of Done)
1. Versão do Vue e estilo (Options/Composition) definidos.
2. Estado global, router e UI framework documentados.
3. Recomendação para dívidas (ex.: upgrade, organização de pastas).

---

## 🧪 Troubleshooting
| Sintoma | Causa comum | Correção |
| :--- | :--- | :--- |
| `package.json` sem `vue`, mas código usa Vue | Dependência via subpacote/frontend separado | Verificar subpastas (`frontend/`, `resources/js`). |
| Difícil identificar API (Options vs Composition) | Projeto híbrido ou migração em andamento | Procurar `<script setup>` e `defineComponent`. |
| Router inexistente | Páginas SSR/Inertia | Confirmar se Inertia controla navegação via Laravel. |

---

## 📚 Referências
- `docs/55--tech-stack/vue.md`
- `.ai-doc/ai-modules/___analysis/templates/tmp--analytics--scanner.md`

---

## 📜 Histórico
| Data | Autor | Mudança |
| :--- | :--- | :--- |
| 2026-01-05 | AI Agent | Migração para template padronizado. |

---

## 🎯 Objetivos do Scanner
1. Validar versão e paradigmas (Options vs Composition).
2. Mapear gerenciadores de estado, router e integração com Laravel.
3. Listar toolchain (build, UI kit, testes) para orientar decisões.

## ⚙️ Trigger / Quando rodar
- [ ] `package.json` contém `vue`.
- [ ] Existe `resources/js/app.js` ou `src/main.ts`.

## 📋 Checklist de Preparação
1. Revisar active-state para ver último snapshot frontend.
2. Procurar findings anteriores sobre Vue.
3. (Opcional) Rodar `npm run build -- --dry-run` para checar toolchain.

## 🔬 Pontos de Análise
### 1. Versão e Estilo
- [ ] Vue 2 ou Vue 3?
- [ ] Options API vs Composition / `<script setup>`?
- [ ] Uso de TypeScript (`tsconfig.json`)?

### 2. Estado Global
- [ ] Pinia? Vuex? Composables?
- [ ] Estrutura dos stores (modular, auto-import)?

### 3. Roteamento & Navegação
- [ ] Presença de `vue-router` (SPA) ou Inertia (SSR híbrido)?
- [ ] Estrutura de `pages`/`views` e guards.

### 4. UI & Tooling
- [ ] Tailwind, Vuetify, Quasar, PrimeVue ou libs custom?
- [ ] Ferramentas de teste (Vitest, Cypress, Playwright).

## 🧪 Evidências Necessárias
| Fonte | Comando/Arquivo | O que coletar |
| --- | --- | --- |
| package.json | dependências | Versão do Vue, libs associadas |
| resources/js/ | estrutura | Layouts, Pages, componentes |
| vite.config.ts / webpack | config | Toolchain e plugins |
| tests/ | specs JS/TS | Presença de testes front |

## 🧠 Conexões com outros kernels
- **Docs**: atualizar `docs/55--tech-stack/vue.md` se houver mudanças.
- **Tasks**: abrir task para migração (ex.: Vuex → Pinia) se necessário.
- **Reports**: incluir achados em health-check do frontend.

## 📝 Saída Esperada (JSON Fragment)
```json
{
  "vue": {
    "version": "3.3",
    "style": "Composition API",
    "store": "Pinia",
    "router": "Inertia",
    "ui": "Tailwind + Shadcn"
  }
}
```

## ✅ Pós-execução
1. Atualize finding específico (`analysis--vue--{{YYYYMMDD}}.md`).
2. Caso necessário, sincronize `active-state.json`.
3. Reporte achados no board (task/comment) com links.
