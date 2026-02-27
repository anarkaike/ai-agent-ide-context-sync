const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/**
 * Identity Command - Manage Personas and Avatars
 */
const identityCommand = async (args = []) => {
  const subCommand = (args[0] || 'list').toLowerCase();
  const projectRoot = process.cwd();
  const wsPath = path.join(projectRoot, '.ai-workspace');
  const personasPath = path.join(wsPath, 'personas');

  if (!fs.existsSync(personasPath)) {
    fs.mkdirSync(personasPath, { recursive: true });
  }

  if (subCommand === 'list') {
    const personas = fs.readdirSync(personasPath).filter(f => f.endsWith('.md') || f.endsWith('.yaml'));
    console.log('\n🎭 Available Avatars (Personas):\n');
    if (personas.length === 0) {
      console.log('No personas found. Use "ai-agent-sync identity create <name>"');
      return;
    }
    personas.forEach(p => {
      const name = p.replace(/\.(md|yaml)$/, '');
      console.log(`- ${name}`);
    });
    return;
  }

  if (subCommand === 'create') {
    const name = args[1];
    if (!name) {
      console.error('❌ Usage: ai-agent-sync identity create <name>');
      return;
    }
    const filePath = path.join(personasPath, `${name}.yaml`);
    const content = {
      name,
      title: `${name} Avatar`,
      description: "Custom AI Persona",
      capabilities: ["general"],
      mcp_tools: ["n:users"],
      tone: "neutral",
      created_at: new Date().toISOString()
    };
    fs.writeFileSync(filePath, yaml.dump(content), 'utf-8');
    console.log(`✅ Avatar "${name}" created at ${filePath}`);
    return;
  }

  if (subCommand === 'select') {
    const name = args[1];
    if (!name) {
      console.log('🔍 Usage: ai-agent-sync identity select <name>');
      return;
    }
    const yamlPath = path.join(personasPath, `${name}.yaml`);
    let personaData = null;

    if (fs.existsSync(yamlPath)) {
      personaData = yaml.load(fs.readFileSync(yamlPath, 'utf-8'));
    } else {
      console.error(`❌ Persona "${name}" not found.`);
      return;
    }

    const identityPath = path.join(wsPath, 'identity.json');
    fs.writeFileSync(identityPath, JSON.stringify(personaData, null, 2), 'utf-8');
    console.log(`✨ Persona "${name}" selected!`);
    
    if (personaData.mcp_tools) {
      const mcpCmd = require('./mcp');
      for (const tool of personaData.mcp_tools) {
          const [prefix, resource] = tool.split(':');
          if (prefix === 'n' && resource) {
              await mcpCmd(['curate', resource]);
          }
      }
    }
    return;
  }
};

module.exports = identityCommand;
