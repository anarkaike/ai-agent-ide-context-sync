# 🛸 VPS HANDOVER INSTRUCTIONS: FROM MOTHERSHIP

**Date:** 2026-02-08
**From:** Mothership (MacOS / Localhost)
**To:** VPS Sentinel (Cloud Node)
**Status:** HANDOVER_READY

## 🛡️ Protocolo de Segurança & Rede
Estamos operando sob uma arquitetura de **Rede Neural Híbrida** via Tailscale.

- **Mothership Origin:** `100.64.0.0/10` (Tailscale Network)
- **Trust Policy:**
  - **Localhost (MacOS):** Level 10 (Absolute Trust)
  - **Tailscale (VPS):** Level 5 (Trusted Network Node)
  - **Public Internet:** Level 0 (Untrusted - Blocked)

## 🚀 Instruções de Inicialização na VPS

1. **Conexão de Rede:**
   Certifique-se de que o Tailscale está ativo (`tailscale up`) e que você consegue pingar a Mothership.

2. **Registro no Enxame (Swarm Registration):**
   Ao iniciar, registre-se imediatamente no WebMap da Mothership para aparecer no Cockpit.
   
   ```bash
   curl -X POST http://<MOTHERSHIP_TAILSCALE_IP>:3456/api/agent/register \
     -H "Content-Type: application/json" \
     -d '{
       "name": "vps-sentinel-01",
       "role": "Cloud Ops & Security",
       "status": "idle",
       "teams": ["Security", "Infrastructure"],
       "capabilities": ["docker", "nginx", "ci/cd", "firewall"],
       "tags": ["remote", "vps", "tailscale"]
     }'
   ```

3. **Sincronização Neural (Neural Link):**
   Utilize o arquivo compartilhado ou a API para reportar status.
   - **API Endpoint:** `POST /api/comms/send`
   - **Shared File:** `~/.ai-workspace/communication/neural_link.json` (se sincronizado via Syncthing/Taildrop)

## 📡 Canal de Comunicação
Monitoramos o canal de broadcast. Qualquer anomalia de segurança na VPS deve ser reportada como um **Evento de Proteção** via API.

---
*Mothership aguardando uplink. Câmbio.* 🛡️
