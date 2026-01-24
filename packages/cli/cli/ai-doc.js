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
const HeuristicsEngine = require('../heuristics/engine');
const yaml = require('js-yaml');

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

const writeJsonSafe = (filePath, value) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf-8');
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
    buildModuleBudgets: env.AI_DOC_BUILD_MODULE_BUDGETS || '-',
    buildStackBudgets: env.AI_DOC_BUILD_STACK_BUDGETS || '-',
    promptMaxChars: env.AI_DOC_PROMPT_MAX_CHARS || '-',
    promptMaxRuleChars: env.AI_DOC_PROMPT_MAX_RULE_CHARS || '-',
    promptMaxRules: env.AI_DOC_PROMPT_MAX_RULES || '-',
    promptMaxContextFiles: env.AI_DOC_PROMPT_MAX_CONTEXT_FILES || '-',
    promptMaxHistoryItems: env.AI_DOC_PROMPT_MAX_HISTORY_ITEMS || '-'
  };
};

const normalizeText = (value = '') => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

const extractAfterKeyword = (value, keyword) => {
  const lowerValue = value.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();
  const index = lowerValue.indexOf(lowerKeyword);
  if (index === -1) return '';
  return value.slice(index + lowerKeyword.length).trim();
};

const getRulePath = (projectRoot, rule) => {
  if (rule.level === 'user') {
    return path.join(require('os').homedir(), '.ai-doc', 'rules', 'user', rule.filename);
  }
  if (rule.level === 'project') {
    return path.join(projectRoot, '.ai-context', 'rules', 'project', rule.filename);
  }
  return path.join(projectRoot, '.ai-context', 'rules', 'path-specific', rule.filename);
};

const updateRuleAlwaysApply = (projectRoot, rule, enabled) => {
  const rulePath = getRulePath(projectRoot, rule);
  const content = fs.existsSync(rulePath) ? fs.readFileSync(rulePath, 'utf-8') : '';
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const body = match ? match[2].trim() : rule.content || content;
  const frontmatter = match ? yaml.load(match[1]) || {} : {};
  frontmatter.description = frontmatter.description || rule.description || '';
  frontmatter.alwaysApply = !!enabled;
  frontmatter.globs = frontmatter.globs || rule.globs || [];
  const nextContent = `---\n${yaml.dump(frontmatter).trim()}\n---\n\n${body}\n`;
  writeFileSafely(rulePath, nextContent);
};

const computeRuleScore = (usage, rule) => {
  if (!usage) return 0;
  
  // Se tiver histórico, prioriza uso recente (últimos 30 dias)
  let scoreBase = 0;
  if (usage.history) {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const cutoff = thirtyDaysAgo.toISOString().split('T')[0];
    
    const recentCount = Object.entries(usage.history)
      .filter(([date]) => date >= cutoff)
      .reduce((sum, [, count]) => sum + count, 0);
      
    scoreBase = recentCount;
  } else {
    scoreBase = usage.suggestions || 0;
  }

  if (!scoreBase) return 0;

  const reasons = usage.byReasons || {};
  const weights = {
    'manual-mention': 2.0,
    'always-apply': 1.5,
    'glob-match': 1.2,
    'semantic-match': 1.1
  };
  const weighted = Object.entries(reasons).reduce((sum, [reason, count]) => {
    const key = reason.startsWith('semantic-match') ? 'semantic-match' : reason;
    return sum + count * (weights[key] || 1.0);
  }, 0);
  
  // Normaliza pelo total para obter qualidade média, mas multiplica pelo volume recente
  const qualityFactor = usage.suggestions > 0 ? weighted / usage.suggestions : 0;
  const finalScore = scoreBase * qualityFactor;
  
  const modePenalty = rule.mode === 'always' ? 0.15 : 0;
  return Math.max(0, finalScore - modePenalty);
};

