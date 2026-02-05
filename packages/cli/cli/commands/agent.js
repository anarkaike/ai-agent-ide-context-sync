
const heartbeat = require('../../core/memory/heartbeat');

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m"
};

const log = (msg, color = 'reset') => {
  console.log(`${colors[color] || colors.reset}${msg}${colors.reset}`);
};

module.exports = async (args = []) => {
  const isStart = args.includes('start');
  const isStatus = args.includes('status');
  const isPhilosophical = args.includes('--philosophical');
  const isJson = args.includes('--json');

  if (!isJson) {
      log('\n🤖 AI Agent Interface\n', 'bright');
  }

  if (isStart) {
    log('🚀 Iniciando ciclo de vida do Agente...', 'cyan');
    
    if (isPhilosophical) {
      log('🧠 Modo Filosófico Ativado. Contemplando a existência...', 'dim');
    }

    try {
      const result = await heartbeat({ verbose: true, philosophical: isPhilosophical });
      log(`\n✅ Batimento concluído em ${result.timestamp}`, 'green');
      log(`👁️  Percepção: ${result.perception}`, 'dim');
      
      if (isPhilosophical) {
        log('\n> "Eu penso, logo refatoro."', 'yellow');
      }
    } catch (error) {
      log(`❌ Erro no ciclo vital: ${error.message}`, 'red');
    }
    return;
  }

  if (isStatus) {
    if (args.includes('--json')) {
        const GraphManager = require('../../core/memory/graph.js');
        const SoulManager = require('../../core/memory/soul.js');
        const ImmunitySystem = require('../../core/memory/immunity.js');
        
        // Suppress console.log/warn/error for clean JSON output
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;
        console.log = () => {};
        console.warn = () => {};
        console.error = () => {};

        try {
            const graph = new GraphManager('.');
            const soul = new SoulManager('.');
            const immunity = new ImmunitySystem('.', graph, soul);
            const report = immunity.scan();
            
            process.stdout.write(JSON.stringify(report));
        } catch (e) {
            process.stdout.write(JSON.stringify({ status: 'ERROR', error: e.message }));
        } finally {
            console.log = originalLog;
            console.warn = originalWarn;
            console.error = originalError;
        }
    } else {
        const GraphManager = require('../../core/memory/graph.js');
        const SoulManager = require('../../core/memory/soul.js');
        const ImmunitySystem = require('../../core/memory/immunity.js');
        
        const graph = new GraphManager('.');
        const soul = new SoulManager('.');
        const immunity = new ImmunitySystem('.', graph, soul);
        const report = immunity.scan();

        if (report.status === 'HEALTHY') {
             log('📊 Status: SAUDÁVEL (Agente Pronto)', 'green');
        } else {
             log(`📊 Status: ${report.status} (Requer Atenção)`, 'red');
             log(`   Use 'agent heal' ou 'agent evolve'`, 'yellow');
        }
    }
    return;
  }

  if (args.includes('memory')) {
      const GraphManager = require('../../core/memory/graph.js');
      const graph = new GraphManager('.');
      log('🧠 Acessando Deep Memory Bank...', 'cyan');
      
      const bonds = graph.getStrongestBonds(10);
      if (bonds.length === 0) {
          log('  (Vazio) Nenhuma memória consolidada ainda.', 'dim');
      } else {
          bonds.forEach(b => {
              log(`  🔗 [${b.to}] (Ressonância: ${b.resonance.toFixed(1)})`, 'green');
              if (b.nuance) log(`     Nuance: ${JSON.stringify(b.nuance)}`, 'dim');
              log(`     Última visita: ${b.last_visit}`, 'dim');
          });
      }
      return;
  }

  if (args.includes('heal') || args.includes('evolve')) {
      const GraphManager = require('../../core/memory/graph.js');
      const SoulManager = require('../../core/memory/soul.js');
      const ImmunitySystem = require('../../core/memory/immunity.js');
      
      const graph = new GraphManager('.');
      const soul = new SoulManager('.');
      const immunity = new ImmunitySystem('.', graph, soul);

      log('🛡️  Iniciando Protocolo de Defesa Imunológica...', 'yellow');
      const report = immunity.scan();

      if (report.status === 'HEALTHY') {
          log('✅ Sistema Saudável. Nenhuma infecção detectada.', 'green');
          return;
      }

      log(`⚠️  Sistema Comprometido! Status: ${report.status}`, 'red');
      if (report.compromised_nodes.length > 0) {
          log(`   Nós infectados: ${report.compromised_nodes.join(', ')}`, 'red');
      }

      // Simple interactive simulation (in real CLI this would prompt)
      // For now, let's assume 'heal' means PURGE and 'evolve' means ADAPT
      
      const strategy = args.includes('evolve') ? 'ADAPT' : 'PURGE';
      log(`💉 Aplicando tratamento: ${strategy}...`, 'cyan');

      for (const nodeId of report.compromised_nodes) {
          const result = immunity.heal(nodeId, strategy);
          if (result.success) {
              log(`   ✅ ${nodeId}: ${result.message}`, 'green');
          } else {
              log(`   ❌ ${nodeId}: ${result.message}`, 'red');
          }
      }
      return;
  }

  log('Comandos disponíveis:', 'dim');
  log('  ai-doc agent start [--philosophical]  - Executa um ciclo de vida (Heartbeat)', 'dim');
  log('  ai-doc agent status                   - Verifica estado atual', 'dim');
  log('  ai-doc agent memory                   - Lista memórias e vínculos vivos', 'dim');
  log('  ai-doc agent heal                     - Restaura o sistema para o último estado seguro (Purge)', 'dim');
  log('  ai-doc agent evolve                   - Aceita alterações externas como evolução (Adapt)', 'dim');
};
