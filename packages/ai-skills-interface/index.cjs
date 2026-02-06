/**
 * AI Skills Interface - Main Entry Point
 * Transforma todos os recursos de interação do pacote em skills aprendíveis por IAs
 */

const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

class AISkillsInterface {
  constructor() {
    this.skillsRegistry = new Map();
    this.adaptersRegistry = new Map();
    this.trainersRegistry = new Map();
    this.skillsPath = path.join(__dirname, 'skills');
    this.adaptersPath = path.join(__dirname, 'adapters');
    this.trainersPath = path.join(__dirname, 'trainers');
  }

  /**
   * Inicializa a interface de skills
   */
  async initialize() {
    console.log('🤖 Inicializando AI Skills Interface...');
    
    await this.loadSkills();
    await this.loadAdapters();
    await this.loadTrainers();
    
    console.log('✅ AI Skills Interface inicializada!');
    return this.getSkillsSummary();
  }

  /**
   * Carrega todas as skills disponíveis
   */
  async loadSkills() {
    const skillFiles = glob.sync('*.cjs', { cwd: this.skillsPath });
    
    for (const skillFile of skillFiles) {
      try {
        const skillPath = path.join(this.skillsPath, skillFile);
        delete require.cache[require.resolve(skillPath)];
        const skill = require(skillPath);
        
        if (skill.validate && skill.validate()) {
          this.skillsRegistry.set(skill.name, skill);
          console.log('  ✅ Skill carregada: ' + skill.name);
        } else {
          console.log('  ⚠️ Skill inválida: ' + skillFile);
        }
      } catch (error) {
        console.log('  ❌ Erro ao carregar skill ' + skillFile + ': ' + error.message);
      }
    }
  }

  /**
   * Carrega todos os adaptadores de IDE
   */
  async loadAdapters() {
    const adapterFiles = glob.sync('*.js', { cwd: this.adaptersPath });
    
    for (const adapterFile of adapterFiles) {
      try {
        const adapterPath = path.join(this.adaptersPath, adapterFile);
        const adapter = require(adapterPath);
        
        this.adaptersRegistry.set(adapter.name, adapter);
        console.log('  ✅ Adaptador carregado: ' + adapter.name);
      } catch (error) {
        console.log('  ❌ Erro ao carregar adaptador ' + adapterFile + ': ' + error.message);
      }
    }
  }

  /**
   * Carrega todos os treinadores
   */
  async loadTrainers() {
    const trainerFiles = glob.sync('*.js', { cwd: this.trainersPath });
    
    for (const trainerFile of trainerFiles) {
      try {
        const trainerPath = path.join(this.trainersPath, trainerFile);
        const trainer = require(trainerPath);
        
        this.trainersRegistry.set(trainer.name, trainer);
        console.log('  ✅ Treinador carregado: ' + trainer.name);
      } catch (error) {
        console.log('  ❌ Erro ao carregar treinador ' + trainerFile + ': ' + error.message);
      }
    }
  }

  /**
   * Obtém resumo de todas as skills
   */
  getSkillsSummary() {
    const summary = {
      total: this.skillsRegistry.size,
      skills: Array.from(this.skillsRegistry.keys()),
      adapters: Array.from(this.adaptersRegistry.keys()),
      trainers: Array.from(this.trainersRegistry.keys()),
      categories: this.categorizeSkills()
    };
    
    return summary;
  }

  /**
   * Categoriza as skills por tipo
   */
  categorizeSkills() {
    const categories = {
      'ide-integration': [],
      'context-management': [],
      'documentation': [],
      'automation': [],
      'communication': [],
      'development': []
    };

    for (const [name, skill] of this.skillsRegistry) {
      const category = skill.category || 'development';
      if (categories[category]) {
        categories[category].push(name);
      }
    }

    return categories;
  }

  /**
   * Exporta todas as skills para diferentes formatos
   */
  async exportSkills(format = 'json') {
    const skills = {};
    
    for (const [name, skill] of this.skillsRegistry) {
      skills[name] = {
        name: skill.name,
        description: skill.description,
        category: skill.category,
        capabilities: skill.capabilities || [],
        examples: skill.examples || [],
        adapters: skill.adapters || [],
        metadata: skill.metadata || {}
      };
    }

    const outputPath = path.join(__dirname, 'exported-skills.' + format);
    
    switch (format) {
      case 'json':
        await fs.writeJson(outputPath, skills, { spaces: 2 });
        break;
      case 'yaml':
        const yaml = require('js-yaml');
        await fs.writeFile(outputPath, yaml.dump(skills));
        break;
      default:
        throw new Error('Formato não suportado: ' + format);
    }

    console.log('📦 Skills exportadas para: ' + outputPath);
    return outputPath;
  }

  /**
   * Treina uma skill específica
   */
  async trainSkill(skillName, trainingData = {}) {
    const skill = this.skillsRegistry.get(skillName);
    if (!skill) {
      throw new Error('Skill não encontrada: ' + skillName);
    }

    const trainer = this.trainersRegistry.get(skill.trainer || 'default');
    if (!trainer) {
      throw new Error('Treinador não encontrado: ' + skill.trainer);
    }

    console.log('🎯 Treinando skill: ' + skillName);
    
    const result = await trainer.train(skill, trainingData);
    
    console.log('✅ Skill treinada: ' + skillName);
    return result;
  }

  /**
   * Lista todas as skills disponíveis
   */
  listSkills() {
    const skills = [];
    
    for (const [name, skill] of this.skillsRegistry) {
      skills.push({
        name,
        description: skill.description,
        category: skill.category,
        capabilities: skill.capabilities || []
      });
    }

    return skills;
  }

  /**
   * Obtém uma skill específica
   */
  getSkill(name) {
    return this.skillsRegistry.get(name);
  }

  /**
   * Valida todas as skills
   */
  validateSkills() {
    const results = {
      valid: [],
      invalid: [],
      total: this.skillsRegistry.size
    };

    for (const [name, skill] of this.skillsRegistry) {
      try {
        if (skill.validate && skill.validate()) {
          results.valid.push(name);
        } else {
          results.invalid.push({ name, error: 'Skill inválida' });
        }
      } catch (error) {
        results.invalid.push({ name, error: error.message });
      }
    }

    return results;
  }
}

module.exports = AISkillsInterface;
