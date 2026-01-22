/**
 * Comando BUILD - Compila instruções para IDEs
 */

const fs = require('fs');
const path = require('path');

const CORE_START = '<!-- AI-DOC:CORE_START -->';
const CORE_END = '<!-- AI-DOC:CORE_END -->';
const FULL_START = '<!-- AI-DOC:FULL_START -->';
const FULL_END = '<!-- AI-DOC:FULL_END -->';

function toNumber(value) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function trimText(text, maxChars, notice) {
  if (!maxChars || text.length <= maxChars) return text;
  const suffix = notice || '\n\n⚠️ Conteúdo truncado por orçamento de contexto.';
  const available = Math.max(0, maxChars - suffix.length);
  return text.slice(0, available) + suffix;
}

function parseBudgetMap(value) {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (e) {
    return {};
  }
}

function applyBudget(header, blocks, maxChars) {
  if (!maxChars || maxChars <= 0) {
    return header + blocks.join('\n\n---\n');
  }

  const separator = '\n\n---\n';
  const notice = '\n\n## ⚠️ Contexto truncado\nEste arquivo excedeu o orçamento de contexto e foi reduzido.';
  let currentBlocks = [...blocks];
  let content = header + currentBlocks.join(separator);

  if (content.length <= maxChars) return content;

  while (currentBlocks.length > 0) {
    currentBlocks.pop();
    content = header + currentBlocks.join(separator) + notice;
    if (content.length <= maxChars) return content;
  }

  const truncatedHeader = header.slice(0, Math.max(0, maxChars - notice.length));
  return truncatedHeader + notice;
}

function stripFrontmatter(content) {
  return content.replace(/^---[\s\S]*?---\n*/, '');
}

function extractSection(content, startTag, endTag) {
  const startIndex = content.indexOf(startTag);
  const endIndex = content.indexOf(endTag);
  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) return '';
  return content
    .slice(startIndex + startTag.length, endIndex)
    .trim();
}

function normalizeModuleContent(content, variant) {
  const cleanContent = stripFrontmatter(content);
  const core = extractSection(cleanContent, CORE_START, CORE_END);
  const full = extractSection(cleanContent, FULL_START, FULL_END);

  if (!core && !full) {
    return cleanContent.trim();
  }

  if (variant === 'core') {
    return core.trim();
  }

  if (core && full) {
    return `${core.trim()}\n\n${full.trim()}`.trim();
  }

  return (core || full).trim();
}

function build(kernelPath, wsPath, projectRoot, options = {}) {
  const now = new Date().toISOString();
  const variant = options.variant || 'full';
  const budget = options.budget || {};
  const maxChars = toNumber(budget.maxChars || process.env.AI_DOC_BUILD_MAX_CHARS);
  const moduleBudgets = parseBudgetMap(budget.moduleBudgets || process.env.AI_DOC_BUILD_MODULE_BUDGETS);
  const stackBudgets = parseBudgetMap(budget.stackBudgets || process.env.AI_DOC_BUILD_STACK_BUDGETS);
  
  // Ler config do workspace
  const configPath = path.join(wsPath, 'config.yaml');
  let projectName = path.basename(projectRoot);
  let techStack = '';
  
  if (fs.existsSync(configPath)) {
    const config = fs.readFileSync(configPath, 'utf-8');
    const nameMatch = config.match(/name:\s*"?([^"\n]+)"?/);
    if (nameMatch) projectName = nameMatch[1];
    
    // Extrair tech stack
    const stackMatch = config.match(/tech_stack:([\s\S]*?)(?=\n\w|$)/);
    if (stackMatch) techStack = stackMatch[1];
  }
  
  // Header padrão
  const header = `# AI Instructions - ${projectName}
# Gerado automaticamente pelo AI-DOC Kernel v2.0
# Data: ${now}
# Variante: ${variant.toUpperCase()}
# ⚠️ NÃO EDITE MANUALMENTE - Use 'ai-doc build' para regenerar

`;

  // Coletar instruções dos módulos do kernel
  let instructions = [];
  
  const modulesPath = path.join(kernelPath, 'modules');
  const moduleOrder = ['core', 'identity', 'memory', 'tasks', 'analysis', 'docs', 'responses'];
  
  moduleOrder.forEach(modName => {
    const modPath = path.join(modulesPath, modName);
    const instructionFile = path.join(modPath, 'instruction.md');
    
    // console.log(`Checking module: ${modName} at ${instructionFile}`);

    if (fs.existsSync(instructionFile)) {
      const content = fs.readFileSync(instructionFile, 'utf-8');
      const normalized = normalizeModuleContent(content, variant);
      // console.log(`Normalized content length for ${modName}: ${normalized ? normalized.length : 0}`);
      
      if (normalized) {
        const budgetLimit = toNumber(moduleBudgets[modName]);
        const trimmed = trimText(normalized, budgetLimit);
        instructions.push(`\n## Módulo: ${modName.toUpperCase()}\n\n${trimmed}`);
      }
    } else {
        // console.log(`Module file not found: ${instructionFile}`);
    }
  });
  
  // Coletar stacks (Laravel, Vue, etc.)
  const stacksPath = path.join(modulesPath, 'integrations', 'stacks');
  if (fs.existsSync(stacksPath)) {
    fs.readdirSync(stacksPath).forEach(file => {
      if (file.endsWith('.md')) {
        const content = fs.readFileSync(path.join(stacksPath, file), 'utf-8');
        const cleanContent = stripFrontmatter(content).trim();
        const stackName = file.replace('.md', '').toUpperCase();
        if (cleanContent) {
          const budgetLimit = toNumber(stackBudgets[file.replace('.md', '')]);
          const trimmed = trimText(cleanContent, budgetLimit);
          instructions.push(`\n## Stack: ${stackName}\n\n${trimmed}`);
        }
      }
    });
  }
  
  // Montar conteúdo final
  const finalContent = applyBudget(header, instructions, maxChars);
  
  return finalContent;
}

module.exports = { build };
