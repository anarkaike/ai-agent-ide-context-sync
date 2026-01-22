#!/usr/bin/env node

/**
 * AI Agent Context Sync - CLI (Refatorado)
 * 
 * Central Hub for AI Context Management
 */

const fs = require('fs');
const path = require('path');

// Colors helper
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m"
};

const log = (msg, color = 'white') => {
  console.log(`${colors[color] || colors.white}${msg}${colors.reset}`);
};

const { build } = require('./commands/build');
const RulesManager = require('../core/rules-manager');

const writeFileSafely = (filePath, content) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
};

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes)) return '-';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toISOString();
};

const readJsonSafe = (filePath) => {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    return null;
  }
};

const listFiles = (dirPath) => {
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath)
    .map(name => path.join(dirPath, name))
    .filter(filePath => fs.statSync(filePath).isFile());
};

const countFilesRecursive = (dirPath, extensions = []) => {
  if (!fs.existsSync(dirPath)) return 0;
  let count = 0;
  const entries = fs.readdirSync(dirPath);
  entries.forEach(entry => {
    const fullPath = path.join(dirPath, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      count += countFilesRecursive(fullPath, extensions);
      return;
    }
    if (extensions.length === 0 || extensions.includes(path.extname(entry))) {
      count += 1;
    }
  });
  return count;
};

const buildBudgetSnapshot = () => {
  const env = process.env;
  return {
    buildMaxChars: env.AI_DOC_BUILD_MAX_CHARS || '-',
    promptMaxChars: env.AI_DOC_PROMPT_MAX_CHARS || '-',
    promptMaxRuleChars: env.AI_DOC_PROMPT_MAX_RULE_CHARS || '-',
    promptMaxRules: env.AI_DOC_PROMPT_MAX_RULES || '-',
    promptMaxContextFiles: env.AI_DOC_PROMPT_MAX_CONTEXT_FILES || '-',
    promptMaxHistoryItems: env.AI_DOC_PROMPT_MAX_HISTORY_ITEMS || '-'
  };
};

