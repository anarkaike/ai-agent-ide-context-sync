<!-- AI-DOC:CORE_START -->
- Teste comportamento e acessibilidade; evite testar detalhes internos do componente.
- Prefira testar integração por fluxo (estado → UI → ação) em vez de snapshots frágeis.
- Não adicione libs de teste novas sem confirmar que o repo já usa.
<!-- AI-DOC:CORE_END -->

<!-- AI-DOC:FULL_START -->

# ⚛️ Tool: React Testing (Behavior-first)
Playbook para escrever e manter testes de UI React com foco em comportamento.

## 🧭 Quando usar?
- Ao corrigir bug em UI e precisa prevenir regressão.
- Ao refatorar componentes com estado complexo.
- Ao ajustar acessibilidade (labels, roles, navegação).

## ⚙️ Passo a passo
1. **Descobrir o stack de testes existente**
   - Procure scripts (`npm test`) e deps (`jest`, `vitest`, `@testing-library/react`, `cypress`, `playwright`).
2. **Rodar a suíte**
   ```bash
   npm test
   ```
3. **Escrever teste por comportamento**
   - Arrange: renderizar com props/estado.
   - Act: interagir como usuário (click, type).
   - Assert: verificar texto/role/estado visível.
4. **Preferir seletores acessíveis**
   - `getByRole`, `getByLabelText`, `getByText` (de acordo com a lib já usada no repo).
5. **Revalidar**
   - Rode testes e, se existir, lint/typecheck.

## 📌 Dicas
- Se houver API calls, mocke no boundary do app (fetch client, service layer) conforme padrão do repo.
- Para componentes com timers/debounce, use o mecanismo de fake timers do framework de teste do projeto.

## 🔗 Referências
- `package.json` scripts
- `src/**/__tests__/**` ou padrão equivalente do repo

<!-- AI-DOC:FULL_END -->

