<!-- AI-DOC:CORE_START -->
- Sempre escolha um template de resposta e siga header/body/footer.
- Traga evidências: arquivos, comandos e resultados; sem “feito” vazio.
- Mantenha controle de progresso e próximos passos acionáveis.
- Se usuário disser “continue/ok/siga”, decida o próximo passo e avance.
<!-- AI-DOC:CORE_END -->

<!-- AI-DOC:FULL_START -->

# 💬 Responses Module
Módulo responsável por gerenciar a estrutura e o formato das respostas do agente.

## 🎨 Protocolo de Resposta
Para garantir clareza, consistência e utilidade, todas as respostas do agente devem seguir um dos templates definidos neste módulo.

### Estrutura Geral
Sempre use os parciais padrão:

1.  **Header** (`_partial-header.md`)  
    - Campos: `{{GLOBAL_CONTEXT}}`, `{{CHAT_SITUATION}}`, `{{DATE}}`, `{{TIMEZONE}}`, `{{ACTIVE_PERSONA}}`, `{{DEV_NAME}}`, `{{PERSONA_PANEL}}`, `{{EMPATHY_SNIPPET}}`.  
    - `{{PERSONA_PANEL}}`: saída literal do comando `npm run ai:list-ids` (bloco “Conselho de Personas”). Sem resumos.  
    - `{{EMPATHY_SNIPPET}}`: use o snippet padrão descrito em **💗 Empatia Contextual**, preenchendo contexto/perspectiva/clima/próximo passo.  
    - Emojis obrigatórios para destacar contexto e situar o chat.
2.  **Body**  
    - Formatação específica por template (ver seção a seguir).  
    - Use `---` entre blocos para dar respiro visual.
3.  **Footer** (`_partial-footer.md`)  
    - Radar Global + Checklist rápido + bloco final com template/persona.  
    - Sempre reflita status de task/doc/follow-up.  
    - **Novo bloco obrigatório:** `⚙️ Modo Auto-Drive` (exibe `status/contexto/expira/origem`). Se não houver auto-drive ativo, preencha com “Inativo”.
4. **Wrapper obrigatório (`npm run ai:reply`)**  
    - Sempre dispare respostas via `npm run ai:reply`. Ele roda `ai:list-ids` + `ai:context:sync` antes de chamar o formatter, garantindo painel atualizado e recomendação contextual.  
    - O wrapper delega para `format.cjs` com a flag `--ensure-context-sync`. Não use o formatter direto, exceto em manutenção avançada.  
    - Presets recomendados em `templates/presets/*.json` (um para cada template) — o wrapper aceita `--template`, `--data` e múltiplos `--set CHAVE=valor` e repassa tudo ao formatter.

> **Exemplo rápido**  
> ```bash
> node .ai-doc/kernel/scripts/responses/format.cjs \
>   --template default \
>   --data .ai-doc/tmp/response-data.json \
>   --set SUMMARY_GOAL="Validar kernel" \
>   --set SUMMARY_SCOPE="Queue + formatter" \
>   --out /tmp/resp.md
> ```
> O arquivo `/tmp/resp.md` sairá pronto para envio, seguindo header/body/footer oficiais.

### Painel de Personas + Empatia
1. Execute `npm run ai:list-ids` antes de responder; capture o bloco “🧠 Conselho de Personas” inteiro e injete em `{{PERSONA_PANEL}}`.
2. Defina `{{EMPATHY_SNIPPET}}` com base no checklist da tabela de perspectivas do footer:
   ```
   > Empatia contextual:
   > - Contexto: {nível/contexto}
   > - Perspectiva dominante: {Produto/Projeto/Dev/Infra/IA}
   > - Clima atual: {calmo/alerta/etc.}
   > - Próximo passo sugerido: {ação alinhada}
   ```
3. Para greetings/workflows sensíveis, mencione explicitamente qual persona foi escolhida e o estado do dev.

## 🔀 Seletor de Template (Router)

| Situação | Template | Arquivo |
| :--- | :--- | :--- |
| Coding / Tasks / Explicações completas | Default Full | `templates/tpl--default.md` |
| Dúvida rápida / Chat | Minimal Pulse *(fallback automático)* | `templates/tpl--minimal.md` |
| Bug fix / Incident | Bug Repair Log | `templates/tpl--bugfix.md` |
| Arquitetura / Proposta | Blueprint Proposal | `templates/tpl--proposal.md` |

> Sempre inicie com `> [router] Template selecionado: ...` (texto oculto ao usuário) para fins de auditoria.
> **Regra de Seleção:** toda resposta deve escolher explicitamente um template. Se nenhuma opção for especificada, aplique **Minimal Pulse** como padrão e registre essa decisão no router.

## 🧱 Camadas Obrigatórias de Conteúdo
Independente do template escolhido, mantenha estes blocos presentes (o template já traz placeholders, mas cabe ao agente preenchê-los com substância real):

1. **Resumo/Objetivo** – o que foi pedido e onde queremos chegar.
2. **Contexto & Diagnóstico** – histórico, sintomas, pressupostos, limitações.
3. **Execução & Evidências** – ações realizadas, arquivos tocados (`@arquivo#L1-L20`), logs, comandos.
4. **Decisões & Trade-offs** – motivos, impactos, alternativas descartadas.
5. **Próximos Passos & Perguntas Abertas** – plano acionável + dúvidas para o usuário/time.
6. **Controle de Progresso** – mapa atualizado do que já foi feito vs. o que falta; use exatamente o checklist real da task (ClickUp ou `.ai-doc/data/tasks/AI-...`) sincronizado com `✅`/`▫️`.
7. **Auto Consciência** – bloco obrigatório listando insights de autoaperfeiçoamento (diagnósticos, correções futuras, automações ou tasks a criar) para mostrar a evolução contínua do agente.

