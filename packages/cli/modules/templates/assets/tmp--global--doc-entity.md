---
title: [Nome da Entidade]
subtitle: [Subtítulo Opcional]
description: [Descrição curta]
author: [Nome]
status: done
---

> 🍞 **Caminho**: [Home](../../README.md) > [Entidades](../README.md) > [NomeEntidade]

# 🧊 [Nome da Entidade]

**[Resumo de uma linha sobre o papel desta entidade no negócio]**

> 📅 **Última Atualização**: YYYY-MM-DD | 👤 **Autor**: [Nome]
>
> ![Status](https://img.shields.io/badge/Status-Ativo-success?style=flat-square)

---

> 🔗 **Relacionados**: [Regra de Negócio X](../business-patterns/RN-001.md) • [API Docs](https://...)
> 📑 **Índice**: [Estrutura](#-estrutura-de-dados) • [Backend](#-backend-implementation) • [Frontend](#-frontend-implementation)

## 📋 Metadados Técnicos

| Atributo | Valor |
| :--- | :--- |
| **Tabela DB** | `[tabela_snake_case]` |
| **Model Laravel** | `App\Models\[NomeModel]` |
| **Tenant Aware?** | ✅ Sim (Trait `TenantOwned`) |
| **Auditoria?** | ✅ Sim (`Auditable`) |
| **Soft Deletes?** | ❌ Não |

## 🏗 Estrutura de Dados

### Diagrama de Relacionamento (ERD)

```mermaid
erDiagram
    [ENTITY] ||--o{ RELATED : "possui"
    [ENTITY] {
        uuid id PK
        uuid business_id FK
        string name
        timestamp created_at
    }
```

### Dicionário de Dados

| Coluna | Tipo | Obrigatório | Descrição |
| :--- | :--- | :---: | :--- |
| `id` | `uuid` | ✅ | Identificador único (PK) |
| `business_id` | `uuid` | ✅ | FK para Business (Isolamento Multi-tenant) |
| `[campo]` | `[tipo]` | ❌ | [Descrição detalhada] |

> [!IMPORTANT]
> **Atenção**: O campo `business_id` é preenchido automaticamente pelo `TenantObserver` e nunca deve ser enviado pelo frontend.

## 🔁 Ciclo de Vida e Estados

| Estado | Descrição | Transições |
| :--- | :--- | :--- |
| [Rascunho] | [Descrição] | [Próximos estados] |

## ✅ Regras e Invariantes

- [Regra crítica 1]
- [Regra crítica 2]

## 📈 Índices e Performance

- **Índices**: [Lista]
- **Consultas críticas**: [Queries]

## 🔒 Regras de Negócio & Policies

> [!NOTE]
> As regras de autorização estão definidas em `App\Policies\[Model]Policy`.

- **Create**: [Quem pode criar?]
- **Update**: [Regras de edição. Ex: Apenas status 'Rascunho' pode ser editado.]
- **Delete**: [Regras de exclusão.]
- **View**: [Quem pode visualizar? Apenas dono ou time?]

## 💻 Backend Implementation

### Controller & Routes
**`routes/api/v1/[recurso].php`**

- `GET /api/v1/[recurso]` - *Listagem (Paginação + Filtros)*
- `POST /api/v1/[recurso]` - *Criação*
- `GET /api/v1/[recurso]/{id}` - *Detalhes*

### Observers & Events
- **Observer**: `[Model]Observer` - *Gerencia [ex: envio de email após criação]*
- **Events**: `[Model]Created`, `[Model]Updated`

## 🖥 Frontend Implementation

### Estrutura de Arquivos

- 📂 **resources/js/modules/[modulo]/**
  - 📄 `[Entity]Index.vue` - *Listagem principal*
  - 📄 `[Entity]Form.vue` - *Formulário de criação/edição*
  - 📂 **components/**
    - 📄 `[Entity]Card.vue` - *Componente de visualização*

### State Management (Pinia/TanStack Query)

- **Query Key**: `['[recurso]', { filters }]`
- **Service**: `services/[recurso].service.ts`

```typescript
// Exemplo de uso do Composable
const { data, isLoading } = useEntityList('[recurso]', filters);
```

## 📜 Histórico de Alterações

| Data | Versão | Autor | Descrição |
| :--- | :---: | :--- | :--- |
| YYYY-MM-DD | 1.0.0 | [Nome] | Criação inicial. |
