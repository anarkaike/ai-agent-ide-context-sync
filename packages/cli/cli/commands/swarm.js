const fs = require('fs');
const path = require('path');
const os = require('os');
const TaskManager = require('../../core/swarm/TaskManager');

const getRegistry = () => {
    const registryPath = process.env.AI_DOC_SWARM_REGISTRY || path.join(os.homedir(), '.ai-doc', 'swarm', 'registry.json');
    // console.log('DEBUG: Registry Path:', registryPath); 
    
    if (!fs.existsSync(registryPath)) {
        // console.log('DEBUG: Registry file not found');
        return [];
    }
    
    try {
        const content = fs.readFileSync(registryPath, 'utf8');
        // console.log('DEBUG: Registry Content:', content);
        return JSON.parse(content);
    } catch (e) {
        console.error('Error reading registry:', e.message);
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
    
    // 🔐 Security Handshake
    const SecurityKernel = require('../../core/swarm/SecurityKernel');
    const securityKernel = new SecurityKernel();
    
    // Resolve my security level
    let myLevel = 1;
    if (me.security_profile) {
        myLevel = securityKernel.resolveProfile(me.security_profile).level;
    }
    
    // Issue Token (Self-signed by the Swarm Authority/Kernel)
    const token = securityKernel.issueToken(me.id || me.name, myLevel);
    console.log(`🔐 Token Issued: ${token.substring(0, 8)}... (Level ${myLevel})`);

    // Create Task Payload
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const slug = message.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 30);
    
    // ... rest of the code ...
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
    
    const util = require('util');
    const exec = util.promisify(require('child_process').exec);
    
    // Resolve CLI path for dev/test environments if 'ai-doc' is not in PATH
    let aiDocCmd = 'ai-doc';
    const localCliPath = path.resolve(__dirname, '../ai-doc.js');
    if (fs.existsSync(localCliPath)) {
        // Use node to run the local script
        aiDocCmd = `node "${localCliPath}"`;
    }
    
    console.log(`🚀 Sending task to ${targetAgent.name}...`);
    
    try {
        // Construct command: ai-doc task start "message" --auto --from "my-id" --token "token"
        const cmd = `${aiDocCmd} task start "${message}" --auto --from "${me.id || me.name}" --token "${token}"`;
        
        // Execute in target CWD
        const { stdout, stderr } = await exec(cmd, { cwd: targetAgent.path });
        
        if (stderr) {
            console.log(stderr);
        }
        console.log(stdout);
        console.log(`✅ Task successfully delegated to ${targetAgent.name}`);
    } catch (e) {
        console.log(`❌ Error executing command: ${e.message}`);
        if (e.stdout) console.log(e.stdout);
        if (e.stderr) console.log(e.stderr);
    }
};

