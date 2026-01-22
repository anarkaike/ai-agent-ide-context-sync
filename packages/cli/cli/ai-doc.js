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

const commands = {
  prompt: require('../commands/prompt'),
  run: require('../commands/run'),
  // Manteremos ones simples inline ou moveremos depois se precisar
  init: async () => { /* ... existing init logic ... */ log('Init not fully migrated logic kept in legacy for brevity, please run build first.'); },
  status: async () => { console.log("AI CLI v2.0 Refactored"); },
  help: () => {
    log('\n🤖 AI Agent Context Sync CLI', 'bright');
    log('\nComandos:', 'yellow');
    log('  ai-doc prompt "..."   Gera prompt estruturado com contexto inteligente');
    log('  ai-doc run <wf>       Executa workflow de automação');
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
