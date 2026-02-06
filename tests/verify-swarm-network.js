const SwarmRegistry = require('../packages/cli/core/swarm/Registry.js');
const NetworkLayer = require('../packages/cli/core/swarm/NetworkLayer.js');
const SecurityKernel = require('../packages/cli/core/swarm/SecurityKernel.js');

async function test() {
    console.log("🌐 Testing Swarm Networking & Security...\n");

    // 1. Test Network Detection
    const net = new NetworkLayer();
    const netInfo = net.getNetworkInfo();
    console.log(`[Network] Detected Interface: ${netInfo.interface}`);
    console.log(`[Network] IP Address: ${netInfo.address}`);
    console.log(`[Network] Provider: ${netInfo.provider}`);
    console.log(`[Network] Secure? ${netInfo.is_secure ? '✅ YES' : '⚠️ NO'}\n`);

    // 2. Test Security Kernel
    const sec = new SecurityKernel();
    console.log("[Security] Profiles:");
    console.log(`  - Nanobot Level: ${sec.resolveProfile('nanobot').level}`);
    console.log(`  - OpenClaw Level: ${sec.resolveProfile('openclaw').level}`);

    const token = sec.issueToken('agent-007', 10);
    console.log(`[Security] Issued Token: ${token.substring(0, 10)}...`);
    
    const valid = sec.validateToken(token);
    console.log(`[Security] Token Valid? ${valid.valid ? '✅ YES' : '❌ NO'} (Level: ${valid.level})\n`);

    // 3. Test Registry Update
    const registry = new SwarmRegistry();
    console.log("[Registry] Registering Agent on Tailscale/Network...");
    
    registry.registerAgent({
        id: 'agent-test-net',
        name: 'Test Network Agent',
        path: process.cwd(),
        security_level: 10,
        current_task: 'Testing Network Layer',
        trajectory: ['Initialize', 'Scan Network', 'Report']
    });

    const agent = registry.findAgent('agent-test-net');
    console.log(`[Registry] Agent Registered:`);
    console.log(`  - Name: ${agent.name}`);
    console.log(`  - IP: ${agent.network.ip} (${agent.network.provider})`);
    console.log(`  - Security Level: ${agent.security_level}`);
    console.log(`  - Current Task: ${agent.current_task}`);
    
    if (agent.network.ip === netInfo.address) {
        console.log("\n✅ Integration Verified Successfully!");
    } else {
        console.error("\n❌ IP Mismatch!");
        process.exit(1);
    }
}

test();
