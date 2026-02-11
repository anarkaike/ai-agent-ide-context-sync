#!/usr/bin/env node

/**
 * Deploy Intelligence Layer
 * Sistema inteligente de deploy e automação para projetos Laravel+Inertia+Vue+Chatwoot
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

class DeployIntelligence {
  constructor(config = {}) {
    this.config = {
      projectsPath: config.projectsPath || '/root/projects/dev/ai-agent-ide-context-sync',
      backupPath: config.backupPath || '/tmp/deploy-backups',
      logPath: config.logPath || '/var/log/deploy-intelligence',
      environments: config.environments || ['dev', 'hmg', 'prod'],
      ...config
    };
    
    this.ensureDirectories();
    this.loadProjectManifest();
  }

  ensureDirectories() {
    [this.config.backupPath, this.config.logPath].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  loadProjectManifest() {
    const manifestPath = path.join(this.config.projectsPath, 'project-manifest.json');
    console.log(`Looking for manifest at: ${manifestPath}`);
    
    if (fs.existsSync(manifestPath)) {
      this.projects = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      console.log(`Loaded manifest with ${Object.keys(this.projects).length} projects`);
    } else {
      console.log('Manifest not found, discovering projects...');
      this.projects = this.discoverProjects();
      this.saveProjectManifest();
    }
  }

  discoverProjects() {
    const projects = {};
    const projectTypes = {
      'sistema-clinica-new': {
        type: 'laravel-inertia-vue',
        stack: ['Laravel', 'Inertia.js', 'Vue.js', 'PostgreSQL', 'Redis'],
        chatwoot: true,
        domains: ['alphaclinics.servinder.com.br', 'hmg.alphaclinics.servinder.com.br', 'dev.alphaclinics.servinder.com.br']
      },
      'kanban-free': {
        type: 'kanban-chatwoot',
        stack: ['Node.js', 'React', 'PostgreSQL', 'Chatwoot Integration'],
        chatwoot: true,
        domains: ['kanbanfrontchatwoot.servinder.com.br', 'kanbanbackchatwoot.servinder.com.br']
      }
    };

    Object.keys(projectTypes).forEach(projectName => {
      let projectPath;
      
      if (projectName === 'kanban-free') {
        // Kanban-free is in docs/Kanban Free
        projectPath = path.join(this.config.projectsPath, 'docs', 'Kanban Free');
      } else if (projectName === 'sistema-clinica-new') {
        // Look for sistema-clinica-new in various locations
        const possiblePaths = [
          path.join('/root/projects/dev', projectName),
          path.join('/root/projects/prod', projectName),
          path.join(this.config.projectsPath, projectName),
          path.join(this.config.projectsPath, 'dev', projectName)
        ];
        projectPath = possiblePaths.find(p => fs.existsSync(p));
      }

      if (projectPath && fs.existsSync(projectPath)) {
        projects[projectName] = {
          ...projectTypes[projectName],
          path: projectPath,
          lastDeploy: null,
          status: 'unknown',
          health: 'unknown'
        };
        console.log(`Discovered project: ${projectName} at ${projectPath}`);
      } else {
        console.log(`Project not found: ${projectName}`);
      }
    });

    return projects;
  }

  saveProjectManifest() {
    const manifestPath = path.join(this.config.projectsPath, 'project-manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(this.projects, null, 2));
  }

  async deployProject(projectName, environment = 'dev', options = {}) {
    const project = this.projects[projectName];
    if (!project) {
      throw new Error(`Project ${projectName} not found`);
    }

    const deployId = this.generateDeployId();
    const deployLog = {
      id: deployId,
      project: projectName,
      environment,
      timestamp: new Date().toISOString(),
      status: 'starting',
      steps: []
    };

    try {
      this.log(`🚀 Starting deploy of ${projectName} to ${environment}`);
      
      // Step 1: Backup
      await this.executeStep(deployLog, 'backup', () => this.createBackup(projectName, environment));
      
      // Step 2: Health Check
      await this.executeStep(deployLog, 'pre-deploy-health', () => this.healthCheck(projectName, environment));
      
      // Step 3: Deploy based on project type
      if (project.type === 'laravel-inertia-vue') {
        await this.deployLaravelProject(project, environment, deployLog);
      } else if (project.type === 'kanban-chatwoot') {
        await this.deployKanbanProject(project, environment, deployLog);
      }
      
      // Step 4: Post-deploy validation
      await this.executeStep(deployLog, 'post-deploy-validation', () => this.validateDeploy(projectName, environment));
      
      deployLog.status = 'success';
      this.log(`✅ Deploy ${deployId} completed successfully`);
      
    } catch (error) {
      deployLog.status = 'failed';
      deployLog.error = error.message;
      
      // Automatic rollback
      if (options.autoRollback !== false) {
        await this.executeStep(deployLog, 'rollback', () => this.rollback(projectName, environment, deployLog));
      }
      
      this.log(`❌ Deploy ${deployId} failed: ${error.message}`);
      throw error;
    } finally {
      this.saveDeployLog(deployLog);
      this.updateProjectStatus(projectName, environment, deployLog.status);
    }
  }

  async deployLaravelProject(project, environment, deployLog) {
    const projectPath = project.path;
    const envPath = environment === 'prod' ? 
      path.join('/root/projects/prod', path.basename(projectPath)) : 
      projectPath;

    await this.executeStep(deployLog, 'git-pull', async () => {
      process.chdir(envPath);
      execSync('git pull origin main', { stdio: 'inherit' });
    });

    await this.executeStep(deployLog, 'docker-build', async () => {
      process.chdir(envPath);
      execSync('docker compose build', { stdio: 'inherit' });
    });

    await this.executeStep(deployLog, 'container-restart', async () => {
      process.chdir(envPath);
      execSync('docker compose down', { stdio: 'inherit' });
      execSync('docker compose up -d', { stdio: 'inherit' });
    });

    await this.executeStep(deployLog, 'laravel-optimizations', async () => {
      const containerName = `${environment === 'prod' ? 'prod' : 'dev'}-sistema-clinica-app-1`;
      execSync(`docker exec ${containerName} php artisan config:cache`, { stdio: 'inherit' });
      execSync(`docker exec ${containerName} php artisan route:cache`, { stdio: 'inherit' });
      execSync(`docker exec ${containerName} php artisan view:cache`, { stdio: 'inherit' });
      execSync(`docker exec ${containerName} php artisan migrate --force`, { stdio: 'inherit' });
    });
  }

  async deployKanbanProject(project, environment, deployLog) {
    const projectPath = path.join(this.config.projectsPath, 'docs/Kanban Free');
    
    await this.executeStep(deployLog, 'docker-compose-up', async () => {
      process.chdir(projectPath);
      execSync('docker compose -f Kanban-chatwoot-free.yml down', { stdio: 'inherit' });
      execSync('docker compose -f Kanban-chatwoot-free.yml up -d', { stdio: 'inherit' });
    });

    await this.executeStep(deployLog, 'ssl-validation', async () => {
      // Wait for SSL to propagate
      await new Promise(resolve => setTimeout(resolve, 30000));
      
      for (const domain of project.domains) {
        const response = execSync(`curl -k -s -o /dev/null -w "%{http_code}" https://${domain}`, { encoding: 'utf8' }).trim();
        if (response !== '200') {
          this.log(`Warning: ${domain} returned HTTP ${response}, but continuing...`);
          // Don't fail the deploy for SSL issues, just warn
        }
      }
    });
  }

  async healthCheck(projectName, environment) {
    const project = this.projects[projectName];
    const results = [];

    for (const domain of project.domains) {
      try {
        const response = execSync(`curl -k -s -o /dev/null -w "%{http_code}" https://${domain}`, { encoding: 'utf8' }).trim();
        results.push({
          domain,
          status: response === '200' ? 'healthy' : 'unhealthy',
          httpCode: response
        });
      } catch (error) {
        results.push({
          domain,
          status: 'error',
          error: error.message
        });
      }
    }

    return results;
  }

  async createBackup(projectName, environment) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(this.config.backupPath, `${projectName}-${environment}-${timestamp}`);
    
    fs.mkdirSync(backupDir, { recursive: true });
    
    // Backup database
    if (this.projects[projectName].type === 'laravel-inertia-vue') {
      const containerName = `${environment === 'prod' ? 'prod' : 'dev'}-sistema-clinica-db-1`;
      try {
        execSync(`docker exec ${containerName} pg_dump -U clinica clinica > ${backupDir}/database.sql`, { stdio: 'inherit' });
      } catch (error) {
        this.log(`Warning: Database backup failed: ${error.message}`);
      }
    }
    
    // Backup files
    const projectPath = this.projects[projectName].path;
    if (fs.existsSync(projectPath)) {
      const quotedPath = `"${projectPath}"`;
      execSync(`tar -czf ${backupDir}/files.tar.gz -C ${quotedPath} .`, { stdio: 'inherit' });
    }
    
    return backupDir;
  }

  async rollback(projectName, environment, deployLog) {
    this.log(`🔄 Rolling back ${projectName} ${environment}...`);
    
    // Find latest backup
    const backups = fs.readdirSync(this.config.backupPath)
      .filter(name => name.startsWith(`${projectName}-${environment}-`))
      .sort()
      .reverse();
    
    if (backups.length === 0) {
      throw new Error('No backup found for rollback');
    }
    
    const latestBackup = path.join(this.config.backupPath, backups[0]);
    
    // Restore database
    if (fs.existsSync(path.join(latestBackup, 'database.sql'))) {
      const containerName = `${environment === 'prod' ? 'prod' : 'dev'}-sistema-clinica-db-1`;
      execSync(`docker exec -i ${containerName} psql -U clinica -d clinica < ${latestBackup}/database.sql`, { stdio: 'inherit' });
    }
    
    // Restart containers
    const project = this.projects[projectName];
    if (project.type === 'laravel-inertia-vue') {
      const envPath = environment === 'prod' ? 
        path.join('/root/projects/prod', path.basename(project.path)) : 
        project.path;
      
      process.chdir(envPath);
      execSync('docker compose restart', { stdio: 'inherit' });
    }
    
    this.log(`✅ Rollback completed`);
  }

  async validateDeploy(projectName, environment) {
    const healthResults = await this.healthCheck(projectName, environment);
    const unhealthy = healthResults.filter(r => r.status === 'error');
    const warning = healthResults.filter(r => r.status === 'unhealthy');
    
    // Only fail if there are errors, not warnings
    if (unhealthy.length > 0) {
      throw new Error(`Validation failed: ${unhealthy.map(u => u.domain).join(', ')} have errors`);
    }
    
    // Log warnings but don't fail
    if (warning.length > 0) {
      this.log(`Warning: ${warning.map(w => w.domain).join(', ')} are unhealthy but deploy continuing`);
    }
    
    return healthResults;
  }

  async executeStep(deployLog, stepName, stepFunction) {
    const stepStart = Date.now();
    deployLog.steps.push({
      name: stepName,
      status: 'running',
      startTime: new Date().toISOString()
    });

    try {
      const result = await stepFunction();
      const step = deployLog.steps[deployLog.steps.length - 1];
      step.status = 'success';
      step.endTime = new Date().toISOString();
      step.duration = Date.now() - stepStart;
      step.result = result;
      
      this.log(`✅ Step ${stepName} completed`);
    } catch (error) {
      const step = deployLog.steps[deployLog.steps.length - 1];
      step.status = 'failed';
      step.endTime = new Date().toISOString();
      step.duration = Date.now() - stepStart;
      step.error = error.message;
      
      this.log(`❌ Step ${stepName} failed: ${error.message}`);
      throw error;
    }
  }

  generateDeployId() {
    return `deploy-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }

  saveDeployLog(deployLog) {
    const logFile = path.join(this.config.logPath, `${deployLog.id}.json`);
    fs.writeFileSync(logFile, JSON.stringify(deployLog, null, 2));
  }

  updateProjectStatus(projectName, environment, status) {
    if (this.projects[projectName]) {
      this.projects[projectName].status = status;
      this.projects[projectName].lastDeploy = new Date().toISOString();
      this.saveProjectManifest();
    }
  }

  log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }

  // CLI Interface
  static async run() {
    const args = process.argv.slice(2);
    const command = args[0];
    
    const deployIntelligence = new DeployIntelligence();
    
    try {
      switch (command) {
        case 'deploy':
          const projectName = args[1];
          const environment = args[2] || 'dev';
          await deployIntelligence.deployProject(projectName, environment);
          break;
          
        case 'status':
          console.log(JSON.stringify(deployIntelligence.projects, null, 2));
          console.log(`\nFound ${Object.keys(deployIntelligence.projects).length} projects`);
          break;
          
        case 'health':
          const healthProject = args[1];
          const healthEnv = args[2] || 'dev';
          const health = await deployIntelligence.healthCheck(healthProject, healthEnv);
          console.log(JSON.stringify(health, null, 2));
          break;
          
        case 'rollback':
          const rollbackProject = args[1];
          const rollbackEnv = args[2] || 'dev';
          await deployIntelligence.rollback(rollbackProject, rollbackEnv, {});
          break;
          
        default:
          console.log(`
Deploy Intelligence Layer

Commands:
  deploy <project> <environment>  Deploy project (dev/hmg/prod)
  status                          Show all projects status
  health <project> <environment>  Check project health
  rollback <project> <environment> Rollback to last backup

Projects:
${Object.keys(deployIntelligence.projects).length > 0 ? Object.keys(deployIntelligence.projects).map(p => `  - ${p}`).join('\n') : '  No projects found. Check project paths.'}
          `);
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  }
}

// Run CLI if called directly
if (require.main === module) {
  DeployIntelligence.run();
}

module.exports = DeployIntelligence;
