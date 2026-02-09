#!/usr/bin/env node

/**
 * Script para construir e validar todas as skills
 */

const fs = require('fs-extra');
const path = require('path');

class SkillsBuilder {
  constructor() {
    this.skillsPath = path.join(__dirname, '../skills');
    this.outputPath = path.join(__dirname, '../dist');
    this.skills = [];
  }

  async build() {
    console.log('🔨 Construindo AI Skills...');
    
    try {
      await this.loadSkills();
      await this.validateSkills();
      await this.buildDistribution();
      await this.generateDocumentation();
      
      console.log('✅ Build concluído com sucesso!');
      this.printSummary();
    } catch (error) {
      console.error('❌ Erro no build: ' + error.message);
      process.exit(1);
    }
  }

  async loadSkills() {
    const skillFiles = fs.readdirSync(this.skillsPath).filter(f => f.endsWith('.cjs'));
    
    for (const skillFile of skillFiles) {
      try {
        const skillPath = path.join(this.skillsPath, skillFile);
        delete require.cache[require.resolve(skillPath)]; // Limpa cache
        const skill = require(skillPath);
        
        if (skill.validate && skill.validate()) {
          this.skills.push(skill);
          console.log('  ✅ ' + skill.name);
        } else {
          console.log('  ⚠️ ' + skillFile + ' - inválida');
        }
      } catch (error) {
        console.log('  ❌ ' + skillFile + ' - ' + error.message);
      }
    }
  }

  async validateSkills() {
    console.log('\n🔍 Validando skills...');
    
    const requiredFields = ['name', 'description', 'capabilities', 'examples', 'metadata'];
    let validSkills = 0;
    
    for (const skill of this.skills) {
      const missing = requiredFields.filter(field => !skill[field]);
      
      if (missing.length === 0) {
        validSkills++;
        console.log('  ✅ ' + skill.name + ' - válida');
      } else {
        console.log('  ❌ ' + skill.name + ' - campos faltando: ' + missing.join(', '));
      }
    }
    
    if (validSkills === 0) {
      throw new Error('Nenhuma skill válida encontrada');
    }
    
    console.log('\n📊 ' + validSkills + '/' + this.skills.length + ' skills válidas');
  }

  async buildDistribution() {
    console.log('\n📦 Construindo distribuição...');
    
    await fs.ensureDir(this.outputPath);
    
    // Build principal
    const buildData = {
      version: '1.0.0',
      buildAt: new Date().toISOString(),
      skills: this.skills.map(skill => ({
        name: skill.name,
        description: skill.description,
        category: skill.category,
        capabilities: skill.capabilities,
        examples: skill.examples,
        adapters: skill.adapters,
        metadata: skill.metadata
      }))
    };
    
    await fs.writeJson(path.join(this.outputPath, 'skills.json'), buildData, { spaces: 2 });
    
    // Build por categoria
    const categories = this.categorizeSkills();
    for (const [category, categorySkills] of Object.entries(categories)) {
      await fs.writeJson(
        path.join(this.outputPath, category + '-skills.json'),
        categorySkills,
        { spaces: 2 }
      );
    }
    
    console.log('  ✅ Build criado em ' + this.outputPath);
  }

  async generateDocumentation() {
    console.log('\n📚 Gerando documentação...');
    
    const docsPath = path.join(this.outputPath, 'docs');
    await fs.ensureDir(docsPath);
    
    // README principal
    const readme = this.generateMainReadme();
    await fs.writeFile(path.join(docsPath, 'README.md'), readme);
    
    // Documentação individual
    for (const skill of this.skills) {
      const skillDoc = this.generateSkillDocumentation(skill);
      await fs.writeFile(path.join(docsPath, skill.name + '.md'), skillDoc);
    }
    
    console.log('  ✅ Documentação gerada em ' + docsPath);
  }

  categorizeSkills() {
    const categories = {};
    
    for (const skill of this.skills) {
      const category = skill.category || 'general';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push({
        name: skill.name,
        description: skill.description,
        capabilities: skill.capabilities
      });
    }
    
    return categories;
  }

