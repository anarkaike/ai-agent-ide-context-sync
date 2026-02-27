const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * MCP Command - Manage MCP Servers and Tool Curation
 */
const mcpCommand = async (args = []) => {
  const subCommand = (args[0] || 'status').toLowerCase();
  const traeMcpPath = path.join(os.homedir(), '.trae-server', 'data', 'Machine', 'mcp.json');
  const specPath = '/root/nocobase-spec.json';

  if (subCommand === 'setup') {
    console.log('🔧 Setting up NocoBase MCP for Trae...');
    
    if (!fs.existsSync(specPath)) {
      console.error('❌ OpenAPI Spec not found at /root/nocobase-spec.json');
      return;
    }

    const config = {
      mcpServers: {
        "nocobase": {
          "command": "npx",
          "args": [
            "-y",
            "@ivotoby/openapi-mcp-server",
            "--openapi-spec",
            specPath,
            "--api-base-url",
            "https://sys.servinder.com.br",
            "--headers",
            "Authorization:Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoicm9vdCIsImlhdCI6MTc3MjE5NTc3OSwiZXhwIjozMzMyOTc5NTc3OX0.qWH_U2Exe9v-qwY-Mbws3bx-fB97AVqkEjBX5gt1rMU,X-Role:root"
          ]
        }
      }
    };

    const dir = path.dirname(traeMcpPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(traeMcpPath, JSON.stringify(config, null, 2), 'utf-8');
    console.log(`✅ MCP config updated at ${traeMcpPath}`);
    return;
  }

  if (subCommand === 'curate') {
    const filter = args[1];
    if (!filter) {
      console.log('🔍 Usage: ai-agent-sync mcp curate <filter_keyword>');
      return;
    }

    if (!fs.existsSync(traeMcpPath)) {
      console.error('❌ Trae MCP config not found.');
      return;
    }

    let mcpConfig = JSON.parse(fs.readFileSync(traeMcpPath, 'utf-8'));
    if (!mcpConfig.mcpServers || !mcpConfig.mcpServers.nocobase) {
      console.error('❌ NocoBase MCP (server "nocobase") not found in config. Run "mcp setup" first.');
      return;
    }

    const currentArgs = mcpConfig.mcpServers.nocobase.args;
    const newArgs = currentArgs.filter(a => !a.startsWith('--resource'));
    
    newArgs.push('--resource');
    newArgs.push(`/${filter}`);

    mcpConfig.mcpServers.nocobase.args = newArgs;
    fs.writeFileSync(traeMcpPath, JSON.stringify(mcpConfig, null, 2), 'utf-8');
    console.log(`✅ Tools curated! Trae will now only load tools for /${filter}`);
    return;
  }

  if (subCommand === 'optimize-spec') {
    if (!fs.existsSync(specPath)) {
      console.error('❌ Spec not found');
      return;
    }
    console.log('⚡ Optimizing OpenAPI spec for MCP (shortening IDs)...');
    const spec = JSON.parse(fs.readFileSync(specPath, 'utf-8'));
    if (spec.paths) {
      for (const [pathStr, methods] of Object.entries(spec.paths)) {
        for (const [method, details] of Object.entries(methods)) {
          const p = pathStr.replace(/^\//, '').replace(/\{[a-zA-Z]+\}/g, 'X').replace(/[:/]/g, '_');
          details.operationId = `${method.toUpperCase()}_${p}`.substring(0, 50).replace(/_+/g, '_');
        }
      }
    }
    fs.writeFileSync(specPath, JSON.stringify(spec, null, 2), 'utf-8');
    console.log('✅ Spec optimized!');
    return;
  }

  if (subCommand === 'auto-curate') {
    const projectRoot = process.cwd();
    const wsPath = path.join(projectRoot, '.ai-workspace');
    const identityPath = path.join(wsPath, 'identity.json');
    
    if (fs.existsSync(identityPath)) {
      const identity = JSON.parse(fs.readFileSync(identityPath, 'utf-8'));
      if (identity.mcp_tools && Array.isArray(identity.mcp_tools)) {
        console.log(`🤖 Auto-curating tools for identity: ${identity.name}`);
        for (const tool of identity.mcp_tools) {
          const [prefix, resource] = tool.split(':');
          if (prefix === 'nocobase' && resource) {
            await mcpCommand(['curate', resource]);
          }
        }
        return;
      }
    }
    
    console.log('🔄 No identity focus detected. Resetting MCP tools...');
    return mcpCommand(['setup']);
  }

  if (subCommand === 'status') {
    console.log('📡 MCP Status:');
    if (fs.existsSync(traeMcpPath)) {
      const config = JSON.parse(fs.readFileSync(traeMcpPath, 'utf-8'));
      const servers = Object.keys(config.mcpServers || {});
      console.log(`- Config: ${traeMcpPath}`);
      console.log(`- Active Servers: ${servers.join(', ') || 'None'}`);
    } else {
      console.log('- Config: Not found');
    }
  }
};

module.exports = mcpCommand;
