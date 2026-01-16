# 🔧 AI Kernel v2.0.0

> O Sistema Operacional da IA — Módulos, comportamentos e regras universais.

## Estrutura

```
kernel/
├── modules/           # Módulos funcionais
│   ├── core/         # Boot, build, i18n, autopriority
│   ├── identity/     # Templates de personas
│   ├── memory/       # Protocolo de memória
│   ├── tasks/        # Protocolo de tasks
│   ├── analysis/     # Scanners e protocolos
│   ├── responses/    # Templates de resposta
│   ├── templates/    # Templates de documentação
│   └── integrations/ # MCP + Stacks (Laravel, Vue)
├── ide/              # Integrações com IDEs
│   ├── cursor/
│   ├── copilot/
│   ├── windsurf/
│   └── trae/
├── heuristics/       # Aprendizados (auto-evolução)
└── package.json      # Manifesto
```

## Características

- **Global**: Instalado em `~/.ai-doc/kernel/`
- **Versionado**: SemVer (v2.0.0-alpha.1)
- **Auto-evolutivo**: Aprende e melhora heurísticas
- **Portável**: Pode ser copiado/sincronizado entre máquinas

## Uso

O Kernel é ativado automaticamente quando existe um `.ai-workspace/` 
em um projeto que aponta para ele via `config.yaml`.

---

*Criado em: 2026-01-16*