  generateMainReadme() {
    let readme = '# AI Skills Interface\n\n';
    readme += '## 🚀 Visão Geral\n\n';
    readme += 'Interface completa de skills de IA para automação e integração com IDEs.\n\n';
    readme += '## 📊 Skills Disponíveis\n\n';
    
    for (const skill of this.skills) {
      readme += '### ' + skill.name + '\n\n';
      readme += '**Descrição:** ' + skill.description + '\n\n';
      readme += '**Categoria:** ' + skill.category + '\n\n';
      readme += '**Capacidades:**\n';
      for (const cap of skill.capabilities) {
        readme += '- ' + cap + '\n';
      }
      readme += '\n**Exemplos:**\n';
      for (let i = 0; i < skill.examples.length; i++) {
        const ex = skill.examples[i];
        readme += (i + 1) + '. ' + ex.scenario + '\n';
        readme += '   `' + ex.code + '`\n';
        readme += '   ' + ex.description + '\n\n';
      }
      readme += '---\n\n';
    }
    
    readme += '## 🔧 Instalação\n\n';
    readme += '```bash\n';
    readme += 'npm install @ai-agent-ide-context-sync/ai-skills-interface\n';
    readme += '```\n\n';
    
    readme += '## 📖 Uso\n\n';
    readme += '```javascript\n';
    readme += 'const AISkillsInterface = require("@ai-agent-ide-context-sync/ai-skills-interface");\n\n';
    readme += 'const aiSkills = new AISkillsInterface();\n';
    readme += 'await aiSkills.initialize();\n\n';
    readme += '// Listar skills\n';
    readme += 'const skills = aiSkills.listSkills();\n\n';
    readme += '// Executar skill\n';
    readme += 'const result = await aiSkills.trainSkill("ide-integration", { action: "sync-context" });\n';
    readme += '```\n\n';
    
    readme += '## 📚 Documentação\n\n';
    readme += 'Veja a pasta `docs/` para documentação detalhada de cada skill.\n\n';
    readme += '---\n';
    readme += '**Versão:** 1.0.0\n';
    readme += '**Build:** ' + new Date().toISOString();
    
    return readme;
  }

  generateSkillDocumentation(skill) {
    let doc = '# ' + skill.name + '\n\n';
    doc += '## Descrição\n\n';
    doc += skill.description + '\n\n';
    doc += '## Categoria\n\n';
    doc += skill.category + '\n\n';
    doc += '## Capacidades\n\n';
    for (const cap of skill.capabilities) {
      doc += '- **' + cap + '**\n';
    }
    doc += '\n## Adaptadores Suportados\n\n';
    for (const adapter of skill.adapters) {
      doc += '- ' + adapter + '\n';
    }
    doc += '\n## Exemplos de Uso\n\n';
    for (let i = 0; i < skill.examples.length; i++) {
      const ex = skill.examples[i];
      doc += '### Exemplo ' + (i + 1) + ': ' + ex.scenario + '\n\n';
      doc += '```javascript\n';
      doc += ex.code + '\n';
      doc += '```\n\n';
      doc += ex.description + '\n\n';
    }
    doc += '## Metadados\n\n';
    doc += '```json\n';
    doc += JSON.stringify(skill.metadata, null, 2) + '\n';
    doc += '```\n\n';
    doc += '---\n';
    doc += '**Versão:** ' + skill.metadata.version + '\n';
    doc += '**Autor:** ' + skill.metadata.author;
    
    return doc;
  }

  printSummary() {
    console.log('\n📊 Resumo do Build:');
    console.log('  ✅ Skills: ' + this.skills.length);
    console.log('  ✅ Categorias: ' + Object.keys(this.categorizeSkills()).length);
    console.log('  ✅ Build: ' + this.outputPath);
    console.log('  ✅ Documentação: ' + path.join(this.outputPath, 'docs'));
  }
}

// Executa build
if (require.main === module) {
  const builder = new SkillsBuilder();
  builder.build().catch(console.error);
}

module.exports = SkillsBuilder;
