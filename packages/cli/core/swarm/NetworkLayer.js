const os = require('os');

/**
 * 🌐 NetworkLayer
 * Gerencia a detecção de interfaces de rede, com prioridade para redes seguras (Tailscale/VPN).
 */
class NetworkLayer {
    constructor() {
        this.interfaces = os.networkInterfaces();
        this.preferredInterface = this.detectPreferredInterface();
    }

    /**
     * Detecta a melhor interface de rede disponível.
     * Prioridade:
     * 1. Tailscale (tailscale0, utun*, ou IPs 100.x.x.x)
     * 2. VPNs Gerais
     * 3. LAN (192.168.x.x, 10.x.x.x)
     * 4. Localhost
     */
    detectPreferredInterface() {
        let bestCandidate = null;

        for (const [name, addrs] of Object.entries(this.interfaces)) {
            for (const addr of addrs) {
                // Pular IPv6 por enquanto (simplificação) e interfaces internas
                if (addr.family !== 'IPv4' || addr.internal) continue;

                const score = this.scoreInterface(name, addr.address);
                
                if (!bestCandidate || score > bestCandidate.score) {
                    bestCandidate = { name, address: addr.address, score };
                }
            }
        }

        return bestCandidate || { name: 'lo', address: '127.0.0.1', score: 0 };
    }

    /**
     * Pontua uma interface baseada em segurança e tipo.
     */
    scoreInterface(name, ip) {
        // 1. Tailscale (Ouro)
        if (name.includes('tailscale') || (ip.startsWith('100.') && !ip.startsWith('100.64.'))) { // CGNAT exclusion logic simplified
            return 100;
        }

        // 2. Outras VPNs (Prata)
        if (name.includes('tun') || name.includes('tap') || name.includes('wg')) {
            return 80;
        }

        // 3. Redes Privadas (Bronze)
        if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.16.')) {
            return 50;
        }

        // 4. Público (Risco)
        return 10;
    }

    /**
     * Retorna o endereço IP preferencial para comunicação Swarm.
     */
    getSwarmIP() {
        return this.preferredInterface.address;
    }

    /**
     * Retorna metadados da rede para registro no Registry.
     */
    getNetworkInfo() {
        return {
            interface: this.preferredInterface.name,
            address: this.preferredInterface.address,
            is_secure: this.preferredInterface.score >= 80,
            provider: this.preferredInterface.score >= 100 ? 'TAILSCALE' : 'GENERIC'
        };
    }
}

module.exports = NetworkLayer;