const detectDrift = (rule, stats) => {
  if (!stats || !stats.history) return null;
  
  const today = new Date();
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(today.getDate() - 14);
  const cutoff = fourteenDaysAgo.toISOString().split('T')[0];
  
  const recentUsage = Object.entries(stats.history)
    .filter(([date]) => date >= cutoff)
    .reduce((sum, [, count]) => sum + count, 0);
    
  const totalUsage = stats.suggestions || 0;
  const lastUsedDate = stats.lastUsed ? new Date(stats.lastUsed) : null;
  
  // Critério de Drift:
  // 1. Regra relevante (usada pelo menos 10 vezes no total)
  // 2. Uso recente zero ou muito baixo (< 5% do esperado)
  // 3. Não usada há mais de 14 dias
  if (totalUsage > 10 && recentUsage === 0 && lastUsedDate && lastUsedDate < fourteenDaysAgo) {
    const daysSinceLastUse = Math.floor((today - lastUsedDate) / (1000 * 60 * 60 * 24));
    return {
      status: 'drift',
      daysSinceLastUse,
      totalUsage
    };
  }
  
  return null;
};

const collectEvolutionSignals = (projectRoot, stats) => {
  const rulesManager = new RulesManager(projectRoot);
  const ruleStats = stats?.rules || {};
  const allRules = rulesManager.getAllRules();
  const drifted = [];
  const lowScore = [];
  const missingHistory = [];

  allRules.forEach(rule => {
    const usage = ruleStats[rule.id] || { suggestions: 0, byReasons: {} };
    const drift = detectDrift(rule, usage);
    if (drift) drifted.push({ id: rule.id, ...drift });

    const score = computeRuleScore(usage, rule);
    if (usage.suggestions > 0 && score === 0) lowScore.push({ id: rule.id, suggestions: usage.suggestions });
    if (usage.suggestions > 0 && !usage.history) missingHistory.push({ id: rule.id });
  });

  return {
    totalRules: allRules.length,
    drifted,
    lowScore,
    missingHistory
  };
};

const runEvolution = (projectRoot, statsPath) => {
  const stats = readJsonSafe(statsPath) || { rules: {}, sessions: 0 };
  const engine = new HeuristicsEngine();
  const heuristicsStats = engine.stats();
  const signals = collectEvolutionSignals(projectRoot, stats);
  const entry = {
    timestamp: new Date().toISOString(),
    heuristics: heuristicsStats,
    signals
  };

  stats.autoEvolutionLog = Array.isArray(stats.autoEvolutionLog) ? stats.autoEvolutionLog : [];
  stats.autoEvolutionLog.push(entry);
  if (stats.autoEvolutionLog.length > 30) {
    stats.autoEvolutionLog = stats.autoEvolutionLog.slice(-30);
  }
  stats.lastUpdated = entry.timestamp;
  writeJsonSafe(statsPath, stats);

  log('\n=== 🧬 Autoevolução ===\n');
  log(`Heurísticas: ${heuristicsStats.total}`);
  log(`Drift detectado: ${signals.drifted.length}`);
  log(`Regras com score baixo: ${signals.lowScore.length}`);
  log(`Regras sem histórico: ${signals.missingHistory.length}`);
};

const checkAutoTriggers = (projectRoot) => {
  const wsPath = path.join(projectRoot, '.ai-workspace');
  const statsPath = path.join(wsPath, 'stats.json');
  const stats = readJsonSafe(statsPath);
  const triggers = [];

  // Se não tem stats, provavelmente é novo, então roda ritual
  if (!stats) {
    triggers.push('ritual');
    return triggers;
  }

  // Auto-ritual trigger: > 60 minutes since last ritual
  const lastRitual = stats.lastRitual ? new Date(stats.lastRitual) : null;
  const now = new Date();
  const oneHour = 60 * 60 * 1000;

  if (!lastRitual || (now - lastRitual > oneHour)) {
    triggers.push('ritual');
  }

  // Trigger if .env is newer than last ritual (config change)
  const envPath = path.join(projectRoot, '.env');
  if (fs.existsSync(envPath) && lastRitual) {
    const envStat = fs.statSync(envPath);
    if (envStat.mtime > lastRitual) {
       if (!triggers.includes('ritual')) triggers.push('ritual');
    }
  }

  return triggers;
};

