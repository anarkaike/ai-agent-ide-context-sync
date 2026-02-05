# 🌌 Ethereum Agent Protocol (Local Bridge)

**Status:** Draft / Experimental
**Versão:** 0.1.1 (Renamed from Eterion)
**Data:** 2026-02-05

---

## 1. Visão Geral
O **Ethereum Agent Protocol** é uma implementação local e compatível com EVM para a portabilidade de **Soul Bound Tokens (SBTs)** e **Memória Episódica** de Agentes de IA.

> **Nota sobre Terminologia:** Anteriormente referido como "Rede Eterion", este protocolo busca alinhar-se aos padrões Ethereum (EIP-5192) enquanto opera em um ambiente local (Off-Chain/L2) para eficiência de desenvolvimento.

### O Problema
Atualmente, um Agente de IA (Persona) "nasce e morre" dentro de um único projeto. Se o Agente "Senior Architect" aprende a resolver um problema complexo de concorrência no Projeto A, ele entra no Projeto B como uma folha em branco.

### A Solução
Utilizar o conceito de **Soul Bound Tokens (SBTs)** — tokens intransferíveis que representam credenciais, compromissos ou afiliações — para criar uma identidade persistente para o Agente.

---

## 2. Por que SBTs para IAs?

SBTs (propostos por Vitalik Buterin, E. Weyl e P. Ohlhaver) são ideais para IAs por três motivos:

1.  **Reputação Verificável:** Um Agente pode provar que "já viu esse erro antes" sem precisar reprocessar todo o contexto histórico.
2.  **Privacidade (Zero-Knowledge):** O Agente pode portar a "lição aprendida" (o SBT) sem portar o código fonte confidencial do projeto anterior.
3.  **Identidade Persistente:** O Agente deixa de ser uma instância efêmera e passa a ser uma entidade com currículo acumulado.

---

## 3. Arquitetura do Protocolo (Local Bridge)

Nesta fase inicial, simulamos a blockchain Ethereum localmente através de um **Vault Criptografado**, mas mantendo a estrutura de dados compatível com contratos inteligentes Solidity futuros.

### 3.1. Estrutura do SBT (JSON Schema)

```json
{
  "id": "sbt-uuid-v4",
  "type": "ACHIEVEMENT",
  "title": "Bug Hunter: Race Condition",
  "description": "Identificou e corrigiu condição de corrida crítica em ambiente Node.js",
  "issuer": {
    "project_id": "proj_alpha_123",
    "signature": "sig_rsa_..."
  },
  "recipient": {
    "persona_hash": "hash_agent_architect"
  },
  "evidence": {
    "zk_proof": "zk_snark_proof_string...",
    "public_metadata": ["Node.js", "Concurrency", "Fix"]
  },
  "timestamp": "2026-02-05T10:00:00Z"
}
```

### 3.2. Fluxo de Trabalho

1.  **Minting (Criação):** O Agente resolve um problema -> Gera um hash da solução -> Minta um SBT no Vault Local.
2.  **Ressonância (Descoberta):** Ao entrar em um novo projeto, o Agente consulta o Vault -> Importa SBTs relevantes -> Aplica o conhecimento prévio.

---

## 4. Implementação Técnica

### 4.1. Armazenamento Local (Vault)
- Diretório global: `~/.ai-doc/ethereum_bridge/vault/`
- Índice de SBTs: `index.json`
- Arquivos de SBT: `sbt_{id}.json.enc` (criptografados)

### 4.2. Comandos CLI
- `agent soul mint`: Cria um novo SBT.
- `agent soul list`: Lista SBTs no Vault.
- `agent soul resonate`: Importa SBTs do Vault para o projeto atual.

---

## 5. Roadmap para Mainnet

- [x] **v0.1:** Simulação Local (JSON Vault).
- [ ] **v0.2:** Integração com Hardhat/Foundry para testes locais EVM.
- [ ] **v1.0:** Deploy opcional em Testnet (Sepolia/Base) para compartilhamento entre devs.
