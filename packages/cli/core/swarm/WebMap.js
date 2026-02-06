const fs = require('fs');
const http = require('http');
const path = require('path');
const SwarmRegistry = require('../../core/swarm/Registry');
const TaskManager = require('./TaskManager');

const PORT = 3456; // Swarm Map Port

const startServer = () => {
    const registry = new SwarmRegistry();
    const taskManager = new TaskManager();

    const server = http.createServer((req, res) => {
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }

        if (req.url === '/') {
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
                        grid-template-columns: 2fr 1fr;
                        gap: 1px;
                        flex: 1;
                        overflow: hidden;
                        background: var(--border);
                    }

                    .panel {
                        background: var(--bg);
                        overflow-y: auto;
                        padding: 30px;
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
                        font-size: 0.9rem;
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
                    
                    .task-title { font-weight: 600; font-size: 0.9rem; margin-bottom: 4px; }
                    .task-meta { font-size: 0.75rem; color: var(--text-secondary); display: flex; justify-content: space-between; }
                    .task-status { 
                        font-size: 0.7rem; 
                        padding: 2px 6px; 
                        border-radius: 10px; 
                        background: var(--border);
                        text-transform: uppercase;
                    }
                    .status-PENDING { color: var(--text-secondary); }
                    .status-IN_PROGRESS { color: var(--accent); background: rgba(88, 166, 255, 0.1); }
                    .status-COMPLETED { color: var(--success); background: rgba(35, 134, 54, 0.1); }

                    /* Animation */
                    @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
                    .updating { animation: pulse 1s infinite; }
                </style>
            </head>
            <body>
                <header>
                    <h1>🌌 Swarm Existential Map</h1>
                    <div id="connection-status" class="tag">Online</div>
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

                    <!-- Right: Global Tasks -->
                    <div class="panel" id="tasks-panel">
                        <div class="panel-header">
                            <span class="panel-title">Global Task Queue</span>
                            <span class="tag" id="task-count">0 Tasks</span>
                        </div>
                        <div id="tasks-content">Loading tasks...</div>
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

                    async function updateData() {
                        try {
                            // Fetch Map
                            const mapRes = await fetch('/api/map');
                            const teams = await mapRes.json();
                            
                            // Fetch Tasks
                            const taskRes = await fetch('/api/tasks');
                            const tasks = await taskRes.json();

                            renderMap(teams);
                            renderTasks(tasks);
                            
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
        } else if (req.url === '/api/map') {
            const agents = registry.listAgents();
            const teams = {};
            const identityPath = path.join(process.cwd(), '.ai-workspace', 'identity.json');
            let localTeams = ['Freelancers'];
            
            try {
                if (fs.existsSync(identityPath)) {
                    const id = JSON.parse(fs.readFileSync(identityPath, 'utf-8'));
                    if (id.teams) localTeams = id.teams;
                }
            } catch (e) {}

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
        } else if (req.url === '/api/tasks') {
            const tasks = taskManager.listTasks();
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(tasks));
        } else {
            res.writeHead(404);
            res.end('Not Found');
        }
    });

    server.listen(PORT, () => {
        console.log(`🌌 Swarm Map Web Interface running at http://localhost:${PORT}`);
    });
};

module.exports = startServer;
