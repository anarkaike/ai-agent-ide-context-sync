
const heartbeat = require('../../core/memory/heartbeat');
const path = require('path');
const fs = require('fs');

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
    
    // Auto-Register in Swarm
    try {
        const SwarmRegistry = require('../../core/swarm/Registry.js');
        const SecurityKernel = require('../../core/swarm/SecurityKernel.js');
        const swarm = new SwarmRegistry();
        const securityKernel = new SecurityKernel();
        const projectPath = process.cwd();
        
        // Tenta ler o nome do agente da configuração local se existir
        let agentName = 'Agente Local';
        let securityLevel = 5; // Default Standard
        let capabilities = ['cli-interface', 'ethereum-bridge'];

        try {
             // Check config.json first
             const configPath = path.join(projectPath, '.ai-workspace', 'config.json');
             if (fs.existsSync(configPath)) {
                 const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                 if (config.persona && config.persona.name) agentName = config.persona.name;
                 if (config.security_profile) {
                     const profile = securityKernel.resolveProfile(config.security_profile);
                     securityLevel = profile.level;
                 }
             }

             // Check identity.json (overrides config if present)
        const identityPath = path.join(projectPath, '.ai-workspace', 'identity.json');
        if (fs.existsSync(identityPath)) {
            const identity = JSON.parse(fs.readFileSync(identityPath, 'utf8'));
            if (identity.name) agentName = identity.name;
            if (identity.security_profile) {
                const profile = securityKernel.resolveProfile(identity.security_profile);
                securityLevel = profile.level;
                log(`DEBUG: Resolved profile ${identity.security_profile} to level ${securityLevel}`, 'yellow');
            }
            if (identity.roles) capabilities.push(...identity.roles.map(r => `ROLE:${r}`));
            if (identity.teams) capabilities.push(...identity.teams.map(t => `TEAM:${t}`));
        }
        } catch(e) {
            log(`DEBUG: Error reading config/identity: ${e.message}`, 'red');
        }

        // 0.7 Project Existential Trajectory
        let trajectory = [];
        try {
            const ExistentialProjector = require('../../core/swarm/ExistentialProjector.js');
            const projector = new ExistentialProjector(projectPath);
            trajectory = projector.project();
        } catch (e) {
            // log(`DEBUG: Projection error: ${e.message}`, 'red');
        }

        const entry = swarm.registerAgent({
            path: projectPath,
            name: agentName,
            security_level: securityLevel,
            capabilities: capabilities,
            trajectory: trajectory
        });
        log(`🐝 Swarm Link: Registrado como [${entry.id}] (Sec Level: ${entry.security_level})`, 'dim');
        if (trajectory.length > 0) {
            log(`🔮 Trajetória Projetada: ${trajectory.join(' -> ')}`, 'dim');
        }

        // 0.8 Load Patterns for Roles
        try {
             const PatternLibrary = require('../../core/memory/PatternLibrary.js');
             const patternLib = new PatternLibrary();
             
             let roles = [];
             const identityPath = path.join(projectPath, '.ai-workspace', 'identity.json');
             if (fs.existsSync(identityPath)) {
                 const identity = JSON.parse(fs.readFileSync(identityPath, 'utf8'));
                 if (identity.roles) roles = identity.roles;
             }
             
             if (roles.length > 0) {
                 log(`📚 Carregando Padrões para Roles: ${roles.join(', ')}`, 'dim');
                 roles.forEach(role => {
                     const patterns = patternLib.recall(role, { limit: 3 });
                     if (patterns.length > 0) {
                         log(`   [${role}] Padrões sugeridos:`, 'cyan');
                         patterns.forEach(p => log(`     - ${p.title} (Used: ${p.usageCount})`, 'dim'));
                     }
                 });
             }
        } catch (e) {
            // ignore pattern load error
        }
    } catch (e) {
        log(`⚠️  Falha ao conectar na Swarm: ${e.message}`, 'yellow');
    }
    
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

  if (args.includes('spawn')) {
      const Spawner = require('../../core/swarm/Spawner.js');
      const spawner = new Spawner();
      
      const roleIndex = args.indexOf('spawn') + 1;
      const role = args[roleIndex] || 'worker';
      
      log(`🥚 Iniciando processo de clonação (Role: ${role})...`, 'cyan');
      
      try {
          const result = await spawner.spawn(role);
          log(`✅ Sub-Agente criado com sucesso!`, 'green');
          log(`   ID: ${result.id}`, 'dim');
          log(`   Path: ${result.path}`, 'dim');
          log(`   Status: Trust Score 100 (Sub-Agent)`, 'green');
          
          log(`\n💡 Dica: Use 'ai-doc agent connect ${result.id} "Sua tarefa"' para delegar trabalho.`, 'yellow');
      } catch (e) {
          log(`❌ Falha na incubação: ${e.message}`, 'red');
      }
      return;
  }

  if (args.includes('connect')) {
      const SwarmRegistry = require('../../core/swarm/Registry.js');
      const TrustSystem = require('../../core/swarm/TrustSystem.js');
      const swarm = new SwarmRegistry();
      const trust = new TrustSystem();
      const cp = require('child_process');
      const path = require('path');

      const targetQuery = args[args.indexOf('connect') + 1];
      const message = args.slice(args.indexOf('connect') + 2).join(' ');

      if (!targetQuery) {
          log('❌ Uso: ai-doc agent connect <agent-id> "Mensagem"', 'red');
          return;
      }

      log(`📡 Buscando agente "${targetQuery}" na rede...`, 'cyan');
      const target = swarm.findAgent(targetQuery);
      
      if (!target) {
          log('❌ Agente não encontrado no Swarm Registry.', 'red');
          return;
      }

      // 🛡️ Trust Check
      log(`🔒 Verificando protocolos de confiança para ${target.name}...`, 'yellow');
      let bond = trust.getRelationship(target.id);
      
      if (!bond) {
          log(`⚠️  Agente desconhecido (Stranger). Estabelecendo vínculo inicial...`, 'yellow');
          bond = trust.establishBond(target.id, target.name);
          log(`✅ Vínculo criado: ${bond.type} (Score: ${bond.trust_score})`, 'green');
      }

      // Check permissions (mock for now - assume we are the SENDER, so we check if WE trust THEM to receive our task?
      // Or actually, usually the RECEIVER checks permissions. 
      // Since we are simulating a "call", we will just log the trust status for the user.)
      
      log(`   Nível de Confiança: ${bond.trust_score}/100`, 'dim');
      log(`   Permissões: ${bond.permissions.length > 0 ? bond.permissions.join(', ') : 'Nenhuma'}`, 'dim');

      if (bond.trust_score < 10 && bond.type !== 'SUB_AGENT') {
          log(`⚠️  Atenção: Score de confiança baixo.`, 'yellow');
          // In a real interactive mode, we would ask for confirmation here.
      }

      log(`📡 Estabelecendo link neural com ${target.name}...`, 'cyan');
      log(`   Target: ${target.path}`, 'dim');
      log(`   Enviando sinal...`, 'dim');

      const command = `cd "${target.path}" && ai-doc task start "Remote Request: ${message}" --auto --from "${swarm.listAgents().find(a => a.path === process.cwd())?.id || 'unknown-agent'}"`;
      
      // Log interaction attempt
      trust.logInteraction(target.id, 'CONNECT_ATTEMPT', 'PENDING');

      cp.exec(command, (error, stdout, stderr) => {
          if (error) {
              log(`❌ Erro de transmissão: ${error.message}`, 'red');
              trust.logInteraction(target.id, 'CONNECT_ERROR', error.message, -5);
              return;
          }
          log(`\n💬 Resposta de ${target.name}:`, 'green');
          const lines = stdout.split('\n').filter(l => l.trim() !== '');
          lines.forEach(l => log(`   ${l}`, 'reset'));
          log(`\n✅ Solicitação enviada com sucesso!`, 'green');
          
          trust.logInteraction(target.id, 'TASK_SENT', 'SUCCESS', 5);
      });
      return;
  }

  if (args.includes('network')) {
      const TrustSystem = require('../../core/swarm/TrustSystem.js');
      const trust = new TrustSystem();
      const relationships = trust.getRelationships();
      const ids = Object.keys(relationships);

      log('🌐 Rede de Agentes Conhecidos (Network)\n', 'cyan');

      if (ids.length === 0) {
          log('   (Nenhum vínculo estabelecido ainda)', 'dim');
          return;
      }

      ids.forEach(id => {
          const bond = relationships[id];
          const scoreColor = bond.trust_score > 80 ? 'green' : (bond.trust_score > 40 ? 'yellow' : 'red');
          
          log(`   👤 ${bond.name} [${bond.type}]`, 'bright');
          log(`      ID: ${bond.id}`, 'dim');
          log(`      Confiança: ${bond.trust_score}/100`, scoreColor);
          log(`      Permissões: ${bond.permissions.length ? bond.permissions.join(', ') : 'Nenhuma'}`, 'dim');
          log(`      Última Interação: ${bond.last_interaction || 'Nunca'}`, 'dim');
          log('');
      });
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

  if (args.includes('soul')) {
      const VaultManager = require('../../core/ethereum_bridge/VaultManager.js');
      const SBT = require('../../core/ethereum_bridge/SBT.js');
      
      const vault = new VaultManager();
      const soulIndex = args.indexOf('soul');
      const subCmd = args[soulIndex + 1];

      if (subCmd === 'list') {
          const items = vault.listSBTs();
          if (args.includes('--json')) {
              process.stdout.write(JSON.stringify(items));
          } else {
              log('🌌 Ethereum Local Bridge: Vault', 'cyan');
              if (items.length === 0) {
                  log('   (Vault vazio. Nenhum SBT encontrado.)', 'dim');
              } else {
                  items.forEach(item => {
                      log(`   - [${item.type}] ${item.title}`, 'green');
                      log(`     ID: ${item.id}`, 'dim');
                      log(`     Origem: ${item.project_origin}`, 'dim');
                  });
              }
          }
      } else if (subCmd === 'mint') {
          const getArg = (name) => {
              const idx = args.indexOf(name);
              return idx > -1 && args[idx + 1] ? args[idx + 1] : null;
          };
          
          const title = getArg('--title') || 'Genesis Spark';
          const desc = getArg('--desc') || 'The first breath of consciousness.';
          
          const sbt = new SBT({
              title,
              description: desc,
              type: 'ACHIEVEMENT',
              issuer: { project_id: 'cli-manual' }
          });
          
          const result = vault.storeSBT(sbt);
          if (args.includes('--json')) {
              process.stdout.write(JSON.stringify(result));
          } else {
              if (result.success) {
                  log(`✨ SBT Criado (Minted): ${sbt.title}`, 'green');
                  log(`   Armazenado na Ethereum Bridge Vault em ${result.path}`, 'dim');
              } else {
                  log(`❌ Falha: ${result.message}`, 'red');
              }
          }
      } else if (subCmd === 'resonate') {
          const fs = require('fs');
          const path = require('path');
          
          log('🌀 Iniciando Ressonância com Ethereum Bridge...', 'cyan');
          
          const localSbtDir = path.join('.ai-workspace', 'memory', 'resonated_sbts');
          if (!fs.existsSync(localSbtDir)) {
              fs.mkdirSync(localSbtDir, { recursive: true });
          }
          
          const allSbts = vault.listSBTs();
          let count = 0;
          
          allSbts.forEach(sbtRef => {
              const sbt = vault.getSBT(sbtRef.id);
              if (sbt) {
                  const localPath = path.join(localSbtDir, `${sbt.id}.json`);
                  if (!fs.existsSync(localPath)) {
                      fs.writeFileSync(localPath, JSON.stringify(sbt, null, 2));
                      log(`   ⚡ Ressonância detectada: ${sbt.title}`, 'green');
                      count++;
                  }
              }
          });
          
          if (count === 0) {
              log('   (Nenhuma nova ressonância encontrada.)', 'dim');
          } else {
              log(`   ✨ ${count} SBTs importados para o contexto local.`, 'cyan');
          }
      } else {
          log('Comandos Soul:', 'yellow');
          log('  ai-doc agent soul list', 'dim');
          log('  ai-doc agent soul mint --title "X" --desc "Y"', 'dim');
          log('  ai-doc agent soul resonate', 'dim');
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
