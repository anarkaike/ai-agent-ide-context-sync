<!-- AI-DOC:CORE_START -->
- Node.js: Use async/await para I/O assíncrono; evite callbacks aninhados.
- Tratamento de erros: Sempre trate erros em promises (try/catch) e eventos "error".
- Módulos: Use ESM (import/export) ou CommonJS de forma consistente no projeto.
- Segurança: Valide inputs externos; evite eval() e execução de comandos arbitrários sem sanitização.
<!-- AI-DOC:CORE_END -->

<!-- AI-DOC:FULL_START -->
# 🟩 Node.js Integration Module
Centraliza boas práticas para projetos Node.js detectados via `package.json`.

## 🎯 Objetivo
Manter o uso de Node previsível e seguro: I/O assíncrono, erros tratados e consistência de módulos.

## 🧩 Convenções
- Prefira `async/await` para I/O e APIs assíncronas.
- Não faça trabalho pesado no Event Loop; extraia para workers/serviços quando necessário.
- Padronize ESM vs CommonJS no projeto (evite misturar sem necessidade).

## 🧯 Tratamento de Erros
- Em promises, sempre use `try/catch` (ou `.catch`) e propague erros corretamente.
- Não engula erros silenciosamente.
- Centralize o handling em um ponto de entrada (ex.: handler HTTP, job runner), seguindo o padrão existente do repo.

## ⚡ Performance
- Evite operações síncronas em hot paths (ex.: `fs.readFileSync` em request).
- Para payloads grandes, prefira streaming quando o projeto já usa esse padrão.

## 🔐 Segurança
- Sempre valide dados externos na borda (HTTP, filas, webhooks) usando o mecanismo já adotado no projeto.
- Evite `eval()` e construção de comandos/queries por concatenação.
- Não logue segredos, tokens ou dados sensíveis.
<!-- AI-DOC:FULL_END -->
