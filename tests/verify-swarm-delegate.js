const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FIXTURES_DIR = path.join(__dirname, 'fixtures', 'swarm-test');
const AGENT_A_DIR = path.join(FIXTURES_DIR, 'agent-a');
const AGENT_B_DIR = path.join(FIXTURES_DIR, 'agent-b');
const REGISTRY_PATH = path.join(FIXTURES_DIR, 'registry.json');
const CLI_PATH = path.resolve(__dirname, '../packages/cli/cli/ai-doc.js');

// Helper to create workspace
function createWorkspace(dir) {
    const ws = path.join(dir, '.ai-workspace');
    fs.mkdirSync(path.join(ws, 'tasks', 'active'), { recursive: true });
    fs.mkdirSync(path.join(ws, 'tasks', 'completed'), { recursive: true });
    fs.mkdirSync(path.join(ws, 'live-state'), { recursive: true });
    
    // Create minimal identity
    fs.writeFileSync(path.join(ws, 'identity.json'), JSON.stringify({
        id: path.basename(dir),
        name: path.basename(dir)
    }));
}

// Helper to cleanup
function cleanup() {
    if (fs.existsSync(FIXTURES_DIR)) {
        fs.rmSync(FIXTURES_DIR, { recursive: true, force: true });
    }
}

async function test() {
    console.log("🧪 Testing Swarm Delegation...\n");

    try {
        // 1. Setup Environment
        cleanup();
        fs.mkdirSync(AGENT_A_DIR, { recursive: true });
        fs.mkdirSync(AGENT_B_DIR, { recursive: true });
        
        createWorkspace(AGENT_A_DIR);
        createWorkspace(AGENT_B_DIR);

        // 2. Setup Registry
        const registry = [
            {
                id: 'agent-b',
                name: 'Agent B',
                path: AGENT_B_DIR, // Absolute path required for delegate command
                capabilities: ['coding']
            }
        ];
        fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));

        // 3. Set Env Var for Registry
        process.env.AI_DOC_SWARM_REGISTRY = REGISTRY_PATH;

        // 4. Run Delegate Command from Agent A
        console.log(`📡 Delegating from Agent A to Agent B...`);
        // Using node to run CLI
        const cmd = `node "${CLI_PATH}" swarm delegate agent-b "Refactor login module"`;
        
        // Execute in Agent A dir
        // We pass the ENV VAR so the CLI knows where the registry is
        execSync(cmd, { 
            cwd: AGENT_A_DIR,
            env: { ...process.env, AI_DOC_SWARM_REGISTRY: REGISTRY_PATH },
            stdio: 'inherit'
        });
        
        // console.log(output.toString());

        // 5. Verify Task Creation in Agent B
        const tasksDirB = path.join(AGENT_B_DIR, '.ai-workspace', 'tasks', 'active');
        const tasks = fs.readdirSync(tasksDirB).filter(f => f.endsWith('.md'));
        
        if (tasks.length > 0) {
            console.log(`✅ Task received in Agent B: ${tasks[0]}`);
            
            const content = fs.readFileSync(path.join(tasksDirB, tasks[0]), 'utf-8');
            
            // Check essential content
            const hasTitle = content.includes('Refactor login module');
            const hasSender = content.includes('from_agent: agent-a');
            
            if (hasTitle && hasSender) {
                 console.log(`✅ Content verified: Title and Sender match.`);
            } else {
                 console.log(`❌ Content mismatch.`);
                 console.log(`Has Title: ${hasTitle}`);
                 console.log(`Has Sender: ${hasSender}`);
                 console.log('--- Content ---');
                 console.log(content);
            }
            
            // Verify Security Interception
            // Since agent-a is unknown to agent-b (no trust history), it should be pending_approval
            if (content.includes('status: pending_approval')) {
                console.log(`✅ Status is 'pending_approval' (Security Interception worked).`);
            } else if (content.includes('status: queued_for_agent')) {
                console.log(`⚠️ Status is 'queued_for_agent' (Trust check might be bypassed or misconfigured).`);
            } else {
                console.log(`❓ Status is unexpected: ${content.match(/status: .*/)?.[0]}`);
            }
            
        } else {
            console.log(`❌ No task found in Agent B.`);
            try {
                console.log(`List of ${tasksDirB}:`, fs.readdirSync(tasksDirB));
            } catch (e) {
                console.log(`Could not list dir: ${e.message}`);
            }
        }

    } catch (e) {
        console.error("❌ Test Failed:", e);
        if (e.stdout) console.log(e.stdout.toString());
        if (e.stderr) console.log(e.stderr.toString());
    } finally {
        // Cleanup
        cleanup();
    }
}

test();
