const fs = require('fs');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');
const SwarmRegistry = require('../../core/swarm/Registry');
const TaskManager = require('./TaskManager');
const SecurityKernel = require('./SecurityKernel');
const SwarmNetwork = require('./SwarmNetwork');
const DatabaseManager = require('./DatabaseManager');
const SwarmAnalyst = require('./SwarmAnalyst');
const NeuralLink = require('./NeuralLink');

const PORT = 3000; // Swarm Map Port (Changed from 3456 due to Windsurf conflict)

const startServer = async () => {
    const dbManager = new DatabaseManager();
    await dbManager.init();
    
    const registry = new SwarmRegistry();
    const taskManager = new TaskManager();
    const securityKernel = new SecurityKernel(dbManager);
    const analyst = new SwarmAnalyst(dbManager);
    const neuralLink = new NeuralLink(dbManager);

    // Initial Sync
    await neuralLink.sync();

    // WebSocket Broadcast Placeholder (Initialized after server creation)
    let broadcast = (type, data) => {};

    const server = http.createServer(async (req, res) => {
        // Security Check
        const ip = req.socket.remoteAddress;
        const securityStatus = securityKernel.validateNetworkOrigin(ip);
        
        // Log Access (Audit)
        if (!securityStatus.trusted) {
            console.warn(`⚠️ [Security] Untrusted access attempt from ${ip}`);
        }

        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Swarm-Token');

        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }

        const url = new URL(req.url, `http://${req.headers.host}`);
        const pathname = url.pathname;

        // 🛡️ ENFORCE SECURITY ON ALL API ROUTES (placed before handlers)
        if (pathname.startsWith('/api/') && !securityStatus.trusted) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'ACCESS_DENIED', reason: 'UNTRUSTED_NETWORK_ORIGIN' }));
            return;
        }

        if (pathname === '/api/tasks/request' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', async () => {
                try {
                    const data = JSON.parse(body);
                    
                    // Use TaskManager to save directly to DB (Source of Truth)
                    const newTask = await taskManager.createTask(
                        data.title, 
                        data.description, 
                        data.priority || 'medium',
                        { source: 'WebMap User Interface', requester_ip: ip },
                        1, // Security Level Requirement (Default)
                        'user'
                    );

                    console.log(`[TaskQueue] Task created: ${newTask.id}`);
                    broadcast('TASK_UPDATE', newTask);

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, task: newTask }));
                } catch (e) {
                    console.error('Failed to queue task', e);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: e.message }));
                }
            });
            return;
        }

        if (pathname === '/api/agent/register' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', async () => {
                try {
                    const data = JSON.parse(body);
                    
                    // Security Enrichment
                    let ip = req.socket.remoteAddress || req.connection.remoteAddress;

                    // DEV SIMULATION HOOK (Allow testing Tailscale UI locally)
                    if ((ip === '127.0.0.1' || ip === '::1') && req.headers['x-simulate-ip']) {
                        ip = req.headers['x-simulate-ip'];
                        console.log(`[Dev] Simulating Remote IP: ${ip}`);
                    }

                    const netStatus = securityKernel.validateNetworkOrigin(ip);
                    
                    data.network = {
                        ip: ip,
                        type: netStatus.network, // 'TAILSCALE', 'LOCAL', 'UNKNOWN'
                        trustLevel: netStatus.trustLevel
                    };

                    // Auto-assign "Remote" capability/tag if Tailscale
                    if (netStatus.network === 'TAILSCALE') {
                        if (!data.capabilities) data.capabilities = [];
                        if (!data.capabilities.includes('remote-access')) data.capabilities.push('remote-access');
                        // Tag for UI
                        data.tags = data.tags || [];
                        if (!data.tags.includes('VPS')) data.tags.push('VPS');
                    }

                    // Register external agent via Registry
                    // Expected format: { id, name, roles: [], status, security_level }
                    const registered = await registry.registerAgent(data);
                    
                    console.log(`[Swarm] External Agent Registered via HTTP: ${registered.name} (${registered.id}) from ${netStatus.network}`);
                    broadcast('AGENT_UPDATE', registered);

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, agent: registered }));
                } catch (e) {
                    console.error('Failed to register external agent', e);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: e.message }));
                }
            });
            return;
        }

        if (pathname === '/api/comms/send' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', async () => {
                try {
                    const data = JSON.parse(body);
                    // data: { from, to, content, type }
                    
                    const msg = {
                        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                        from: data.from,
                        to: data.to || 'MOTHERSHIP',
                        content: data.content,
                        type: data.type || 'text',
                        timestamp: new Date().toISOString(),
                        read: false
                    };

                    await neuralLink.sendMessage(msg);
                    broadcast('COMMS_UPDATE', msg);
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, messageId: msg.id }));
                } catch (e) {
                    console.error('Failed to receive message', e);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: e.message }));
                }
            });
            return;
        }

        if (pathname === '/api/comms/messages' && req.method === 'GET') {
            try {
                await neuralLink.sync(); // Sync before read
                const messages = await dbManager.getMessages(100);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ messages }));
            } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
            return;
        }


        if (pathname === '/' || pathname === '/index.html') {
            // Serve HTML
            const html = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head> 
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>🌌 Swarm Existential Map</title>
                <style>
                    :root {
                        --bg: #0d1117;
                        --sidebar-bg: #161b22;
                        --card-bg: #21262d;
                        --border: #30363d;
                        --text-primary: #c9d1d9;
                        --text-secondary: #8b949e;
                        --accent: #58a6ff;
                        --success: #238636;
                        --danger: #da3633;
                        --warning: #d29922;
                        --info: #3fb950;
                        --shield: #a371f7; /* Purple for protection/shield */
                        --hover: #21262d;
                    }
                    
                    body { 
                        background: var(--bg); 
                        color: var(--text-primary); 
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
                        padding: 0; 
                        margin: 0;
                        height: 100vh;
                        display: flex;
                        flex-direction: column;
                        overflow: hidden;
                    }

                    /* Comms Feed */
                    .comm-msg {
                        padding: 12px;
                        border-bottom: 1px solid var(--border);
                        font-size: 0.9rem;
                        background: rgba(255,255,255,0.01);
                    }
                    .comm-msg:hover { background: rgba(255,255,255,0.03); }
                    .comm-header {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 6px;
                        font-size: 0.75rem;
                        color: var(--text-secondary);
                    }
                    .comm-sender { font-weight: 600; color: var(--accent); }
                    .comm-body {
                        white-space: pre-wrap; /* Preserve formatting */
                        line-height: 1.5;
                        color: var(--text-primary);
                    }
                    .comm-body strong { color: #fff; font-weight: 600; }
                    .comm-body code {
                        background: rgba(110,118,129,0.4);
                        padding: 0.2em 0.4em;
                        border-radius: 3px;
                        font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
                        font-size: 0.85em;
                    }

                    /* Header */
                    header {
                        padding: 6px 16px;
                        border-bottom: 1px solid var(--border);
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        background: var(--sidebar-bg);
                        z-index: 100;
                        height: 40px; /* Force compact height */
                    }

                    header h1 {
                        margin: 0;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        font-size: 1rem;
                        font-weight: 600;
                        color: var(--text-primary);
                    }

                    /* Layout */
                    .main-layout {
                        display: grid;
                        grid-template-columns: 1fr 350px;
                        flex: 1;
                        overflow: hidden;
                    }

                    .agent-grid-area {
                        padding: 20px;
                        overflow-y: auto; /* Ensure vertical scrolling */
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
                        grid-auto-rows: min-content; /* Prevent cards from stretching weirdly */
                        gap: 20px;
                        align-content: start;
                        height: 100%; /* Take full height of parent */
                        box-sizing: border-box;
                    }

                    .sidebar-area {
                        background: var(--sidebar-bg);
                        border-left: 1px solid var(--border);
                        display: flex;
                        flex-direction: column;
                        overflow: hidden;
                    }

                    /* Agent Card */
                    .agent-card {
                        background: var(--card-bg);
                        border: 1px solid var(--border);
                        border-radius: 8px;
                        overflow: hidden;
                        display: flex;
                        flex-direction: column;
                        transition: transform 0.2s, box-shadow 0.2s;
                    }
                    .agent-card:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 8px 24px rgba(0,0,0,0.2);
                        border-color: var(--accent);
                    }

                    .card-header {
                        padding: 15px;
                        background: rgba(255,255,255,0.02);
                        border-bottom: 1px solid var(--border);
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                    }

                    .agent-identity { display: flex; gap: 10px; align-items: center; }
                    .agent-avatar { 
                        width: 40px; height: 40px; 
                        border-radius: 50%; 
                        background: var(--border); 
                        display: flex; align-items: center; justify-content: center;
                        font-size: 1.2rem;
                        border: 2px solid transparent;
                    }
                    .agent-avatar.online { border-color: var(--success); }
                    .agent-info h3 { margin: 0; font-size: 1rem; color: var(--text-primary); }
                    .agent-info p { margin: 0; font-size: 0.75rem; color: var(--text-secondary); font-family: monospace; }

                    /* Card Tabs */
                    .card-tabs {
                        display: flex;
                        border-bottom: 1px solid var(--border);
                        background: rgba(0,0,0,0.1);
                    }
                    .tab-btn {
                        flex: 1;
                        padding: 8px;
                        background: none;
                        border: none;
                        color: var(--text-secondary);
                        font-size: 0.75rem;
                        cursor: pointer;
                        border-bottom: 2px solid transparent;
                    }
                    .tab-btn.active { color: var(--text-primary); border-bottom-color: var(--accent); font-weight: 600; }
                    .tab-btn:hover { background: rgba(255,255,255,0.02); }

                    .card-body {
                        padding: 0;
                        height: 250px; /* Fixed height for consistency */
                        overflow-y: auto;
                        position: relative;
                    }
                    
                    .tab-content { display: none; padding: 15px; }
                    .tab-content.active { display: block; animation: fadeIn 0.2s; }

                    /* Task Item in Card */
                    .mini-task {
                        background: rgba(255,255,255,0.03);
                        border: 1px solid var(--border);
                        border-radius: 6px;
                        padding: 10px;
                        margin-bottom: 8px;
                        cursor: pointer;
                        transition: background 0.2s;
                    }
                    .mini-task:hover { background: rgba(255,255,255,0.08); border-color: var(--accent); }
                    .mini-task-header { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 0.75rem; }
                    .mini-task-title { font-weight: 600; font-size: 0.85rem; color: var(--accent); margin-bottom: 4px; }
                    .mini-task-desc { font-size: 0.75rem; color: var(--text-secondary); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

                    /* Shield Event with Pointer */
                    .shield-event {
                        padding: 8px 15px;
                        border-bottom: 1px solid rgba(163, 113, 247, 0.1);
                        background: rgba(163, 113, 247, 0.05);
                        font-size: 0.75rem;
                        display: flex;
                        gap: 10px;
                        align-items: center;
                        cursor: pointer;
                    }
                    .shield-event:hover { background: rgba(163, 113, 247, 0.1); }
                    
                    /* Tooltip Icons */
                    .help-icon {
                        cursor: help;
                        opacity: 0.7;
                        transition: opacity 0.2s;
                        margin-left: 5px;
                        font-size: 0.9em;
                    }
                    .help-icon:hover { opacity: 1; }

                    .mini-log {
                        font-family: 'SF Mono', monospace;
                        font-size: 0.7rem;
                        padding: 4px 0;
                        border-bottom: 1px solid rgba(255,255,255,0.05);
                        display: flex;
                        gap: 8px;
                    }
                    .log-dir { font-weight: bold; width: 20px; text-align: center; }
                    .log-in { color: var(--success); }
                    .log-out { color: var(--accent); }
                    .log-shield { color: var(--shield); }

                    /* Sidebar Widgets */
                    .widget {
                        border-bottom: 1px solid var(--border);
                        display: flex;
                        flex-direction: column;
                        max-height: 50%;
                    }
                    .widget-header {
                        padding: 12px 15px;
                        background: rgba(255,255,255,0.02);
                        font-size: 0.75rem;
                        text-transform: uppercase;
                        font-weight: 700;
                        letter-spacing: 1px;
                        color: var(--text-secondary);
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .widget-content {
                        flex: 1;
                        overflow-y: auto;
                        padding: 0;
                    }

                    /* Global Queue List */
                    .queue-item {
                        padding: 10px 15px;
                        border-bottom: 1px solid var(--border);
                        cursor: pointer;
                    }
                    .queue-item:hover { background: var(--hover); }

                    /* Shield/Protection Visuals */
                    .shield-event {
                        padding: 8px 15px;
                        border-bottom: 1px solid rgba(163, 113, 247, 0.1);
                        background: rgba(163, 113, 247, 0.05);
                        font-size: 0.75rem;
                        display: flex;
                        gap: 10px;
                        align-items: center;
                    }
                    .shield-icon { color: var(--shield); font-size: 1rem; }
                    
                    /* Comms Feed */
                    .comm-msg {
                        padding: 10px 15px;
                        border-bottom: 1px solid rgba(255,255,255,0.05);
                        font-size: 0.8rem;
                        display: flex;
                        flex-direction: column;
                        gap: 4px;
                    }
                    .comm-header { display: flex; justify-content: space-between; color: var(--text-secondary); font-size: 0.7rem; }
                    .comm-sender { font-weight: bold; color: var(--accent); }
                    .comm-body { color: var(--text-primary); white-space: pre-wrap; }
                    .comm-time { font-family: monospace; }
                    
                    /* Utility */
                    .tag { padding: 2px 8px; border-radius: 12px; font-size: 0.7em; font-weight: 600; border: 1px solid transparent; }
                    .tag.L10 { background: rgba(163, 113, 247, 0.15); color: #d2a8ff; border-color: rgba(163, 113, 247, 0.3); }
                    
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                    
                    /* Scrollbar */
                    ::-webkit-scrollbar { width: 6px; }
                    ::-webkit-scrollbar-track { background: transparent; }
                    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

                    /* Nav Tabs */
                    .nav-tab {
                        background: none;
                        border: none;
                        color: var(--text-secondary);
                        padding: 6px 12px;
                        font-size: 0.8rem;
                        cursor: pointer;
                        border-radius: 4px;
                        font-weight: 500;
                        transition: all 0.2s;
                    }
                    .nav-tab.active {
                        background: var(--accent);
                        color: white;
                    }
                    .nav-tab:hover:not(.active) {
                        background: rgba(255,255,255,0.1);
                        color: var(--text-primary);
                    }
                    
                    /* Full Comms View */
                    .comms-container {
                        display: flex;
                        flex-direction: column;
                        height: 100%;
                        background: var(--bg);
                    }
                    .msg-bubble {
                        margin-bottom: 12px;
                        padding: 10px 15px;
                        border-radius: 8px;
                        max-width: 80%;
                        line-height: 1.5;
                        font-size: 0.9rem;
                    }
                    .msg-bubble.out {
                        align-self: flex-end;
                        background: rgba(88, 166, 255, 0.15);
                        border: 1px solid rgba(88, 166, 255, 0.3);
                        color: #e6edf3;
                    }
                    .msg-bubble.in {
                        align-self: flex-start;
                        background: rgba(255, 255, 255, 0.05);
                        border: 1px solid var(--border);
                    }
                </style>
            </head>
            <body>
                <header>
                    <div style="display:flex; align-items:center; gap: 20px;">
                        <h1>
                            <span style="font-size: 1.2rem;">🌌</span> 
                            <span>Swarm Existential Map</span>
                            <span style="font-size: 0.7rem; color: var(--text-secondary); opacity: 0.7; border-left: 1px solid var(--border); padding-left: 8px; margin-left: 0px; letter-spacing: 0.5px;">COCKPIT</span>
                        </h1>
                        <div style="display:flex; background: rgba(255,255,255,0.05); border-radius: 6px; padding: 2px;">
                            <button class="nav-tab active" onclick="switchMainView('dashboard')" id="nav-dashboard">📡 Monitoramento</button>
                            <button class="nav-tab" onclick="switchMainView('comms')" id="nav-comms">💬 Central de Comunicações</button>
                        </div>
                    </div>

                    <div style="display:flex; gap:8px; align-items:center;">
                        <input type="text" id="global-search" style="padding: 4px 8px; font-size: 0.7rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: var(--text-primary); border-radius: 4px; width: 150px;" placeholder="🔍 Filtrar...">
                        <button style="padding: 4px 8px; font-size: 0.7rem; background: var(--success); color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;" onclick="openRequestModal()">➕ Tarefa</button>
                        <div class="tag" style="border: 1px solid var(--border); color: var(--text-secondary); font-size: 0.65rem; padding: 2px 6px;">
                            🛡️ <span id="security-status-text">Ativo</span>
                        </div>
                    </div>
                </header>
                
                <div class="main-layout" id="view-dashboard">
                    <!-- Main Area: Agent Grid -->
                    <div class="agent-grid-area" id="agent-grid">
                        <!-- Cards injected by JS -->
                    </div>

                    <!-- Sidebar: System Health & Queue -->
                    <div class="sidebar-area">
                        
                        <!-- 0. Network Uplink Status (NEW) -->
                        <div class="widget" style="flex: 0 0 auto; border-bottom: 1px solid var(--border); background: rgba(0, 255, 136, 0.05);">
                            <div class="widget-header">
                                <div>
                                    <span>👽 Borg Link (Uplink)</span>
                                    <div style="font-size:0.6em; color:var(--text-secondary); margin-top:2px;">
                                        <span style="color:#0f0;">●</span> Listening on Tailscale
                                    </div>
                                </div>
                                <span class="tag" style="background:var(--accent); color:#fff; font-family:monospace;">100.104.189.106:3456</span>
                            </div>
                        </div>

                        <!-- 1. Protection Log (Previously Network Grid) -->
                        <div class="widget" style="flex: 1;">
                            <div class="widget-header">
                                <div>
                                    <span>🛡️ Eventos de Proteção</span>
                                    <div style="font-size:0.6em; color:var(--text-secondary); font-weight:400; text-transform:none; margin-top:2px;">Monitoramento de Tráfego e Bloqueios</div>
                                </div>
                                <span class="tag" style="background:var(--shield); color:#fff;" id="blocked-count">0</span>
                            </div>
                            <div class="widget-content" id="protection-feed">
                                <!-- Shield events -->
                            </div>
                        </div>

                        <!-- 2. Unassigned Tasks / Global Queue -->
                        <div class="widget" style="flex: 1; border-top: 1px solid var(--border);">
                            <div class="widget-header">
                                <span>📋 Fila Global (Pendentes)</span>
                                <span class="tag" id="queue-count">0</span>
                            </div>
                            <div class="widget-content" id="global-queue">
                                <!-- Tasks -->
                            </div>
                        </div>

                        <!-- 3. Inter-Agent Communication (Mural) -->
                        <div class="widget" style="flex: 1; border-top: 1px solid var(--border); background: rgba(0,0,0,0.1);">
                            <div class="widget-header">
                                <span>📡 Frequência Inter-Agentes</span>
                            </div>
                            <div class="widget-content" id="comms-feed" style="padding: 0;">
                                <!-- Chat Messages -->
                            </div>
                        </div>
                    </div>
                </div>

                <!-- View: Central de Comunicações -->
                <div class="main-layout" id="view-comms" style="display:none; grid-template-columns: 250px 1fr;">
                    <!-- Sidebar: Channels/Contacts -->
                    <div class="sidebar-area">
                        <div class="widget" style="flex:1">
                            <div class="widget-header">
                                <span>👥 Agentes & Canais</span>
                            </div>
                            <div class="widget-content" id="comms-sidebar-list" style="padding:10px;">
                                <!-- Agents List -->
                            </div>
                        </div>
                    </div>
                    
                    <!-- Main Chat Area -->
                    <div class="comms-container">
                        <div id="comms-main-feed" style="flex:1; overflow-y:auto; padding:20px; display:flex; flex-direction:column-reverse;">
                            <!-- Full Chat History -->
                        </div>
                        <div style="padding:20px; border-top:1px solid var(--border); background: var(--sidebar-bg);">
                            <div style="display:flex; gap:10px;">
                                <input type="text" id="comms-input" placeholder="Enviar mensagem para a rede..." style="flex:1; padding:12px; background:var(--bg); border:1px solid var(--border); color:var(--text-primary); border-radius:4px; outline:none;" onkeypress="handleCommsInput(event)">
                                <button onclick="sendCommsMessage()" style="background:var(--accent); color:white; border:none; padding:0 20px; border-radius:4px; cursor:pointer; font-weight:600;">ENVIAR</button>
                            </div>
                            <div style="font-size:0.7rem; color:var(--text-secondary); margin-top:5px;">
                                Pressione Enter para enviar. Mensagens são transmitidas via Neural Link para todos os agentes conectados (Local & Tailscale).
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Divine Intervention Bar (Fixed Bottom) -->
                <div class="command-container" style="position: fixed; bottom: 0; width: 100%; border-top: 1px solid var(--accent); background: var(--bg); box-shadow: 0 -4px 20px rgba(0,0,0,0.5); z-index: 900; display:flex; padding: 10px; gap: 10px;">
                    <div style="color: var(--accent); font-size: 1.2rem;">⚡</div>
                    <input type="text" id="cmd-input" class="cmd-input-lg" style="flex:1; background:transparent; border:none; color:var(--text-primary); outline:none;" placeholder="Intervenção Divina: Injetar Comando...">
                    <button class="cmd-btn-lg" style="background:var(--accent); color:white; border:none; padding:5px 15px; border-radius:4px; cursor:pointer;" onclick="sendCommand()">EXECUTAR</button>
                </div>

                <!-- Request Task Modal -->
                <div id="request-modal" class="modal-overlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); display:none; justify-content:center; align-items:center; z-index:1000;">
                    <div class="modal" style="width: 500px; background:var(--sidebar-bg); border:1px solid var(--border); border-radius:8px; padding:20px;">
                        <div class="modal-header" style="display:flex; justify-content:space-between; margin-bottom:20px;">
                            <h3 style="margin:0; font-weight: 400;">Solicitar Nova Tarefa</h3>
                            <button onclick="closeRequestModal()" style="background:none; border:none; color:var(--text-secondary); cursor:pointer; font-size:1.5rem;">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div style="margin-bottom:15px;">
                                <label style="display:block; color:var(--text-secondary); font-size:0.8rem; margin-bottom:5px;">TÍTULO</label>
                                <input type="text" id="req-title" style="width:100%; padding:8px; background:var(--bg); border:1px solid var(--border); color:var(--text-primary); border-radius:4px;" placeholder="Ex: Refatorar Módulo de Login">
                            </div>
                            <div style="margin-bottom:15px;">
                                <label style="display:block; color:var(--text-secondary); font-size:0.8rem; margin-bottom:5px;">DESCRIÇÃO</label>
                                <textarea id="req-desc" style="width:100%; padding:8px; background:var(--bg); border:1px solid var(--border); color:var(--text-primary); border-radius:4px; height:100px; resize:vertical;" placeholder="Detalhes da solicitação..."></textarea>
                            </div>
                            <div style="margin-bottom:15px;">
                                <label style="display:block; color:var(--text-secondary); font-size:0.8rem; margin-bottom:5px;">PRIORIDADE</label>
                                <select id="req-pri" style="width:100%; padding:8px; background:var(--bg); border:1px solid var(--border); color:var(--text-primary); border-radius:4px;">
                                    <option value="medium">Média</option>
                                    <option value="high">Alta</option>
                                    <option value="low">Baixa</option>
                                </select>
                            </div>
                            <div style="text-align:right;">
                                <button onclick="submitRequest()" style="background:var(--success); color:white; border:none; padding:8px 16px; border-radius:4px; cursor:pointer;">ENVIAR SOLICITAÇÃO</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Generic Info/Details Modal -->
                <div id="info-modal" class="modal-overlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); display:none; justify-content:center; align-items:center; z-index:1000;">
                    <div class="modal" style="width: 600px; max-width:90%; background:var(--sidebar-bg); border:1px solid var(--border); border-radius:8px; display:flex; flex-direction:column; max-height:80vh;">
                        <div class="modal-header" style="display:flex; justify-content:space-between; padding:20px; border-bottom:1px solid var(--border);">
                            <h3 style="margin:0; font-weight: 400; color: var(--accent);" id="info-modal-title">Detalhes</h3>
                            <button onclick="closeInfoModal()" style="background:none; border:none; color:var(--text-secondary); cursor:pointer; font-size:1.5rem;">&times;</button>
                        </div>
                        <div class="modal-body" id="info-modal-content" style="padding:20px; overflow-y:auto; line-height: 1.6; color: var(--text-primary);">
                            <!-- Content injected via JS -->
                        </div>
                    </div>
                </div>

                <script>
                    // State
                    let state = {
                        agents: [],
                        tasks: [],
                        logs: [],
                        securityLogs: [],
                        comms: [],
                        filter: '',
                        ui: {
                            activeTabs: {} // agentId -> tabName
                        }
                    };

                    // WebSocket Connection
                    function connectWebSocket() {
                        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                        const ws = new WebSocket(protocol + '//' + window.location.host);

                        ws.onopen = () => {
                            console.log('✅ [WebSocket] Connected');
                            const status = document.getElementById('security-status-text');
                            if (status && !status.innerHTML.includes('⚡')) status.innerHTML += ' <span style="color:var(--success)">⚡</span>';
                        };

                        ws.onmessage = (event) => {
                            try {
                                const msg = JSON.parse(event.data);
                                
                                if (msg.type === 'WELCOME') {
                                    console.log('🌌 [Swarm]', msg.message);
                                }
                                else if (msg.type === 'COMMS_UPDATE') {
                                    // Avoid duplicates
                                    if (!state.comms.find(c => c.id === msg.data.id)) {
                                        state.comms.unshift(msg.data);
                                        renderCommsFeed();
                                    }
                                }
                                else if (msg.type === 'TASK_UPDATE') {
                                    if (!state.tasks.find(t => t.id === msg.data.id)) {
                                        state.tasks.unshift(msg.data);
                                        renderGlobalQueue();
                                    }
                                }
                                else if (msg.type === 'AGENT_UPDATE') {
                                    updateData(); // Trigger full sync
                                }
                            } catch (e) {
                                console.error('WS Error', e);
                            }
                        };

                        ws.onclose = () => {
                            console.log('❌ [WebSocket] Disconnected. Reconnecting in 5s...');
                            setTimeout(connectWebSocket, 5000);
                        };
                    }

                    connectWebSocket();

                    // Listeners
                    document.getElementById('global-search').addEventListener('input', (e) => {
                        state.filter = e.target.value.toLowerCase();
                        renderAgentCards();
                    });

                    // Request Modal
                    function openRequestModal() {
                        document.getElementById('request-modal').style.display = 'flex';
                        document.getElementById('req-title').focus();
                    }
                    function closeRequestModal() {
                        document.getElementById('request-modal').style.display = 'none';
                    }

                    function openInfoModal(title, htmlContent) {
                        document.getElementById('info-modal-title').innerText = title;
                        document.getElementById('info-modal-content').innerHTML = htmlContent;
                        document.getElementById('info-modal').style.display = 'flex';
                    }
                    function closeInfoModal() {
                        document.getElementById('info-modal').style.display = 'none';
                    }
                    
                    // Close modals on outside click
                    window.onclick = function(event) {
                        if (event.target.classList.contains('modal-overlay')) {
                            event.target.style.display = "none";
                        }
                    }

                    async function submitRequest() {
                        const title = document.getElementById('req-title').value;
                        const desc = document.getElementById('req-desc').value;
                        const pri = document.getElementById('req-pri').value;

                        if (!title) return alert('Título é obrigatório');

                        try {
                            const res = await fetch('/api/tasks/request', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ title, description: desc, priority: pri })
                            });
                            const data = await res.json();
                            if (data.success) {
                                alert('Tarefa solicitada com sucesso!');
                                closeRequestModal();
                                updateData(); // Refresh immediately
                            } else {
                                alert('Erro: ' + data.error);
                            }
                        } catch (e) {
                            alert('Erro de conexão');
                        }
                    }

                    // Renderers
                    function renderAgentCards() {
                        const container = document.getElementById('agent-grid');
                        
                        const filteredAgents = state.agents.filter(a => 
                            (a.name || '').toLowerCase().includes(state.filter) || 
                            (a.role || '').toLowerCase().includes(state.filter)
                        );

                        // 1. Remove agents that are no longer in the list
                        const currentIds = filteredAgents.map(a => a.id);
                        Array.from(container.children).forEach(child => {
                            const id = child.getAttribute('data-agent-id');
                            if (!currentIds.includes(id)) {
                                child.remove();
                            }
                        });

                        // 2. Update or Create agents
                        filteredAgents.forEach(agent => {
                            const agentTasks = state.tasks.filter(t => t.assignee === agent.id);
                            const existingCard = document.getElementById('card-' + agent.id);
                            const activeTab = state.ui.activeTabs[agent.id] || 'tasks';

                            const isOnline = agent.status !== 'OFFLINE';
                            
                            // Network/VPS Indicator
                            let networkHTML = '';
                            if ((agent.network && agent.network.type === 'TAILSCALE') || (agent.tags && agent.tags.includes('VPS'))) {
                                networkHTML = '<div class="tag" style="background:rgba(255, 165, 0, 0.2); color:orange; margin-left:4px;" title="Conectado via VPS/Tailscale" onclick="openNetworkHelp(event)">☁️ VPS</div>';
                            }

                            // Template Parts
                            const headerHTML = 
                                '<div class="agent-identity">' +
                                    '<div class="agent-avatar ' + (isOnline ? 'online' : '') + '">' +
                                        getAvatarEmoji(agent.role) +
                                    '</div>' +
                                    '<div class="agent-info">' +
                                        '<h3>' + (agent.name || agent.id.substring(0,8)) + ' <span class="help-icon" onclick="openAgentHelp(event)" title="O que é um Agente?">ℹ️</span></h3>' +
                                        '<p>' + (agent.role || 'Unassigned') + '</p>' +
                                    '</div>' +
                                '</div>' +
                                '<div style="display:flex; align-items:center;">' +
                                    '<div class="tag sec-' + agent.security_level + '" onclick="openSecurityHelp(event)" style="cursor:help;">L' + agent.security_level + '</div>' +
                                    networkHTML +
                                '</div>';

                            const tabsHTML = 
                                '<button class="tab-btn ' + (activeTab === 'tasks' ? 'active' : '') + '" onclick="switchTab(\\\'' + agent.id + '\\\', \\\'tasks\\\')">Tarefas (' + agentTasks.length + ')</button>' +
                                '<button class="tab-btn ' + (activeTab === 'logs' ? 'active' : '') + '" onclick="switchTab(\\\'' + agent.id + '\\\', \\\'logs\\\')">Logs</button>' +
                                '<button class="tab-btn ' + (activeTab === 'details' ? 'active' : '') + '" onclick="switchTab(\\\'' + agent.id + '\\\', \\\'details\\\')">Detalhes</button>';

                            // Only re-render content if tab is active to preserve scroll/selection in others? 
                            // Actually, we just render all content divs, but only show one via CSS.
                            // We need to be careful not to destroy innerHTML of the active tab if possible, 
                            // BUT tasks list changes frequently. 
                            // For simplicity/stability: we will update innerHTML of specific tab content divs if they exist.

                            if (existingCard) {
                                // Update Header (Status/Online might change)
                                const header = existingCard.querySelector('.card-header');
                                if (header.innerHTML !== headerHTML) header.innerHTML = headerHTML;

                                // Update Tabs (Counts might change)
                                const tabs = existingCard.querySelector('.card-tabs');
                                if (tabs.innerHTML !== tabsHTML) tabs.innerHTML = tabsHTML;

                                // Update Content Areas
                                const tasksContainer = document.getElementById('tab-' + agent.id + '-tasks');
                                const newTasksHTML = renderAgentTasks(agentTasks);
                                if (tasksContainer.innerHTML !== newTasksHTML) tasksContainer.innerHTML = newTasksHTML;

                                const logsContainer = document.getElementById('tab-' + agent.id + '-logs');
                                const newLogsHTML = renderAgentLogs(agent.id);
                                if (logsContainer.innerHTML !== newLogsHTML) logsContainer.innerHTML = newLogsHTML;
                                
                                const detailsContainer = document.getElementById('tab-' + agent.id + '-details');
                                const newDetailsHTML = renderAgentDetails(agent);
                                if (detailsContainer.innerHTML !== newDetailsHTML) detailsContainer.innerHTML = newDetailsHTML;

                            } else {
                                // Create New
                                const card = document.createElement('div');
                                card.className = 'agent-card';
                                card.id = 'card-' + agent.id;
                                card.setAttribute('data-agent-id', agent.id);
                                
                                card.innerHTML = 
                                    '<div class="card-header">' +
                                        headerHTML +
                                    '</div>' +
                                    '<div class="card-tabs">' +
                                        tabsHTML +
                                    '</div>' +
                                    '<div class="card-body" id="body-' + agent.id + '">' +
                                        '<div class="tab-content ' + (activeTab === 'tasks' ? 'active' : '') + '" id="tab-' + agent.id + '-tasks">' +
                                            renderAgentTasks(agentTasks) +
                                        '</div>' +
                                        '<div class="tab-content ' + (activeTab === 'logs' ? 'active' : '') + '" id="tab-' + agent.id + '-logs">' +
                                            renderAgentLogs(agent.id) +
                                        '</div>' +
                                        '<div class="tab-content ' + (activeTab === 'details' ? 'active' : '') + '" id="tab-' + agent.id + '-details">' +
                                            renderAgentDetails(agent) +
                                        '</div>' +
                                    '</div>';
                                container.appendChild(card);
                            }
                        });
                    }

                    function renderAgentTasks(tasks) {
                        if (tasks.length === 0) return '<div style="color:var(--text-secondary); text-align:center; padding:20px;">Sem tarefas ativas</div>';
                        return tasks.map(t => 
                            '<div class="mini-task" onclick="showTaskDetails(\\\'' + t.id + '\\\')">' +
                                '<div class="mini-task-header">' +
                                    '<span style="color:var(--accent);">' + t.id.substring(0,8) + '</span>' +
                                    '<span class="tag" style="font-size:0.6em">' + t.priority + '</span>' +
                                '</div>' +
                                '<div class="mini-task-title">' + t.title + '</div>' +
                                '<div class="mini-task-desc">' + (t.description || '') + '</div>' +
                            '</div>'
                        ).join('');
                    }

                    function renderAgentLogs(agentId) {
                        // Filter logs for this agent
                        const logs = state.logs.filter(l => l.from === agentId || l.to === agentId).slice(0, 10);
                        if (logs.length === 0) return '<div style="color:var(--text-secondary); text-align:center; padding:20px;">Sem logs recentes</div>';
                        return logs.map(l => 
                            '<div class="mini-log">' +
                                '<div class="log-dir">' + (l.from === agentId ? 'OUT' : 'IN') + '</div>' +
                                '<div style="flex:1">' + l.type + '</div>' +
                                '<div style="color:var(--text-secondary)">' + new Date(l.timestamp).toLocaleTimeString() + '</div>' +
                            '</div>'
                        ).join('');
                    }

                    function renderAgentDetails(agent) {
                        return '<div style="font-size:0.8rem; line-height:1.6;">' +
                                '<div><strong>ID:</strong> ' + agent.id + '</div>' +
                                '<div><strong>IP:</strong> ' + (agent.network?.ip || 'N/A') + '</div>' +
                                '<div><strong>Capacidades:</strong> ' + (agent.capabilities || []).join(', ') + '</div>' +
                                '<div style="margin-top:10px;">' +
                                    '<strong>Status:</strong> <span style="color:' + (agent.status === 'BUSY' ? 'var(--warning)' : 'var(--success)') + '">' + agent.status + '</span>' +
                                '</div>' +
                            '</div>';
                    }

                    function getAvatarEmoji(role) {
                        if (!role) return '🤖';
                        if (role.includes('Architect')) return '📐';
                        if (role.includes('Security')) return '🛡️';
                        if (role.includes('Analyst')) return '🔎';
                        if (role.includes('Memory')) return '🧠';
                        return '🤖';
                    }

                    function switchTab(agentId, tabName) {
                        // Update State
                        state.ui.activeTabs[agentId] = tabName;

                        // UI Update (Immediate)
                        const body = document.getElementById('body-' + agentId);
                        if (!body) return; // Should not happen

                        body.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
                        
                        const card = body.parentElement;
                        card.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
                        
                        const targetContent = document.getElementById('tab-' + agentId + '-' + tabName);
                        if (targetContent) targetContent.classList.add('active');

                        // Update buttons visual state
                        const btns = card.querySelectorAll('.tab-btn');
                        if (tabName === 'tasks') btns[0].classList.add('active');
                        if (tabName === 'logs') btns[1].classList.add('active');
                        if (tabName === 'details') btns[2].classList.add('active');
                    }
                    window.switchTab = switchTab; // Expose to global scope

                    // --- View Switching ---
                    window.switchMainView = function(view) {
                        document.getElementById('view-dashboard').style.display = view === 'dashboard' ? 'grid' : 'none';
                        document.getElementById('view-comms').style.display = view === 'comms' ? 'grid' : 'none';
                        
                        document.getElementById('nav-dashboard').classList.toggle('active', view === 'dashboard');
                        document.getElementById('nav-comms').classList.toggle('active', view === 'comms');

                        if (view === 'comms') {
                            renderFullCommsFeed();
                            renderCommsSidebar();
                            // Scroll adjustment (if needed)
                        }
                    }

                    // --- Comms Feature ---
                    function renderFullCommsFeed() {
                        const container = document.getElementById('comms-main-feed');
                        // Only render if visible to save resources
                        if (document.getElementById('view-comms').style.display === 'none') return;

                        const messages = state.comms || [];

                        if (messages.length === 0) {
                            container.innerHTML = '<div style="color:var(--text-secondary); text-align:center; margin-top: auto; padding:20px;">Nenhuma mensagem na rede Neural Link.</div>';
                            return;
                        }

                        // Flex-direction: column-reverse means first child is at bottom.
                        // state.comms has newest first (unshift).
                        // So mapping state.comms directly puts newest at bottom. Correct.
                        
                        const html = messages.map(msg => {
                            const isMe = msg.from === 'MOTHERSHIP' || msg.from === 'User' || msg.from === 'Admin'; 
                            const direction = isMe ? 'out' : 'in';
                            const time = new Date(msg.timestamp).toLocaleTimeString();
                            
                            // Markdown-ish
                            let content = msg.content || '';
                            content = content.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                            content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                            // Fix for backticks
                            content = content.replace(/\\x60(.*?)\\x60/g, '<code>$1</code>');
                            content = content.replace(/\\x60/g, '');
                            content = content.replace(/\\n/g, '<br>');

                            const color = isMe ? 'var(--accent)' : 'var(--card-bg)';
                            const align = isMe ? 'flex-end' : 'flex-start';
                            const sender = isMe ? 'MOTHERSHIP (Você)' : (msg.from_agent || msg.from);
                            const borderColor = isMe ? 'transparent' : 'var(--border)';

                            return \`
                                <div style="display:flex; flex-direction:column; align-items:\${align}; margin-bottom:15px; max-width:85%; align-self:\${align};">
                                    <div style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:4px; padding:0 4px;">
                                        \${sender} • \${time}
                                    </div>
                                    <div style="background:\${color}; color:\${isMe ? 'white' : 'var(--text-primary)'}; padding:12px 16px; border-radius:12px; border-\${isMe ? 'bottom-right' : 'bottom-left'}-radius:2px; box-shadow:0 2px 5px rgba(0,0,0,0.1); border:1px solid \${borderColor}; line-height:1.5; word-wrap: break-word;">
                                        \${content}
                                    </div>
                                </div>
                            \`;
                        }).join('');

                        if (container.innerHTML !== html) container.innerHTML = html;
                    }

                    function renderCommsSidebar() {
                        const container = document.getElementById('comms-sidebar-list');
                        if (document.getElementById('view-comms').style.display === 'none') return;
                        
                        const html = state.agents.map(agent => {
                            const isOnline = agent.status !== 'OFFLINE';
                            return \`
                                <div style="display:flex; align-items:center; padding:10px; border-bottom:1px solid var(--border); cursor:pointer; transition: background 0.2s;" onmouseover="this.style.background='var(--hover)'" onmouseout="this.style.background='transparent'">
                                    <div style="position:relative; margin-right:10px;">
                                        <div style="width:32px; height:32px; background:var(--bg); border-radius:50%; display:flex; align-items:center; justify-content:center; border:1px solid var(--border); font-size: 1.2rem;">
                                            \${getAvatarEmoji(agent.role)}
                                        </div>
                                        <div style="width:10px; height:10px; background:\${isOnline ? 'var(--success)' : 'var(--text-secondary)'}; border-radius:50%; position:absolute; bottom:-2px; right:-2px; border:2px solid var(--sidebar-bg);"></div>
                                    </div>
                                    <div style="overflow:hidden;">
                                        <div style="font-weight:600; font-size:0.85rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color: var(--text-primary);">\${agent.name}</div>
                                        <div style="font-size:0.7rem; color:var(--text-secondary);">\${agent.role}</div>
                                    </div>
                                </div>
                            \`;
                        }).join('');

                        if (container.innerHTML !== html) container.innerHTML = html;
                    }

                    window.handleCommsInput = function(e) {
                        if (e.key === 'Enter') sendCommsMessage();
                    }

                    window.sendCommsMessage = async function() {
                        const input = document.getElementById('comms-input');
                        const content = input.value.trim();
                        if (!content) return;

                        try {
                            const res = await fetch('/api/comms/send', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    from: 'MOTHERSHIP',
                                    to: 'BROADCAST',
                                    content: content,
                                    type: 'text'
                                })
                            });
                            
                            const data = await res.json();
                            if (data.success) {
                                input.value = '';
                                // Optimistic update will handle it via WebSocket or next poll
                                updateData();
                            } else {
                                alert('Erro ao enviar: ' + data.error);
                            }
                        } catch (e) {
                            console.error(e);
                            alert('Erro de conexão');
                        }
                    }

                    function renderProtectionFeed() {
                        const container = document.getElementById('protection-feed');
                        const blockedCount = document.getElementById('blocked-count');
                        
                        // Use Security Logs (High Level) and Blocked Network Logs
                        const securityEvents = state.securityLogs || [];
                        const blockedNetwork = (state.logs || []).filter(l => l.status === 'BLOCKED');
                        
                        // Merge and sort by timestamp desc
                        const allEvents = [...securityEvents, ...blockedNetwork].sort((a, b) => {
                            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                        });
                        
                        blockedCount.innerText = allEvents.length;

                        if (allEvents.length === 0) {
                            container.innerHTML = '<div style="color:var(--text-secondary); text-align:center; padding:20px;">Sistema Seguro. Nenhuma ameaça detectada.</div>';
                            return;
                        }

                        container.innerHTML = allEvents.slice(0, 50).map(e => {
                            const isSecLog = e.severity !== undefined;
                            const title = isSecLog ? (e.action || 'SECURITY EVENT') : 'Bloqueio de Rede';
                            const detail = isSecLog ? e.details : (e.reason || 'Blocked connection');
                            const source = isSecLog ? (e.ip || 'Unknown') : (e.from || 'Unknown');
                            // Create a composite ID for network logs since they might not have one or it might duplicate
                            const eventId = e.id || ('net-' + e.timestamp + '-' + source);
                            
                            return \`
                            <div class="shield-event" onclick="showEventDetails('\${eventId}')">
                                <div class="shield-icon">🛡️</div>
                                <div style="flex:1;">
                                    <div style="font-weight:600; color:var(--text-primary);">\${title}</div>
                                    <div style="color:var(--text-secondary); font-size:0.7em;">\${detail}</div>
                                    <div style="color:var(--text-secondary); font-size:0.7em;">Origem: \${source}</div>
                                </div>
                                <div style="font-size:0.7em; color:var(--text-secondary);">\${new Date(e.timestamp).toLocaleTimeString()}</div>
                            </div>
                        \`}).join('');
                    }

                    // ... API Endpoints ...
                    
                    function showTaskDetails(taskId) {
                        const task = state.tasks.find(t => t.id === taskId);
                        if (!task) return;
                        
                        const html = \`
                            <div style="margin-bottom:20px;">
                                <div style="color:var(--text-secondary); font-size:0.8rem;">ID: \${task.id}</div>
                                <h2 style="margin:5px 0; color:var(--accent);">\${task.title}</h2>
                                <div class="tag" style="display:inline-block; margin-top:5px;">\${task.priority}</div>
                            </div>
                            <div style="background:rgba(255,255,255,0.03); padding:15px; border-radius:6px; margin-bottom:20px;">
                                <h4 style="margin-top:0;">Descrição</h4>
                                <p style="white-space: pre-wrap;">\${task.description || 'Sem descrição.'}</p>
                            </div>
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; font-size:0.9rem;">
                                <div><strong>Status:</strong> \${task.status}</div>
                                <div><strong>Assignee:</strong> \${task.assignee || 'Unassigned'}</div>
                                <div><strong>Criado em:</strong> \${new Date(task.timestamp).toLocaleString()}</div>
                                <div><strong>Origem:</strong> \${task.source || 'System'}</div>
                            </div>
                        \`;
                        openInfoModal('Detalhes da Tarefa', html);
                    }

                    function showEventDetails(eventId) {
                        // Search in both security logs and network logs
                        // We need to handle the composite ID logic again if needed, or just finding by ID match
                        let event = state.securityLogs.find(e => e.id === eventId);
                        if (!event) {
                             // Try to match constructed ID for network logs
                             event = state.logs.find(e => {
                                 const constructedId = 'net-' + e.timestamp + '-' + (e.from || 'Unknown');
                                 return constructedId === eventId || e.id === eventId;
                             });
                        }
                        
                        if (!event) return;

                        const isSecLog = event.severity !== undefined;
                        const title = isSecLog ? (event.action || 'SECURITY EVENT') : 'Bloqueio de Rede';
                        const color = isSecLog ? 'var(--shield)' : 'var(--danger)';

                        const html = \`
                            <div style="margin-bottom:20px; border-left: 4px solid \${color}; padding-left:15px;">
                                <div style="color:var(--text-secondary); font-size:0.8rem;">EVENT ID: \${eventId}</div>
                                <h2 style="margin:5px 0; color:var(--text-primary);">\${title}</h2>
                                <div style="color:\${color}; font-weight:bold;">\${isSecLog ? event.severity : 'BLOCKED'}</div>
                            </div>
                            
                            <div style="background:rgba(255,255,255,0.03); padding:15px; border-radius:6px; margin-bottom:20px;">
                                <h4 style="margin-top:0;">Detalhes</h4>
                                <p>\${isSecLog ? event.details : (event.reason || 'Conexão bloqueada pelo SecurityKernel')}</p>
                            </div>

                            <div style="display:grid; grid-template-columns: 1fr; gap:10px; font-size:0.9rem;">
                                <div><strong>Timestamp:</strong> \${new Date(event.timestamp).toLocaleString()}</div>
                                <div><strong>Recurso Alvo:</strong> \${isSecLog ? event.resource : ('To: ' + event.to)}</div>
                                <div><strong>Agente/Origem:</strong> \${isSecLog ? event.agent_role : ('From: ' + event.from)}</div>
                                <div><strong>Endereço IP:</strong> \${event.ip || 'N/A'}</div>
                            </div>
                            
                            <div style="margin-top:20px; font-size:0.8rem; color:var(--text-secondary); border-top:1px solid var(--border); padding-top:10px;">
                                ℹ️ <strong>Explicação:</strong> 
                                \${isSecLog 
                                    ? 'O SecurityKernel detectou um padrão comportamental que viola as regras de segurança estabelecidas (ex: acesso a módulo restrito).' 
                                    : 'A tentativa de comunicação direta entre agentes foi interceptada e bloqueada porque não havia uma relação de confiança estabelecida ou a origem da rede não é segura.'}
                            </div>
                        \`;
                        openInfoModal('Evento de Proteção', html);
                    }

                    function openAgentHelp(e) {
                        e.stopPropagation();
                        const html = \`
                            <p><strong>Agentes</strong> são unidades autônomas de software especializadas em funções específicas (ex: Arquiteto, Desenvolvedor, Segurança).</p>
                            <p>Eles operam de forma independente mas colaborativa, formando um "Enxame" (Swarm) para resolver problemas complexos.</p>
                            <ul>
                                <li><strong>Online/Offline:</strong> Indica se o agente está ativo na rede.</li>
                                <li><strong>Papel (Role):</strong> A especialidade do agente.</li>
                                <li><strong>L1-L10:</strong> Nível de Acesso de Segurança.</li>
                            </ul>
                        \`;
                        openInfoModal('O que é um Agente?', html);
                    }

                    function openSecurityHelp(e) {
                        e.stopPropagation();
                        const html = \`
                            <p><strong>Nível de Segurança (L1 - L10)</strong> define a hierarquia de confiança e acesso dentro do sistema.</p>
                            <ul>
                                <li><strong>L1-L3 (Básico):</strong> Acesso restrito, apenas leitura pública.</li>
                                <li><strong>L4-L6 (Intermediário):</strong> Operações padrão de desenvolvimento.</li>
                                <li><strong>L7-L9 (Avançado):</strong> Acesso a arquitetura e configurações críticas.</li>
                                <li><strong>L10 (Admin/Security):</strong> Controle total e auditoria.</li>
                            </ul>
                            <p>Agentes com nível inferior não podem comandar agentes de nível superior.</p>
                        \`;
                        openInfoModal('Níveis de Segurança', html);
                    }

                    function openNetworkHelp(e) {
                        e.stopPropagation();
                        const html = \`
                            <p><strong>Rede de Confiança (Trust Network)</strong></p>
                            <ul>
                                <li><strong>Localhost (🏠):</strong> Máxima confiança (L10). Acesso direto ao Kernel.</li>
                                <li><strong>VPS / Tailscale (☁️):</strong> Rede Privada Virtual Segura. Confiança Intermediária (L5). 
                                    <br>Requer autenticação adicional para operações críticas.</li>
                                <li><strong>Externa (🌐):</strong> Rede pública/desconhecida. Bloqueio padrão (Zero Trust).</li>
                            </ul>
                            <p>A comunicação entre VPS e Localhost é criptografada e monitorada pelo Security Kernel.</p>
                        \`;
                        openInfoModal('Topologia de Rede', html);
                    }

                    function renderGlobalQueue() {
                        const container = document.getElementById('global-queue');
                        const queueCount = document.getElementById('queue-count');
                        
                        const pendingTasks = state.tasks.filter(t => !t.assignee || t.status === 'queued' || t.status === 'PENDING');
                        queueCount.innerText = pendingTasks.length;

                        if (pendingTasks.length === 0) {
                            container.innerHTML = '<div style="color:var(--text-secondary); text-align:center; padding:20px;">Fila vazia.</div>';
                            return;
                        }

                        container.innerHTML = pendingTasks.map(t => \`
                            <div class="queue-item">
                                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                                    <strong style="font-size:0.8rem;">\${t.title}</strong>
                                    <span class="tag">\${t.priority}</span>
                                </div>
                                <div style="font-size:0.7rem; color:var(--text-secondary);">ID: \${t.id.substring(0,8)}</div>
                            </div>
                        \`).join('');
                    }

                    async function updateData() {
                        try {
                            const [mapRes, taskRes, netRes, secRes, commRes] = await Promise.all([
                                fetch('/api/map'),
                                fetch('/api/tasks'),
                                fetch('/api/network'),
                                fetch('/api/security/logs'),
                                fetch('/api/comms/messages')
                            ]);
                            
                            const teams = await mapRes.json();
                            let flatAgents = [];
                            for (const [team, agents] of Object.entries(teams)) {
                                agents.forEach(a => {
                                    a.team = team;
                                    flatAgents.push(a);
                                });
                            }
                            state.agents = flatAgents;
                            state.tasks = await taskRes.json();
                            state.logs = await netRes.json();
                            state.securityLogs = await secRes.json();
                            const commData = await commRes.json();
                            state.comms = commData.messages || [];

                            renderAgentCards();
                            renderProtectionFeed();
                            renderGlobalQueue();
                            renderCommsFeed();
                            
                            // Update Full Comms View components
                            renderFullCommsFeed();
                            renderCommsSidebar();
                        } catch (e) {
                            console.error('Update failed', e);
                        }
                    }

                    function renderCommsFeed() {
                        const container = document.getElementById('comms-feed');
                        const messages = state.comms || [];

                        if (messages.length === 0) {
                            container.innerHTML = '<div style="color:var(--text-secondary); text-align:center; padding:20px;">Silêncio na rede...</div>';
                            return;
                        }

                        // Sort by timestamp desc (newest first)
                        const sorted = [...messages].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

                        container.innerHTML = sorted.map(msg => {
                            // Basic Markdown parsing
                            let content = msg.content || '';
                            // Escape HTML first
                            content = content.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                            // Bold
                            content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                            // Code (using hex for backtick to avoid template literal issues)
                            content = content.replace(/\\x60(.*?)\\x60/g, '<code>$1</code>');
                            // SAFETY: Remove remaining backticks to prevent template literal breakage
                            content = content.replace(/\\x60/g, '');
                            // Newlines
                            content = content.replace(/\\n/g, '<br>');
                            
                            return \`
                            <div class="comm-msg">
                                <div class="comm-header">
                                    <span class="comm-sender">\${msg.from_agent || msg.from || 'Unknown'}</span>
                                    <span class="comm-time">\${new Date(msg.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <div class="comm-body">\${content}</div>
                            </div>
                            \`;
                        }).join('');
                    }

                    // Loop
                    setInterval(updateData, 2000);
                    updateData();

                </script>
            </body>
            </html>
            `;

            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(html);
            return;
        }

        // ... API Endpoints ...
        if (pathname === '/api/map') {
            try {
                const agents = await registry.listAgents();
                // Group by team for the frontend
                const teams = {};
                agents.forEach(agent => {
                    const agentTeams = (agent.teams && agent.teams.length > 0) ? agent.teams : ['Swarm'];
                    agentTeams.forEach(team => {
                        if (!teams[team]) teams[team] = [];
                        teams[team].push(agent);
                    });
                });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(teams));
            } catch (e) {
                console.error('Failed to list agents', e);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
            return;
        }

        if (pathname === '/api/tasks') {
            try {
                const tasks = await taskManager.listTasks();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(tasks));
            } catch (e) {
                console.error('Failed to list tasks', e);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
            return;
        }

        if (pathname === '/api/network') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(SwarmNetwork.getLogs()));
            return;
        }

        if (pathname === '/api/security/logs') {
            try {
                const logs = await dbManager.getSecurityLogs(50);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(logs));
            } catch (e) {
                console.error('Failed to fetch security logs', e);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify([])); // Fallback
            }
            return;
        }

        if (pathname === '/api/comms/messages') {
            try {
                // Sync first to get latest
                await neuralLink.sync();
                const messages = await dbManager.getMessages(50);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ messages }));
            } catch (e) {
                console.error('Failed to fetch messages', e);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
            return;
        }

        if (pathname === '/api/comms/send' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', async () => {
                try {
                    const data = JSON.parse(body);
                    const msg = {
                        id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                        from: 'MOTHERSHIP', // WebMap User
                        to: data.to || 'broadcast',
                        content: data.content,
                        type: data.type || 'text',
                        timestamp: new Date().toISOString(),
                        read: true
                    };
                    await neuralLink.sendMessage(msg);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, message: msg }));
                } catch (e) {
                    console.error('Failed to send message', e);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: e.message }));
                }
            });
            return;
        }

        if (pathname === '/api/topology') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(SwarmNetwork.getLinks()));
            return;
        }

        res.writeHead(404);
        res.end('Not Found');
    });

    // WebSocket Initialization
    const wss = new WebSocket.Server({ noServer: true });
    
    server.on('upgrade', (request, socket, head) => {
        // Security: Validate origin if needed (though we want remote access)
        // const origin = request.headers['origin'];
        // if (!securityKernel.validateOrigin(origin)) { ... }

        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    });
    
    wss.on('connection', (ws, req) => {
        const ip = req.socket.remoteAddress;
        console.log(`⚡ [WebSocket] New connection from ${ip}`);
        ws.send(JSON.stringify({ type: 'WELCOME', message: 'Connected to Swarm Neural Link' }));
        
        ws.on('message', async (message) => {
            try {
                const msg = JSON.parse(message);
                
                if (msg.type === 'HEARTBEAT') {
                    console.log(`💓 [Heartbeat] ${msg.data.id} from ${ip}`);
                    
                    // Enrich with network info
                    const netStatus = securityKernel.validateNetworkOrigin(ip);
                    msg.data.network = {
                        ip: ip,
                        type: netStatus.network,
                        trustLevel: netStatus.trustLevel,
                        secure: true
                    };
                    
                    if (netStatus.network === 'TAILSCALE') {
                         if (!msg.data.capabilities) msg.data.capabilities = [];
                         if (!msg.data.capabilities.includes('REMOTE_WORKER')) {
                             msg.data.capabilities.push('REMOTE_WORKER');
                         }
                    }

                    await registry.registerAgent(msg.data);
                    broadcast('AGENT_UPDATE', msg.data);
                }
            } catch (e) {
                console.error('❌ [WS Error]', e.message);
            }
        });

        ws.on('error', console.error);
    });

    broadcast = (type, data) => {
        const payload = JSON.stringify({ type, data });
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(payload);
            }
        });
    };

    server.listen(PORT, '0.0.0.0', () => {
        console.log(`🌌 Swarm Existential Map running at http://localhost:${PORT} (Accessible via Tailscale/LAN)`);
        console.log(`📡 [BORG LINK] Listening on 0.0.0.0:${PORT} for inter-agent neural requests.`);
    });
};

startServer();
