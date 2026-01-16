/**
 * Comando BUILD - Compila instruções para IDEs
 */

const fs = require('fs');
const path = require('path');

function build(kernelPath, wsPath, projectRoot) {
  const now = new Date().toISOString();
  
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
# ⚠️ NÃO EDITE MANUALMENTE - Use 'ai-doc build' para regenerar

`;

  // Coletar instruções dos módulos do kernel
  let instructions = [];
  
  const modulesPath = path.join(kernelPath, 'modules');
  const moduleOrder = ['core', 'identity', 'memory', 'tasks', 'analysis', 'responses'];
  
  moduleOrder.forEach(modName => {
    const modPath = path.join(modulesPath, modName);
    const instructionFile = path.join(modPath, 'instruction.md');
    
    if (fs.existsSync(instructionFile)) {
      const content = fs.readFileSync(instructionFile, 'utf-8');
      // Remover frontmatter se existir
      const cleanContent = content.replace(/^---[\s\S]*?---\n*/, '');
      instructions.push(`\n## Módulo: ${modName.toUpperCase()}\n\n${cleanContent}`);
    }
  });
  
  // Coletar stacks (Laravel, Vue, etc.)
  const stacksPath = path.join(modulesPath, 'integrations', 'stacks');
  if (fs.existsSync(stacksPath)) {
    fs.readdirSync(stacksPath).forEach(file => {
      if (file.endsWith('.md')) {
        const content = fs.readFileSync(path.join(stacksPath, file), 'utf-8');
        const cleanContent = content.replace(/^---[\s\S]*?---\n*/, '');
        const stackName = file.replace('.md', '').toUpperCase();
        instructions.push(`\n## Stack: ${stackName}\n\n${cleanContent}`);
      }
    });
  }
  
  // Montar conteúdo final
  const finalContent = header + instructions.join('\n\n---\n');
  
  return finalContent;
}

module.exports = { build };
