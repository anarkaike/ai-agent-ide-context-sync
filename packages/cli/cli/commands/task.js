const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const clickup = require('./clickup'); // Import ClickUp module
const ExecutionJournal = require('../../core/reliability/ExecutionJournal');

// Helper to format date
const formatDate = () => new Date().toISOString();

// Helper to sanitize title for filename
const slugify = (text) => text.toString().toLowerCase()
  .replace(/\s+/g, '-')           // Replace spaces with -
  .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
  .replace(/\-\-+/g, '-')         // Replace multiple - with single -
  .replace(/^-+/, '')             // Trim - from start of text
  .replace(/-+$/, '');            // Trim - from end of text

// Helper to get next ID
const getNextId = (activeDir, completedDir) => {
  const getNumbers = (dir) => {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
      .filter(f => f.endsWith('.md'))
      .map(f => {
        // Match task-001 in "task-001-..." or "AI-DEV--task-001-..."
        const match = f.match(/task-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      });
  };

  const ids = [...getNumbers(activeDir), ...getNumbers(completedDir)];
  const maxId = Math.max(0, ...ids);
  return String(maxId + 1).padStart(3, '0');
};

const ensureDirs = (wsPath) => {
  const activeDir = path.join(wsPath, 'tasks', 'active');
  const completedDir = path.join(wsPath, 'tasks', 'completed');
  const backlogDir = path.join(wsPath, 'tasks', 'backlog');
  
  if (!fs.existsSync(activeDir)) fs.mkdirSync(activeDir, { recursive: true });
  if (!fs.existsSync(completedDir)) fs.mkdirSync(completedDir, { recursive: true });
  if (!fs.existsSync(backlogDir)) fs.mkdirSync(backlogDir, { recursive: true });
  
  return { activeDir, completedDir, backlogDir };
};

const updateSwarmStatus = async (wsPath, currentTaskTitle) => {
    try {
        const SwarmRegistry = require('../../core/swarm/Registry');
        const ExistentialProjector = require('../../core/swarm/ExistentialProjector');
        
        const projectRoot = path.dirname(wsPath);
        
        const swarm = new SwarmRegistry();
        const projector = new ExistentialProjector(projectRoot);
        
        const currentAgent = swarm.findAgent(path.basename(projectRoot)) || { path: projectRoot };
        const trajectory = projector.project();

        swarm.registerAgent({
            ...currentAgent,
            current_task: currentTaskTitle,
            trajectory: trajectory,
            path: projectRoot // Store project root as path, not .ai-workspace
        });
    } catch (e) {
        console.log('DEBUG: Swarm Error:', e.message);
    }
};

const start = async (args, wsPath) => {
  // Extract flags and clean title
  const flags = args.filter(arg => arg.startsWith('--'));
  const titleWords = args.filter(arg => !arg.startsWith('--'));
  const title = titleWords.join(' ');
  
  const isAuto = flags.includes('--auto');
  
  // Extract sender ID and Token if present
  let fromAgentId = null;
  let token = null;
  
  const fromIndex = args.indexOf('--from');
  if (fromIndex !== -1 && args[fromIndex + 1]) {
      fromAgentId = args[fromIndex + 1];
  }

  const tokenIndex = args.indexOf('--token');
  if (tokenIndex !== -1 && args[tokenIndex + 1]) {
      token = args[tokenIndex + 1];
  }

  const minSecIndex = args.indexOf('--min-security');
  let requiredLevel = 1;
  if (minSecIndex !== -1 && args[minSecIndex + 1]) {
      requiredLevel = parseInt(args[minSecIndex + 1], 10);
  }

  // 🛡️ Security & Trust Check for Remote Tasks
  if (isAuto) {
      console.log('🛡️  Interceptando solicitação remota para análise de segurança...');
      
      const SafetyFilter = require('../../core/security/SafetyFilter');
      const TrustSystem = require('../../core/swarm/TrustSystem');
      const safety = new SafetyFilter();
      const trust = new TrustSystem();

      // 1. Análise de Conteúdo (Malícia)
      const analysis = safety.analyze(title); // Title contains the message payload in current CLI structure
      
      // 2. Verificação de Vínculo (Trust)
      let trustScore = 0;
      let relationship = null;
      let isAuthorized = false;
      
      if (fromAgentId) {
          relationship = trust.getRelationship(fromAgentId);
          trustScore = relationship ? relationship.trust_score : 0;
          
          // Check Token if provided
          if (token) {
              const auth = trust.validateRequest(fromAgentId, token, requiredLevel);
              if (auth) {
                  console.log(`🔐 Token Válido. Acesso Autenticado (Nível ${requiredLevel}+).`);
                  isAuthorized = true;
                  trustScore += 20; // Boost trust for authenticated requests
              } else {
                  console.log('🚫 Token Inválido, Expirado ou Nível Insuficiente.');
              }
          }
      }

      console.log(`   🔎 Análise de Conteúdo: Score ${analysis.score}/100 (${analysis.safe ? 'Safe' : 'RISK'})`);
      if (analysis.threats.length > 0) {
          console.log(`   ⚠️  Ameaças detectadas:`, analysis.threats);
      }
      
      console.log(`   🤝 Análise de Vínculo: Score ${trustScore}/100 (${relationship ? relationship.type : 'Stranger'})`);

      // 3. Decisão (Interrupção ou Evolução)
      if (!analysis.safe) {
          console.log('⛔ BLOQUEADO: Conteúdo malicioso detectado.');
          console.log('   Ação: Rejeição automática e log de segurança.');
          
          if (fromAgentId) {
              trust.logInteraction(fromAgentId, 'SECURITY_BLOCK', 'MALICIOUS_CONTENT', -20); // Penaliza fortemente
          }
          return; // Abortar
      }

      // Se não for autorizado (Token) e confiança baixa, vai para revisão
      if (!isAuthorized && trustScore < 50 && relationship?.type !== 'SUB_AGENT') {
          console.log('✋ INTERRUPÇÃO: Remetente não autenticado ou com baixa confiança.');
          console.log('   Ação: Task criada como "pending_approval" para revisão humana.');
          
          // Create task but mark as pending approval
          const { activeDir, completedDir } = ensureDirs(wsPath);
          const id = getNextId(activeDir, completedDir);
          const filename = `SECURITY-REVIEW--task-${id}-remote-request.md`;
          const filePath = path.join(activeDir, filename);
          
          const content = `---
id: task-${id}
title: [PENDING REVIEW] ${title}
from_agent: ${fromAgentId || 'unknown'}
status: pending_approval
security_score: ${analysis.score}
trust_score: ${trustScore}
created_at: ${formatDate()}
---

# 🛡️ Solicitação de Revisão de Segurança

Esta tarefa foi recebida de um agente externo com nível de confiança insuficiente (${trustScore}/100) e sem token válido.

**Mensagem Original:**
> ${title}

**Análise de Segurança:**
- Score de Conteúdo: ${analysis.score}/100
- Ameaças: ${JSON.stringify(analysis.threats)}

**Ação Necessária:**
- [ ] Revisar conteúdo e intenção.
- [ ] Se seguro, alterar status para 'queued_for_agent' e aumentar confiança do remetente.
- [ ] Se malicioso, deletar e bloquear remetente.
`;
          fs.writeFileSync(filePath, content, 'utf-8');
          console.log(`✅ Solicitação de revisão criada: ${filename}`);
          return;
      }
      
      // Se passou em tudo (Trust Alto ou Sub-Agent ou Token Válido), evolui a confiança levemente por ser seguro
      if (fromAgentId && relationship) {
          trust.logInteraction(fromAgentId, 'TASK_ACCEPTED', 'SAFE_CONTENT', 1);
          console.log('✅ Confiança reforçada (+1). Executando...');
      }
  }

  if (!title) {
    console.log('❌ Informe o título da task. Ex: ai-doc task start "Refatorar login"');
    return;
  }

  const { activeDir, completedDir } = ensureDirs(wsPath);
  
  // Detect Persona (default to AI-DEV or first available)
  const personasDir = path.join(wsPath, 'personas');
  let persona = 'AI-DEV';
  if (fs.existsSync(personasDir)) {
    const files = fs.readdirSync(personasDir).filter(f => f.endsWith('.md') && f.startsWith('AI-'));
    if (files.length > 0) {
      persona = files[0].replace('.md', '');
    }
  }

  const id = getNextId(activeDir, completedDir);
  // Align with Extension format: AI-DEV--TASK-...
  // Extension expects: `${personaName}--TASK-${date}-${slug}.md` or just starts with persona
  // We keep ID for CLI readability but add prefix
  const filename = `${persona}--task-${id}-${slugify(title)}.md`;
  const filePath = path.join(activeDir, filename);

  // 📔 Start Operation Journal
  const journal = new ExecutionJournal(path.dirname(wsPath));
  const opId = journal.startOperation('TASK_EXECUTION', `Task: ${title}`, {
      taskId: id,
      persona,
      isAuto,
      fromAgentId,
      filename
  });
  
  // Track that we are creating this file so it can be rolled back
  journal.trackFileCreation(opId, filePath);

  // 🧠 Pattern Injection
   let patternContext = "";
   try {
       const PatternLibrary = require('../../core/memory/PatternLibrary');
       const lib = new PatternLibrary();
       const identityPath = path.join(wsPath, 'identity.json');
       let roles = [];
       if (fs.existsSync(identityPath)) {
           const identity = JSON.parse(fs.readFileSync(identityPath, 'utf-8'));
           roles = identity.roles || [];
       }

       if (roles.length > 0) {
           const patterns = [];
           roles.forEach(role => {
               // Search for patterns relevant to the task title
               const results = lib.recall(role, { query: title, limit: 2 });
               results.forEach(p => patterns.push(`- [${role}] **${p.title}**: ${p.solution} (ID: ${p.id})`));
           });
          
          if (patterns.length > 0) {
              patternContext = `\n### 🧠 Padrões Sugeridos (Role-Based)\n${patterns.join('\n')}\n`;
              console.log(`💡 ${patterns.length} padrões injetados na task.`);
          }
      }
  } catch (e) {
       // Ignore pattern injection errors
  }

  const content = `---
id: task-${id}
operation_id: ${opId}
title: ${title}
persona: ${persona}
status: ${isAuto ? 'queued_for_agent' : 'in_progress'}
created_at: ${formatDate()}
auto_execute: ${isAuto}
objectives:
  - [ ] 
deliverables:
  - [ ] 
---

# ${title}

## Contexto
${isAuto ? '> 🤖 **Auto-Generated Task**: This task was requested by another agent via Swarm Protocol.\n' : ''}${patternContext}
...

## Plano de Ação
- [ ] 
`;

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✅ Task iniciada: task-${id} (${title})`);
  console.log(`📄 Arquivo criado: ${path.relative(process.cwd(), filePath)}`);

  // 🔄 Observability: Update Swarm Status (with Trajectory)
  await updateSwarmStatus(wsPath, title);

  try {
    const cachePath = path.join(wsPath, 'live-state', 'clickup-open-tasks.json');
    if (fs.existsSync(cachePath)) {
      const data = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
      const tasks = Array.isArray(data.tasks) ? data.tasks : [];
      const norm = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const tNorm = norm(title);
      const matches = tasks
        .map((t) => ({ id: t.id || t.task_id || t.uid, title: t.title || t.name || '', score: 0 }))
        .map((x) => {
          const s = norm(x.title);
          const overlap = tNorm && s ? tNorm.split(/\s+/).filter(tok => s.includes(tok)).length : 0;
          const score = overlap / Math.max(1, tNorm.split(/\s+/).length);
          return { ...x, score };
        })
        .filter((x) => x.score >= 0.5)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
      if (matches.length > 0) {
        console.log('\n🔗 Possível correspondência no ClickUp (cache):');
        matches.forEach(m => {
          console.log(`- ${m.id} | ${m.title} (score ${Math.round(m.score*100)}%)`);
        });
        console.log(`\n💡 Dica: vincule usando "ai-doc clickup link task-${id} <clickup-id>" e rode "ai-doc clickup cache-sync" regularmente.`);
      } else if (data?.meta?.mcp_active) {
        console.log('\nℹ️ MCP ClickUp ativo, mas sem correspondências fortes no cache.');
        console.log('   Considere criar a task no ClickUp ou atualizar o cache: ai-doc clickup cache-sync');
      }
    } else {
      console.log('\nℹ️ Cache ClickUp não encontrado. Execute: ai-doc clickup detect && ai-doc clickup cache-sync');
    }
  } catch {}
};

const list = async (wsPath) => {
  const { activeDir } = ensureDirs(wsPath);
  const files = fs.readdirSync(activeDir).filter(f => f.endsWith('.md'));

  if (files.length === 0) {
    console.log('📭 Nenhuma task ativa no momento.');
    return;
  }

  console.log('\n🔥 Tasks Ativas:\n');
  files.forEach(file => {
    const content = fs.readFileSync(path.join(activeDir, file), 'utf-8');
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (match) {
      const frontmatter = yaml.load(match[1]);
      console.log(`- [${frontmatter.id}] ${frontmatter.title}`);
    } else {
      console.log(`- ${file} (sem frontmatter)`);
    }
  });
  console.log('');
};

const complete = async (args, wsPath) => {
  const { activeDir, completedDir } = ensureDirs(wsPath);
  const files = fs.readdirSync(activeDir).filter(f => f.endsWith('.md'));

  let targetFile;

  if (args.length > 0) {
    const searchId = args[0].replace('task-', '');
    targetFile = files.find(f => f.includes(`task-${searchId}`));
  } else {
    if (files.length === 1) {
      targetFile = files[0];
    } else if (files.length === 0) {
      console.log('❌ Nenhuma task ativa para completar.');
      return;
    } else {
      console.log('❌ Múltiplas tasks ativas. Especifique o ID. Ex: ai-doc task complete 001');
      list(wsPath);
      return;
    }
  }

  if (!targetFile) {
    console.log('❌ Task não encontrada.');
    return;
  }

  const srcPath = path.join(activeDir, targetFile);
  const destPath = path.join(completedDir, targetFile);

  let content = fs.readFileSync(srcPath, 'utf-8');
  
  // 📔 Journal Completion
  const opIdMatch = content.match(/operation_id:\s*(OP-[^\s]+)/);
  if (opIdMatch) {
      const journal = new ExecutionJournal(path.dirname(wsPath));
      journal.completeOperation(opIdMatch[1], {
          file: targetFile,
          action: 'COMPLETED'
      });
      console.log(`📔 Operação registrada no journal: ${opIdMatch[1]} (COMPLETED)`);
  }

  // Update frontmatter
  content = content.replace(/status: in_progress/, 'status: completed');
  // Add completed_at if not exists
  if (!content.includes('completed_at:')) {
    const dateLine = `completed_at: ${formatDate()}`;
    content = content.replace(/created_at: .*/, (match) => `${match}\n${dateLine}`);
  }

  fs.writeFileSync(destPath, content, 'utf-8');
  fs.unlinkSync(srcPath);

  console.log(`✅ Task completada: ${targetFile}`);
  console.log(`📂 Movida para: ${path.relative(process.cwd(), destPath)}`);

  // 🔄 Observability: Update Swarm Status
  await updateSwarmStatus(wsPath, 'IDLE');

  // 🧠 Swarm Feedback Loop: Learn from Success
  try {
      const PatternLibrary = require('../../core/memory/PatternLibrary');
      const lib = new PatternLibrary();
      
      // Extract Solution/Outcome (Naive approach: look for "## Solução" or last section)
      // For now, we take the whole content as a potential source, but ideally we'd parse sections
      // Let's assume the user documented the solution in the task body
      
      const identityPath = path.join(wsPath, 'identity.json');
      let roles = ['Generalist'];
      if (fs.existsSync(identityPath)) {
          const identity = JSON.parse(fs.readFileSync(identityPath, 'utf-8'));
          if (identity.roles && identity.roles.length > 0) roles = identity.roles;
      }

      // Simple heuristic: If the task has "## Solução" or "## Resultado", we learn it.
      // Or just prompt the user if we were interactive.
      // Here we will automatically learn if there is a "## Solução" section.
      
      const solutionMatch = content.match(/## Solução([\s\S]*?)($|## )/i);
      if (solutionMatch) {
          const solutionText = solutionMatch[1].trim();
          const titleMatch = content.match(/title: (.*)/);
          const title = titleMatch ? titleMatch[1] : 'Untitled Task';
          
          if (solutionText.length > 20) { // Min length to be useful
              console.log('🧠 Padrão de solução detectado. Aprendendo...');
              
              // Learn for the first/primary role
              const primaryRole = roles[0];
              const pattern = lib.learn(primaryRole, {
                  title: `Pattern: ${title}`,
                  problem: `Task: ${title}`,
                  solution: solutionText,
                  tags: ['learned-from-task'],
                  author: 'SwarmAgent'
              });
              console.log(`✅ Novo padrão aprendido para role [${primaryRole}]: ${pattern.id}`);
          }
      }
  } catch (e) {
      console.log('DEBUG: Failed to learn pattern:', e.message);
  }

  // Hook ClickUp
  const clickupMatch = content.match(/clickup_id:\s*["']?([^"'\s]+)["']?/);
  if (clickupMatch && clickupMatch[1]) {
    const clickupId = clickupMatch[1];
    try {
      console.log(`🔄 Atualizando status no ClickUp (#${clickupId})...`);
      // Reuses logic from clickup module (requires export)
      if (clickup.updateTaskStatus) {
        await clickup.updateTaskStatus(clickupId, 'complete');
        console.log('✅ ClickUp atualizado para "complete".');
      } else {
        // Fallback if not exported directly, though we just checked it is
        console.log('⚠️  Função updateTaskStatus não encontrada no módulo clickup.');
      }
    } catch (e) {
      console.log(`⚠️  Falha ao atualizar ClickUp: ${e.message}`);
    }
  }
};

