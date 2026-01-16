#!/usr/bin/env node
/**
 * AI-DOC CLI v2.0.0 - "Universal Agent Support"
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
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

  build: () => {
    const wsPath = findWorkspace();
    if (!wsPath) { log('❌ Nenhum workspace encontrado', 'red'); return; }
    
    log('🔨 Compilando instruções para múltiplos agentes...', 'cyan');
    const projectRoot = path.dirname(wsPath);
    
    // Header
    const header = `# AI Instructions - UNIVERSAL CONTEXT\n# Gerado por AI-DOC Kernel v2.0\n# Alvo: Suporte multi-agente (Cursor, Trae, Windsurf, Claude, Gemini, Antigravity)\n# Data: ${new Date().toISOString()}\n\n`;

    // 1. Core Modules
    let body = "";
    const modulesDir = path.join(KERNEL_PATH, 'modules');
    const order = ['core', 'identity', 'memory', 'tasks', 'analysis'];
    order.forEach(mod => {
      const file = path.join(modulesDir, mod, 'instruction.md');
      if (fs.existsSync(file)) {
        body += `\n## [MÓDULO] ${mod.toUpperCase()}\n${fs.readFileSync(file, 'utf-8').replace(/^---[\s\S]*?---\n*/, '')}\n`;
      }
    });

    // 2. Stacks & Heuristics
    const stacksDir = path.join(modulesDir, 'integrations', 'stacks');
    if (fs.existsSync(stacksDir)) {
      body += `\n## [TECNOLOGIAS]\n`;
      fs.readdirSync(stacksDir).filter(f => f.endsWith('.md')).forEach(file => {
        body += `### STACK: ${file.replace('.md', '').toUpperCase()}\n${fs.readFileSync(path.join(stacksDir, file), 'utf-8').replace(/^---[\s\S]*?---\n*/, '')}\n`;
      });
    }

    const fullContent = header + body;
    
    // MAPA DE AGENTES E SEUS ARQUIVOS DE PREFERÊNCIA
    const agentTargets = [
      { name: 'Cursor', file: '.cursorrules' },
      { name: 'Windsurf', file: '.windsurfrules' },
      { name: 'Copilot', file: '.github/copilot-instructions.md' },
      { name: 'Trae', file: '.trae/rules/project_rules.md' },
      { name: 'Claude', file: '.claude/instructions.md' },
      { name: 'Gemini', file: '.google/instructions.md' },
      { name: 'Generic/Antigravity', file: '.ai-workspace/cache/compiled/ai-instructions.md' }
    ];
    
    agentTargets.forEach(target => {
      const fullPath = path.join(projectRoot, target.file);
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(fullPath, fullContent);
      log(`   ✅ Sincronizado: ${target.name} (${target.file})`, 'green');
    });

    log('\n🚀 Sucesso! Todos os agentes agora compartilham o mesmo cérebro.', 'bright');
  },

  init: () => { /* Mantido anterior */ },
  identity: (args) => { /* Mantido anterior */ },
  heuristics: () => { /* Mantido anterior */ },
  soul: (args) => { /* Mantido anterior */ },
  help: () => {
    logSection('AI-DOC CLI v2.0.0');
    log('Comandos:', 'cyan');
    log('  init, status, build, sync, heuristics, identity, soul');
  }
};

const args = process.argv.slice(2);
const cmd = args[0] || 'help';
if (commands[cmd]) commands[cmd](args.slice(1));
else commands.help();
