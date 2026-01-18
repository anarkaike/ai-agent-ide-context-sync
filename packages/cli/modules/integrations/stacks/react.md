<!-- AI-DOC:CORE_START -->
- React: Prefira Functional Components e Hooks; evite Class Components.
- Hooks: Respeite as regras dos Hooks (top-level, sem condicionais).
- Props: Use chaves explícitas e estáveis em listas (key prop).
- State: Mantenha estado local mínimo; use Context/Global State apenas quando necessário (prop drilling excessivo).
<!-- AI-DOC:CORE_END -->

<!-- AI-DOC:FULL_START -->
# ⚛️ React Integration Module
Centraliza boas práticas para projetos React detectados via dependências.

## 🎯 Objetivo
Manter UI previsível, com re-render controlado, hooks corretos e estado bem delimitado.

## 🧩 Convenções
- Componentes funcionais como padrão.
- Estado local mínimo; eleve estado apenas quando precisar compartilhar.
- Side-effects em `useEffect` com dependências corretas.

## ✅ Padrão de Componente
```tsx
export function Button({ label, onClick }: { label: string; onClick: () => void }) {
  return <button onClick={onClick}>{label}</button>;
}
```

## ⚡ Performance
- Só use `useMemo`/`useCallback` quando houver evidência de custo (re-renders caros).
- Para listas longas, considere virtualização se o projeto já usar essa abordagem.

## 🧪 Testes
- Teste comportamento e acessibilidade, não detalhes de implementação.
- Use o framework/biblioteca de teste já adotado no projeto.
<!-- AI-DOC:FULL_END -->
