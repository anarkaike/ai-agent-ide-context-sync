# 📋 Sistema de Regras Multi-Nível

Sistema avançado de gerenciamento de regras com hierarquia e múltiplos modos de aplicação.

## 🎯 Visão Geral

O RulesManager permite definir regras em 3 níveis diferentes, cada uma com seu próprio escopo e prioridade:

1. **User Rules** (Globais) - `~/.ai-doc/rules/user/`
2. **Project Rules** (Repositório) - `.ai-workspace/rules/project/`
3. **Path-Specific Rules** (Repositório) - `.ai-workspace/rules/path-specific/`

## 🔧 Modos de Aplicação

Cada regra pode ter um dos 4 modos:

### 1. Always (`alwaysApply: true`)
Regra sempre incluída no contexto, independente do arquivo ou situação.

**Exemplo:** Princípios de clean code, convenções gerais

```yaml
---
description: "Princípios de código limpo"
alwaysApply: true
globs: []
---

# Clean Code
...
```

### 2. Globs (`globs: [...]`)
Regra aplicada quando o arquivo atual faz match com os padrões glob.

**Exemplo:** Padrões React apenas para componentes

```yaml
---
description: "Padrões React"
alwaysApply: false
globs:
  - "src/components/**/*.tsx"
  - "src/components/**/*.jsx"
---

# React Patterns
...
```

### 3. Intelligent (`description` presente)
Regra aplicada quando o sistema detecta relevância via embeddings (futuro).

**Exemplo:** Padrões de API aplicados quando trabalhando com endpoints

```yaml
---
description: "Padrões de API REST seguindo convenções RESTful"
alwaysApply: false
globs: []
---

# API Patterns
...
```

### 4. Manual (padrão)
Regra aplicada apenas quando mencionada explicitamente via `@rule-name`.

**Exemplo:** `@api-patterns` no prompt

## 📁 Estrutura de Arquivo

### Arquivo `.md` (simples)
```markdown
# Minha Regra

Conteúdo da regra...
```

### Arquivo `.mdc` (com frontmatter)
```markdown
---
description: "Descrição da regra"
alwaysApply: false
globs:
  - "src/**/*.ts"
---

# Minha Regra

Conteúdo da regra...
```

## 🚀 Uso Programático

```javascript
const RulesManager = require('./core/rules-manager');

// Inicializar
const manager = new RulesManager('/caminho/do/projeto');

// Obter regras aplicáveis
const rules = manager.getApplicableRules({
  filePath: '/projeto/src/components/Button.tsx',
  mentions: ['@api-patterns']
});

// Criar nova regra
manager.createRule('project', {
  id: 'my-rule',
  description: 'Minha regra personalizada',
  mode: 'globs',
  globs: ['src/**/*.ts'],
  content: '# My Rule\n\nConteúdo...'
});

// Estatísticas
const stats = manager.stats();
console.log(stats);
// {
//   total: 5,
//   byLevel: { user: 1, project: 3, pathSpecific: 1 },
//   byMode: { always: 1, intelligent: 2, globs: 1, manual: 1 }
// }
```

## 📊 CLI

```bash
# Ver estatísticas
node core/rules-manager.js

# Testar sistema
node test-rules-manager.js
```

## 🎨 Exemplos

Veja `examples/rules/` para exemplos completos:
- `clean-code.mdc` - Modo always
- `react-patterns.mdc` - Modo globs
- `api-patterns.mdc` - Modo intelligent

## 🔄 Integração com Build

O comando `ai-doc build` automaticamente:
1. Carrega todas as regras dos 3 níveis
2. Determina quais regras são aplicáveis
3. Inclui o conteúdo das regras no prompt final

## 📝 Migração de Regras Antigas

Se você já tem regras em formato antigo, migre assim:

```bash
# Copiar regras antigas para novo formato
cp ~/.ai-doc/rules/*.md ~/.ai-doc/rules/user/

# Adicionar frontmatter se necessário
# (editar manualmente ou criar script)
```

## 🎯 Melhores Práticas

1. **User Rules**: Use para princípios universais (clean code, segurança)
2. **Project Rules**: Use para padrões específicos do projeto
3. **Path-Specific**: Use para regras muito específicas de certos arquivos
4. **Always**: Use com moderação (< 5 regras)
5. **Globs**: Prefira padrões específicos (`src/api/**/*.ts` vs `**/*.ts`)
6. **Descriptions**: Seja específico para melhor matching inteligente

## 🔮 Futuro

- [ ] Indexação semântica para modo 'intelligent'
- [ ] UI para gerenciar regras visualmente
- [ ] Importação/exportação de regras
- [ ] Templates de regras comuns
- [ ] Análise de eficácia de regras
