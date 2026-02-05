const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const clickup = require('./clickup'); // Import ClickUp module

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
  if (!fs.existsSync(activeDir)) fs.mkdirSync(activeDir, { recursive: true });
  if (!fs.existsSync(completedDir)) fs.mkdirSync(completedDir, { recursive: true });
  return { activeDir, completedDir };
};

const start = async (args, wsPath) => {
  // Extract flags and clean title
  const flags = args.filter(arg => arg.startsWith('--'));
  const titleWords = args.filter(arg => !arg.startsWith('--'));
  const title = titleWords.join(' ');
  
  const isAuto = flags.includes('--auto');

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

  const content = `---
id: task-${id}
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
${isAuto ? '> 🤖 **Auto-Generated Task**: This task was requested by another agent via Swarm Protocol.' : ''}
...

## Plano de Ação
- [ ] 
`;

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✅ Task iniciada: task-${id} (${title})`);
  console.log(`📄 Arquivo criado: ${path.relative(process.cwd(), filePath)}`);

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
    default:
      console.log('\n📋 Gerenciador de Tasks\n');
      console.log('  ai-doc task start "Titulo"   Inicia nova task');
      console.log('  ai-doc task list             Lista tasks ativas');
      console.log('  ai-doc task complete [id]    Completa uma task');
      console.log('  ai-doc task status           Status atual');
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
