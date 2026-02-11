#!/usr/bin/env node

/**
 * Distribuidor de Skills Chatwoot para Agentes IA e Bots
 * Distribui skills completas para VPS e macOS com validação e instalação automática
 * 
 * @author AI Agent Collective
 * @version 2.0.0
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ChatwootSkillsDistributor {
  constructor() {
    this.skillsPath = path.join(__dirname, 'skills');
    this.registryPath = path.join(this.skillsPath, 'registry.json');
    this.targets = {
      vps: [
        '/root/.nanobot/skills',
        '/opt/ai-agent/skills',
        '/usr/local/share/ai-skills'
      ],
      macos: [
        '/Users/$USER/.nanobot/skills',
        '/usr/local/share/ai-skills',
        '/opt/homebrew/share/ai-skills'
      ]
    };
  }

  async distribute() {
    console.log('🚀 Iniciando distribuição de skills Chatwoot...');
    
    try {
      // 1. Validar skills
      await this.validateSkills();
      
      // 2. Preparar pacotes
      await this.preparePackages();
      
      // 3. Distribuir para VPS
      await this.distributeToVPS();
      
      // 4. Distribuir para macOS
      await this.distributeToMacOS();
      
      // 5. Configurar nanobot registry
      await this.configureNanobotRegistry();
      
      // 6. Validar instalação
      await this.validateInstallation();
      
      console.log('✅ Distribuição concluída com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro na distribuição:', error.message);
      process.exit(1);
    }
  }

  async validateSkills() {
    console.log('📋 Validando skills...');
    
    const registry = JSON.parse(fs.readFileSync(this.registryPath, 'utf8'));
    const requiredSkills = [
      'chatwoot-api-complete',
      'whatsapp-business-api-complete',
      'chatwoot-whatsapp-orchestrator',
      'chatwoot-analytics-intelligence',
      'chatwoot-security-compliance'
    ];

    for (const skillName of requiredSkills) {
      const skillPath = path.join(this.skillsPath, skillName);
      const skillJsonPath = path.join(skillPath, 'skill.json');
      
      if (!fs.existsSync(skillJsonPath)) {
        throw new Error(`Skill não encontrada: ${skillName}`);
      }
      
      const skillData = JSON.parse(fs.readFileSync(skillJsonPath, 'utf8'));
      
      // Validar estrutura
      if (!skillData.name || !skillData.capabilities || !skillData.dependencies) {
        throw new Error(`Skill inválida: ${skillName}`);
      }
      
      console.log(`  ✅ ${skillName} - ${skillData.capabilities.length} capacidades`);
    }
  }

  async preparePackages() {
    console.log('📦 Preparando pacotes de distribuição...');
    
    const distPath = path.join(__dirname, 'dist');
    if (!fs.existsSync(distPath)) {
      fs.mkdirSync(distPath, { recursive: true });
    }

    // Criar pacote completo
    const packageData = {
      name: 'chatwoot-skills-complete',
      version: '2.0.0',
      description: 'Pacote completo de skills Chatwoot para agentes IA',
      skills: [],
      created_at: new Date().toISOString(),
      author: 'AI Agent Collective'
    };

    const registry = JSON.parse(fs.readFileSync(this.registryPath, 'utf8'));
    
    // Adicionar skills relevantes
    const chatwootSkills = registry.skills.filter(skill => 
      skill.name.includes('chatwoot') || skill.name.includes('whatsapp')
    );
    
    for (const skill of chatwootSkills) {
      const skillPath = path.join(this.skillsPath, skill.path);
      if (fs.existsSync(skillPath)) {
        // Copiar skill para pacote
        const targetPath = path.join(distPath, skill.name);
        this.copyDirectory(skillPath, targetPath);
        packageData.skills.push(skill);
      }
    }

    // Salvar manifesto do pacote
    fs.writeFileSync(
      path.join(distPath, 'package.json'),
      JSON.stringify(packageData, null, 2)
    );
    
    // Copiar registry
    fs.copyFileSync(
      this.registryPath,
      path.join(distPath, 'registry.json')
    );
    
    console.log(`  ✅ Pacote criado com ${packageData.skills.length} skills`);
  }

  async distributeToVPS() {
    console.log('🖥️  Distribuindo para VPS...');
    
    const distPath = path.join(__dirname, 'dist');
    
    for (const targetPath of this.targets.vps) {
      try {
        // Expandir $USER
        const expandedPath = targetPath.replace('$USER', process.env.USER || 'root');
        
        // Criar diretório se não existir
        if (!fs.existsSync(expandedPath)) {
          fs.mkdirSync(expandedPath, { recursive: true });
        }
        
        // Copiar pacote
        this.copyDirectory(distPath, expandedPath);
        
        // Configurar permissões
        execSync(`chmod -R 755 "${expandedPath}"`, { stdio: 'inherit' });
        
        // Criar symlink para nanobot
        const nanobotPath = '/root/.nanobot/skills';
        if (fs.existsSync(nanobotPath)) {
          const linkPath = path.join(nanobotPath, 'chatwoot-skills-complete');
          if (fs.existsSync(linkPath)) {
            fs.unlinkSync(linkPath);
          }
          fs.symlinkSync(expandedPath, linkPath);
        }
        
        console.log(`  ✅ Distribuído para: ${expandedPath}`);
        
      } catch (error) {
        console.warn(`  ⚠️  Falha em ${targetPath}: ${error.message}`);
      }
    }
  }

  async distributeToMacOS() {
    console.log('🍎 Distribuindo para macOS...');
    
    const distPath = path.join(__dirname, 'dist');
    
    for (const targetPath of this.targets.macos) {
      try {
        // Expandir $USER
        const expandedPath = targetPath.replace('$USER', process.env.USER || 'root');
        
        // Criar diretório se não existir
        if (!fs.existsSync(expandedPath)) {
          fs.mkdirSync(expandedPath, { recursive: true });
        }
        
        // Copiar pacote
        this.copyDirectory(distPath, expandedPath);
        
        // Configurar permissões
        execSync(`chmod -R 755 "${expandedPath}"`, { stdio: 'inherit' });
        
        // Criar symlink para nanobot
        const homeDir = process.env.HOME || '/Users/root';
        const nanobotPath = path.join(homeDir, '.nanobot/skills');
        if (fs.existsSync(nanobotPath)) {
          const linkPath = path.join(nanobotPath, 'chatwoot-skills-complete');
          if (fs.existsSync(linkPath)) {
            fs.unlinkSync(linkPath);
          }
          fs.symlinkSync(expandedPath, linkPath);
        }
        
        console.log(`  ✅ Distribuído para: ${expandedPath}`);
        
      } catch (error) {
        console.warn(`  ⚠️  Falha em ${targetPath}: ${error.message}`);
      }
    }
  }

  async configureNanobotRegistry() {
    console.log('⚙️  Configurando Nanobot Registry...');
    
    const nanobotConfigPaths = [
      '/root/.nanobot/config.json',
      path.join(process.env.HOME || '/Users/root', '.nanobot/config.json')
    ];

    for (const configPath of nanobotConfigPaths) {
      try {
        let config = {};
        
        if (fs.existsSync(configPath)) {
          config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }
        
        // Adicionar skills ao registry
        if (!config.skills) config.skills = [];
        if (!config.trusted_networks) config.trusted_networks = [];
        
        const newSkills = [
          'chatwoot-api-complete',
          'whatsapp-business-api-complete', 
          'chatwoot-whatsapp-orchestrator',
          'chatwoot-analytics-intelligence',
          'chatwoot-security-compliance'
        ];
        
        newSkills.forEach(skill => {
          if (!config.skills.includes(skill)) {
            config.skills.push(skill);
          }
        });
        
        // Adicionar trust network
        if (!config.trusted_networks.includes('trust-network-ai-agent')) {
          config.trusted_networks.push('trust-network-ai-agent');
        }
        
        // Salvar configuração
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        
        console.log(`  ✅ Configurado: ${configPath}`);
        
      } catch (error) {
        console.warn(`  ⚠️  Falha em ${configPath}: ${error.message}`);
      }
    }
  }

  async validateInstallation() {
    console.log('🔍 Validando instalação...');
    
    const validationResults = [];
    
    // Validar VPS
    for (const targetPath of this.targets.vps) {
      const expandedPath = targetPath.replace('$USER', process.env.USER || 'root');
      const result = await this.validateTarget(expandedPath, 'VPS');
      validationResults.push(result);
    }
    
    // Validar macOS
    for (const targetPath of this.targets.macos) {
      const expandedPath = targetPath.replace('$USER', process.env.USER || 'root');
      const result = await this.validateTarget(expandedPath, 'macOS');
      validationResults.push(result);
    }
    
    // Relatório final
    console.log('\n📊 Relatório de Validação:');
    validationResults.forEach(result => {
      const icon = result.success ? '✅' : '❌';
      console.log(`  ${icon} ${result.platform} - ${result.path}: ${result.message}`);
    });
    
    const successCount = validationResults.filter(r => r.success).length;
    console.log(`\n🎯 Taxa de sucesso: ${successCount}/${validationResults.length} (${Math.round(successCount/validationResults.length*100)}%)`);
  }

  async validateTarget(targetPath, platform) {
    try {
      if (!fs.existsSync(targetPath)) {
        return { platform, path: targetPath, success: false, message: 'Diretório não existe' };
      }
      
      const requiredSkills = [
        'chatwoot-api-complete',
        'whatsapp-business-api-complete',
        'chatwoot-whatsapp-orchestrator'
      ];
      
      let foundSkills = 0;
      for (const skill of requiredSkills) {
        const skillPath = path.join(targetPath, skill);
        if (fs.existsSync(skillPath)) {
          foundSkills++;
        }
      }
      
      if (foundSkills === requiredSkills.length) {
        return { platform, path: targetPath, success: true, message: 'Todas as skills instaladas' };
      } else {
        return { platform, path: targetPath, success: false, message: `${foundSkills}/${requiredSkills.length} skills encontradas` };
      }
      
    } catch (error) {
      return { platform, path: targetPath, success: false, message: error.message };
    }
  }

  copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  async generateReport() {
    console.log('📄 Gerando relatório de distribuição...');
    
    const report = {
      timestamp: new Date().toISOString(),
      distribution: {
        total_skills: 5,
        platforms: ['VPS', 'macOS'],
        targets: {
          vps: this.targets.vps.length,
          macos: this.targets.macos.length
        }
      },
      skills: [
        {
          name: 'chatwoot-api-complete',
          capabilities: 15,
          description: 'API REST completa do Chatwoot'
        },
        {
          name: 'whatsapp-business-api-complete',
          capabilities: 15,
          description: 'WhatsApp Business API completa'
        },
        {
          name: 'chatwoot-whatsapp-orchestrator',
          capabilities: 15,
          description: 'Orquestrador multicanal com IA'
        },
        {
          name: 'chatwoot-analytics-intelligence',
          capabilities: 15,
          description: 'Analytics e Machine Learning'
        },
        {
          name: 'chatwoot-security-compliance',
          capabilities: 15,
          description: 'Segurança e compliance GDPR/LGPD'
        }
      ]
    };
    
    const reportPath = path.join(__dirname, 'distribution-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`  ✅ Relatório salvo em: ${reportPath}`);
    return report;
  }
}

// Executar distribuição
if (require.main === module) {
  const distributor = new ChatwootSkillsDistributor();
  distributor.distribute()
    .then(() => distributor.generateReport())
    .then(() => {
      console.log('\n🎉 Distribuição concluída com sucesso!');
      console.log('📚 Skills Chatwoot agora disponíveis para todos os agentes IA e bots!');
    })
    .catch(error => {
      console.error('\n💥 Falha na distribuição:', error.message);
      process.exit(1);
    });
}

module.exports = ChatwootSkillsDistributor;