const map = () => {
            const registry = getRegistry();
            console.log('\n🌌 Swarm Existential Map (Observability)\n');
            
            if (registry.length === 0) {
                console.log('   (Void) No agents detected in the known universe.');
                return;
            }

            // Group by Team (Holon)
            const teams = { 'Freelancers': [] };
            
            registry.forEach(agent => {
                const caps = agent.capabilities || [];
                const agentTeams = caps
                    .filter(c => c.startsWith('TEAM:'))
                    .map(c => c.replace('TEAM:', ''));
                
                if (agentTeams.length === 0) {
                    teams['Freelancers'].push(agent);
                } else {
                    agentTeams.forEach(t => {
                        if (!teams[t]) teams[t] = [];
                        teams[t].push(agent);
                    });
                }
            });

            // Render by Team
            Object.keys(teams).forEach(team => {
                if (teams[team].length === 0) return;
                
                console.log(`\n🔷 HOLON: ${team}`);
                console.log(`${'AGENT ID'.padEnd(25)} | ${'ROLE'.padEnd(15)} | ${'SEC'.padEnd(4)} | ${'NET'.padEnd(10)} | ${'STATUS'.padEnd(15)} | ${'NEXT STEP'.padEnd(20)}`);
                console.log('-'.repeat(120));

                teams[team].forEach(agent => {
                    const id = (agent.id || 'unknown').substring(0, 24);
                    const caps = agent.capabilities || [];
                    const roles = caps
                        .filter(c => c.startsWith('ROLE:'))
                        .map(c => c.replace('ROLE:', ''))
                        .join(',') || 'Generalist';
                    const roleStr = roles.substring(0, 15);
                    const sec = (agent.security_level || '?').toString();
                    const net = (agent.network?.provider || 'LOCAL').substring(0, 10);
                    const status = (agent.current_task || 'IDLE').substring(0, 15);
                    
                    // Trajectory
                    const trajectory = agent.trajectory || [];
                    const nextStep = (trajectory.length > 0 ? trajectory[0] : 'Unknown').substring(0, 20);

                    let color = '\x1b[37m'; // White
                    if (agent.security_level >= 8) color = '\x1b[31m'; // Red (Critical/OpenClaw)
                    else if (agent.security_level <= 3) color = '\x1b[36m'; // Cyan (Nanobot)
                    
                    const reset = '\x1b[0m';

                    console.log(`${color}${id.padEnd(25)} | ${roleStr.padEnd(15)} | ${sec.padEnd(4)} | ${net.padEnd(10)} | ${status.padEnd(15)} | ${nextStep.padEnd(20)}${reset}`);
                    
                    // Show full trajectory in dim if available
                    if (trajectory.length > 1) {
                         console.log(`\x1b[2m${''.padEnd(25)}   🔮 Future: ${trajectory.slice(1).join(' -> ')}\x1b[0m`);
                    }
                });
            });
            console.log('\n');
        };

