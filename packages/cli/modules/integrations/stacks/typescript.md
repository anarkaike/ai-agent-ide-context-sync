<!-- AI-DOC:CORE_START -->
- TypeScript: Use "strict: true" no tsconfig; evite "any" a todo custo.
- Tipagem: Prefira Interfaces para objetos públicos e Types para uniões/interseções.
- Generics: Use Generics para componentes/funções reutilizáveis e type-safety.
- Async: Tipar Promises explicitamente (ex.: Promise<User>) quando não inferido.
<!-- AI-DOC:CORE_END -->

<!-- AI-DOC:FULL_START -->
# 🟦 TypeScript Integration Module
Centraliza boas práticas para projetos TypeScript detectados via `tsconfig.json` ou dependências.

## 🎯 Objetivo
Maximizar segurança de tipos, reduzir bugs em runtime e manter APIs internas previsíveis.

## 🧩 Convenções
- Deixe o TypeScript inferir tipos quando óbvio; explicite quando fizer parte de API pública.
- Prefira `unknown` no lugar de `any`, com narrowing via type guards.
- Trate `null`/`undefined` explicitamente (com `strictNullChecks`).

## ✅ Padrões de Tipagem
```ts
interface User {
  id: string;
  name: string;
}

type ID = string | number;
```

## 🧰 Boas Práticas
- Use utility types (`Partial`, `Pick`, `Omit`, `Record`) para derivar tipos.
- Prefira union types e objetos `as const` quando fizer sentido.
- Evite suppress de erro; quando inevitável, limite o escopo ao mínimo necessário e corrija a causa raiz.
<!-- AI-DOC:FULL_END -->