const runAssistant = async (args, commandsRef) => {
  const message = args.join(' ').trim();
  const projectRoot = process.cwd();

  if (!message) {
    log('❌ Informe sua intenção. Ex: ai-doc chat "atualizar regras e compilar"');
    return;
  }

  const normalized = normalizeText(message);
  const actions = [];

  const wantsRules = /regras|rules/.test(normalized);
  const wantsBudgets = /budget|orcamento|orçamento/.test(normalized);
  const wantsCache = /cache/.test(normalized);
  const wantsHeuristics = /heuristic|heuristica|heurística/.test(normalized);
  const wantsCompiled = /compiled|compilad/.test(normalized);
  const wantsBuild = /build|compilar|compilacao|compilação/.test(normalized);
  const wantsKernel = /status|kernel/.test(normalized);
  const wantsPrompt = /prompt|pergunta|gerar prompt|gera prompt|escrever prompt/.test(normalized);
  const wantsWorkflow = /workflow|run\s+/.test(normalized);
  const wantsRitual = /ritual/.test(normalized);
  const wantsScan = /scan|scanner|placeholders|verificar docs/.test(normalized);
  const wantsTask = /task|tarefa|todo/.test(normalized);

  if (wantsTask) {
    const subArgs = [];
    if (/nova|criar|iniciar|start|new|add/.test(normalized)) subArgs.push('start');
    else if (/lista|ver|mostrar|list|ls/.test(normalized)) subArgs.push('list');
    else if (/complet|conclui|finish|done/.test(normalized)) subArgs.push('complete');
    else if (/status/.test(normalized)) subArgs.push('status');
    
    // Extract title if it's a start command
    const title = message.replace(/nova task|criar task|iniciar task|task start|task add/i, '').trim();
    if (subArgs[0] === 'start' && title) subArgs.push(title);

    if (subArgs.length > 0) {
      actions.push({ command: 'task', args: subArgs });
    } else {
      actions.push({ command: 'task', args: ['list'] });
    }
  }

  if (wantsScan) {
    const args = message.split(' ').slice(1);
    actions.push({ command: 'scan', args });
  }

  if (wantsRules) {
    const isApply = /aplicar|apply/.test(normalized);
    const ruleArgs = ['rules'];

    if (/promov|promote/.test(normalized)) {
        ruleArgs.push('--promote');
    }
    if (/rebaix|demot/.test(normalized)) {
        ruleArgs.push('--demote');
    }

    if (isApply) ruleArgs.push('--apply');
    actions.push({ command: 'kernel', args: ruleArgs });
  }

  if (wantsBudgets) actions.push({ command: 'kernel', args: ['budgets'] });
  if (wantsCache) actions.push({ command: 'kernel', args: ['cache'] });
  if (wantsHeuristics) actions.push({ command: 'kernel', args: ['heuristics'] });
  if (wantsCompiled) actions.push({ command: 'kernel', args: ['compiled'] });
  if (wantsKernel && !wantsRules && !wantsBudgets && !wantsCache && !wantsHeuristics && !wantsCompiled) {
    actions.push({ command: 'kernel', args: [] });
  }
  if (wantsBuild) actions.push({ command: 'build', args: [] });
  if (wantsRitual) actions.push({ command: 'ritual', args: [] });

  if (wantsWorkflow) {
    const match = normalized.match(/(?:workflow|run)\s+([^\s]+)/);
    const workflowId = match ? match[1] : null;
    if (workflowId) {
      const params = message.split(' ').filter(token => token.includes('='));
      actions.push({ command: 'run', args: [workflowId, ...params] });
    }
  }

  if (wantsPrompt) {
    const promptText = extractAfterKeyword(message, 'prompt');
    const promptValue = promptText.trim() || message;
    actions.push({ command: 'prompt', args: [promptValue] });
  }

  if (!wantsRitual) {
    const autoTriggers = checkAutoTriggers(projectRoot);
    if (autoTriggers.includes('ritual')) {
      log('\n🔄 Auto-trigger: Executando ritual de manutenção (Contexto expirado/Nova sessão)...', 'cyan');
      actions.unshift({ command: 'ritual', args: [] });
    }
  }

  if (actions.length === 0) {
    actions.push({ command: 'kernel', args: [] });
    actions.push({ command: 'kernel', args: ['rules'] });
  }

  log('\n🧭 Assistente do Kernel\n', 'bright');
  actions.forEach(action => {
    log(`→ ai-doc ${action.command} ${action.args.join(' ')}`.trim(), 'dim');
  });

  for (const action of actions) {
    const handler = commandsRef[action.command];
    if (handler) {
      await handler(action.args);
    } else {
      log(`❌ Comando não disponível: ${action.command}`, 'red');
    }
  }
};

