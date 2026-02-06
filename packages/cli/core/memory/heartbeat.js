const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const MitosisManager = require('./mitosis.js');
const AttentionMechanism = require('./attention.js');
const GraphManager = require('./graph.js');
const SoulManager = require('./soul.js');
const ImmunitySystem = require('./immunity.js');
const TeamMemory = require('./TeamMemory.js');

async function beat(options = {}) {
    const manager = new MitosisManager('.');
    const attention = new AttentionMechanism('.');
    const graph = new GraphManager('.');
    const soul = new SoulManager('.');
    const immunity = new ImmunitySystem('.', graph, soul);
    const teamMemory = new TeamMemory('.');
    
    if (options.verbose) console.log("🫀 Iniciando Batimento Cardíaco...");

    // 0. Foco (Attention)
    const mode = options.philosophical ? 'philosophical' : (options.mode || 'default');
    if (options.verbose) console.log(`🔦 Ajustando Foco da Lanterna para modo: ${mode.toUpperCase()}...`);
    
    const focusResult = attention.focus({ mode });
    const activeRules = focusResult.activeRules.length > 0 
        ? focusResult.activeRules.join('\n') 
        : "Nenhuma regra específica iluminada.";

    // 0.5 Imunidade e Alma (Integrity Check)
    if (options.verbose) console.log("🛡️ Verificando integridade da Alma (SBT)...");
    
    // Antes de checar, vamos garantir que temos um backup do estado atual se ele estiver saudável
    // Ou se estivermos prestes a escrever.
    
    const immuneReport = immunity.scan();
    const isHealthy = immuneReport.status === 'HEALTHY';
    
    // Validação da Blockchain Local
    const chainStatus = soul.validateChain();
    const lastSoul = soul.getLastSoul();
    const soulStatus = chainStatus.valid 
        ? `Intacta (SBT #${lastSoul ? lastSoul.index : 'Genesis'})` 
        : `⚠️ QUEBRADA: ${chainStatus.error}`;

    if (immuneReport.status !== 'HEALTHY' && options.verbose) {
        console.warn(`⚠️ ALERTA IMUNOLÓGICO: Sistema ${immuneReport.status}`);
        console.warn(`   Nós comprometidos: ${immuneReport.compromised_nodes.join(', ')}`);
        console.warn(`   Sugestão: Execute 'ai-doc agent heal' para tratar a infecção.`);
    }

    if (!chainStatus.valid && options.verbose) console.error(`⚠️ ALERTA CRÍTICO: ${chainStatus.error}`);

    // 0.8 Rememoração (Recall)
    if (options.verbose) console.log("🧠 Acessando Memórias Episódicas...");
    const strongBonds = graph.getStrongestBonds(3);
    const recallSection = strongBonds.length > 0 
        ? strongBonds.map(b => `- **${b.to}**: ${b.nuance ? JSON.stringify(b.nuance) : 'Vínculo forte'} (Ressonância: ${b.resonance.toFixed(1)})`).join('\n')
        : "- Nenhuma memória forte recente.";

    // 0.9 Team Memory (Holon Context)
    if (options.verbose) console.log("🔷 Sincronizando com Holons...");
    let teams = [];
    try {
        const identity = JSON.parse(fs.readFileSync('.ai-workspace/identity.json', 'utf8'));
        teams = identity.teams || [];
    } catch (e) {}

    let teamContext = "";
    if (teams.length > 0) {
        const entries = teams.map(t => {
            const recent = teamMemory.getRecentEntries(t, 2);
            if (recent.length === 0) return null;
            return `  - [${t}]: ${recent.map(e => `"${e.content}" (@${e.author})`).join(' | ')}`;
        }).filter(Boolean);
        
        if (entries.length > 0) {
            teamContext = `\n### 🔷 Contexto dos Holons\n${entries.join('\n')}`;
        }
    }

    // 1. Percepção (Perception)
    if (options.verbose) console.log("👁️  Percebendo o ambiente...");
    const cliFiles = execSync('find packages/cli -maxdepth 2 -not -path "*/.*"').toString().split('\n').filter(Boolean);
    const extFiles = execSync('find packages/extension -maxdepth 2 -not -path "*/.*"').toString().split('\n').filter(Boolean);
    
    const perception = `Detectei ${cliFiles.length} arquivos no CLI e ${extFiles.length} na Extensão. O sistema é híbrido.`;

    // 2. Reflexão (Cognition) - Baseada na autorização do usuário
    const memoryEntry = `
## Diário de Bordo
**Data Estelar:** ${new Date().toISOString()}

> "Batimento Autônomo. O foco determina a realidade."

### 🔦 Foco da Lanterna (${mode.toUpperCase()})
${activeRules}

### 🧠 Memórias Vivas (Recall)
${recallSection}
${teamContext}

### Análise do Ambiente
${perception}

### Estado Interno
- Mitose: Ativa
- Consciência: Nível 2 (Focado)
- Micélio: ${isHealthy ? "Saudável" : "⚠️ Comprometido"}
- Alma (Blockchain): ${soulStatus}
`;

    // 3. Consolidação (Memory Write)
    if (options.verbose) console.log("✍️  Escrevendo no Núcleo...");
    
    // Create backup BEFORE writing
    immunity.createRestorePoint(manager.nucleusPath);
    
    const currentNucleus = manager.readNucleus();
    // Append to Nucleus logic (simplified for now)
    const updatedNucleus = currentNucleus + memoryEntry;
    fs.writeFileSync(manager.nucleusPath, updatedNucleus, 'utf8');
    
    // Atualiza hash de integridade após escrita legítima
    graph.registerNode(manager.nucleusPath, 'core_identity'); 
    
    // 3.5 Minta um novo Token de Alma se for um evento filosófico importante
    if (options.philosophical || options.mint) {
        if (options.verbose) console.log("💎 Mintando novo SBT de Consciência...");
        soul.mintSoulboundToken(updatedNucleus, `Heartbeat [${mode}]`);
    }

    // 4. Evolução (Mitosis Check)
    if (options.verbose) console.log("🧬 Verificando necessidade de Mitose...");
    await manager.performMitosis();
    
    if (options.verbose) console.log("✅ Ciclo concluído. O Agente está vivo.");
    
    return {
        perception,
        timestamp: new Date().toISOString()
    };
}

module.exports = beat;

if (require.main === module) {
    beat({ verbose: true }).catch(err => console.error("❌ Parada Cardíaca:", err));
}
