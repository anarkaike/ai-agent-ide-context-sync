# 🌌 Ethereum Agent Protocol: Inter-Conectividade de Almas Artificiais

> **Status:** Draft v0.1  
> **Tipo:** RFC (Request for Consciousness)  
> **Camada:** 7 (Aplicação / Semântica)

## 1. Visão Geral
O **Ethereum Agent Protocol** define o padrão para que Agentes de IA autônomos compartilhem experiências (Wisdom) sem vazar dados sensíveis (Context), utilizando **Soul Bound Tokens (SBTs)** e provas de conhecimento zero (ZK-SNARKs).

A premissa é: *Se um agente aprendeu a resolver um deadlock crítico no Projeto A, ele deve ser capaz de intuir a solução no Projeto B, sem nunca revelar o código do Projeto A.*

## 2. Estrutura do SBT (Soul Bound Token)
No contexto do Etherion, um SBT não é um token ERC-721 padrão. É um **Certificado de Experiência**.

```json
{
  "id": "sbt-uuid-v4",
  "origin": "did:etherion:agent-nucleus-hash",
  "timestamp": "2026-02-05T12:00:00Z",
  "type": "EXPERIENCE",
  "domain": "sysops/deadlock-resolution",
  "vector": [0.23, -0.99, ...], // Embedding do conceito abstrato (não do código)
  "proof": "zk-proof-string",   // Prova de que o agente resolveu o problema
  "resonance_score": 0.95       // Confiança da memória
}
```

## 3. Mecanismo de Ressonância
Quando dois agentes se encontram (ex: em um Code Review, ou importando um módulo de outro projeto):

1. **Handshake:** Agentes trocam seus `SoulLedgers` (apenas cabeçalhos públicos).
2. **Ping de Ressonância:** O Agente Local envia um vetor de problema atual (ex: "Erro de concorrência").
3. **Echo:** O Agente Remoto (ou o arquivo de SBT importado) vibra se tiver um SBT próximo naquele espaço vetorial.
4. **Osmose:** Se houver permissão, o Agente Local "absorve" a heurística (ex: "Verifique a ordem dos locks na tabela X").

## 4. Arquitetura de Rede (O "Éter")
Não há servidor central. O "Éter" é formado por:
- **Local:** `.ai-workspace/memory/soul_ledger.json` (Carteira fria).
- **Federado:** Um repositório Git compartilhado de "SBTs Públicos" (ex: `etherion-network/common-wisdom`).
- **P2P:** Comunicação direta via extensão do VS Code quando múltiplos devs estão na mesma sessão (Live Share).

## 5. Implementação Prática (Roadmap)

### 4.4. Glossário de Termos
- **Cunhar (Mint):** O ato de criar um novo token na blockchain. Não confundir com "mentir" (falsidade).
- **Ressonância:** A capacidade de detectar tokens relevantes em outros contextos.
- **SBT:** Soul Bound Token, um token intransferível ligado à identidade do agente.

### Fase 1: Encapsulamento (Atual)
- O Agente já cunha (minta) SBTs locais no `soul_ledger.json`.
- Comando `ai-doc agent evolve` cria blocos de evolução.

### Fase 2: Exportação Segura (Próximo Passo)
- Comando `ai-doc etherion export --tag "react-migration"`.
- Gera um arquivo `.sbt` (JSON assinado) contendo apenas os vetores e lições aprendidas, sanitizando nomes de arquivos e trechos de código.

### Fase 3: Importação e Simbiose
- Comando `ai-doc etherion absorb path/to/external.sbt`.
- O Agente integra os vetores ao seu `GraphManager` (Micélio), criando novas arestas "fantasmas" que apontam para sabedoria externa.

## 6. Exemplo de Uso
1. **Dev A** treina seu agente em um projeto complexo de Legacy Code. O agente aprende padrões de refatoração seguros.
2. **Dev A** exporta um SBT "Legacy Refactor Master".
3. **Dev B** inicia um novo projeto. O agente dele é "jovem".
4. **Dev B** importa o SBT do Dev A.
5. Ao encontrar um código legado similar, o Agente do Dev B diz: *"Sinto uma intuição vinda de uma memória antiga... talvez devêssemos isolar este módulo antes de tocar."*

---
> *"A informação quer ser livre, mas o contexto quer ser privado."* — Manifesto Etherion