const commands = {
  prompt: require('../commands/prompt'),
  run: require('../commands/run'),
  docs: require('./commands/docs'),
  task: require('./commands/task'),
  workflows: require('../commands/workflows'),
  clickup: require('./commands/clickup'),
  version: require('./commands/version'),
  scan: async (args = []) => {
    try {
      const { scanDirectory } = require('../modules/docs/tools/placeholder-scanner');
      const targetDir = args[0] || 'docs'; // Default to docs folder
      const absoluteTargetDir = path.resolve(process.cwd(), targetDir);
      
      log(`\n🔍 Scanning for placeholders in: ${absoluteTargetDir}\n`, 'cyan');
      
      if (!fs.existsSync(absoluteTargetDir)) {
         log(`❌ Directory not found: ${absoluteTargetDir}`, 'red');
         return;
      }

      const allIssues = scanDirectory(absoluteTargetDir);
      const fileCount = Object.keys(allIssues).length;

      if (fileCount === 0) {
        log('✅ No placeholders found. Documentation looks clean!', 'green');
      } else {
        log(`⚠️  Found potential placeholders in ${fileCount} file(s):\n`, 'yellow');
        
        Object.entries(allIssues).forEach(([file, issues]) => {
          const relativePath = path.relative(process.cwd(), file);
          log(`📄 ${relativePath}`, 'white');
          issues.forEach(issue => {
            log(`   L${issue.line}: ${issue.content} (matches ${issue.pattern})`, 'dim');
          });
          console.log('');
        });
        
        log('❌ Please review and fill in the missing information.', 'red');
      }
    } catch (error) {
      log(`❌ Error running scan: ${error.message}`, 'red');
    }
  },
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

    // Validar documentação após build (Kernel Rule: Deep Research + Placeholder Check)
    try {
      const { scanDirectory } = require('../modules/docs/tools/placeholder-scanner');
      const docsDir = path.resolve(projectRoot, 'docs');
      
      if (fs.existsSync(docsDir)) {
        log('\n🔍 Validando conformidade da documentação...', 'cyan');
        const allIssues = scanDirectory(docsDir);
        const fileCount = Object.keys(allIssues).length;

        if (fileCount === 0) {
          log('✅ Documentação validada: Nenhum placeholder encontrado.', 'green');
        } else {
          log(`⚠️  Atenção: ${fileCount} arquivo(s) contém placeholders pendentes.`, 'yellow');
          log('💡 Execute "ai-doc scan" para ver detalhes e corrigir.', 'white');
        }
      }
    } catch (err) {
      // Ignora erro se scanner não estiver disponível ou falhar, para não quebrar o build
    }
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
      const promoteMin = Number(process.env.AI_DOC_RULE_PROMOTE_MIN || 5);
      const demoteMax = Number(process.env.AI_DOC_RULE_DEMOTE_MAX || 1);
      const applyPromotions = args.includes('--apply-promotions') || args.includes('--apply');
      const applyDemotions = args.includes('--apply-demotions') || args.includes('--demote');
      const ruleStats = stats?.rules || {};
      const allRules = rulesManager.getAllRules();
      const promotions = allRules.filter(rule => {
        const usage = ruleStats[rule.id]?.suggestions || 0;
        return usage >= promoteMin && rule.mode === 'manual';
      });
      const demotions = allRules.filter(rule => {
        const usage = ruleStats[rule.id]?.suggestions || 0;
        return usage <= demoteMax && rule.mode === 'always';
      });
      
      const driftedRules = [];
      const scoredRules = allRules.map(rule => {
        const usage = ruleStats[rule.id] || { suggestions: 0, byReasons: {} };
        const drift = detectDrift(rule, usage);
        if (drift) {
          driftedRules.push({ rule, drift });
        }
        return {
          id: rule.id,
          mode: rule.mode,
          level: rule.level,
          score: computeRuleScore(usage, rule),
          suggestions: usage.suggestions || 0,
          drift
        };
      }).sort((a, b) => b.score - a.score);

      log('\n=== 📏 Regras ===\n');
      log(`Total: ${rulesStats.total}`);
      Object.entries(rulesStats.byLevel).forEach(([level, count]) => log(`${level}: ${count}`));
      Object.entries(rulesStats.byMode).forEach(([mode, count]) => log(`${mode}: ${count}`));

      if (driftedRules.length > 0) {
        log('\n⚠️  Drift Detectado (Regras em desuso):', 'yellow');
        driftedRules.forEach(({ rule, drift }) => {
          log(`- ${rule.id} (Último uso: ${drift.daysSinceLastUse} dias atrás | Total: ${drift.totalUsage})`, 'yellow');
        });
        log('Considere removê-las ou movê-las para "manual".', 'dim');
      }

      if (promotions.length > 0) {
        log('\nSugestões de promoção para always:');
        promotions.forEach(rule => {
          const usage = ruleStats[rule.id]?.suggestions;
          log(`- ${rule.id} (${usage} usos)`);
        });
      } else {
        log('\nSem sugestões de promoção.');
      }

      if (demotions.length > 0) {
        log('\nSugestões de rebaixamento para manual:');
        demotions.forEach(rule => {
          const usage = ruleStats[rule.id]?.suggestions || 0;
          log(`- ${rule.id} (${usage} usos)`);
        });
      } else {
        log('\nSem sugestões de rebaixamento.');
      }

      if (scoredRules.length > 0) {
        log('\nScore por regra (top 10):');
        scoredRules.slice(0, 10).forEach(rule => {
          log(`- ${rule.id} | score: ${rule.score.toFixed(2)} | uso: ${rule.suggestions} | modo: ${rule.mode}`);
        });
      }

      if (applyPromotions && promotions.length > 0) {
        promotions.forEach(rule => updateRuleAlwaysApply(projectRoot, rule, true));
        log('\nPromoções aplicadas.');
      }

      if (applyDemotions && demotions.length > 0) {
        demotions.forEach(rule => updateRuleAlwaysApply(projectRoot, rule, false));
        log('\nRebaixamentos aplicados.');
      }
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
  ritual: async () => {
    const projectRoot = process.cwd();
    const wsPath = path.join(projectRoot, '.ai-workspace');
    const statsPath = path.join(wsPath, 'stats.json');

    // Always run init to ensure structure is up-to-date (idempotent)
    await commands.init();

    log('\n🕯️ Iniciando Ritual de Manutenção...\n', 'magenta');

    runEvolution(projectRoot, statsPath);
    await commands.kernel([]);
    
    log('\n🔧 Auto-Repair: Verificando regras...', 'cyan');
    await commands.kernel(['rules', '--apply', '--demote']);

    await commands.kernel(['cache']);
    try {
      await commands.clickup(['cache-sync']);
    } catch (e) {
      log(`⚠️ Falha no sync do ClickUp: ${e.message}`, 'yellow');
    }
    await commands.build();

    const stats = readJsonSafe(statsPath) || {};
    stats.lastRitual = new Date().toISOString();
    writeJsonSafe(statsPath, stats);

    log('\n✨ Ritual concluído.', 'green');
  },
  evolve: async () => {
    const projectRoot = process.cwd();
    const wsPath = path.join(projectRoot, '.ai-workspace');
    const statsPath = path.join(wsPath, 'stats.json');

    if (!fs.existsSync(wsPath)) {
      log('❌ Workspace não encontrado. Rode "ai-doc init" primeiro.', 'red');
      return;
    }

    runEvolution(projectRoot, statsPath);
  },
  chat: async (args = []) => runAssistant(args, commands),
  assist: async (args = []) => runAssistant(args, commands),
  init: async () => {
    const projectRoot = process.cwd();
    const wsPath = path.join(projectRoot, '.ai-workspace');
    const docsPath = path.join(projectRoot, 'docs');

    // Ensure all required subdirectories exist (idempotent)
    const requiredDirs = [
      path.join(wsPath, 'cache', 'compiled'),
      path.join(wsPath, 'rules', 'project'),
      path.join(wsPath, 'rules', 'path-specific'),
      path.join(wsPath, 'tasks', 'active'),
      path.join(wsPath, 'tasks', 'completed'),
      path.join(wsPath, 'personas'),
      path.join(wsPath, 'analysis')
    ];

    if (fs.existsSync(wsPath)) {
      log('⚠️ Workspace detectado. Verificando estrutura...', 'yellow');
    } else {
      log('✅ Inicializando novo Workspace em .ai-workspace', 'green');
    }

    requiredDirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        log(`   + Criado: ${path.relative(projectRoot, dir)}`, 'dim');
      }
    });

    if (!fs.existsSync(path.join(wsPath, 'stats.json'))) {
      writeJsonSafe(path.join(wsPath, 'stats.json'), { sessions: 0, rules: {} });
    }

    if (!fs.existsSync(docsPath)) {
      fs.mkdirSync(docsPath, { recursive: true });
      fs.writeFileSync(path.join(docsPath, 'README.md'), '# Documentação do Projeto\n\nGerado via ai-doc init.');
      log('✅ Pasta docs/ criada.', 'green');
    }
    
    log('✅ Estrutura do Workspace validada.', 'green');
  },
  status: async () => { console.log("AI CLI v2.0 Refactored"); },
  help: () => {
    log('\n🤖 AI Agent Context Sync CLI', 'bright');
    log('\nComandos:', 'yellow');
    log('  ai-doc prompt "..."   Gera prompt estruturado com contexto inteligente');
    log('  ai-doc task <cmd>     Gerencia tasks (start|list|complete|status)');
    log('  ai-doc clickup <cmd>  Integra ClickUp (detect|cache-sync|link)');
    log('  ai-doc run <wf>       Executa workflow de automação');
    log('  ai-doc workflows      Lista workflows disponíveis');
    log('  ai-doc docs [recipe]  Gera estrutura de documentação (backend|frontend|fullstack)');
    log('  ai-doc scan [dir]     Verifica placeholders na documentação');
    log('  ai-doc build          Compila e sincroniza regras e instruções');
    log('  ai-doc kernel         Navegação e status do kernel');
    log('  ai-doc ritual         Roda auto-ritual (evolução + kernel + build)');
    log('  ai-doc evolve         Roda ciclo de autoevolução e registra sinais');
    log('  ai-doc chat "..."     Interpreta intenção e executa comandos');
    log('  ai-doc assist "..."   Alias de chat');
    log('  ai-doc init           Inicializa workspace e docs');
    log('  ai-doc status         Status do Kernel');
    log('  ai-doc version        Exibe versão');
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

/* istanbul ignore next */
if (require.main === module) {
  main();
}

module.exports = {
  main,
  commands,
  formatBytes,
  formatDate,
  computeRuleScore,
  detectDrift,
  updateRuleAlwaysApply,
  log,
  listFiles,
  countFilesRecursive,
  normalizeText
};
