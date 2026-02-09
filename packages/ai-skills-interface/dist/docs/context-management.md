# context-management

## Descrição

Capacidade avançada de gerenciamento de contexto de projetos para IAs

## Categoria

context-management

## Capacidades

- **context-extraction**
- **context-optimization**
- **context-synchronization**
- **context-filtering**
- **context-persistence**
- **context-retrieval**

## Adaptadores Suportados

- cursor
- windsurf
- claude
- github-copilot

## Exemplos de Uso

### Exemplo 1: Extrair contexto de projeto

```javascript
await aiSkill.execute("context-management", { action: "extract", path: "./src", depth: 3 })
```

Extrai contexto estruturado do projeto com profundidade configurável

### Exemplo 2: Otimizar contexto para IA

```javascript
await aiSkill.execute("context-management", { action: "optimize", target: "claude", maxSize: "100KB" })
```

Otimiza o contexto para limites específicos de IA

### Exemplo 3: Sincronizar contexto entre ambientes

```javascript
await aiSkill.execute("context-management", { action: "sync", from: "dev", to: "prod" })
```

Sincroniza contexto entre diferentes ambientes do projeto

## Metadados

```json
{
  "version": "1.0.0",
  "author": "AI Skills Team",
  "tags": [
    "context",
    "management",
    "optimization",
    "ai"
  ],
  "complexity": "advanced",
  "dependencies": [
    "fs-extra",
    "path",
    "glob",
    "yaml"
  ]
}
```

---
**Versão:** 1.0.0
**Autor:** AI Skills Team