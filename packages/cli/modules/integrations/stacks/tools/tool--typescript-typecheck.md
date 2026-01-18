<!-- AI-DOC:CORE_START -->
- Nunca “corrija” TypeScript com `any`; prefira `unknown` + narrowing.
- Se `strict` estiver ativo, mantenha compatibilidade e trate null/undefined.
- Se o projeto tem lint/typecheck, rode antes de concluir mudanças.
<!-- AI-DOC:CORE_END -->

<!-- AI-DOC:FULL_START -->

# 🟦 Tool: TypeScript Typecheck & Narrowing
Playbook para diagnosticar e resolver erros de TypeScript sem perder segurança de tipos.

## 🧭 Quando usar?
- Falhas em `tsc`, typecheck de CI ou bundler (Vite/Next/Nuxt).
- Refactors grandes que quebram contratos de tipos.
- Integrações onde o payload é desconhecido e precisa de validação.

## ⚙️ Passo a passo
1. **Encontrar o comando oficial do repo**
   - Leia `package.json` e procure por `typecheck`, `tsc`, `build`, `lint`.
2. **Rodar o typecheck**
   ```bash
   npm run typecheck
   ```
   - Se não existir, use o que o projeto já usa (ex.: `npm run build` ou `npx tsc -p tsconfig.json --noEmit`).
3. **Classificar o erro**
   - Incompatibilidade de contrato (tipos divergentes entre camadas).
   - Nullability (`undefined`/`null`).
   - Inferência quebrada após refactor.
4. **Corrigir sem degradar tipagem**
   - Prefira type guards:
   ```ts
   function isUser(x: unknown): x is { id: string } {
     return typeof x === 'object' && x !== null && 'id' in x;
   }
   ```
   - Para dados externos, valide na borda (schema/runtime) e tipa o resultado validado.
5. **Revalidar**
   - Reexecute typecheck e os testes/lint relevantes.

## 📌 Dicas
- Se o projeto usa `strict`, evite soluções que “empurrem” o problema via asserts (`as`) sem evidência.
- Use `satisfies` quando quiser checar forma sem perder inferência.

## 🔗 Referências
- `tsconfig.json`
- `package.json` scripts

<!-- AI-DOC:FULL_END -->

