# 🧠 Heurísticas do Kernel

> Auto-evolução: O Kernel aprende e melhora a si mesmo com cada projeto.

## O que são Heurísticas?

Heurísticas são **regras aprendidas** pelo Kernel sobre como navegar e trabalhar melhor em projetos. Diferente do Soul (que é experiência técnica), heurísticas são sobre **como o próprio Kernel funciona**.

## Tipos de Heurísticas

### 1. Navegação de Código
Como encontrar arquivos e estruturas em diferentes stacks.

### 2. Padrões de Documentação
Como documentar melhor para diferentes contextos.

### 3. Otimizações de Prompt
Fraseados que funcionam melhor.

### 4. Estratégias de Análise
Como analisar código de forma mais eficiente.

## Estrutura de Arquivos

```
heuristics/
├── navigation/
│   ├── laravel.yaml
│   ├── vue.yaml
│   └── general.yaml
├── documentation/
│   └── patterns.yaml
├── prompts/
│   └── optimizations.yaml
└── analysis/
    └── strategies.yaml
```

## Como Funciona

1. **Detecção**: Durante trabalho, IA identifica padrão útil
2. **Validação**: Verifica se padrão se repete (min 2x)
3. **Abstração**: Remove referências específicas ao projeto
4. **Salvamento**: Grava em `heuristics/` apropriado
5. **Aplicação**: Usa em projetos futuros automaticamente

## Formato YAML

```yaml
# heuristics/navigation/laravel.yaml
heuristics:
  - id: controllers-location
    type: navigation
    stack: laravel
    pattern: "Controllers em app/Http/Controllers"
    confidence: 0.95
    times_applied: 12
    learned_from:
      - projeto-clinica
      - projeto-ecommerce
    created_at: "2026-01-16"
    last_used: "2026-01-16"
```

## Diferença: Heurística vs Soul

| Heurística (Kernel) | Soul (Experiência) |
|:--------------------|:-------------------|
| Como o Kernel funciona | Conhecimento técnico |
| "Perguntar antes de criar Service" | "Service + Repository funciona bem" |
| Melhora o sistema | Melhora o código |
| Aplicado automaticamente | Sugerido quando relevante |