module.exports = async (args) => {
    const subcommand = args[0];
    const currentWsPath = process.cwd();

    if (subcommand === 'delegate') {
        await delegate(args.slice(1), currentWsPath);
    } else if (subcommand === 'list') {
        const registry = getRegistry();
        console.log(JSON.stringify(registry, null, 2));
    } else if (subcommand === 'map') {
        const isWeb = args.includes('--web');
        if (isWeb) {
            const startServer = require('../../core/swarm/WebMap');
            startServer();
            return; // Keep process alive
        }
        map();
    } else if (subcommand === 'task') {
        const taskManager = new TaskManager();
        const action = args[1];
        
        if (action === 'list') {
            const tasks = taskManager.listTasks();
            console.log('\n📋 Global Task Queue\n');
            if (tasks.length === 0) {
                console.log('   No active tasks.');
            } else {
                console.log(`${'ID'.padEnd(15)} | ${'Lvl'.padEnd(3)} | ${'STATUS'.padEnd(12)} | ${'ASSIGNEE'.padEnd(15)} | ${'TITLE'}`);
                console.log('-'.repeat(100));
                tasks.forEach(t => {
                    const assignee = (t.assignee || 'Unassigned').substring(0, 15);
                    const lvl = (t.required_security_level || 1).toString();
                    const title = t.title.substring(0, 50);
                    const status = t.status.substring(0, 12);
                    console.log(`${t.id.padEnd(15)} | ${lvl.padEnd(3)} | ${status.padEnd(12)} | ${assignee.padEnd(15)} | ${title}`);
                });
            }
            console.log('\n');
        } else if (action === 'add') {
            // Usage: ai-doc swarm task add "Title" "Description" --level 5
            const title = args[2];
            if (!title) {
                console.log('❌ Usage: ai-doc swarm task add "Task Title" [Description] [--level <1-10>]');
                return;
            }
            
            let description = 'Created via CLI';
            let level = 1;
            
            // Simple arg parsing
            for (let i = 3; i < args.length; i++) {
                if (args[i] === '--level' && args[i+1]) {
                    level = parseInt(args[i+1]);
                    i++; // skip next
                } else if (!args[i].startsWith('--')) {
                    description = args[i];
                }
            }

            const task = taskManager.createTask(title, description, 'medium', {}, level);
            console.log(`✅ Task created: ${task.id} (Level ${level})`);
            
        } else if (action === 'assign') {
            const taskId = args[2];
            const agentId = args[3];
            
            if (!taskId || !agentId) {
                console.log('❌ Usage: ai-doc swarm task assign <task-id> <agent-id>');
                return;
            }
            
            try {
                // Verify agent exists in registry
                const registry = getRegistry();
                const agent = registry.find(a => a.id === agentId || a.name === agentId);
                
                if (!agent) {
                    console.log(`⚠️ Warning: Agent "${agentId}" not found in registry, assigning anyway...`);
                }
                
                // Verify task security level match
                const task = taskManager.getTask(taskId);
                if (task) {
                    const taskLevel = task.required_security_level || 1;
                    const agentLevel = agent ? (agent.security_level || 1) : 1;
                    
                    if (agent && agentLevel < taskLevel) {
                         console.log(`⚠️ Security Warning: Agent level (${agentLevel}) is lower than task requirement (${taskLevel}).`);
                    }
                }

                taskManager.assignTask(taskId, agentId);
                console.log(`✅ Task ${taskId} assigned to ${agentId}`);
            } catch (e) {
                console.log(`❌ Error: ${e.message}`);
            }
            
        } else if (action === 'complete') {
            const taskId = args[2];
            if (!taskId) {
                console.log('❌ Usage: ai-doc swarm task complete <task-id>');
                return;
            }
            try {
                taskManager.updateStatus(taskId, 'COMPLETED');
                console.log(`✅ Task ${taskId} marked as COMPLETED`);
            } catch (e) {
                console.log(`❌ Error: ${e.message}`);
            }
        } else {
            console.log('Usage: ai-doc swarm task <list|add|assign|complete>');
        }
    } else if (subcommand === 'patterns') {
        const PatternLibrary = require('../../core/memory/PatternLibrary');
        const lib = new PatternLibrary();
        const action = args[1]; // learn, recall
        
        if (action === 'learn') {
            // usage: swarm patterns learn <role> <title> <solution> [tags]
            const role = args[2];
            const title = args[3];
            const solution = args[4];
            const tags = args[5] ? args[5].split(',') : [];
            
            if (!role || !title || !solution) {
                console.log('❌ Usage: ai-doc swarm patterns learn <role> <title> <solution> [tag1,tag2]');
                return;
            }
            
            const pattern = lib.learn(role, { title, solution, tags, author: 'CLI-User' });
            console.log(`✅ Pattern learned for [${role}]: ${pattern.title} (${pattern.id})`);
            
        } else if (action === 'recall') {
            // usage: swarm patterns recall <role> [query]
            const role = args[2];
            const query = args[3];
            
            if (!role) {
                console.log('❌ Usage: ai-doc swarm patterns recall <role> [query]');
                return;
            }
            
            const results = lib.recall(role, { query });
            console.log(`\n🧠 Knowledge Patterns for Role: [${role}]`);
            if (results.length === 0) {
                console.log('   (No patterns found)');
            } else {
                results.forEach(p => {
                    console.log(`   - ${p.title} [${p.tags.join(', ')}]`);
                    console.log(`     Solution: ${p.solution.substring(0, 100)}${p.solution.length > 100 ? '...' : ''}`);
                });
            }
            console.log('\n');
        } else {
            console.log('Usage: ai-doc swarm patterns <learn|recall>');
        }
    } else if (subcommand === 'map-web') {
        const startServer = require('../../core/swarm/WebMap');
        startServer();
    } else {
        console.log('Usage: ai-doc swarm <delegate|list|map|map-web|task|patterns>');
    }
};

module.exports.delegate = delegate;