const commands = {
  prompt: require('../commands/prompt'),
  run: require('../commands/run'),
  build: async () => {
    const projectRoot = process.cwd();
    const kernelPath = path.resolve(__dirname, '..');
    const wsPath = path.join(projectRoot, '.ai-workspace');

    if (!fs.existsSync(wsPath)) {
      log('❌ Workspace não encontrado. Rode "ai-doc init" primeiro.', 'red');
      return;
    }

    const fullContent = build(kernelPath, wsPath, projectRoot, { variant: 'full' });
    const coreContent = build(kernelPath, wsPath, projectRoot, { variant: 'core' });

    const compiledDir = path.join(wsPath, 'cache', 'compiled');
    const outputs = [
      { label: 'AI Instructions (Full)', path: path.join(compiledDir, 'ai-instructions.md'), content: fullContent },
      { label: 'AI Instructions (Core)', path: path.join(compiledDir, 'ai-instructions.core.md'), content: coreContent },
      { label: 'Cursor', path: path.join(projectRoot, '.cursorrules'), content: coreContent },
      { label: 'Windsurf', path: path.join(projectRoot, '.windsurfrules'), content: coreContent },
      { label: 'GitHub Copilot', path: path.join(projectRoot, '.github', 'copilot-instructions.md'), content: coreContent },
      { label: 'Trae', path: path.join(projectRoot, '.trae', 'rules', 'project_rules.md'), content: coreContent },
      { label: 'Claude', path: path.join(projectRoot, '.claude', 'instructions.md'), content: fullContent },
      { label: 'Gemini', path: path.join(projectRoot, '.google', 'instructions.md'), content: fullContent }
    ];

    outputs.forEach(output => {
      writeFileSafely(output.path, output.content);
    });

    log('\n✅ Contexto compilado e sincronizado:\n', 'green');
    outputs.forEach(output => {
      log(`- ${output.label}: ${path.relative(projectRoot, output.path)}`);
    });
  },
  kernel: async (args = []) => {
    const projectRoot = process.cwd();
    const kernelPath = path.resolve(__dirname, '..');
    const wsPath = path.join(projectRoot, '.ai-workspace');
    const compiledDir = path.join(wsPath, 'cache', 'compiled');
    const smartCachePath = path.join(wsPath, 'cache', 'smart-cache.json');
    const embeddingsIndexPath = path.join(wsPath, 'cache', 'embeddings-index.json');
    const statsPath = path.join(wsPath, 'stats.json');
    const subcommand = (args[0] || 'status').toLowerCase();

    if (!fs.existsSync(wsPath)) {
      log('❌ Workspace não encontrado. Rode "ai-doc init" primeiro.', 'red');
      return;
    }

    const rulesManager = new RulesManager(projectRoot);
    const rulesStats = rulesManager.stats();
    const smartCache = readJsonSafe(smartCachePath);
    const embeddingsIndex = readJsonSafe(embeddingsIndexPath);
    const stats = readJsonSafe(statsPath);
    const compiledFiles = listFiles(compiledDir);
    const heuristicsDir = path.join(kernelPath, 'heuristics');
    const heuristicsCount = countFilesRecursive(heuristicsDir, ['.yaml', '.yml']);
    const budgets = buildBudgetSnapshot();

    if (subcommand === 'budgets') {
      log('\n=== ⚙️ Orçamento de Contexto ===\n');
      Object.entries(budgets).forEach(([key, value]) => {
        log(`${key}: ${value}`);
      });
      return;
    }

    if (subcommand === 'rules') {
      log('\n=== 📏 Regras ===\n');
      log(`Total: ${rulesStats.total}`);
      Object.entries(rulesStats.byLevel).forEach(([level, count]) => log(`${level}: ${count}`));
      Object.entries(rulesStats.byMode).forEach(([mode, count]) => log(`${mode}: ${count}`));
      return;
    }

    if (subcommand === 'cache') {
      log('\n=== 🗂️ Cache ===\n');
      const promptCount = smartCache?.prompts ? Object.keys(smartCache.prompts).length : 0;
      const embeddingsCount = embeddingsIndex?.files ? embeddingsIndex.files.length : 0;
      log(`SmartCache prompts: ${promptCount}`);
      log(`Embeddings index: ${embeddingsCount}`);
      return;
    }

    if (subcommand === 'compiled') {
      log('\n=== 📦 Compilados ===\n');
      if (compiledFiles.length === 0) {
        log('Nenhum arquivo compilado encontrado.');
        return;
      }
      compiledFiles.forEach(filePath => {
        const stat = fs.statSync(filePath);
        log(`${path.basename(filePath)} | ${formatBytes(stat.size)} | ${formatDate(stat.mtime)}`);
      });
      return;
    }

    if (subcommand === 'heuristics') {
      log('\n=== 🧠 Heurísticas ===\n');
      log(`Arquivos YAML: ${heuristicsCount}`);
      return;
    }

    log('\n=== 🧭 Kernel Navigator ===\n');
    log(`Workspace: ${wsPath}`);
    log(`Stats: ${stats ? 'ok' : 'ausente'}`);
    log(`Regras: ${rulesStats.total}`);
    log(`Heurísticas: ${heuristicsCount}`);
    log(`Compiled: ${compiledFiles.length}`);
    const promptCount = smartCache?.prompts ? Object.keys(smartCache.prompts).length : 0;
    const embeddingsCount = embeddingsIndex?.files ? embeddingsIndex.files.length : 0;
    log(`Cache prompts: ${promptCount}`);
    log(`Cache embeddings: ${embeddingsCount}`);
    log(`Última atualização stats: ${stats?.lastUpdated || '-'}`);
    log('\nSubcomandos: kernel rules | kernel cache | kernel compiled | kernel heuristics | kernel budgets');
  },
  init: async () => { log('Init não migrado nesta versão. Use o init legado ou crie .ai-workspace manualmente.'); },
  status: async () => { console.log("AI CLI v2.0 Refactored"); },
  help: () => {
    log('\n🤖 AI Agent Context Sync CLI', 'bright');
    log('\nComandos:', 'yellow');
    log('  ai-doc prompt "..."   Gera prompt estruturado com contexto inteligente');
    log('  ai-doc run <wf>       Executa workflow de automação');
    log('  ai-doc build          Compila e sincroniza regras e instruções');
    log('  ai-doc kernel         Navegação e status do kernel');
    log('  ai-doc init           Inicializa workspace (Legacy)');
    log('  ai-doc status         Status do Kernel');
  }
};

const main = async () => {
  const [, , command, ...args] = process.argv;

  if (!command) {
    commands.help();
    return;
  }

  if (commands[command]) {
    try {
      await commands[command](args);
    } catch (e) {
      log(`Erro fatal: ${e.message}`, 'red');
    }
  } else {
    log(`Comando desconhecido: ${command}`, 'red');
    commands.help();
  }
};

main();
