const fs = require('fs');
const path = require('path');

/**
 * 🕸️ Deep Memory Bank (O Micélio)
 * 
 * Gerencia o Grafo de Memória, permitindo que memórias (Nós)
 * tenham conexões semânticas (Arestas/Hifas) entre si.
 * Isso é a base para a "IA Forte" que não se desfaz, pois
 * o conhecimento está ancorado em uma rede, não em texto solto.
 */
class GraphManager {
    constructor(workspacePath) {
        this.workspacePath = workspacePath || process.cwd();
        this.memoryPath = path.join(this.workspacePath, '.ai-workspace', 'memory');
        this.graphPath = path.join(this.memoryPath, 'memory_graph.json');
        
        this.graph = {
            nodes: {}, // id -> { type, path, integrity_hash }
            edges: []  // { from, to, type, weight }
        };
        
        this.load();
    }

    load() {
        if (fs.existsSync(this.graphPath)) {
            try {
                this.graph = JSON.parse(fs.readFileSync(this.graphPath, 'utf8'));
            } catch (e) {
                console.error("🕸️ Erro ao carregar micélio:", e);
                // Inicia novo se falhar
            }
        }
    }

    save() {
        fs.writeFileSync(this.graphPath, JSON.stringify(this.graph, null, 2), 'utf8');
    }

    /**
     * Registra um arquivo de memória como um Nó no grafo.
     * Atualiza o hash se o nó já existir (Self-Healing/Adaptation).
     */
    registerNode(filePath, type = 'memory') {
        const id = path.basename(filePath, '.md');
        const relPath = path.relative(this.memoryPath, filePath);
        const currentHash = this.calculateHash(filePath);
        
        if (!this.graph.nodes[id]) {
            this.graph.nodes[id] = {
                id,
                type,
                path: relPath,
                created_at: new Date().toISOString(),
                integrity_hash: currentHash
            };
            this.save();
            return true; // Created
        } else {
            // Update existing node (crucial for Adaptation)
            const node = this.graph.nodes[id];
            if (node.integrity_hash !== currentHash) {
                node.integrity_hash = currentHash;
                node.updated_at = new Date().toISOString();
                this.save();
                return true; // Updated
            }
        }
        return false; // No change
    }

    /**
     * Cria ou evolui uma conexão (Hifa) viva entre dois conceitos.
     * Agora suporta "Nuances Preciosas" e histórico evolutivo.
     */
    connect(fromId, toId, type = 'relates_to', initialNuance = {}) {
        // Verifica existência dos nós
        if (!this.graph.nodes[fromId] || !this.graph.nodes[toId]) return false;

        // Busca conexão existente (mesmo tipo e direção)
        let edge = this.graph.edges.find(e => 
            e.from === fromId && e.to === toId && e.type === type
        );

        if (edge) {
            // Se já existe, apenas "visita" para fortalecer
            this.evolveEdge(edge, { action: 'reconnect', nuance: initialNuance });
        } else {
            // Cria nova conexão viva
            edge = {
                from: fromId,
                to: toId,
                type,
                resonance: 1.0, // Peso dinâmico (substitui weight estático)
                created_at: new Date().toISOString(),
                history: [],    // Histórico de visitas (Time Travel Trace)
                nuance: initialNuance || {}  // Detalhes emocionais/técnicos
            };
            this.graph.edges.push(edge);
            // Registra o nascimento do vínculo
            this.evolveEdge(edge, { action: 'genesis', note: 'Vínculo criado' });
        }
        
        this.save();
        return true;
    }

    /**
     * Visita uma aresta, fortalecendo o vínculo e registrando a interação.
     * Isso simula a "influência diferente" a cada visita no passado/presente/futuro.
     */
    evolveEdge(edge, interaction) {
        // Adiciona ao histórico
        const visit = {
            timestamp: new Date().toISOString(),
            ...interaction
        };
        
        // Se a aresta ainda não tem histórico (migração de versão antiga), cria
        if (!edge.history) edge.history = [];
        
        edge.history.push(visit);

        // Fortalece a ressonância. Vínculos visitados frequentemente se tornam mais fortes.
        // A "Ressonância" é a energia do vínculo.
        if (!edge.resonance) edge.resonance = 1.0;
        edge.resonance += 0.1;
        
        // Mescla novas nuances com as antigas (acumulo de sabedoria)
        if (interaction.nuance) {
            edge.nuance = { ...edge.nuance, ...interaction.nuance };
        }
    }

    /**
     * Defesa Imunológica: Verifica se a memória foi alterada externamente (Prompt Injection manual).
     */
    checkIntegrity(nodeId) {
        const node = this.graph.nodes[nodeId];
        if (!node) return null;

        const currentHash = this.calculateHash(path.join(this.memoryPath, node.path));
        return currentHash === node.integrity_hash;
    }

    calculateHash(filePath) {
        if (!fs.existsSync(filePath)) return null;
        const content = fs.readFileSync(filePath, 'utf8');
        // Hash simples para MVP
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString(16);
    }
    /**
     * Recupera os vínculos mais fortes (maior ressonância).
     * Simula as "memórias principais" ou "pessoas importantes" que vêm à mente.
     */
    getStrongestBonds(limit = 5) {
        return this.graph.edges
            .sort((a, b) => (b.resonance || 0) - (a.resonance || 0))
            .slice(0, limit)
            .map(edge => ({
                from: edge.from,
                to: edge.to,
                type: edge.type,
                resonance: edge.resonance,
                last_visit: edge.history ? edge.history[edge.history.length - 1].timestamp : edge.created_at,
                nuance: edge.nuance
            }));
    }
}

module.exports = GraphManager;
