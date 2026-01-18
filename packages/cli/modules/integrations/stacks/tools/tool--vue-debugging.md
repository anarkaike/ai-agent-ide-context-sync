<!-- AI-DOC:CORE_START -->
- Prefira Composition API e mantenha template simples; lógica complexa vai para computed/composables.
- Preserve reatividade ao extrair `props`/estado; evite destructuring que quebra tracking.
- Não logue dados sensíveis em console ou logs persistidos.
<!-- AI-DOC:CORE_END -->

<!-- AI-DOC:FULL_START -->

# 🟩 Tool: Vue Debugging (Reatividade e Estado)
Playbook para diagnosticar problemas de reatividade, renderização e fluxo de estado em Vue.

## 🧭 Quando usar?
- UI não atualiza após mudança de estado.
- Watchers/computed com comportamento inesperado.
- Problemas de performance por re-render excessivo.

## ⚙️ Passo a passo
1. **Confirmar versão e setup**
   - Verifique dependências (`vue`, `nuxt`, `pinia`/`vuex`) e padrão de componentes (Options vs Composition).
2. **Isolar o fluxo mínimo**
   - Identifique o estado de entrada, a transformação (computed/watch) e a saída no template.
3. **Checar reatividade**
   - Em Vue 3, use `ref`/`reactive` corretamente e acesse `.value` em refs.
   - Ao extrair props/estado, preserve tracking (ex.: `toRefs` quando aplicável).
4. **Auditar watchers e efeitos**
   - Evite watcher em cascata; prefira computed para derivação.
5. **Revalidar com testes/build**
   - Rode scripts do projeto (lint/test/build) que existirem.

## 📌 Dicas
- Para toggles frequentes, `v-show` pode ser mais eficiente que `v-if` dependendo do caso.
- Em listas, `key` estável evita estados “fantasma” e renders erráticos.

## 🔗 Referências
- Componentes `.vue`
- Store (Pinia/Vuex) conforme padrão do repo

<!-- AI-DOC:FULL_END -->

