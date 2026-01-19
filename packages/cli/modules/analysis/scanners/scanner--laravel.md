---
type: scanner
name: scanner--laravel
description: Scanner especializado para projetos Laravel quando `laravel/framework` é detectado.
---

# 🐘 Scanner: Laravel Framework
> **Objetivo**: identificar padrões arquiteturais, pacotes críticos e maturidade de stack Laravel.  
> **Contexto**: rodar após o scanner de fingerprint sempre que `composer.json` incluir `laravel/framework`.

---

## 🧩 Identificação
- **ID**: `scanner--laravel.md`
- **Categoria**: backend
- **Dependências**:
  - Scripts: `php artisan list`, `php artisan route:list` (se ambiente permitir)
  - Ferramentas MCP: FileSystem para app/, database/, routes/, config/ + playbooks do módulo `___laravel` (Laravel Boost)
  - Arquivos de cache: `.ai-workspace/analysis/active-state.json` (use `templates/tech-profile.json` se precisar criar)

---

## ⚙️ Pré-Requisitos
1. `composer install` executado (para ler artisan/pacotes).
2. Acesso à pasta `app/`, `database/`, `routes/`, `config/`.
3. (Opcional) Ambiente com `.env` configurado para rodar comandos artisan.

---

## 🛰️ Fluxo de Execução
1. **Fingerprint Laravel**
   - Verificar `composer.json` → versão de `laravel/framework`, pacotes `laravel/sanctum`, `spatie/*`.
2. **Coleta Primária**
   - Listar estrutura de `app/` (`find app -maxdepth 2`).
   - `ls database/migrations` para contar arquivos.
   - `ls routes/` para identificar web/api/channels/console.
3. **Análise**
   1. Classificar arquitetura (padrão, modular, DDD).
   2. Mapear banco (quantidade de migrations, factories, seeders).
   3. Validar rotas/API: uso de Sanctum/Passport, versionamento.
   4. Levantar pacotes críticos (Admin Panels, Jobs, Observers).
4. **Síntese & Ações**
   - Atualizar active-state (`tech_stack.laravel`) — se inexistente, inicialize a partir do template.
   - Criar finding detalhando pontos fortes/débitos.
   - Abrir task se encontrar dívida grave (ex.: ausência de testes/seeders).

> **Dica**: ao analisar arquitetura modular, cite diretórios específicos (ex.: `app/Domain`, `modules/Billing`).

---

## 📤 Saídas Esperadas
- `.ai-workspace/analysis/findings/analysis--laravel--{{YYYYMMDD}}.md`
- Bloco `laravel` atualizado em `active-state.json`.
- Tópicos de follow-up (tasks) linkados ao finding.

---

## ✅ DoD (Definition of Done)
1. Versão do Laravel e estrutura principal documentadas.
2. Banco e rotas mapeados com contagem aproximada.
3. Pacotes críticos e gaps (tests/docs) registrados.

---

## 🧪 Troubleshooting
| Sintoma | Causa comum | Correção |
| :--- | :--- | :--- |
| Não é possível rodar `php artisan` | Dependências não instaladas ou falta de `.env` | Rodar `composer install` e copiar `.env.example`. |
| Estrutura não padrão (DDD) confunde scanner | Convenções customizadas | Mapear README interno ou `app/Domain` e documentar no finding. |
| Migrations ausentes | Repositório parcial | Conferir se existe submódulo ou diretórios `database/legacy`. |

---

## 📚 Referências
- `docs/40--tech-manual/20--project-architecture-patterns/laravel.md`
- `~/.ai-doc/kernel/modules/analysis/templates/tmp--analytics--scanner.md`

---

## 📜 Histórico
| Data | Autor | Mudança |
| :--- | :--- | :--- |
| 2026-01-05 | AI Agent | Migração para template padronizado. |

---

## 🎯 Objetivos do Scanner
1. Entender arquitetura de pastas e distribuição de domínio.
2. Avaliar maturidade do banco/migrations/factories.
3. Mapear rotas, autenticação e pacotes estratégicos.

## ⚙️ Trigger / Quando rodar
- [ ] `composer.json` possui `laravel/framework`.
- [ ] Existe `app/Console/Kernel.php` ou `artisan`.

## 📋 Checklist de Preparação
1. Confirmar active-state atualizado.
2. Checar findings anteriores sobre Laravel para reaproveitar contexto.
3. (Opcional) Validar se ambiente permite rodar comandos artisan.

## 🔬 Pontos de Análise
### 1. Arquitetura de Pastas
- [ ] Padrão default (`app/Models`, `app/Http/Controllers`)?
- [ ] DDD/modular (`src/Domain`, `modules/`)? Onde ficam Services/Actions?

### 2. Banco de Dados
- [ ] Analisar `database/migrations` (volume, datas recentes).
- [ ] Confirmar factories (`database/factories`) e seeders.

### 3. Rotas & API
- [ ] Comparar `routes/web.php` vs `routes/api.php`.
- [ ] Uso de `sanctum`, `passport` ou guards customizados.
- [ ] Versionamento (`Route::prefix('v1')`, etc.).

### 4. Pacotes & Ferramentas
- [ ] Admin panels (Filament, Nova).
- [ ] Observabilidade (Telescope, Debugbar).
- [ ] Testes (Pest, PHPUnit, Dusk).

## 🧪 Evidências Necessárias
| Fonte | Comando/Arquivo | O que coletar |
| --- | --- | --- |
| composer.json | campos `require`, `autoload` | Versão Laravel, pacotes chave |
| app/ | estrutura de diretórios | Padrão arquitetural |
| routes/*.php | conteúdo | Autenticação, versionamento |
| database/ | migrations/factories | Volume e cobertura de dados |

## 🧠 Conexões com outros kernels
- **Docs**: atualizar guias de arquitetura se forem divergentes.
|- **Tasks**: abrir task para dívidas (ex.: falta de versionamento API).
- **Reports**: alimentar health-check backend.

## 📝 Saída Esperada (JSON Fragment)
```json
{
  "laravel": {
    "version": "10.x",
    "structure": "Default",
    "key_packages": [
      "filament/filament",
      "spatie/laravel-permission"
    ],
    "api_centric": false
  }
}
```

## ✅ Pós-execução
1. Atualize finding específico (`analysis--laravel--{{YYYYMMDD}}.md`).
2. Caso necessário, sincronize `active-state.json`.
3. Reporte achados no board (task/comment) com links.
