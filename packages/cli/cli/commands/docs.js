const fs = require('fs');
const path = require('path');

// Colors for logging
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const log = (msg, color = 'reset') => {
  console.log(`${colors[color] || colors.reset}${msg}${colors.reset}`);
};

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    return true;
  }
  return false;
};

const getTemplateContent = (templateName, modulesPath) => {
  const templatePath = path.join(modulesPath, 'templates', 'assets', templateName);
  if (fs.existsSync(templatePath)) {
    return fs.readFileSync(templatePath, 'utf-8');
  }
  return `# ${templateName}\n\n(Template not found)`;
};

const writeFileSafe = (filePath, content) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  }
  return false;
};

module.exports = async (args = []) => {
  const projectRoot = process.cwd();
  // We assume this file is in packages/cli/cli/commands/docs.js
  // Modules are in packages/cli/modules
  // So we go up: ../../modules
  const cliRoot = path.resolve(__dirname, '../../');
  const modulesPath = path.join(cliRoot, 'modules');
  const recipesPath = path.join(modulesPath, 'docs', 'recipes');

  log('\n=== 📚 Auto-Docs Generator ===\n', 'bright');

  // 1. Determine Recipe
  let recipeId = args[0];
  const configPath = path.join(projectRoot, 'docs-config.json');
  
  if (!recipeId && fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (config.recipe) {
        recipeId = config.recipe;
        log(`📖 Recipe lida do config: ${recipeId}`, 'cyan');
      }
    } catch (e) {
      log(`⚠️ Erro ao ler docs-config.json: ${e.message}`, 'yellow');
    }
  }

  if (!recipeId) {
    recipeId = 'fullstack';
    log(`ℹ️ Nenhuma recipe informada. Usando default: ${recipeId}`, 'dim');
  }

  // 2. Load Recipe
  const recipeFile = path.join(recipesPath, `recipe-${recipeId}.json`);
  if (!fs.existsSync(recipeFile)) {
    log(`❌ Recipe não encontrada: ${recipeId}`, 'red');
    log(`   Caminho tentado: ${recipeFile}`, 'dim');
    log('   Recipes disponíveis: backend, frontend, fullstack', 'dim');
    return;
  }

  let recipe;
  try {
    recipe = JSON.parse(fs.readFileSync(recipeFile, 'utf-8'));
  } catch (e) {
    log(`❌ Erro ao parsear recipe: ${e.message}`, 'red');
    return;
  }

  log(`🏗️  Construindo estrutura para: ${recipe.description}`, 'green');

  const docsRoot = path.join(projectRoot, 'docs');
  ensureDir(docsRoot);

  let createdDirs = 0;
  let createdFiles = 0;

  // 3. Process Structure (Folders)
  if (recipe.structure) {
    for (const folder of recipe.structure) {
      const folderPath = path.join(docsRoot, folder.path);
      if (ensureDir(folderPath)) {
        createdDirs++;
      }

      if (folder.readmeTemplate) {
        const readmePath = path.join(folderPath, 'README.md');
        const content = getTemplateContent(folder.readmeTemplate, modulesPath);
        if (writeFileSafe(readmePath, content)) {
          createdFiles++;
        }
      }
    }
  }

  // 4. Process Files
  if (recipe.files) {
    for (const file of recipe.files) {
      const filePath = path.join(docsRoot, file.path);
      const dirPath = path.dirname(filePath);
      ensureDir(dirPath);

      if (file.template) {
        const content = getTemplateContent(file.template, modulesPath);
        if (writeFileSafe(filePath, content)) {
          createdFiles++;
        }
      }
    }
  }

  // 5. Create Config if not exists
  if (!fs.existsSync(configPath)) {
    const configContent = {
      recipe: recipeId,
      mode: "update",
      depth: "standard",
      readmePolicy: "all-folders",
      language: "pt-BR",
      linkPolicy: "strict",
      outputDir: "docs"
    };
    fs.writeFileSync(configPath, JSON.stringify(configContent, null, 2), 'utf-8');
    log('⚙️  Arquivo docs-config.json criado.', 'cyan');
  }

  log('\n✅ Docs scaffolding concluído!', 'green');
  log(`   Pastas criadas: ${createdDirs}`);
  log(`   Arquivos criados: ${createdFiles}`);
  log(`\n👉 Próximo passo: Explore a pasta /docs e preencha os READMEs.\n`, 'magenta');
};