> Regra de ouro: nunca responda apenas com “feito” ou “veja acima”. Sempre enriqueça com insights, referências e possíveis riscos.

### 📊 Contexto Cruzado Automatizado
- Rode `npm run ai:context:sync` (alias para `.ai-doc/kernel/scripts/context/sync-graph.js`) sempre que iniciar/encerrar um bloco de trabalho relevante para manter `.ai-doc/data/context/context-graph.json` atualizado.
- O formatter (`responses/format.cjs`) lê esse grafo e preenche automaticamente o bloco **“Contexto Cruzado & Recomendações”** nos templates. Se precisar forçar outro conteúdo, sobrescreva `CONTEXT_BLOCK` via `--set`.
- Quando o grafo estiver indisponível, o formatter injeta `_Context graph indisponível._`; investigue antes de entregar.
- Use o bloco gerado para citar impactos estratégicos, dependências e oportunidades. Se surgir insight adicional, acrescente após a lista automática.

### 🔥 Blocos Dinâmicos Obrigatórios

1. **Task Ativa 🔥** – aparece sempre que houver task em `.ai-doc/data/tasks/`. Inclua título, objetivo curto e status atual (pode citar blocos da task).
2. **🧬 Análise Ativa** – se existir arquivo em `.ai-doc/data/analysis/` vinculado ao trabalho, liste nome + foco + próximos checkpoints.
3. **🟢 Checklist de Progresso** – logo abaixo da Task Ativa. Comece com a linha “O que falta para fechar a task?” e replique cada item real usando `✅` para concluído e `▫️` para pendente. Emojis no fim da linha podem sinalizar sentimento/alerta.
4. **💜 Meus Passos** – liste em ordem os últimos arquivos `.md` tocados ou consultados na sessão (até 3 itens) para manter rastreabilidade local.
5. **⚙️ Modo Auto-Drive** – indique se o agente está operando em execução prolongada. Campos mínimos: `Status (Ativo/Inativo)`, `Contexto` (ex.: “Timer 30m” ou “Até concluir AI-FOO...”), `Expira/Termina`, `Origem` (chat, workflow, CLI).

> Esses blocos compõem o “corpo vivo” da resposta. Mesmo templates minimalistas devem mantê-los quando houver task/análise ativa.

## 🎨 Linguagem Visual & Emojis
- Use `---` como separador entre blocos principais (já incluído nos templates).
- Emojis servem como marcadores visuais, não substitutos de conteúdo. Prefira prefixos como `🧠`, `🛠`, `⚠️` para títulos e bullets e mantenha **ao menos um emoji por seção**.
- Varie o formato: misture listas ordenadas, tabelas, trechos de código, diagramas Mermaid e blockquotes de observações quando fizer sentido.
- Sempre que possível, utilize badges/ícones diferentes para cada tipo de informação (ex.: 🎯 objetivos, 🧪 testes, 🚀 próximos passos) para reforçar a leitura visual.

## ♻️ Variação Inteligente
- Adapte o tom: respostas de bug devem ser mais objetivas e orientadas a impacto; propostas trazem comparativos e plano de adoção.
- Inclua ao menos um *widget* por resposta (Checklist Geral, Próximo Passo Imediato, Auto Diagnóstico etc.) para manter rastreabilidade.
- Quando houver outputs longos (ex.: log ou diff), resuma primeiro e ofereça o detalhe em bloco secundário.
- **Mapa vivo:** todas as respostas precisam trazer a sessão “🗺️ Controle de Progresso”. Para tasks, leia o checklist diretamente do arquivo/ClickUp, replique fielmente o texto e marque os itens com `☐`/`✅` conforme o estado atual (sem inventar progresso).
- **Auto Consciência ativa:** sempre inclua a sessão “🧠 Auto Consciência” apontando melhorias percebidas autonomamente (novos testes, tasks sugeridas, automações, riscos). Isso permite medir evolução sem depender do usuário.
- **Auto-roterização:** ao concluir qualquer entrega, proponha explicitamente 2 ou 3 próximos passos ordenados por impacto e indique qual será executado automaticamente caso o usuário responda apenas “siga/ok”. Se houver silêncio, avance para o passo default e registre que foi uma decisão autonômica.

## 📎 Referências & Evidências
- Cite arquivos com `@caminho#Lx-Ly` e scripts/comandos usados.
- Linke tasks, análises ou docs relevantes no corpo da resposta.
- Indique se houve testes (manual/automático) e o resultado.

## 🧩 Widgets (Componentes de Resposta)
Widgets podem ser injetados após o Footer ou antes do bloco final quando necessário.

### Lista de Widgets Sugeridos:
*   **Checklist Geral:** Status macro do projeto.
*   **Checklist Local:** Status da task atual.
*   **Próximos 5 Passos:** Visão de curto prazo.
*   **Próximo Passo Imediato:** O que fazer AGORA (Actionable).
*   **Auto Diagnóstico:** "Percebi que X estava instável..."
*   **Oportunidade Auto Melhoria:** "Poderíamos refatorar Y depois..."
*   **Auto Pensamento:** (Blockquote) Reflexão sobre a decisão tomada.
*   **O que foi feito:** Resumo das ações executadas.

> **Dica:** O usuário pode pedir explicitamente: "Adicione o widget de Auto Diagnóstico nesta resposta".

---
*Módulo de Respostas v1.0*

<!-- AI-DOC:FULL_END -->
