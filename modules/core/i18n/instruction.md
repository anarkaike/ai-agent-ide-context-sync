# 🌍 i18n Translation System Module

> **Módulo de Internacionalização e Tradução Automática**
> Sistema completo para gerenciar traduções multi-idioma com validação e sincronização automática.

## 📋 Visão Geral

Este módulo fornece ferramentas para:
- ✅ Validar consistência de chaves i18n entre idiomas
- 🔍 Detectar chaves usadas no código mas não traduzidas
- 🤖 Adicionar automaticamente chaves faltantes
- 🌍 Traduzir placeholders para português
- 🔄 Sincronizar estrutura entre todos os idiomas

## 🎯 Idiomas Suportados

- `pt-BR` - Português (Brasil) - **Idioma fonte**
- `en-US` - English (United States)
- `es-ES` - Español (España)
- `de-DE` - Deutsch (Deutschland)
- `fr-FR` - Français (France)
- `it-IT` - Italiano (Italia)
- `ja-JP` - 日本語 (日本)
- `zh-CN` - 中文 (中国)

## 🛠️ Scripts Disponíveis

### 1. `check-messages-translations.js`
**Função:** Valida se todos os idiomas têm as mesmas chaves

**Quando usar:**
- Após adicionar novas traduções
- Para verificar integridade do sistema i18n
- Como parte do CI/CD

**Uso:**
```bash
node scripts/check-messages-translations.js
```

**Saída esperada:**
```
[i18n-check] All locales share the same keys 🎉
```

---

### 2. `find-missing-i18n-keys.js`
**Função:** Escaneia todo o código e detecta chaves i18n usadas mas não traduzidas

**Quando usar:**
- Quando encontrar chaves literais aparecendo na interface
- Após adicionar novos componentes/páginas
- Periodicamente para auditoria

**Uso:**
```bash
node scripts/find-missing-i18n-keys.js
```

**O que faz:**
- Escaneia arquivos `.vue`, `.ts`, `.tsx`, `.js`
- Extrai todas as chamadas `t('key')`, `$t('key')`
- Compara com chaves disponíveis em `pt-BR.ts`
- Gera relatório em `tmp/missing-i18n-keys.json`

**Padrões detectados:**
```javascript
t('sales.title')           // ✅ Detectado
$t('common.save')          // ✅ Detectado
:title="t('page.title')"   // ✅ Detectado
```

---

### 3. `add-all-missing-keys.js`
**Função:** Adiciona automaticamente todas as chaves faltantes em `pt-BR.ts`

**Quando usar:**
- Após executar `find-missing-i18n-keys.js` e encontrar chaves faltantes
- Para corrigir rapidamente chaves não traduzidas

**Uso:**
```bash
# Primeiro, encontre as chaves faltantes
node scripts/find-missing-i18n-keys.js

# Depois, adicione-as automaticamente
node scripts/add-all-missing-keys.js
```

**O que faz:**
- Lê relatório de `tmp/missing-i18n-keys.json`
- Gera valores placeholder legíveis baseados no nome da chave
- Adiciona chaves em `pt-BR.ts`
- Cria backup automático

**Exemplo:**
```typescript
// Chave: sales.createTitle
// Valor gerado: "Create title"
```

---

### 4. `translate-placeholders-to-pt.js`
**Função:** Traduz valores placeholder em inglês para português

**Quando usar:**
- Após executar `add-all-missing-keys.js`
- Para substituir placeholders por traduções apropriadas

**Uso:**
```bash
node scripts/translate-placeholders-to-pt.js
```

**O que faz:**
- Identifica valores em inglês em `pt-BR.ts`
- Traduz usando dicionário interno
- Mantém termos técnicos e estrangeirismos

**Dicionário de traduções:**
```javascript
'Create' → 'Criar'
'Edit' → 'Editar'
'Save' → 'Salvar'
'Title' → 'Título'
// ... +150 traduções
```

---

### 5. `complete-translations.js`
**Função:** Garante que TODOS os idiomas tenham exatamente as mesmas chaves

**Quando usar:**
- Após adicionar/modificar chaves em qualquer idioma
- Como etapa final de qualquer operação de tradução
- **SEMPRE** após modificar arquivos de tradução

**Uso:**
```bash
node scripts/complete-translations.js
```

**O que faz:**
- Coleta todas as chaves de todos os idiomas
- Cria superset com todas as chaves únicas
- Preenche chaves faltantes em cada idioma usando fallback:
  1. Tradução própria (se existir)
  2. Tradução de `en-US`
  3. Primeira tradução disponível
- Reescreve todos os arquivos `.ts`

---

### 6. `final-sync-and-translate.js`
**Função:** Gera arquivo mestre consolidado para tradução em lote

**Quando usar:**
- Para preparar traduções profissionais
- Para enviar para serviços de tradução externos
- Para tradução assistida por IA

**Uso:**
```bash
node scripts/final-sync-and-translate.js
```

**Saída:**
- `tmp/translations-master.json` - Arquivo consolidado com todas as chaves

---

### 7. `split-master-for-ai.js`
**Função:** Divide arquivo mestre em chunks para tradução por IA

**Quando usar:**
- Para traduzir grandes volumes com IA
- Quando arquivo mestre for muito grande

**Uso:**
```bash
node scripts/split-master-for-ai.js
```

**Saída:**
- `tmp/translation-chunks/<locale>/chunk-XXX.json`

---

### 8. `auto-translate-all-chunks.js`
**Função:** Traduz automaticamente todos os chunks usando dicionários internos

**Uso:**
```bash
node scripts/auto-translate-all-chunks.js
```

