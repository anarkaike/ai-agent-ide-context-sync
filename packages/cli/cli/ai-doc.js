#!/usr/bin/env node
/**
 * AI-DOC CLI v2.0.0 - "Universal Agent Support"
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
const { execSync } = require('child_process');

// Paths globais
const KERNEL_PATH = path.join(os.homedir(), '.ai-doc', 'kernel');
const SOUL_PATH = path.join(os.homedir(), '.ai-doc', 'soul');
const WORKSPACE_NAME = '.ai-workspace';

let HeuristicsEngine = null;
try {
  HeuristicsEngine = require('../heuristics/engine');
} catch (e) {}

const c = {
  reset: '\x1b[0m', bright: '\x1b[1m', dim: '\x1b[2m',
  green: '\x1b[32m', yellow: '\x1b[33m', blue: '\x1b[34m',
  magenta: '\x1b[35m', cyan: '\x1b[36m', red: '\x1b[31m'
};

const log = (msg, color = 'reset') => console.log(`${c[color]}${msg}${c.reset}`);
const logSection = (title) => { console.log(); log(`=== ${title} ===`, 'bright'); };

function findWorkspace() {
  let dir = process.cwd();
  while (dir !== path.dirname(dir)) {
    const wsPath = path.join(dir, WORKSPACE_NAME);
    if (fs.existsSync(wsPath)) return wsPath;
    dir = path.dirname(dir);
  }
  return null;
}

function stripFrontmatter(md) {
  return md.replace(/^---[\s\S]*?---\n*/, '');
}

function readTextIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf-8');
}

function resolveDocTemplateContent(modulesDir, templateName) {
  if (!templateName) return null;
  const candidates = [
    path.join(modulesDir, 'docs', 'templates', templateName),
    path.join(modulesDir, 'templates', 'assets', templateName)
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return fs.readFileSync(candidate, 'utf-8');
    }
  }
  return null;
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

function writeFileEnsuringDir(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content);
}

function resolveModulesDir(source = 'auto') {
  const fromGlobalKernel = path.join(KERNEL_PATH, 'modules');
  const fromLocalPackage = path.join(__dirname, '..', 'modules');
  const globalExists = fs.existsSync(fromGlobalKernel);
  const localExists = fs.existsSync(fromLocalPackage);

  if (source === 'global') return fromGlobalKernel;
  if (source === 'local') return fromLocalPackage;
  if (globalExists) return fromGlobalKernel;
  if (localExists) return fromLocalPackage;
  return fromGlobalKernel;
}

function extractBetweenMarkers(md, startMarker, endMarker) {
  const startIndex = md.indexOf(startMarker);
  const endIndex = md.indexOf(endMarker);
  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) return null;
  return md.slice(startIndex + startMarker.length, endIndex).trim();
}

function extractCoreSection(md) {
  const candidates = [
    ['<!-- AI-DOC:CORE_START -->', '<!-- AI-DOC:CORE_END -->'],
    ['<!-- CORE_START -->', '<!-- CORE_END -->']
  ];
  for (const [start, end] of candidates) {
    const extracted = extractBetweenMarkers(md, start, end);
    if (extracted) return extracted;
  }
  return null;
}

function extractFullSection(md) {
  const candidates = [
    ['<!-- AI-DOC:FULL_START -->', '<!-- AI-DOC:FULL_END -->'],
    ['<!-- FULL_START -->', '<!-- FULL_END -->']
  ];
  for (const [start, end] of candidates) {
    const extracted = extractBetweenMarkers(md, start, end);
    if (extracted) return extracted;
  }
  return null;
}

