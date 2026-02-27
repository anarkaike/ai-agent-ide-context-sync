const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * MCP Command - Manage MCP Servers and Tool Curation
 */
const mcpCommand = async (args = []) => {
  const subCommand = args[0] || 'status';
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
        "n": {
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
    const filter = args[1]; // e.g., "users" or "contacts"
    if (!filter) {
      console.log('🔍 Usage: ai-agent-sync mcp curate <filter_keyword>');
      return;
    }

    console.log(`🎯 Curating tools for: ${filter}...`);
    
    if (!fs.existsSync(traeMcpPath)) {
      console.error('❌ Trae MCP config not found.');
      return;
    }

    let mcpConfig = JSON.parse(fs.readFileSync(traeMcpPath, 'utf-8'));
    if (!mcpConfig.mcpServers || !mcpConfig.mcpServers.n) {
      console.error('❌ NocoBase MCP (server "n") not found in config.');
      return;
    }

    // Update args to include filter
    // Note: openapi-mcp-server supports --tag or --resource
    const currentArgs = mcpConfig.mcpServers.n.args;
    const newArgs = currentArgs.filter(a => !a.startsWith('--resource') && !a.includes(filter));
    
    // Simple curation: filter by resource path prefix
    newArgs.push('--resource');
    newArgs.push(`/${filter}`);

    mcpConfig.mcpServers.n.args = newArgs;
    fs.writeFileSync(traeMcpPath, JSON.stringify(mcpConfig, null, 2), 'utf-8');
    console.log(`✅ Tools curated! Trae will now only load tools for /${filter}`);
    return;
  }

  if (subCommand === 'list-collections') {
    if (!fs.existsSync(specPath)) {
      console.error('❌ Spec not found');
      return;
    }
    const spec = JSON.parse(fs.readFileSync(specPath, 'utf-8'));
    const paths = Object.keys(spec.paths || {});
    const collections = new Set();
    paths.forEach(p => {
      const match = p.match(/^\/([a-zA-Z0-9_-]+)/);
      if (match && !match[1].startsWith('$')) collections.add(match[1]);
    });
    console.log('📦 NocoBase Collections available for curation:');
    Array.from(collections).sort().forEach(c => console.log(`- ${c}`));
    return;
  }

  if (subCommand === 'search-tools') {
    const keyword = args[1];
    if (!keyword) {
      console.log('🔍 Usage: ai-agent-sync mcp search-tools <keyword>');
      return;
    }
    if (!fs.existsSync(specPath)) {
      console.error('❌ Spec not found');
      return;
    }
    const spec = JSON.parse(fs.readFileSync(specPath, 'utf-8'));
    console.log(`🔎 Searching for tools matching "${keyword}"...`);
    const results = [];
    if (spec.paths) {
      Object.entries(spec.paths).forEach(([p, methods]) => {
        if (p.toLowerCase().includes(keyword.toLowerCase())) {
          Object.keys(methods).forEach(m => results.push(`${m.toUpperCase()} ${p}`));
        }
      });
    }
    if (results.length === 0) console.log('No tools found.');
    else results.slice(0, 20).forEach(r => console.log(`- ${r}`));
    if (results.length > 20) console.log(`... and ${results.length - 20} more.`);
    return;
  }

  if (subCommand === 'auto-curate') {
    const projectRoot = process.cwd();
    const wsPath = path.join(projectRoot, '.ai-workspace');
    const focusPath = path.join(wsPath, 'current-focus.json');
    
    if (fs.existsSync(focusPath)) {
      const focus = JSON.parse(fs.readFileSync(focusPath, 'utf-8'));
      if (focus.collection) {
        console.log(`🤖 Auto-curating for focus: ${focus.collection}`);
        return mcpCommand(['curate', focus.collection]);
      }
    }
    // Default: Reset to all if no focus
    console.log('🔄 No specific focus detected. Resetting MCP tools...');
    return mcpCommand(['setup']);
  }

  if (subCommand === 'focus') {
    const collection = args[1];
    const projectRoot = process.cwd();
    const wsPath = path.join(projectRoot, '.ai-workspace');
    const focusPath = path.join(wsPath, 'current-focus.json');

    if (!collection) {
      if (fs.existsSync(focusPath)) fs.unlinkSync(focusPath);
      console.log('🧹 Focus cleared.');
    } else {
      const focus = { collection, timestamp: new Date().toISOString() };
      fs.writeFileSync(focusPath, JSON.stringify(focus, null, 2), 'utf-8');
      console.log(`🎯 Focus set to: ${collection}`);
    }
    return mcpCommand(['auto-curate']);
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
