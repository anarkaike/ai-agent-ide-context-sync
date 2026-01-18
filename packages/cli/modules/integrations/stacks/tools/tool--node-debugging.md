<!-- AI-DOC:CORE_START -->
- Use scripts do projeto (package.json) como entrada: lint, test, build, dev.
- Para crashes e warnings, habilite flags de diagnóstico (trace-warnings, trace-uncaught).
- Evite logar segredos (tokens, cookies, headers sensíveis) em qualquer saída.
<!-- AI-DOC:CORE_END -->

<!-- AI-DOC:FULL_START -->

# 🟩 Tool: Node Debugging & Runtime Diagnostics
Playbook para investigar problemas em projetos Node.js com evidência reproduzível.

## 🧭 Quando usar?
- Crashes em runtime (uncaught exceptions, unhandled rejections).
- Warnings difíceis de rastrear (deprecations, memory leaks).
- Problemas de performance (event loop bloqueado, high CPU).

## ⚙️ Passo a passo
1. **Rodar scripts canônicos do projeto**
   - Leia `package.json` e execute o que existir:
   ```bash
   npm run lint
   npm test
   npm run build
   ```
2. **Ativar diagnósticos do Node**
   ```bash
   node --trace-warnings --trace-uncaught path/to/entry.js
   ```
3. **Forçar stack traces melhores (quando aplicável)**
   - Ajuste `Error.stackTraceLimit` só se o projeto já usar esse padrão.
4. **Isolar o caso mínimo**
   - Reduza a reprodução para um script/rota/job específico.
5. **Consolidar evidências**
   - Capture erro completo, stack trace, versão do Node e OS, e passos para reproduzir.

## 📌 Dicas
- Se o projeto tiver logger estruturado, prefira logs com `requestId`/`correlationId`.
- Para suspeita de leak, monitore crescimento de memória por tempo e reduza o escopo (requests/jobs).
- Para jobs/queues, rode o worker em modo verbose apenas no ambiente local.

## 🔗 Referências
- `package.json` (scripts)
- Node flags: `--trace-warnings`, `--trace-uncaught`

<!-- AI-DOC:FULL_END -->

