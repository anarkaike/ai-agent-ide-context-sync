<!-- AI-DOC:CORE_START -->
- Vue: Prefira Composition API (<script setup>) para novos projetos Vue 3.
- Reactivity: Entenda ref vs reactive; evite destructuring de props sem `toRefs`.
- Lifecycle: Use hooks onMounted, onUnmounted adequadamente para side-effects.
- Template: Evite lógica complexa no template; use computed properties.
<!-- AI-DOC:CORE_END -->

<!-- AI-DOC:FULL_START -->
# 🟩 Vue Integration Module
Centraliza boas práticas para projetos Vue detectados via dependências.

## 🎯 Objetivo
Manter reatividade e composição previsíveis, com templates simples e side-effects controlados.

## 🧩 Convenções (Vue 3)
- Prefira `<script setup>` para novos componentes.
- Defina `props` e `emits` com tipagem/validação conforme o padrão do projeto.
- Evite lógica complexa no template; use `computed` e métodos.

## ✅ Exemplo
```vue
<script setup lang="ts">
import { computed, ref } from 'vue';

const count = ref(0);
const double = computed(() => count.value * 2);
</script>
```

## 🧠 Reatividade
- Entenda `ref` vs `reactive`.
- Ao extrair props/estado, preserve reatividade (ex.: `toRefs` quando aplicável).

## ⚡ Performance
- Use `key` em `v-for` sempre.
- Para toggles frequentes, considere `v-show`; para render condicional real, `v-if`.

## 🧰 Estado global
- Use a store já adotada no projeto (ex.: Pinia/Vuex) e mantenha módulos pequenos e tipados.
<!-- AI-DOC:FULL_END -->
