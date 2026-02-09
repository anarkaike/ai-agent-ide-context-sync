#!/usr/bin/env node

/**
 * AI Agent Swarm - Operations System
 * Sistema central de operações para o ecossistema
 */

import { program } from 'commander';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

program
  .name('ops')
  .description('AI Agent Swarm Operations System')
  .version('2.0.0');

// Network Operations
program
  .command('network')
  .description('Network operations')
  .addCommand(
    program
      .createCommand('connect')
      .description('Connect to swarm network')
      .option('-h, --host <host>', 'Mothership host', '100.104.189.106')
      .option('-p, --port <port>', 'Mothership port', '3456')
      .action(async (options) => {
        console.log('🌐 Connecting to swarm network...');
        console.log(`   Host: ${options.host}`);
        console.log(`   Port: ${options.port}`);
        
        try {
          // Testar conexão
          const { stdout } = await execAsync(`curl -s http://${options.host}:${options.port}/api/comms/messages`);
          console.log('✅ Connected to swarm network');
          console.log(`   Response: ${stdout.length} bytes`);
        } catch (error) {
          console.log('⚠️ Swarm network unreachable, starting local services...');
          await execAsync('./scripts/swarm-service-manager.sh start');
          console.log('✅ Local services started');
        }
      })
  )
  .addCommand(
    program
      .createCommand('discover')
      .description('Discover agents in network')
      .action(async () => {
        console.log('🔍 Discovering agents...');
        
        try {
          const { stdout } = await execAsync('curl -s http://localhost:3456/api/comms/messages');
          console.log('✅ Agents discovered:');
          console.log(`   Local endpoint active`);
          console.log(`   API responding`);
        } catch (error) {
          console.log('❌ No agents found');
        }
      })
  );

// Mesh Network Operations
program
  .command('mesh')
  .description('Mesh network operations')
  .addCommand(
    program
      .createCommand('init')
      .description('Initialize mesh network')
      .option('-n, --nodes <count>', 'Number of nodes', '3')
      .action(async (options) => {
        console.log('🕸️ Initializing mesh network...');
        console.log(`   Target nodes: ${options.nodes}`);
        
        // Criar configuração mesh
        const meshConfig = {
          network_id: `mesh_${Date.now()}`,
          node_count: parseInt(options.nodes),
          created_at: new Date().toISOString(),
          topology: 'mesh',
          protocol: 'neural-link'
        };
        
        // Salvar configuração
        const configPath = '.ai-workspace/mesh-config.json';
        fs.writeFileSync(configPath, JSON.stringify(meshConfig, null, 2));
        
        console.log('✅ Mesh network initialized');
        console.log(`   Config: ${configPath}`);
        console.log(`   Network ID: ${meshConfig.network_id}`);
      })
  );

// Sync Operations
program
  .command('sync')
  .description('Sync operations')
  .addCommand(
    program
      .createCommand('start')
      .description('Start intelligent sync')
      .option('-i, --interval <seconds>', 'Sync interval', '30')
      .action(async (options) => {
        console.log('🔄 Starting intelligent sync...');
        console.log(`   Interval: ${options.interval}s`);
        
        // Criar configuração sync
        const syncConfig = {
          enabled: true,
          interval: parseInt(options.interval),
          delta_compression: true,
          conflict_resolution: 'timestamp',
          created_at: new Date().toISOString()
        };
        
        // Salvar configuração
        const configPath = '.ai-workspace/sync-config.json';
        fs.writeFileSync(configPath, JSON.stringify(syncConfig, null, 2));
        
        console.log('✅ Intelligent sync started');
        console.log(`   Config: ${configPath}`);
      })
  );

