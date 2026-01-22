<!-- AI-DOC:CORE_START -->
- Documente junto ao código: criar/atualizar/remover docs sempre que implementar, corrigir, refatorar ou deletar.
- Regras de documentação vivem no kernel; /docs é só conteúdo do projeto.
- README.md é obrigatório em toda pasta de docs.
- Use templates oficiais e mantenha breadcrumbs e links cruzados.
- Registre decisões de arquitetura e regras de negócio detectadas.
- Após gerar /docs, revise cada arquivo e preencha todos os placeholders com dados reais do projeto.
- Faça pesquisa profunda e abrangente no repo antes de preencher; não invente.
- Valide a documentação com `ai-doc scan` para garantir que não restam placeholders.
- Se faltar informação, registre pendência e abra task para completar.
<!-- AI-DOC:CORE_END -->

<!-- AI-DOC:FULL_START -->

# 📚 Docs Module
Módulo responsável por governar como a documentação do projeto é criada, atualizada e validada.

## 🎯 Responsabilidades
1. Definir políticas e padrões de documentação.
2. Determinar estrutura base por stack/receita.
3. Garantir atualização contínua junto às mudanças de código.
4. Padronizar README por pasta, links e navegabilidade.

## 🧭 Escopo
- Kernel é SSoT do processo de documentação.
- /docs é SSoT do conteúdo do projeto.

## 📂 Estrutura Oficial
- Kernel: `~/.ai-doc/kernel/modules/docs/`
- Config local: `.ai-workspace/docs-config.json` ou `config.yaml` (seção `docs`)
- Projeto (opcional, para humanos): `/docs/00--intro/how-to-document.md`

## 📦 Artefatos do Módulo
- Recipes: `~/.ai-doc/kernel/modules/docs/recipes/`
- Schema de config: `~/.ai-doc/kernel/modules/docs/templates/docs-config.schema.json`
- Exemplo de config: `~/.ai-doc/kernel/modules/docs/templates/docs-config.example.json`
- Tools: `~/.ai-doc/kernel/modules/docs/tools/`

## 🧰 Ferramentas
### Placeholder Scanner
Ferramenta para validar se restaram placeholders nos arquivos de documentação.
- Comando: `ai-doc scan [pasta]` (default: docs)
- Quando usar: Sempre após gerar ou atualizar documentação, como passo final de validação.

## 🧪 Atualização Contínua
- Toda alteração de código deve atualizar a documentação relacionada.
- Se a funcionalidade foi removida, a doc correspondente deve ser removida e os links ajustados.
- Se arquivos/pastas foram renomeados, atualize breadcrumbs e links cruzados.
- Se a documentação não puder ser atualizada agora, registre a pendência em task.

## 🧠 Protocolo de Preenchimento Profundo
1. Fazer varredura ampla do repo: README raiz, manifests (package.json/cargo.toml/composer.json), pastas principais e docs existentes.
2. Buscar fontes de verdade: comandos, módulos, scripts e estruturas reais do projeto.
3. Substituir placeholders (ex.: `[Nome]`, `YYYY-MM-DD`, `[Descrição]`) por conteúdo validado no código.
4. Remover instruções de template e listas de placeholder; entregar conteúdo final limpo.
5. Validar breadcrumbs e links cruzados entre os READMEs.
6. Se algum dado não puder ser inferido com segurança, sinalizar pendência e abrir task.

## 🧱 Recipes (Estruturas)
As receitas definem a estrutura da pasta `/docs` e os templates obrigatórios por tipo de projeto.

Exemplos de recipes:
- backend
- frontend
- fullstack
- monorepo
- lib
- mobile

## 🧬 Fluxo Padrão
1. Detectar stack via módulo `analysis`.
2. Selecionar recipe com base no tipo de projeto.
3. Gerar ou atualizar estrutura da docs.
4. Aplicar templates oficiais.
5. Garantir README em todas as pastas.
6. Preencher placeholders com dados reais (protocolo de preenchimento profundo).
7. Inserir breadcrumbs e links cruzados.
8. Validar consistência e cobertura.

## 🔗 Integrações
- Analysis: scanners alimentam o mapa de stack e padrões.
- Tasks: abrir task quando houver gaps críticos de docs.
- Memory: registrar recipe ativa, idioma e políticas de docs.

<!-- AI-DOC:FULL_END -->