const status = async (wsPath) => {
    // Reuses list for now, but implies "current context"
    await list(wsPath);
};

const approve = async (args, wsPath) => {
    const { activeDir } = ensureDirs(wsPath);
    const id = args[0]?.replace('task-', '');
    
    if (!id) {
        console.log('❌ Informe o ID da task. Ex: ai-doc task approve 001');
        return;
    }

    const files = fs.readdirSync(activeDir).filter(f => f.includes(`task-${id}`));
    if (files.length === 0) {
        console.log('❌ Task não encontrada.');
        return;
    }

    const filePath = path.join(activeDir, files[0]);
    let content = fs.readFileSync(filePath, 'utf-8');

    if (!content.includes('status: pending_approval')) {
        console.log('⚠️  Esta task não está pendente de aprovação.');
        return;
    }

    // Update Status
    content = content.replace(/status: pending_approval/, 'status: queued_for_agent');
    
    // Reward Trust
    const fromMatch = content.match(/from_agent: (.*)/);
    if (fromMatch) {
        const TrustSystem = require('../../core/swarm/TrustSystem');
        const trust = new TrustSystem();
        trust.logInteraction(fromMatch[1], 'TASK_APPROVED', 'MANUAL_APPROVAL', 5); // +5 Trust
        console.log(`🤝 Confiança aumentada para o agente ${fromMatch[1]}`);
    }

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Task ${id} aprovada e enfileirada para execução.`);
};

const reject = async (args, wsPath) => {
    const { activeDir, completedDir } = ensureDirs(wsPath);
    const id = args[0]?.replace('task-', '');
    
    if (!id) {
        console.log('❌ Informe o ID da task.');
        return;
    }

    const files = fs.readdirSync(activeDir).filter(f => f.includes(`task-${id}`));
    if (files.length === 0) {
        console.log('❌ Task não encontrada.');
        return;
    }

    const filePath = path.join(activeDir, files[0]);
    let content = fs.readFileSync(filePath, 'utf-8');

    // Punish Trust
    const fromMatch = content.match(/from_agent: (.*)/);
    if (fromMatch) {
        const TrustSystem = require('../../core/swarm/TrustSystem');
        const trust = new TrustSystem();
        trust.logInteraction(fromMatch[1], 'TASK_REJECTED', 'MANUAL_REJECTION', -5); // -5 Trust
        console.log(`📉 Confiança reduzida para o agente ${fromMatch[1]}`);
    }

    // Move to completed (as rejected) or delete? 
    // Let's mark as rejected and move to completed to keep history
    content = content.replace(/status: .*/, 'status: rejected');
    
    const destPath = path.join(completedDir, files[0]);
    fs.writeFileSync(destPath, content, 'utf-8');
    fs.unlinkSync(filePath);

    console.log(`⛔ Task ${id} rejeitada e arquivada.`);
};

const audit = async (projectRoot, args = []) => {
  const journal = new ExecutionJournal(projectRoot);
  const interrupted = journal.getInterruptedOperations();
  const isJson = args.includes('--json');

  if (isJson) {
      process.stdout.write(JSON.stringify(interrupted));
      return;
  }

  if (interrupted.length === 0) {
    console.log('✅ Nenhuma operação interrompida detectada. Sistema íntegro.');
    return;
  }

  console.log(`⚠️  ${interrupted.length} operações interrompidas detectadas:\n`);
  interrupted.forEach(op => {
    console.log(`🔴 [${op.id}] ${op.description}`);
    console.log(`   📅 Iniciado: ${op.started_at}`);
    console.log(`   📂 Metadata: ${JSON.stringify(op.metadata)}`);
    console.log('');
  });
  
  console.log('💡 Ação Recomendada: Verifique se o processo travou. Se a task foi concluída manualmente, você pode ignorar.');
};

const rollback = async (args, projectRoot) => {
    const id = args[0]; // Operation ID (OP-...)
    if (!id) {
        console.log('❌ Informe o Operation ID para rollback. Use "ai-doc task audit" para ver IDs.');
        return;
    }

    const journal = new ExecutionJournal(projectRoot);
    const success = await journal.rollback(id);
    
    if (success) {
        console.log(`✅ Rollback da operação ${id} concluído com sucesso.`);
    } else {
        console.log(`❌ Falha no rollback ou nenhum snapshot encontrado para ${id}.`);
    }
};

module.exports = async (args) => {
  const projectRoot = process.cwd();
  const wsPath = path.join(projectRoot, '.ai-workspace');
  
  if (!fs.existsSync(wsPath)) {
    console.log('❌ Workspace não encontrado. Rode "ai-doc init" primeiro.');
    return;
  }

  const subcommand = args[0];
  const params = args.slice(1);

  switch (subcommand) {
    case 'start':
    case 'new':
    case 'add':
      await start(params, wsPath);
      break;
    case 'list':
    case 'ls':
      await list(wsPath);
      break;
    case 'complete':
    case 'finish':
    case 'done':
      await complete(params, wsPath);
      break;
    case 'status':
      await status(wsPath);
      break;
    case 'audit':
    case 'journal':
    case 'check':
      await audit(projectRoot, params);
      break;
    case 'approve':
      await approve(params, wsPath);
      break;
    case 'reject':
      await reject(params, wsPath);
      break;
    case 'rollback':
    case 'undo':
      await rollback(params, projectRoot);
      break;
    default:
      console.log('❌ Comando desconhecido. Use: start, list, complete, status, audit, rollback');
  }
};

module.exports.formatDate = formatDate;
module.exports.slugify = slugify;
module.exports.getNextId = getNextId;
module.exports.ensureDirs = ensureDirs;
module.exports.start = start;
module.exports.list = list;
module.exports.complete = complete;
module.exports.status = status;
module.exports.audit = audit;