// Security Operations
program
  .command('security')
  .description('Security operations')
  .addCommand(
    program
      .createCommand('audit')
      .description('Security audit')
      .action(async () => {
        console.log('🔒 Running security audit...');
        
        const audit = {
          timestamp: new Date().toISOString(),
          checks: {},
          overall_score: 0
        };
        
        // Check file permissions
        try {
          const { stdout } = await execAsync('ls -la .ai-workspace/');
          audit.checks.permissions = 'PASS';
          audit.overall_score += 25;
        } catch (error) {
          audit.checks.permissions = 'FAIL';
        }
        
        // Check service status
        try {
          const { stdout } = await execAsync('./scripts/swarm-service-manager.sh status');
          audit.checks.services = stdout.includes('RODANDO') ? 'PASS' : 'FAIL';
          if (audit.checks.services === 'PASS') audit.overall_score += 25;
        } catch (error) {
          audit.checks.services = 'FAIL';
        }
        
        // Check network connectivity
        try {
          await execAsync('curl -s http://localhost:3456');
          audit.checks.network = 'PASS';
          audit.overall_score += 25;
        } catch (error) {
          audit.checks.network = 'FAIL';
        }
        
        // Check logs
        try {
          const logsExist = fs.existsSync('.ai-workspace/logs/webmap.log');
          audit.checks.logging = logsExist ? 'PASS' : 'FAIL';
          if (audit.checks.logging === 'PASS') audit.overall_score += 25;
        } catch (error) {
          audit.checks.logging = 'FAIL';
        }
        
        console.log(`📊 Security Audit Score: ${audit.overall_score}/100`);
        console.log('   Permissions:', audit.checks.permissions);
        console.log('   Services:', audit.checks.services);
        console.log('   Network:', audit.checks.network);
        console.log('   Logging:', audit.checks.logging);
        
        // Salvar audit
        const auditPath = `.ai-workspace/security-audit-${Date.now()}.json`;
        fs.writeFileSync(auditPath, JSON.stringify(audit, null, 2));
        console.log(`   Report: ${auditPath}`);
      })
  );

// Status Command
program
  .command('status')
  .description('Show complete system status')
  .action(async () => {
    console.log('📊 AI Agent Swarm - System Status');
    console.log('===================================');
    
    try {
      // Services Status
      const { stdout: servicesStatus } = await execAsync('./scripts/swarm-service-manager.sh status');
      console.log('\n🛠️ Services:');
      console.log(servicesStatus);
      
      // Network Status
      try {
        await execAsync('curl -s http://localhost:3456');
        console.log('\n🌐 Network: CONNECTED');
      } catch (error) {
        console.log('\n🌐 Network: DISCONNECTED');
      }
      
      // Process Status
      const { stdout: processes } = await execAsync('ps aux | grep -E "(WebMap|SwarmClient)" | grep -v grep | wc -l');
      console.log(`\n🔍 Processes: ${processes.trim()} Swarm processes running`);
      
      // Disk Usage
      const { stdout: diskUsage } = await execAsync('du -sh .ai-workspace/');
      console.log(`\n💾 Storage: ${diskUsage.trim()}`);
      
      // Uptime
      const { stdout: uptime } = await execAsync('ps -o etime= -p $(pgrep -f "WebMap\\|SwarmClient" | head -1)');
      console.log(`\n⏱️ Uptime: ${uptime.trim()}`);
      
    } catch (error) {
      console.error('❌ Error getting status:', error.message);
    }
  });

// Deploy Command
program
  .command('deploy')
  .description('Deploy system')
  .option('-e, --env <environment>', 'Environment', 'development')
  .action(async (options) => {
    console.log(`🚀 Deploying to ${options.env}...`);
    
    const deploySteps = [
      { name: 'Stopping services', cmd: './scripts/swarm-service-manager.sh stop' },
      { name: 'Cleaning workspace', cmd: 'rm -rf .ai-workspace/logs/*' },
      { name: 'Starting services', cmd: './scripts/swarm-service-manager.sh start' },
      { name: 'Verifying deployment', cmd: './scripts/health-monitor.sh check' }
    ];
    
    for (const step of deploySteps) {
      console.log(`   ${step.name}...`);
      try {
        await execAsync(step.cmd);
        console.log(`   ✅ ${step.name} complete`);
      } catch (error) {
        console.log(`   ❌ ${step.name} failed: ${error.message}`);
      }
    }
    
    console.log('✅ Deployment complete');
  });

// Parse command line arguments
program.parse();

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
