const fs = require('fs');
const http = require('http');
const path = require('path');
const SwarmRegistry = require('../../core/swarm/Registry');
const TaskManager = require('./TaskManager');
const SecurityKernel = require('./SecurityKernel');
const SwarmNetwork = require('./SwarmNetwork');

const PORT = 3456; // Swarm Map Port

const startServer = () => {
    const registry = new SwarmRegistry();
    const taskManager = new TaskManager();
    const securityKernel = new SecurityKernel();

    const server = http.createServer((req, res) => {
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
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }

        const url = new URL(req.url, `http://${req.headers.host}`);
        const pathname = url.pathname;

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
                        --bg: #0f1115;
                        --card-bg: #161b22;
                        --border: #30363d;
                        --text-primary: #c9d1d9;
                        --text-secondary: #8b949e;
                        --accent: #58a6ff;
                        --success: #238636;
                        --danger: #da3633;
                        --warning: #d29922;
                        --info: #3fb950;
                    }
                    
                    body { 
                        background: var(--bg); 
                        color: var(--text-primary); 
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
                        padding: 0; 
                        margin: 0;
                        line-height: 1.5;
                        height: 100vh;
                        display: flex;
                        flex-direction: column;
                    }

                    header {
                        padding: 20px 40px;
                        border-bottom: 1px solid var(--border);
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        background: rgba(15, 17, 21, 0.9);
                    }

                    h1 {
                        font-weight: 200;
                        letter-spacing: -1px;
                        margin: 0;
                        font-size: 1.5rem;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }

                    .container {
                        display: grid;
                        grid-template-columns: 2fr 1.2fr 1.2fr;
                        gap: 1px;
                        flex: 1;
                        overflow: hidden;
                        background: var(--border);
                    }

                    .panel {
                        background: var(--bg);
                        overflow-y: auto;
                        padding: 20px;
                    }

                    .panel-header {
                        margin-bottom: 20px;
                        padding-bottom: 10px;
                        border-bottom: 1px solid var(--border);
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }

                    .panel-title {
                        font-size: 0.8rem;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        color: var(--text-secondary);
                        font-weight: 600;
                    }

                    /* Map Styles */
                    .holon { 
                        background: var(--card-bg);
                        border: 1px solid var(--border);
                        border-radius: 8px;
                        margin-bottom: 24px;
                        overflow: hidden;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                    }
                    
                    .holon-header {
                        background: rgba(255,255,255,0.03);
                        padding: 10px 16px;
                        border-bottom: 1px solid var(--border);
                    }

                    .holon h2 { 
                        margin: 0; 
                        font-size: 0.9rem;
                        color: var(--accent);
                        font-weight: 600;
                    }

                    .agent { 
                        display: grid; 
                        grid-template-columns: 2fr 1fr 1.5fr;
                        gap: 10px;
                        padding: 12px 16px;
                        border-bottom: 1px solid var(--border);
                        align-items: center;
                        font-size: 0.85rem;
                    }
                    .agent:last-child { border-bottom: none; }

                    .agent-id { font-weight: 600; color: var(--text-primary); }
                    .agent-role { font-size: 0.8em; color: var(--text-secondary); display: block; }

                    .tag {
                        display: inline-flex;
                        align-items: center;
                        padding: 2px 6px;
                        border-radius: 4px;
                        font-size: 0.7em;
                        font-weight: 600;
                        background: rgba(255,255,255,0.1);
                        color: var(--text-primary);
                        margin-right: 4px;
                    }
                    .tag.sec-10 { background: rgba(218, 54, 51, 0.2); color: #ff7b72; }
                    .tag.sec-5 { background: rgba(210, 153, 34, 0.2); color: #d29922; }
                    .tag.sec-1 { background: rgba(35, 134, 54, 0.2); color: #7ee787; }
                    
                    .status-indicator { display: flex; align-items: center; gap: 6px; }
                    .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--text-secondary); }
                    .status-BUSY .dot { background: var(--warning); box-shadow: 0 0 8px rgba(210, 153, 34, 0.4); }
                    .status-IDLE .dot { background: var(--success); }

                    /* Task Styles */
                    .task-card {
                        background: var(--card-bg);
                        border: 1px solid var(--border);
                        border-radius: 6px;
                        padding: 12px;
                        margin-bottom: 12px;
                        position: relative;
                    }
                    
                    .task-card:hover { border-color: var(--accent); }
                    
                    .task-title { font-weight: 600; font-size: 0.85rem; margin-bottom: 4px; }
                    .task-meta { font-size: 0.7rem; color: var(--text-secondary); display: flex; justify-content: space-between; }
                    .task-status { 
                        font-size: 0.65rem; 
                        padding: 2px 6px; 
                        border-radius: 10px; 
                        background: var(--border);
                        text-transform: uppercase;
                    }
                    .status-PENDING { color: var(--text-secondary); }
                    .status-IN_PROGRESS { color: var(--accent); background: rgba(88, 166, 255, 0.1); }
                    .status-COMPLETED { color: var(--success); background: rgba(35, 134, 54, 0.1); }

                    /* Metrics Styles */
                    .metrics-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 10px;
                        margin-bottom: 15px;
                        padding-bottom: 15px;
                        border-bottom: 1px solid var(--border);
                    }
                    .metric-card {
                        background: rgba(255,255,255,0.03);
                        padding: 10px;
                        border-radius: 6px;
                        text-align: center;
                    }
                    .metric-val { font-size: 1.2rem; font-weight: 700; color: var(--text-primary); }
                    .metric-label { font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; }
                    .metric-danger { color: var(--danger); }
                    .metric-success { color: var(--success); }

                    /* Network Log Styles */
                    .log-entry {
                        font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
                        font-size: 0.75rem;
                        padding: 8px 0;
                        border-bottom: 1px solid rgba(48, 54, 61, 0.5);
                        display: grid;
                        grid-template-columns: 60px 1fr;
                        gap: 10px;
                    }
                    .log-time { color: var(--text-secondary); }
                    .log-content { overflow: hidden; text-overflow: ellipsis; }
                    .log-status-BLOCKED { color: var(--danger); }
                    .log-status-DELIVERED { color: var(--success); }
                    .log-status-DROPPED { color: var(--warning); }
                    .log-arrow { color: var(--text-secondary); margin: 0 4px; }

                    /* Modal Styles */
                    .modal-overlay {
                        position: fixed;
                        top: 0; left: 0; right: 0; bottom: 0;
                        background: rgba(0,0,0,0.7);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 1000;
                        opacity: 0;
                        pointer-events: none;
                        transition: opacity 0.2s;
                    }
                    .modal-overlay.active { opacity: 1; pointer-events: all; }
                    
                    .modal {
                        background: var(--card-bg);
                        border: 1px solid var(--border);
                        border-radius: 8px;
                        width: 600px;
                        max-width: 90vw;
                        max-height: 80vh;
                        display: flex;
                        flex-direction: column;
                        box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                    }
                    
                    .modal-header {
                        padding: 20px;
                        border-bottom: 1px solid var(--border);
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    
                    .modal-body { padding: 20px; overflow-y: auto; }
                    
                    .modal-footer {
                        padding: 15px 20px;
                        border-top: 1px solid var(--border);
                        background: rgba(0,0,0,0.2);
                        text-align: right;
                    }

                    .close-btn { background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 1.2rem; }
                    .close-btn:hover { color: var(--text-primary); }

                    /* Tooltip */
                    .tooltip { position: relative; cursor: help; }
                    .tooltip:hover::after {
                        content: attr(data-tip);
                        position: absolute;
                        bottom: 100%;
                        left: 50%;
                        transform: translateX(-50%);
                        background: #000;
                        border: 1px solid var(--border);
                        padding: 5px 10px;
                        border-radius: 4px;
                        font-size: 0.75rem;
                        white-space: nowrap;
                        z-index: 10;
                        pointer-events: none;
                        margin-bottom: 5px;
                    }

                    /* Command Center */
                    .command-bar {
                        padding: 10px 20px;
                        background: var(--card-bg);
                        border-top: 1px solid var(--border);
                        display: flex;
                        gap: 10px;
                    }
                    .cmd-input {
                        flex: 1;
                        background: var(--bg);
                        border: 1px solid var(--border);
                        color: var(--text-primary);
                        padding: 8px 12px;
                        border-radius: 4px;
                        font-family: monospace;
                    }
                    .cmd-btn {
                        background: var(--accent);
                        color: #fff;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: 600;
                    }
                    .cmd-btn:hover { opacity: 0.9; }
                </style>
            </head>
            <body>
                <header>
                    <h1>🌌 Swarm Existential Map</h1>
                    <div style="display:flex; gap:10px; align-items:center;">
                        <div id="connection-status" class="tag">Online</div>
                        <div class="tag" style="border: 1px solid ${securityStatus.trusted ? 'var(--success)' : 'var(--danger)'}">
                            🛡️ ${securityStatus.network}
                        </div>
                    </div>
                </header>
                
                <div class="container">
                    <!-- Left: Agents Map -->
                    <div class="panel" id="agents-panel">
                        <div class="panel-header">
                            <span class="panel-title">Active Holons & Agents</span>
                            <span class="tag" id="agent-count">0 Agents</span>
                        </div>
                        <div id="map-content">Detecting agents...</div>
                    </div>

                    <!-- Center: Network Logs -->
                    <div class="panel" id="network-panel">
                        <div class="panel-header">
                            <span class="panel-title">P2P Secure Network</span>
                            <span class="tag" id="net-status">Active</span>
                        </div>
                        <div id="network-content">Listening for packets...</div>
                    </div>

                    <!-- Right: Global Tasks -->
                    <div class="panel" id="tasks-panel">
                        <div class="panel-header">
                            <span class="panel-title">Global Task Queue</span>
                            <span class="tag" id="task-count">0 Tasks</span>
                        </div>
                        <div id="tasks-content">Loading tasks...</div>
                    </div>
                </div>

                <!-- Divine Intervention -->
                <div class="command-bar">
                    <input type="text" id="cmd-input" class="cmd-input" placeholder="⚡ Divine Intervention: Inject Command (e.g., /create title:Refactor priority:high)">
                    <button class="cmd-btn" onclick="sendCommand()">INJECT</button>
                </div>

                <!-- Task Modal -->
                <div id="task-modal" class="modal-overlay">
                    <div class="modal">
                        <div class="modal-header">
                            <h3 style="margin:0" id="modal-title">Task Details</h3>
                            <button class="close-btn" onclick="closeModal()">×</button>
                        </div>
                        <div class="modal-body" id="modal-body">
                            <!-- Content -->
                        </div>
                        <div class="modal-footer">
                            <span style="font-size:0.8rem; color:var(--text-secondary)">Task Traceability System v1.0</span>
                        </div>
                    </div>
                </div>

                <script>
                    function renderTag(cls, text) {
                        return '<span class="tag ' + cls + '">' + text + '</span>';
                    }

                    function renderAgent(agent) {
                        const roles = (agent.capabilities || [])
                            .filter(c => c.startsWith('ROLE:'))
                            .map(c => c.replace('ROLE:', ''))
                            .join(', ') || 'Generalist';
                        
                        const isBusy = agent.current_task && agent.current_task !== 'IDLE';
                        const statusClass = isBusy ? 'status-BUSY' : 'status-IDLE';
                        const statusText = isBusy ? agent.current_task.substring(0, 30) : 'Idle';

                        return \`
                            <div class="agent-id">
                                <span>\${agent.id.substring(0, 20)}</span>
                                <span class="agent-role">\${roles}</span>
                            </div>
                            <div>
                                \${renderTag('sec-' + agent.security_level, 'L' + agent.security_level)}
                                \${renderTag('net-' + (agent.network?.provider || 'LOCAL'), agent.network?.provider || 'LOCAL')}
                            </div>
                            <div class="status-indicator \${statusClass}">
                                <div class="dot"></div>
                                <span>\${statusText}</span>
                            </div>
                        \`;
                    }

                    function renderTask(task) {
                        const secLevel = task.required_security_level || 1;
                        return \`
                            <div class="task-card">
                                <div class="task-title">
                                    \${task.title}
                                    <span class="tag sec-\${secLevel}" style="font-size:0.7em; margin-left:8px;">L\${secLevel}</span>
                                </div>
                                <div class="task-meta">
                                    <span>\${task.assignee ? '👤 ' + task.assignee.substring(0,10) : 'Unassigned'}</span>
                                    <span class="task-status status-\${task.status}">\${task.status}</span>
                                </div>
                            </div>
                        \`;
                    }

                    function renderLog(log) {
                        const date = new Date(log.timestamp);
                        const time = date.toLocaleTimeString().split(' ')[0];
                        return \`
                            <div class="log-entry">
                                <span class="log-time">\${time}</span>
                                <div class="log-content">
                                    <span class="log-status-\${log.status}">[\${log.status}]</span>
                                    \${log.from.substring(0,8)} <span class="log-arrow">→</span> \${log.to.substring(0,8)}
                                    <br>
                                    <span style="color:var(--text-secondary)">\${log.type}: \${log.reason || 'OK'}</span>
                                </div>
                            </div>
                        \`;
                    }

                    async function updateData() {
                        try {
                            // Fetch Map
                            const mapRes = await fetch('/api/map');
                            const teams = await mapRes.json();
                            
                            // Fetch Tasks
                            const taskRes = await fetch('/api/tasks');
                            const tasks = await taskRes.json();

                            // Fetch Network Logs
                            const netRes = await fetch('/api/network');
                            const logs = await netRes.json();

                            renderMap(teams);
                            renderTasks(tasks);
                            renderNetwork(logs);
                            
                            document.getElementById('connection-status').innerText = 'Live';
                            document.getElementById('connection-status').style.color = 'var(--success)';
                        } catch (e) {
                            console.error('Connection lost', e);
                            document.getElementById('connection-status').innerText = 'Disconnected';
                            document.getElementById('connection-status').style.color = 'var(--danger)';
                        }
                    }

                    function renderMap(teams) {
                        const container = document.getElementById('map-content');
                        let html = '';
                        let count = 0;
                        
                        for (const [team, agents] of Object.entries(teams)) {
                            count += agents.length;
                            html += \`
                                <div class="holon">
                                    <div class="holon-header">
                                        <h2>🔷 \${team}</h2>
                                    </div>
                            \`;
                            agents.forEach(agent => {
                                html += '<div class="agent">' + renderAgent(agent) + '</div>';
                            });
                            html += '</div>';
                        }
                        
                        if (container.innerHTML !== html) container.innerHTML = html;
                        document.getElementById('agent-count').innerText = count + ' Agents';
                    }

                    function renderTasks(tasks) {
                        const container = document.getElementById('tasks-content');
                        let html = '';
                        
                        if (tasks.length === 0) {
                            html = '<div style="color:var(--text-secondary); text-align:center; padding:20px;">No active tasks</div>';
                        } else {
                            tasks.forEach(task => {
                                html += renderTask(task);
                            });
                        }

                        if (container.innerHTML !== html) container.innerHTML = html;
                        document.getElementById('task-count').innerText = tasks.length + ' Tasks';
                    }

                    function renderNetwork(logs) {
                        const container = document.getElementById('network-content');
                        let html = '';
                        
                        // Calculate Metrics
                        const total = logs.length;
                        const blocked = logs.filter(l => l.status === 'BLOCKED').length;
                        const delivered = logs.filter(l => l.status === 'DELIVERED').length;
                        const blockedRate = total > 0 ? Math.round((blocked / total) * 100) : 0;
                        
                        html += \`
                            <div class="metrics-grid">
                                <div class="metric-card">
                                    <div class="metric-val metric-success">\${delivered}</div>
                                    <div class="metric-label">Allowed Packets</div>
                                </div>
                                <div class="metric-card">
                                    <div class="metric-val metric-danger">\${blocked} <span style="font-size:0.8em">(\${blockedRate}%)</span></div>
                                    <div class="metric-label">Blocked Attempts</div>
                                </div>
                            </div>
                        \`;

                        if (logs.length === 0) {
                            html += '<div style="color:var(--text-secondary); text-align:center; padding:20px;">Silence on the wire...</div>';
                        } else {
                            html += '<div style="max-height: 400px; overflow-y: auto;">';
                            logs.slice(0, 50).forEach(log => {
                                html += renderLog(log);
                            });
                            html += '</div>';
                        }

                        if (container.innerHTML !== html) container.innerHTML = html;
                    }

                    // Initial load
                    updateData();
                    // Poll
                    setInterval(updateData, 2000);
                </script>
            </body>
            </html>
            `;
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(html);
        } else if (pathname === '/api/command') {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', () => {
                try {
                    const cmd = JSON.parse(body);
                    console.log('⚡ [Divine Intervention] Received:', cmd);
                    
                    let result = { status: 'ok', message: 'Command received' };
                    
                    // Process Command
                    if (cmd.text.startsWith('/create')) {
                        // Ex: /create title:MyTask priority:high
                        const parts = cmd.text.replace('/create ', '').split(' ');
                        let title = 'Manual Task';
                        let priority = 'medium';
                        
                        parts.forEach(p => {
                            if (p.startsWith('title:')) title = p.split(':')[1].replace(/_/g, ' ');
                            if (p.startsWith('priority:')) priority = p.split(':')[1];
                        });
                        
                        taskManager.createTask(title, 'Created via Divine Intervention', priority, { origin: 'WebMap' }, 10, 'human-admin');
                        result.message = `Task "${title}" created.`;
                    } else if (cmd.text === '/clear') {
                        taskManager.deleteAllTasks();
                        result.message = 'All tasks cleared.';
                    } else {
                        result.status = 'error';
                        result.message = 'Unknown command. Try /create or /clear';
                    }

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(result));
                } catch (e) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ error: 'Invalid JSON' }));
                }
            });
            return;
        } else if (pathname === '/api/map') {
            const agents = registry.listAgents();
            const teams = {};
            
            agents.forEach(agent => {
                let team = 'Freelancers';
                const teamCap = (agent.capabilities || []).find(c => c.startsWith('TEAM:'));
                if (teamCap) team = teamCap.replace('TEAM:', '');
                else if (agent.name === 'Prime Agent' || agent.id.includes('openclaw')) team = 'Core-System';

                if (!teams[team]) teams[team] = [];
                teams[team].push(agent);
            });
            
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(teams));
        } else if (pathname === '/api/tasks') {
            const tasks = taskManager.listTasks();
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(tasks));
        } else if (pathname === '/api/network') {
            const logs = SwarmNetwork.getLogs();
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(logs));
        } else {
            res.writeHead(404);
            res.end('Not Found');
        }
    });

    server.listen(PORT, () => {
        console.log(`🌌 Swarm Map Web Interface running at http://localhost:${PORT}`);
    });
};

if (require.main === module) {
    startServer();
}

module.exports = startServer;