function safeReadJson(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function collectPackageNames(obj) {
  if (!obj || typeof obj !== 'object') return new Set();
  return new Set(Object.keys(obj));
}

function detectProjectStacks(projectRoot) {
  const detected = new Set();

  const packageJson = safeReadJson(path.join(projectRoot, 'package.json'));
  if (packageJson) {
    detected.add('node');
    const deps = new Set([
      ...collectPackageNames(packageJson.dependencies),
      ...collectPackageNames(packageJson.devDependencies),
      ...collectPackageNames(packageJson.peerDependencies)
    ]);

    if (fs.existsSync(path.join(projectRoot, 'tsconfig.json')) || deps.has('typescript') || deps.has('ts-node')) {
      detected.add('typescript');
    }
    if (deps.has('react') || deps.has('next')) detected.add('react');
    if (deps.has('vue') || deps.has('nuxt') || deps.has('@vue/cli-service')) detected.add('vue');
    if (deps.has('svelte') || deps.has('@sveltejs/kit')) detected.add('svelte');
    if (deps.has('angular') || deps.has('@angular/core')) detected.add('angular');
  }

  const composerJson = safeReadJson(path.join(projectRoot, 'composer.json'));
  if (composerJson) {
    detected.add('php');
    const req = new Set([
      ...collectPackageNames(composerJson.require),
      ...collectPackageNames(composerJson['require-dev'])
    ]);
    if (req.has('laravel/framework')) detected.add('laravel');
  }

  if (fs.existsSync(path.join(projectRoot, 'Gemfile'))) detected.add('ruby');
  if (fs.existsSync(path.join(projectRoot, 'go.mod'))) detected.add('go');
  if (fs.existsSync(path.join(projectRoot, 'Cargo.toml'))) detected.add('rust');
  if (fs.existsSync(path.join(projectRoot, 'pom.xml')) || fs.existsSync(path.join(projectRoot, 'build.gradle')) || fs.existsSync(path.join(projectRoot, 'build.gradle.kts'))) detected.add('java');
  if (fs.existsSync(path.join(projectRoot, 'pyproject.toml')) || fs.existsSync(path.join(projectRoot, 'requirements.txt'))) detected.add('python');

  return Array.from(detected);
}

function listAvailableStacks(modulesDir) {
  const stacksDir = path.join(modulesDir, 'integrations', 'stacks');
  if (!fs.existsSync(stacksDir)) return { stacksDir, available: [] };
  const available = fs.readdirSync(stacksDir)
    .filter(name => name.endsWith('.md'))
    .map(name => name.replace(/\.md$/, ''));
  return { stacksDir, available };
}

function pickStacksForProject(detectedStacks, availableStacks) {
  const available = new Set(availableStacks);
  return detectedStacks.filter(s => available.has(s));
}

function listStackToolFiles(stacksDir, stackId) {
  const toolsDir = path.join(stacksDir, 'tools');
  if (!fs.existsSync(toolsDir)) return [];
  const normalized = (stackId || '').toLowerCase();
  return fs.readdirSync(toolsDir)
    .filter(name => name.endsWith('.md'))
    .filter(name => name.toLowerCase().includes(normalized))
    .map(name => path.join(toolsDir, name));
}

function compactWhitespace(text) {
  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return normalized + '\n';
}

function isInteractive() {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

function createQuestionInterface() {
  return readline.createInterface({ input: process.stdin, output: process.stdout });
}

function askQuestion(rl, prompt) {
  return new Promise(resolve => rl.question(prompt, answer => resolve(answer)));
}

function normalizeYesNo(value, fallback) {
  const raw = (value || '').trim().toLowerCase();
  if (['s', 'sim', 'y', 'yes'].includes(raw)) return 's';
  if (['n', 'nao', 'não', 'no'].includes(raw)) return 'n';
  return fallback;
}

function normalizeChoice(value, allowed, fallback) {
  const raw = (value || '').trim().toLowerCase();
  if (allowed.includes(raw)) return raw;
  return fallback;
}

function decideRecipeFromStacks(detectedStacks) {
  const hasBackend = detectedStacks.includes('laravel') || detectedStacks.includes('php') || detectedStacks.includes('go') || detectedStacks.includes('rust') || detectedStacks.includes('python') || detectedStacks.includes('java');
  const hasFrontend = detectedStacks.includes('react') || detectedStacks.includes('vue') || detectedStacks.includes('angular') || detectedStacks.includes('svelte');
  if (hasBackend && hasFrontend) return 'fullstack';
  if (hasFrontend) return 'frontend';
  if (hasBackend) return 'backend';
  return 'fullstack';
}

async function runDocsWizard({ projectRoot, wsPath }) {
  if (!isInteractive()) return null;

  const rl = createQuestionInterface();
  try {
    const detectedStacks = detectProjectStacks(projectRoot);
    const defaultRecipe = decideRecipeFromStacks(detectedStacks);
    const defaultMode = 'update';
    const defaultDepth = 'standard';
    const defaultReadmePolicy = 'all-folders';
    const defaultLanguage = 'pt-BR';
    const defaultLinkPolicy = 'strict';
    const defaultOutputDir = 'docs';

    const startAnswer = await askQuestion(rl, 'Deseja configurar docs agora? (s/n) [s]: ');
    const startChoice = normalizeYesNo(startAnswer, 's');
    if (startChoice !== 's') return null;

    const recipeAnswer = await askQuestion(rl, `Recipe (backend|frontend|fullstack|monorepo|lib|mobile) [${defaultRecipe}]: `);
    const recipe = normalizeChoice(recipeAnswer, ['backend', 'frontend', 'fullstack', 'monorepo', 'lib', 'mobile'], defaultRecipe);

    const modeAnswer = await askQuestion(rl, `Modo (analyze|generate|update) [${defaultMode}]: `);
    const mode = normalizeChoice(modeAnswer, ['analyze', 'generate', 'update'], defaultMode);

    const depthAnswer = await askQuestion(rl, `Profundidade (minimal|standard|full) [${defaultDepth}]: `);
    const depth = normalizeChoice(depthAnswer, ['minimal', 'standard', 'full'], defaultDepth);

    const readmeAnswer = await askQuestion(rl, `README policy (all-folders|roots-only|none) [${defaultReadmePolicy}]: `);
    const readmePolicy = normalizeChoice(readmeAnswer, ['all-folders', 'roots-only', 'none'], defaultReadmePolicy);

    const languageAnswer = await askQuestion(rl, `Idioma [${defaultLanguage}]: `);
    const language = (languageAnswer || '').trim() || defaultLanguage;

    const linkAnswer = await askQuestion(rl, `Link policy (strict|relaxed) [${defaultLinkPolicy}]: `);
    const linkPolicy = normalizeChoice(linkAnswer, ['strict', 'relaxed'], defaultLinkPolicy);

    const outputAnswer = await askQuestion(rl, `Diretório de saída [${defaultOutputDir}]: `);
    const outputDir = (outputAnswer || '').trim() || defaultOutputDir;

    return { recipe, mode, depth, readmePolicy, language, linkPolicy, outputDir };
  } finally {
    rl.close();
  }
}

function buildDefaultDocsConfig(projectRoot) {
  const detectedStacks = detectProjectStacks(projectRoot);
  const recipe = decideRecipeFromStacks(detectedStacks);
  return {
    recipe,
    mode: 'update',
    depth: 'standard',
    readmePolicy: 'all-folders',
    language: 'pt-BR',
    linkPolicy: 'strict',
    outputDir: 'docs'
  };
}

function parseBuildArgs(args) {
  const options = {
    fixBudget: false,
    report: false,
    onlyAgent: null,
    profile: 'default',
    modules: 'auto'
  };

  for (const arg of args || []) {
    if (arg === '--fix-budget') options.fixBudget = true;
    else if (arg === '--report') options.report = true;
    else if (arg.startsWith('--only=')) options.onlyAgent = arg.slice('--only='.length).trim();
    else if (arg.startsWith('--profile=')) options.profile = arg.slice('--profile='.length).trim() || 'default';
    else if (arg.startsWith('--modules=')) options.modules = arg.slice('--modules='.length).trim() || 'auto';
  }

  return options;
}

function createBudgetReport({ projectRoot, detectedStacks, selectedStacks, modules, agents, outputs, full, profile }) {
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    projectRoot,
    profile,
    detectedStacks,
    selectedStacks,
    modules,
    agents,
    outputs,
    full
  };
}

function writeBudgetReport(projectRoot, report) {
  const reportPath = path.join(projectRoot, '.ai-workspace', 'cache', 'compiled', 'budget-report.json');
  writeFileEnsuringDir(reportPath, JSON.stringify(report, null, 2) + '\n');
  return reportPath;
}

const commands = {
  status: () => {
    logSection('🔧 AI KERNEL (Global)');
    if (fs.existsSync(KERNEL_PATH)) {
      const pkg = JSON.parse(fs.readFileSync(path.join(KERNEL_PATH, 'package.json')));
      log(`   Versão: ${pkg.version}`, 'green');
      if (HeuristicsEngine) {
        const engine = new HeuristicsEngine();
        log(`   Inteligência: ${engine.stats().total} heurísticas aprendidas`, 'magenta');
      }
    }
    
    logSection('📁 AI WORKSPACE (Local)');
    const wsPath = findWorkspace();
    if (wsPath) {
      log(`   Projeto: ${path.basename(path.dirname(wsPath))}`, 'cyan');
      log(`   Path: ${wsPath}`, 'dim');
    } else log('   ⚠️  Execute "ai-doc init" para começar', 'yellow');
    console.log();
  },

  build: (args = []) => {
    const wsPath = findWorkspace();
    if (!wsPath) { log('❌ Nenhum workspace encontrado', 'red'); return; }

    const options = parseBuildArgs(args);
    log('🔨 Compilando instruções (Core + Full) para múltiplos agentes...', 'cyan');
    const projectRoot = path.dirname(wsPath);

    const modulesDir = resolveModulesDir(options.modules);
    const moduleOrder = [
      'core',
      'core/autopriority',
      'core/i18n',
      'identity',
      'memory',
      'tasks',
      'analysis',
      'docs',
      'integrations/mcp',
      'responses',
      'templates'
    ];

    const moduleParts = moduleOrder.map(mod => {
      const instructionPath = path.join(modulesDir, mod, 'instruction.md');
      const raw = readTextIfExists(instructionPath);
      if (!raw) return null;

      const clean = stripFrontmatter(raw);
      const coreFromMarkers = extractCoreSection(clean);
      const fullFromMarkers = extractFullSection(clean);

      const coreFallback = (() => {
        if (mod === 'core') {
          return [
            '- Use o repositório como source of truth.',
            '- Nunca invente dependências; confirme pelo código.',
            '- Prefira mudanças pequenas e verificadas (lint/test).',
            '- Não exponha segredos e não logue dados sensíveis.'
          ].join('\n');
        }
        if (mod === 'identity') {
          return [
            '- Personas são “interfaces”; mantenha objetivos claros e curtos.',
            '- Evite persona super genérica; foque em papéis do projeto.',
            '- Mudanças em persona devem refletir no comportamento e nos outputs.'
          ].join('\n');
        }
        if (mod === 'memory') {
          return [
            '- Memória serve para fatos estáveis e preferências do projeto.',
            '- Registre decisões de arquitetura e invariantes, não conversas longas.',
            '- Prefira referências para arquivos do projeto quando aplicável.'
          ].join('\n');
        }
        if (mod === 'tasks') {
          return [
            '- Tasks devem ser pequenas, com critério de aceite claro.',
            '- Sempre valide mudanças (lint/test/build) quando disponível.',
            '- Atualize progresso e evite “tarefas eternas”.'
          ].join('\n');
        }
        if (mod === 'analysis') {
          return [
            '- Antes de mudar código, entenda o fluxo e impactos.',
            '- Prefira diagnóstico objetivo e evidência no repo.',
            '- Gere propostas com trade-offs e validação.'
          ].join('\n');
        }
        if (mod === 'responses') {
          return [
            '- Use templates de resposta e inclua evidências (arquivos/comandos).',
            '- Mantenha próximos passos claros e controle de progresso.'
          ].join('\n');
        }
        if (mod === 'integrations/mcp') {
          return [
            '- Use MCP para dados ao vivo quando necessário; senão use cache.',
            '- Nunca exponha tokens; sanitize dados antes de persistir.'
          ].join('\n');
        }
        if (mod === 'core/autopriority') {
          return [
            '- Priorize com sinais reais; gere ranking com justificativas.',
            '- Promova critérios apenas após aprovação.'
          ].join('\n');
        }
        if (mod === 'core/i18n') {
          return [
            '- Sempre propague chaves do idioma fonte e valide consistência.',
            '- Preserve placeholders e evite inconsistências entre locais.'
          ].join('\n');
        }
        return '';
      })();

      const fullBody = fullFromMarkers ? fullFromMarkers : clean.trim();
      const coreBody = coreFromMarkers ? coreFromMarkers : coreFallback;

      return {
        id: mod,
        instructionPath,
        core: compactWhitespace(`## ${mod.toUpperCase()}\n${coreBody}`),
        full: compactWhitespace(`## ${mod.toUpperCase()}\n${fullBody}`)
      };
    }).filter(Boolean);

    const detectedStacks = detectProjectStacks(projectRoot);
    const { stacksDir, available: availableStacks } = listAvailableStacks(modulesDir);
    const selectedStacks = pickStacksForProject(detectedStacks, availableStacks);

    const stackParts = selectedStacks.map(stackId => {
      const stackPath = path.join(stacksDir, `${stackId}.md`);
      const raw = readTextIfExists(stackPath);
      if (!raw) return null;
      const clean = stripFrontmatter(raw);
      const coreFromMarkers = extractCoreSection(clean);
      const fullFromMarkers = extractFullSection(clean);

      const coreFallback = (() => {
        if (stackId === 'laravel') {
          return [
            '- Siga padrões do Laravel (routes, controllers, requests, policies).',
            '- Use migrations e Eloquent com consistência.',
            '- Prefira validação via FormRequest e regras explícitas.',
            '- Log e exceptions: mensagens claras, sem dados sensíveis.'
          ].join('\n');
        }
        return `- Stack ${stackId}: use o Full como referência.`;
      })();

      const fullBody = fullFromMarkers ? fullFromMarkers : clean.trim();
      const coreBody = coreFromMarkers ? coreFromMarkers : coreFallback;

      const toolFiles = listStackToolFiles(stacksDir, stackId);
      const toolsFull = toolFiles.map(toolPath => {
        const toolRaw = readTextIfExists(toolPath);
        if (!toolRaw) return '';
        const toolClean = stripFrontmatter(toolRaw);
        const toolFull = extractFullSection(toolClean) || toolClean.trim();
        return compactWhitespace(`### TOOL ${path.basename(toolPath)}\n${toolFull}`);
      }).filter(Boolean).join('\n');

      return {
        id: stackId,
        stackPath,
        core: compactWhitespace(`## STACK ${stackId.toUpperCase()}\n${coreBody}`),
        full: compactWhitespace(`## STACK ${stackId.toUpperCase()}\n${fullBody}` + (toolsFull ? `\n\n## STACK ${stackId.toUpperCase()} TOOLS\n${toolsFull}` : ''))
      };
    }).filter(Boolean);

    const compiledDir = path.join(projectRoot, '.ai-workspace', 'cache', 'compiled');
    ensureDir(compiledDir);

    const fullHeader = compactWhitespace([
      '# AI Instructions (FULL)',
      `Gerado: ${new Date().toISOString()}`,
      `Projeto: ${path.basename(projectRoot)}`,
      ''
    ].join('\n'));

    const coreHeader = compactWhitespace([
      '# AI Rules (CORE)',
      `Projeto: ${path.basename(projectRoot)}`,
      `Stacks: ${selectedStacks.length ? selectedStacks.join(', ') : 'none'}`,
      `Full: .ai-workspace/cache/compiled/ai-instructions.full.md`,
      ''
    ].join('\n'));

    const fullBody = compactWhitespace(moduleParts.map(p => p.full).join('\n') + '\n' + stackParts.map(p => p.full).join('\n'));
    const coreBody = compactWhitespace(moduleParts.map(p => p.core).join('\n') + '\n' + stackParts.map(p => p.core).join('\n'));
    const fullContent = compactWhitespace(fullHeader + fullBody);
    const coreContent = compactWhitespace(coreHeader + coreBody);

    const fullOut = path.join(compiledDir, 'ai-instructions.full.md');
    const coreOut = path.join(compiledDir, 'ai-instructions.core.md');
    writeFileEnsuringDir(fullOut, fullContent);
    writeFileEnsuringDir(coreOut, coreContent);

    const profileName = (options.profile || 'default').toLowerCase();
    const profile = profileName === 'strict'
      ? {
        maxFullChars: 250000,
        agentBudgets: {
          Cursor: 9000,
          Windsurf: 9000,
          Copilot: 6000,
          Trae: 7000,
          Claude: 12000,
          Gemini: 12000,
          'Generic/Antigravity': 12000
        }
      }
      : {
        maxFullChars: 250000,
        agentBudgets: {
          Cursor: 12000,
          Windsurf: 12000,
          Copilot: 8000,
          Trae: 10000,
          Claude: 14000,
          Gemini: 14000,
          'Generic/Antigravity': 14000
        }
      };

    const agentTargets = [
      { name: 'Cursor', file: '.cursorrules', maxCoreChars: profile.agentBudgets.Cursor },
      { name: 'Windsurf', file: '.windsurfrules', maxCoreChars: profile.agentBudgets.Windsurf },
      { name: 'Copilot', file: '.github/copilot-instructions.md', maxCoreChars: profile.agentBudgets.Copilot },
      { name: 'Trae', file: '.trae/rules/project_rules.md', maxCoreChars: profile.agentBudgets.Trae },
      { name: 'Claude', file: '.claude/instructions.md', maxCoreChars: profile.agentBudgets.Claude },
      { name: 'Gemini', file: '.google/instructions.md', maxCoreChars: profile.agentBudgets.Gemini },
      { name: 'Generic/Antigravity', file: '.ai-workspace/cache/compiled/ai-instructions.md', maxCoreChars: profile.agentBudgets['Generic/Antigravity'] }
    ];

    const onlyAgent = options.onlyAgent ? options.onlyAgent.toLowerCase() : null;
    const selectedAgents = agentTargets.filter(a => {
      if (!onlyAgent) return true;
      return a.name.toLowerCase() === onlyAgent || a.file.toLowerCase() === onlyAgent;
    });

    const outputs = [];
    let budgetExceeded = false;
    const fullOk = fullContent.length <= profile.maxFullChars;

    for (const target of selectedAgents) {
      const agentHeader = compactWhitespace([
        '# AI Rules (CORE)',
        `Agent: ${target.name}`,
        `Projeto: ${path.basename(projectRoot)}`,
        `Full: .ai-workspace/cache/compiled/ai-instructions.full.md`,
        ''
      ].join('\n'));

      const agentOverride = (() => {
        if (target.name === 'Trae') {
          return compactWhitespace([
            '## TRAE',
            '- Prefira buscar contexto no repo antes de editar.',
            '- Use SearchCodebase para localizar código; evite buscas manuais longas.',
            '- Edite arquivos com patch; evite comandos de shell para escrever arquivos.',
            '- Valide com lint/test quando existir script no projeto.',
            '- Nunca invente dependências; confirme no código e manifests.'
          ].join('\n'));
        }
        if (target.name === 'Copilot') {
          return compactWhitespace([
            '## COPILOT',
            '- Siga estritamente padrões existentes do repo.',
            '- Se faltar contexto, peça ou abra o arquivo relevante.',
            '- Evite suposições sobre libs e APIs.'
          ].join('\n'));
        }
        return '';
      })();

      let agentCore = compactWhitespace(agentHeader + agentOverride + coreBody);
      if (agentCore.length > target.maxCoreChars && options.fixBudget) {
        const withoutStacks = compactWhitespace(agentHeader + agentOverride + moduleParts.map(p => p.core).join('\n'));
        agentCore = withoutStacks.length <= target.maxCoreChars ? withoutStacks : compactWhitespace(withoutStacks);
      }

      const ok = agentCore.length <= target.maxCoreChars;
      if (!ok) budgetExceeded = true;

      const fullPath = path.join(projectRoot, target.file);
      writeFileEnsuringDir(fullPath, agentCore);
      outputs.push({
        agent: target.name,
        file: target.file,
        coreChars: agentCore.length,
        maxCoreChars: target.maxCoreChars,
        ok
      });
      log(`   ✅ Sincronizado: ${target.name} (${target.file})`, 'green');
    }

    const modulesMetrics = moduleParts.map(p => ({
      id: p.id,
      instructionPath: p.instructionPath,
      coreChars: p.core.length,
      fullChars: p.full.length
    }));

    const stacksMetrics = stackParts.map(p => ({
      id: p.id,
      stackPath: p.stackPath,
      coreChars: p.core.length,
      fullChars: p.full.length
    }));

    const report = createBudgetReport({
      projectRoot,
      profile: profileName,
      detectedStacks,
      selectedStacks,
      modules: modulesMetrics,
      agents: selectedAgents.map(a => ({ name: a.name, file: a.file, maxCoreChars: a.maxCoreChars })),
      outputs,
      full: { file: '.ai-workspace/cache/compiled/ai-instructions.full.md', fullChars: fullContent.length, maxFullChars: profile.maxFullChars, ok: fullOk }
    });

    if (budgetExceeded || !fullOk || options.report) {
      const reportPath = writeBudgetReport(projectRoot, report);
      if (budgetExceeded) {
        log(`\n❌ Budget excedido. Relatório: ${reportPath}`, 'red');
        log('   Dica: rode "ai-doc build --fix-budget --report" para tentar compactar.', 'yellow');
        return;
      }
      if (!fullOk) {
        log(`\n❌ Full excedeu o budget (${fullContent.length}/${profile.maxFullChars}). Relatório: ${reportPath}`, 'red');
        return;
      }
      log(`\n📦 Relatório gerado: ${reportPath}`, 'dim');
    }

    log('\n🚀 Sucesso! Core enxuto sincronizado. Full disponível no cache.', 'bright');
  },

  docs: (args) => runDocsCommand(args),

  init: async () => {
    const projectRoot = process.cwd();
    const wsPath = path.join(projectRoot, WORKSPACE_NAME);

    if (fs.existsSync(wsPath)) {
      log('⚠️  Workspace já existe neste projeto.', 'yellow');
    } else {
      fs.mkdirSync(wsPath, { recursive: true });
      fs.mkdirSync(path.join(wsPath, 'personas'), { recursive: true });
      fs.mkdirSync(path.join(wsPath, 'tasks', 'active'), { recursive: true });
      fs.mkdirSync(path.join(wsPath, 'tasks', 'archive'), { recursive: true });
      fs.mkdirSync(path.join(wsPath, 'analysis'), { recursive: true });

      const configPath = path.join(wsPath, 'config.yaml');
      if (!fs.existsSync(configPath)) {
        const config = [
          `name: ${path.basename(projectRoot)}`,
          `created_at: ${new Date().toISOString()}`,
          `kernel_version: 2.0.0`
        ].join('\n');
        fs.writeFileSync(configPath, config + '\n');
      }

      const personaSettingsPath = path.join(wsPath, '.persona-settings.json');
      if (!fs.existsSync(personaSettingsPath)) {
        fs.writeFileSync(personaSettingsPath, JSON.stringify({ personas: {} }, null, 2));
      }

      log('✅ Workspace inicializado!', 'green');
    }

    const docsConfigPath = path.join(wsPath, 'docs-config.json');
    const existingDocsConfig = fs.existsSync(docsConfigPath);
    const docsConfig = existingDocsConfig ? null : await runDocsWizard({ projectRoot, wsPath });
    const finalDocsConfig = docsConfig || (existingDocsConfig ? null : buildDefaultDocsConfig(projectRoot));
    if (finalDocsConfig) {
      fs.writeFileSync(docsConfigPath, JSON.stringify(finalDocsConfig, null, 2) + '\n');
      log(`📚 Docs config salvo em: ${docsConfigPath}`, 'cyan');
    }

    log('\n🔨 Construindo contexto inicial para todos os agentes...', 'cyan');
    commands.build();
    try {
      execSync('code --install-extension junio-de-almeida-vitorino.ai-agent-ide-context-sync-vscode', { stdio: 'ignore' });
      log('\n🧩 Extensão VS Code instalada/atualizada: AI Agent IDE Context Sync', 'green');
    } catch (e) {
      log('\nℹ️ Para usar a interface visual no VS Code, instale a extensão no VS Code:', 'cyan');
      log('   code --install-extension junio-de-almeida-vitorino.ai-agent-ide-context-sync-vscode', 'dim');
      log('   Open VSX: https://open-vsx.org/extension/junio-de-almeida-vitorino/ai-agent-ide-context-sync-vscode', 'dim');
    }
  },
  identity: (args) => {
    const sub = args[0];
    if (!sub || sub === 'help') {
      logSection('🎭 identity');
      log('Comandos:', 'cyan');
      log('  identity create <NOME>      Cria uma nova persona AI-<NOME>', 'green');
      log('  identity list               Lista personas existentes', 'green');
      return;
    }

    const projectRoot = process.cwd();
    const wsPath = path.join(projectRoot, WORKSPACE_NAME);
    if (!fs.existsSync(wsPath)) {
      log('❌ Nenhum workspace encontrado. Rode "ai-doc init" primeiro.', 'red');
      return;
    }

    const personasDir = path.join(wsPath, 'personas');
    if (!fs.existsSync(personasDir)) {
      fs.mkdirSync(personasDir, { recursive: true });
    }

    if (sub === 'create') {
      const rawName = args[1];
      if (!rawName) {
        log('⚠️  Informe o nome da persona. Ex: ai-doc identity create AI-SAKURA', 'yellow');
        return;
      }

      const personaName = rawName.startsWith('AI-') ? rawName : `AI-${rawName.toUpperCase()}`;
      const personaFile = path.join(personasDir, `${personaName}.md`);

      if (fs.existsSync(personaFile)) {
        log(`⚠️  Persona ${personaName} já existe.`, 'yellow');
        return;
      }

      const content = [
        `# ${personaName}`,
        '',
        'description: Especialista em desenvolvimento do projeto',
        '',
        '## Responsabilidades',
        '- Entender a arquitetura do projeto',
        '- Sugerir melhorias técnicas',
        '- Ajudar na tomada de decisão',
        '',
        '## Contexto',
        '- Tecnologias principais',
        '- Regras de negócio importantes',
        '- Padrões e anti-padrões a evitar',
        ''
      ].join('\n');

      fs.writeFileSync(personaFile, content);
      log(`✅ Persona criada: ${personaName}`, 'green');
      return;
    }

    if (sub === 'list') {
      if (!fs.existsSync(personasDir)) {
        log('Nenhuma persona encontrada.', 'yellow');
        return;
      }
      const files = fs.readdirSync(personasDir).filter(f => f.endsWith('.md') && f.startsWith('AI-'));
      if (files.length === 0) {
        log('Nenhuma persona encontrada.', 'yellow');
        return;
      }
      logSection('🎭 Personas registradas');
      files.forEach(f => {
        log(` • ${f.replace('.md', '')}`, 'cyan');
      });
      return;
    }

    log('Comando identity não reconhecido. Use "ai-doc identity help".', 'red');
  },
  heuristics: () => {
    if (!HeuristicsEngine) {
      log('Heuristics engine not available', 'yellow');
      return;
    }

    const engine = new HeuristicsEngine();
    const stats = engine.stats();

    console.log('\n=== 💡 Heurísticas do Kernel ===\n');
    console.log(`Total: ${stats.total} heurísticas\n`);

    Object.keys(engine.heuristics).forEach(type => {
      const stacks = engine.heuristics[type];
      const stackNames = Object.keys(stacks);
      if (stackNames.length === 0) return;

      console.log(`-- ${type.toUpperCase()} --`);
      stackNames.forEach(stack => {
        const list = stacks[stack] || [];
        if (list.length === 0) return;
        console.log(`  Stack: ${stack}`);
        list.forEach(h => {
          const desc = h.pattern || h.description || '';
          console.log(`   • [${h.id}] ${desc}`);
        });
      });
      console.log();
    });
  },
  soul: (args) => {
    const sub = args[0];
    if (!sub || sub === 'help') {
      logSection('🧠 soul');
      log('Comandos:', 'cyan');
      log('  soul export [arquivo]   Exporta o conhecimento para um .tar.gz', 'green');
      log('  soul import <arquivo>   Importa um backup gerado anteriormente', 'green');
      return;
    }

    if (sub === 'export') {
      if (!fs.existsSync(SOUL_PATH)) {
        fs.mkdirSync(SOUL_PATH, { recursive: true });
      }
      const outName = args[1] || `soul-backup-${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 8)}.tar.gz`;
      const outPath = path.join(process.cwd(), outName);
      try {
        execSync(`tar -czf "${outPath}" -C "${SOUL_PATH}" .`, { stdio: 'ignore' });
        log(`✅ Soul exportada: ${outPath}`, 'green');
      } catch (e) {
        log('❌ Falha ao exportar a Soul. Verifique se o comando "tar" está disponível.', 'red');
      }
      return;
    }

    if (sub === 'import') {
      const file = args[1];
      if (!file) {
        log('⚠️  Informe o arquivo de backup. Ex: ai-doc soul import soul-backup-20260116.tar.gz', 'yellow');
        return;
      }
      const resolved = path.isAbsolute(file) ? file : path.join(process.cwd(), file);
      if (!fs.existsSync(resolved)) {
        log(`❌ Arquivo não encontrado: ${resolved}`, 'red');
        return;
      }
      if (!fs.existsSync(SOUL_PATH)) {
        fs.mkdirSync(SOUL_PATH, { recursive: true });
      }
      try {
        execSync(`tar -xzf "${resolved}" -C "${SOUL_PATH}"`, { stdio: 'ignore' });
        log(`✅ Soul importada a partir de: ${resolved}`, 'green');
      } catch (e) {
        log('❌ Falha ao importar a Soul. Verifique se o arquivo é um .tar.gz válido.', 'red');
      }
      return;
    }

    log('Comando soul não reconhecido. Use "ai-doc soul help".', 'red');
  },
  help: () => {
    logSection('AI-DOC CLI v2.0.0');
    log('Comandos:', 'cyan');
    log('  init, status, build, docs, sync, heuristics, identity, soul');
  }
};

function runDocsCommand(args) {
  const wsPath = findWorkspace();
  if (!wsPath) { log('❌ Nenhum workspace encontrado', 'red'); return; }
  const projectRoot = path.dirname(wsPath);

  logSection('📚 AI-DOC DOCS MANAGER');

  // 1. Carregar configuração
  const configPath = path.join(wsPath, 'docs-config.json');
  let config = safeReadJson(configPath);
  if (!config) {
    log('⚠️  Configuração não encontrada. Gerando padrão...', 'yellow');
    config = buildDefaultDocsConfig(projectRoot);
    writeFileEnsuringDir(configPath, JSON.stringify(config, null, 2));
  }
  
  log(`   Recipe: ${config.recipe}`, 'cyan');
  log(`   Mode: ${config.mode}`, 'cyan');
  log(`   Output: ${config.outputDir}`, 'dim');

  // 2. Carregar Recipe
  const modulesDir = resolveModulesDir('auto');
  const recipePath = path.join(modulesDir, 'docs', 'recipes', `recipe-${config.recipe}.json`);
  const recipe = safeReadJson(recipePath);

  if (!recipe) {
    log(`❌ Recipe "${config.recipe}" não encontrada em ${recipePath}`, 'red');
    return;
  }

  const outputBase = path.join(projectRoot, config.outputDir || 'docs');
  ensureDir(outputBase);
  const folderReadmeTemplateByPath = new Map();
  for (const item of recipe.structure || []) {
    if (item.type === 'folder' && item.readmeTemplate) {
      folderReadmeTemplateByPath.set(item.path, item.readmeTemplate);
    }
  }

  // 3. Processar Estrutura (Pastas)
  log('\n   Verificando estrutura de pastas...', 'bright');
  let missingFolders = 0;
  for (const item of recipe.structure || []) {
    if (item.type === 'folder') {
      const folderPath = path.join(outputBase, item.path);
      if (!fs.existsSync(folderPath)) {
        if (config.mode === 'generate' || config.mode === 'update') {
          ensureDir(folderPath);
          log(`   [+] Pasta criada: ${item.path}`, 'green');
        } else {
          log(`   [!] Pasta faltando: ${item.path}`, 'yellow');
          missingFolders++;
        }
      }
    }
  }

  log('\n   Verificando arquivos...', 'bright');
  let missingFiles = 0;
  for (const item of recipe.files || []) {
    const filePath = path.join(outputBase, item.path);
    if (!fs.existsSync(filePath)) {
      if (config.mode === 'generate' || config.mode === 'update') {
        let content = `# ${path.basename(item.path)}\n\nGerado automaticamente pelo AI-DOC.\n`;
        const resolved = resolveDocTemplateContent(modulesDir, item.template);
        if (resolved) content = resolved;
        writeFileEnsuringDir(filePath, content);
        log(`   [+] Arquivo criado: ${item.path}`, 'green');
      } else {
        log(`   [!] Arquivo faltando: ${item.path}`, 'yellow');
        missingFiles++;
      }
    }
  }

  if (config.readmePolicy === 'all-folders') {
    log('\n   Validando política de READMEs...', 'bright');
    const allFolders = [outputBase]; // Começa pela raiz
    // Coleta todas subpastas da estrutura
    (recipe.structure || []).forEach(i => {
      if (i.type === 'folder') allFolders.push(path.join(outputBase, i.path));
    });

    for (const folder of allFolders) {
      if (fs.existsSync(folder)) {
        const readmePath = path.join(folder, 'README.md');
        if (!fs.existsSync(readmePath)) {
          if (config.mode === 'generate' || config.mode === 'update') {
             const relativeFolder = path.relative(outputBase, folder) || '';
             const templateName = folderReadmeTemplateByPath.get(relativeFolder) || 'tmp--global--doc-folder-readme.md';
             const resolved = resolveDocTemplateContent(modulesDir, templateName);
             const content = resolved || `# README\n\nDocumentação da pasta: ${path.basename(folder)}`;
             fs.writeFileSync(readmePath, content);
             log(`   [+] README criado em: ${path.relative(projectRoot, folder)}`, 'green');
          } else {
             log(`   [!] README faltando em: ${path.relative(projectRoot, folder)}`, 'red');
          }
        }
      }
    }
  }

  logSection('🏁 Docs Check Finalizado');
  if (missingFolders > 0 || missingFiles > 0) {
    log(`   ⚠️  Pendências: ${missingFolders} pastas, ${missingFiles} arquivos.`, 'yellow');
    if (config.mode === 'analyze') {
      log('   Dica: Mude o modo para "generate" ou "update" no docs-config.json para corrigir automaticamente.', 'dim');
    }
  } else {
    log('   ✨ Tudo parece estar em ordem conforme a recipe.', 'green');
  }
  console.log();
}

const args = process.argv.slice(2);
const cmd = args[0] || 'help';
if (commands[cmd]) {
  const result = commands[cmd](args.slice(1));
  if (result && typeof result.then === 'function') {
    result.catch((error) => {
      log(`❌ ${error && error.message ? error.message : 'Falha inesperada'}`, 'red');
      process.exitCode = 1;
    });
  }
} else commands.help();
