const fs = require('fs');
const path = require('path');
const os = require('os');

const getRegistry = () => {
    const registryPath = path.join(os.homedir(), '.ai-doc', 'swarm', 'registry.json');
    if (!fs.existsSync(registryPath)) return [];
    try {
        return JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    } catch (e) {
        return [];
    }
};

const getIdentity = (wsPath) => {
    try {
        const identityPath = path.join(wsPath, '.ai-workspace', 'identity.json');
        if (fs.existsSync(identityPath)) {
            return JSON.parse(fs.readFileSync(identityPath, 'utf8'));
        }
        // Fallback to project name
        return { id: path.basename(wsPath) };
    } catch (e) {
        return { id: 'unknown' };
    }
};

const delegate = async (args, currentWsPath) => {
    if (args.length < 2) {
        console.log('❌ Usage: ai-doc swarm delegate <agent-id> "<message>"');
        return;
    }

    const targetId = args[0];
    const message = args.slice(1).join(' '); // Rejoin in case of spaces, though quotes handle it
    
    console.log(`📡 Delegating to agent [${targetId}]...`);

    const registry = getRegistry();
    const targetAgent = registry.find(a => a.id === targetId || a.name === targetId);

    if (!targetAgent) {
        console.log(`❌ Agent "${targetId}" not found in Swarm Registry.`);
        console.log('   Run "ai-doc agent start" in the target project to register it.');
        return;
    }

    // Determine target workspace path
    // Registry should contain 'path'
    const targetWsPath = targetAgent.path;
    const targetTasksDir = path.join(targetWsPath, '.ai-workspace', 'tasks', 'active');

    if (!fs.existsSync(targetTasksDir)) {
        console.log(`❌ Target agent tasks directory not found at: ${targetTasksDir}`);
        return;
    }

    // Get current identity
    const me = getIdentity(currentWsPath);
    
    // Create Task Payload
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const slug = message.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 30);
    const filename = `REMOTE-${me.id}--task-${date}-${slug}.md`;
    const filePath = path.join(targetTasksDir, filename);

    // We use the --auto flag equivalent logic by setting explicit fields
    // The target agent's CLI (task.js) will process this when it runs 'task start --auto' or similar, 
    // BUT here we are directly injecting the file.
    // To trigger the "Interception Logic" in the target agent, the target agent needs to consume this file.
    // The target agent's `task.js` logic we saw earlier was for *creating* the task via CLI command.
    // Here we are *injecting* a file. 
    // IF the target agent has a file watcher or a "mailbox" processor, it will pick this up.
    // OR we can invoke the target agent's CLI to create the task.
    
    // APPROACH 1: Direct File Injection (Simpler, works if target has watcher)
    // APPROACH 2: Invoke CLI in target cwd (More robust if CLI handles logic)
    
    // Let's use APPROACH 2: Invoke CLI. 
    // This ensures `task.js` logic (Security Interception) runs on the target side.
    
    const cp = require('child_process');
    const aiDocCmd = 'ai-doc'; // Assuming in PATH
    
    console.log(`🚀 Sending task to ${targetAgent.name}...`);
    
    try {
        // Construct command: ai-doc task start "message" --auto --from "my-id"
        const cmd = `${aiDocCmd} task start "${message}" --auto --from "${me.id}"`;
        
        // Execute in target CWD
        cp.exec(cmd, { cwd: targetAgent.path }, (error, stdout, stderr) => {
            if (error) {
                console.log(`❌ Failed to delegate: ${error.message}`);
                console.log(stderr);
                return;
            }
            console.log(stdout);
            console.log(`✅ Task successfully delegated to ${targetAgent.name}`);
        });
    } catch (e) {
        console.log(`❌ Error executing command: ${e.message}`);
    }
};

module.exports = async (args) => {
    const projectRoot = process.cwd();
    const subcommand = args[0];
    const params = args.slice(1);

    if (subcommand === 'delegate') {
        await delegate(params, projectRoot);
    } else {
        console.log('❌ Unknown subcommand. Use: delegate <agent-id> "<message>"');
    }
};

module.exports.delegate = delegate;