---

### 9. `apply-final-translations.js`
**Função:** Aplica traduções dos chunks de volta aos arquivos TypeScript

**Uso:**
```bash
# Aplicar para todos os idiomas
node scripts/apply-final-translations.js

# Aplicar para idioma específico
node scripts/apply-final-translations.js en-US
```

---

## 🔄 Fluxo de Trabalho Completo

### Cenário 1: Encontrei chave literal na interface

```bash
# 1. Detectar chaves faltantes
node scripts/find-missing-i18n-keys.js

# 2. Adicionar chaves automaticamente
node scripts/add-all-missing-keys.js

# 3. Traduzir placeholders para português
node scripts/translate-placeholders-to-pt.js

# 4. Propagar para todos os idiomas
node scripts/complete-translations.js

# 5. Validar
node scripts/check-messages-translations.js
```

### Cenário 2: Adicionei novas chaves manualmente em pt-BR

```bash
# 1. Propagar para todos os idiomas
node scripts/complete-translations.js

# 2. Validar
node scripts/check-messages-translations.js
```

### Cenário 3: Quero traduzir tudo profissionalmente

```bash
# 1. Gerar arquivo mestre
node scripts/final-sync-and-translate.js

# 2. Dividir em chunks
node scripts/split-master-for-ai.js

# 3. Traduzir chunks (manual ou IA)
# ... traduza os arquivos em tmp/translation-chunks/

# 4. Aplicar traduções
node scripts/apply-final-translations.js

# 5. Validar
node scripts/check-messages-translations.js
```

---

## 📂 Estrutura de Arquivos

```
resources/js/i18n/messages/
├── pt-BR.ts          # Idioma fonte (referência)
├── en-US.ts          # Inglês
├── es-ES.ts          # Espanhol
├── de-DE.ts          # Alemão
├── fr-FR.ts          # Francês
├── it-IT.ts          # Italiano
├── ja-JP.ts          # Japonês
└── zh-CN.ts          # Chinês

scripts/
├── check-messages-translations.js
├── find-missing-i18n-keys.js
├── add-all-missing-keys.js
├── translate-placeholders-to-pt.js
├── complete-translations.js
├── final-sync-and-translate.js
├── split-master-for-ai.js
├── auto-translate-all-chunks.js
└── apply-final-translations.js

tmp/
├── missing-i18n-keys.json
├── translations-master.json
└── translation-chunks/
    ├── en-US/
    ├── es-ES/
    └── ...
```

---

## ⚠️ Regras Importantes

### 1. **pt-BR é a fonte de verdade**
- Sempre adicione novas chaves primeiro em `pt-BR.ts`
- Use `complete-translations.js` para propagar

### 2. **Nunca edite múltiplos idiomas manualmente**
- Risco de inconsistência
- Use os scripts de sincronização

### 3. **Sempre valide após mudanças**
```bash
node scripts/check-messages-translations.js
```

### 4. **Preserve placeholders e HTML**
```typescript
// ✅ Correto
'welcome': 'Bem-vindo, {name}!'

// ❌ Errado
'welcome': 'Bem-vindo, nome!'
```

### 5. **Mantenha termos técnicos**
```typescript
// ✅ Correto
'api': 'API',
'dashboard': 'Dashboard',
'email': 'E-mail'

// ❌ Errado
'api': 'Interface de Programação',
'dashboard': 'Painel de Controle'
```

---

## 🐛 Troubleshooting

### Problema: Chave aparece literal na interface

**Solução:**
```bash
node scripts/find-missing-i18n-keys.js
node scripts/add-all-missing-keys.js
node scripts/translate-placeholders-to-pt.js
node scripts/complete-translations.js
```

### Problema: Idiomas com chaves diferentes

**Solução:**
```bash
node scripts/complete-translations.js
```

### Problema: Muitos placeholders em inglês

**Solução:**
```bash
node scripts/translate-placeholders-to-pt.js
node scripts/complete-translations.js
```

### Problema: Preciso adicionar 100+ chaves

**Solução:**
Use o fluxo automatizado completo (Cenário 1)

---

## 🎯 Boas Práticas

1. **Execute validação regularmente**
   ```bash
   # Adicione ao pre-commit hook
   node scripts/check-messages-translations.js
   ```

2. **Documente chaves complexas**
   ```typescript
   // Contexto: Mensagem exibida após criar venda
   'sales.created': 'Venda criada com sucesso'
   ```

3. **Use namespaces consistentes**
   ```typescript
   sales.title
   sales.subtitle
   sales.fields.total
   sales.fields.discount
   ```

4. **Mantenha traduções curtas**
   - Considere espaço na UI
   - Use abreviações quando apropriado

5. **Teste em todos os idiomas**
   - Verifique overflow de texto
   - Valide caracteres especiais

---

## 📊 Estatísticas Atuais

- **Total de chaves:** 2.176
- **Idiomas:** 8
- **Cobertura:** 100%
- **Última sincronização:** 2026-01-10

---

## 🔗 Referências

- [Vue I18n Documentation](https://vue-i18n.intlify.dev/)
- [TypeScript Locale Files](../../../resources/js/i18n/messages/)
- [Translation Scripts](../../../scripts/)

---

## 📝 Changelog

### 2026-01-10
- ✅ Sistema completo de detecção de chaves faltantes
- ✅ Tradução automática de placeholders
- ✅ 238 novas chaves adicionadas
- ✅ 161 valores traduzidos para português
- ✅ 100% de cobertura em todos os idiomas

---

**Mantenedor:** Sistema AI
**Última atualização:** 2026-01-10
