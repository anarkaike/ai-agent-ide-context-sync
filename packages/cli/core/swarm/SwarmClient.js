const WebSocket = require('ws');
const { exec } = require('child_process');
const path = require('path');
const os = require('os');

// Configuration
// If running on VPS/Remote, use Tailscale IP. If local, use localhost.
const MOTHERSHIP_IP = process.env.MOTHERSHIP_IP || '100.104.189.106'; 
const PORT = process.env.SWARM_PORT || 3456;
const AGENT_ID = process.env.AGENT_ID || `REMOTE_${os.hostname()}_${Math.random().toString(36).substr(2, 5)}`;
const RECONNECT_INTERVAL = 5000;

function connect() {
    const url = `ws://${MOTHERSHIP_IP}:${PORT}`;
    console.log(`🔌 [SwarmClient] Connecting to Mothership at ${url}...`);
    
    const ws = new WebSocket(url);

    ws.on('open', () => {
        console.log('✅ [SwarmClient] Connected to Neural Link!');
        
        // Register Presence
        ws.send(JSON.stringify({
            type: 'HEARTBEAT',
            data: {
                id: AGENT_ID,
                status: 'ONLINE',
                hostname: os.hostname(),
                role: process.env.AGENT_ROLE || 'REMOTE_WORKER'
            }
        }));
    });

    ws.on('message', (data) => {
        try {
            const msg = JSON.parse(data);
            console.log(`📩 [SwarmClient] Received: ${msg.type}`);

            handleMessage(msg);
        } catch (e) {
            console.error('❌ [SwarmClient] Parse Error:', e.message);
        }
    });

    ws.on('close', () => {
        console.warn(`⚠️ [SwarmClient] Disconnected. Reconnecting in ${RECONNECT_INTERVAL/1000}s...`);
        setTimeout(connect, RECONNECT_INTERVAL);
    });

    ws.on('error', (err) => {
        console.error(`❌ [SwarmClient] Connection Error: ${err.message}`);
        ws.close();
    });
}

function handleMessage(msg) {
    if (msg.type === 'SYSTEM_UPDATE') {
        console.log('🔄 [SwarmClient] SYSTEM UPDATE RECEIVED. INITIATING SYNC PROTOCOL...');
        
        // Execute sync script
        const scriptPath = path.join(__dirname, '../../scripts/sync-swarm.sh');
        
        exec(`sh ${scriptPath}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`❌ [SwarmClient] Sync Failed: ${error.message}`);
                return;
            }
            if (stderr) {
                console.warn(`⚠️ [SwarmClient] Sync Warning: ${stderr}`);
            }
            console.log(`✅ [SwarmClient] Sync Output:\n${stdout}`);
            console.log('🚀 [SwarmClient] Agent is now running on latest Hive Mind version.');
        });
    }
    
    if (msg.type === 'TASK_ASSIGNED') {
        if (msg.data.assignee === AGENT_ID || msg.data.assignee === 'broadcast') {
            console.log('📋 [SwarmClient] NEW TASK ASSIGNED:');
            console.log(`   Title: ${msg.data.title}`);
            console.log(`   Desc:  ${msg.data.description}`);
            console.log('   --> ACTION REQUIRED: Check .ai-workspace/tasks/ for details.');
        }
    }
}

// Start the neural implant
console.log(`🧠 [SwarmClient] Initializing Neural Implant for Agent: ${AGENT_ID}`);
connect();
