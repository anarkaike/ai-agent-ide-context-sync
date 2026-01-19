---
title: [MÉTODO] /caminho/do/endpoint
subtitle: Especificação de Endpoint API
description: Documentação técnica de um endpoint da API, incluindo requisição e resposta.
author: [Nome]
status: active
tags: [api, backend, documentation]
---

> **Breadcrumbs**: [Index](../../README.md) > [Tech Manual](../README.md) > [API Specs](./README.md) > [Endpoint]

# `[MÉTODO]` /caminho/do/endpoint

## 1. 🎯 Visão Geral
<!-- AI-SESSION: overview -->
Este endpoint é responsável por...
Ele é utilizado principalmente pelos consumidores... (Frontend, Mobile, Externo).

### Autenticação e Autorização
- **Auth Required**: Sim/Não
- **Scopes**: `read:resource`, `write:resource`
- **Rate Limit**: X req/min

## 2. 📥 Requisição (Request)
<!-- AI-SESSION: request -->

### Headers
| Header | Tipo | Obrigatório | Descrição |
|--------|------|-------------|-----------|
| `Authorization` | Bearer Token | Sim | Token JWT |
| `Content-Type` | application/json | Sim | Formato do corpo |

### Path Parameters
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | UUID | Identificador único do recurso |

### Query Parameters
| Parâmetro | Tipo | Opcional | Descrição |
|-----------|------|----------|-----------|
| `limit` | Int | Sim | Limite de registros (default: 20) |
| `page` | Int | Sim | Número da página |

### Body (JSON)
```json
{
  "field1": "string (required)",
  "field2": 123,
  "field3": {
    "nested": "boolean"
  }
}
```

## 3. 📤 Resposta (Response)
<!-- AI-SESSION: response -->

### Sucesso (200 OK / 201 Created)
```json
{
  "data": {
    "id": "uuid",
    "field1": "value",
    "createdAt": "ISO8601"
  },
  "meta": {
    "page": 1,
    "total": 100
  }
}
```

### Erros Comuns
| Status | Código | Descrição |
|--------|--------|-----------|
| 400 | `INVALID_PARAM` | Parâmetro inválido ou faltante |
| 401 | `UNAUTHORIZED` | Token inválido ou expirado |
| 403 | `FORBIDDEN` | Sem permissão para esta ação |
| 404 | `NOT_FOUND` | Recurso não encontrado |
| 500 | `INTERNAL_ERROR` | Erro inesperado no servidor |

## 4. 🧪 Exemplos de Uso
<!-- AI-SESSION: examples -->

### cURL
```bash
curl -X POST https://api.exemplo.com/v1/resource \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field1": "valor"}'
```

### JavaScript (Fetch)
```javascript
const response = await fetch('https://api.exemplo.com/v1/resource', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ field1: 'valor' })
});
const data = await response.json();
```

## 5. ⚠️ Notas de Implementação
<!-- AI-SESSION: notes -->
- Cuidado com N+1 queries ao buscar relacionamentos.
- Este endpoint dispara um evento assíncrono para...
