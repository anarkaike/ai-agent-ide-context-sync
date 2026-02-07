const fs = require('fs');
const http = require('http');
const path = require('path');
const SwarmRegistry = require('../../core/swarm/Registry');
const TaskManager = require('./TaskManager');
const SecurityKernel = require('./SecurityKernel');
const SwarmNetwork = require('./SwarmNetwork');
const DatabaseManager = require('./DatabaseManager');

const PORT = 3456; // Swarm Map Port

const startServer = async () => {
    const dbManager = new DatabaseManager();
    await dbManager.init();
    
    const registry = new SwarmRegistry();
    const taskManager = new TaskManager();
    const securityKernel = new SecurityKernel(dbManager);

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

        // 🛡️ ENFORCE SECURITY ON API ROUTES
        if (pathname.startsWith('/api/') && !securityStatus.trusted) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'ACCESS_DENIED', reason: 'UNTRUSTED_NETWORK_ORIGIN' }));
            return;
        }

        if (pathname === '/' || pathname === '/index.html') {
            // Serve HTML
            const html = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>vc 
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
                        --hover: #21262d;
                    }
                    
                    body { 
                        background: var(--bg); 
                        color: var(--text-primary); 
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
                        padding: 0; 
                        margin: 0;
                        line-height: 1.5;
                        height: 100vh;
                        display: flex;
                        flex-direction: column;
                        overflow: hidden;
                    }

                    /* Scrollbar */
                    ::-webkit-scrollbar { width: 8px; height: 8px; }
                    ::-webkit-scrollbar-track { background: var(--bg); }
                    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
                    ::-webkit-scrollbar-thumb:hover { background: var(--text-secondary); }

                    header {
                        padding: 15px 25px;
                        border-bottom: 1px solid var(--border);
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        background: rgba(22, 27, 34, 0.95);
                        backdrop-filter: blur(10px);
                        z-index: 100;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                    }

                    h1 {
                        font-weight: 300;
                        letter-spacing: -0.5px;
                        margin: 0;
                        font-size: 1.4rem;
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        color: var(--text-primary);
                    }

                    .container {
                        display: grid;
                        grid-template-columns: 35% 30% 35%; /* Adjusted layout */
                        gap: 1px;
                        flex: 1;
                        overflow: hidden;
                        background: var(--border);
                    }

                    .panel {
                        background: var(--bg);
                        overflow: hidden;
                        display: flex;
                        flex-direction: column;
                        min-width: 0; /* Fix flex child overflow */
                    }

                    .panel-header {
                        padding: 15px;
                        border-bottom: 1px solid var(--border);
                        background: var(--card-bg);
                    }

                    .panel-title-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 10px;
                    }

                    .panel-title {
                        font-size: 0.85rem;
                        text-transform: uppercase;
                        letter-spacing: 1.2px;
                        color: var(--accent);
                        font-weight: 700;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }

                    /* Filters */
                    .filter-bar {
                        display: flex;
                        gap: 8px;
                        flex-wrap: wrap;
                    }

                    .filter-input {
                        background: var(--bg);
                        border: 1px solid var(--border);
                        color: var(--text-primary);
                        padding: 6px 10px;
                        border-radius: 4px;
                        font-size: 0.75rem;
                        flex: 1;
                        min-width: 80px;
                        outline: none;
                        transition: border-color 0.2s;
                    }
                    .filter-input:focus { border-color: var(--accent); }
                    
                    select.filter-input { cursor: pointer; }

                    .panel-content {
                        flex: 1;
                        overflow-y: auto;
                        overflow-x: auto;
                        padding: 0;
                    }

                    /* Data Tables */
                    .data-table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 0.8rem;
                        white-space: nowrap;
                    }

                    .data-table th {
                        position: sticky;
                        top: 0;
                        background: var(--card-bg);
                        text-align: left;
                        padding: 10px 12px;
                        color: var(--text-secondary);
                        font-weight: 600;
                        border-bottom: 1px solid var(--border);
                        cursor: pointer;
                        user-select: none;
                        z-index: 10;
                    }
                    .data-table th:hover { color: var(--text-primary); background: var(--hover); }

                    .data-table td {
                        padding: 8px 12px;
                        border-bottom: 1px solid rgba(48, 54, 61, 0.4);
                        color: var(--text-primary);
                    }

                    .data-table tr:hover { background: rgba(88, 166, 255, 0.05); }
                    .data-table tr:last-child td { border-bottom: none; }

                    /* Specific Columns */
                    .col-id { font-family: monospace; color: var(--text-secondary); width: 60px; }
                    .col-status { width: 80px; }
                    .col-pri { width: 60px; }
                    
                    /* Tags & Badges */
                    .tag {
                        display: inline-flex;
                        align-items: center;
                        padding: 2px 8px;
                        border-radius: 12px;
                        font-size: 0.7em;
                        font-weight: 600;
                        background: rgba(255,255,255,0.05);
                        color: var(--text-primary);
                        border: 1px solid transparent;
                    }
                    .tag.sec-10 { background: rgba(218, 54, 51, 0.15); color: #ff7b72; border-color: rgba(218, 54, 51, 0.3); }
                    .tag.sec-8, .tag.sec-9 { background: rgba(210, 153, 34, 0.15); color: #d29922; }
                    .tag.sec-1 { background: rgba(35, 134, 54, 0.15); color: #7ee787; border-color: rgba(35, 134, 54, 0.3); }
                    
                    .badge {
                        padding: 2px 6px;
                        border-radius: 4px;
                        font-size: 0.7em;
                        font-weight: 600;
                        text-transform: uppercase;
                    }
                    .badge-PENDING { background: rgba(139, 148, 158, 0.2); color: #8b949e; }
                    .badge-IN_PROGRESS { background: rgba(88, 166, 255, 0.2); color: #58a6ff; }
                    .badge-COMPLETED { background: rgba(35, 134, 54, 0.2); color: #3fb950; }
                    .badge-BLOCKED { background: rgba(218, 54, 51, 0.2); color: #da3633; }
                    
                    .badge-high { color: #da3633; }
                    .badge-medium { color: #d29922; }
                    .badge-low { color: #3fb950; }

                    /* Network Logs specific */
                    .log-status-BLOCKED { color: var(--danger); font-weight: bold; }
                    .log-status-DELIVERED { color: var(--success); }
                    .log-status-DROPPED { color: var(--warning); }
                    
                    /* Metrics */
                    .metrics-bar {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 10px;
                        margin-bottom: 10px;
                    }
                    .metric-box {
                        background: rgba(255,255,255,0.03);
                        padding: 8px;
                        border-radius: 4px;
                        text-align: center;
                        border: 1px solid rgba(255,255,255,0.05);
                    }
                    .metric-val { font-size: 1.1rem; font-weight: 700; }
                    .metric-lbl { font-size: 0.65rem; text-transform: uppercase; color: var(--text-secondary); margin-top: 2px; }

                    /* Modal */
                    .modal-overlay {
                        position: fixed;
                        top: 0; left: 0; right: 0; bottom: 0;
                        background: rgba(0,0,0,0.8);
                        backdrop-filter: blur(4px);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 1000;
                        opacity: 0;
                        pointer-events: none;
                        transition: all 0.2s ease;
                    }
                    .modal-overlay.active { opacity: 1; pointer-events: all; }
                    
                    .modal {
                        background: #1c2128;
                        border: 1px solid var(--border);
                        border-radius: 12px;
                        width: 700px;
                        max-width: 95vw;
                        max-height: 85vh;
                        display: flex;
                        flex-direction: column;
                        box-shadow: 0 30px 60px rgba(0,0,0,0.6);
                    }
                    
                    .modal-header { padding: 20px 24px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
                    .modal-body { padding: 24px; overflow-y: auto; }
                    .modal-footer { padding: 16px 24px; border-top: 1px solid var(--border); background: rgba(0,0,0,0.2); text-align: right; }

                    /* Command Bar */
                    .command-container {
                        padding: 12px 20px;
                        background: var(--card-bg);
                        border-top: 1px solid var(--border);
                        display: flex;
                        gap: 12px;
                        align-items: center;
                    }
                    .cmd-input-lg {
                        flex: 1;
                        background: var(--bg);
                        border: 1px solid var(--border);
                        color: var(--accent);
                        padding: 10px 16px;
                        border-radius: 6px;
                        font-family: 'SF Mono', monospace;
                        font-size: 0.9rem;
                    }
                    .cmd-btn-lg {
                        background: var(--accent);
                        color: #fff;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        transition: filter 0.2s;
                    }
                    .cmd-btn-lg:hover { filter: brightness(1.1); }

                    /* Tooltip */
                    .tooltip { position: relative; cursor: help; border-bottom: 1px dotted var(--text-secondary); }
                    .tooltip:hover::after {
                        content: attr(data-tip);
                        position: absolute;
                        bottom: 100%; left: 50%; transform: translateX(-50%);
                        background: #000;
                        border: 1px solid var(--border);
                        padding: 6px 12px;
                        border-radius: 6px;
                        font-size: 0.75rem;
                        white-space: nowrap;
                        z-index: 100;
                        pointer-events: none;
                        margin-bottom: 8px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                    }

                    /* Expandable Rows */
                    .data-table tr.main-row { cursor: pointer; transition: background 0.2s; }
                    .data-table tr.main-row:hover { background: rgba(255,255,255,0.02); }
                    .data-table tr.expanded { background: rgba(88, 166, 255, 0.05); border-left: 3px solid var(--accent); }
                    
                    .details-row { display: none; background: rgba(0,0,0,0.2); }
                    .details-row.show { display: table-row; animation: fadeIn 0.3s ease; }
                    .details-content { padding: 15px 20px; font-family: 'SF Mono', monospace; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.6; }
                    
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                </style>
            </head>
            <body>
                <header>
                    <h1>
                        <span style="font-size: 1.8rem;">🌌</span> 
                        <div>
                            Swarm Existential Map
                            <div style="font-size: 0.7rem; color: var(--text-secondary); font-weight: 400; letter-spacing: 1px;">REAL-TIME OBSERVABILITY & CONTROL</div>
                        </div>
                    </h1>
                    <div style="display:flex; gap:12px; align-items:center;">
                        <div id="connection-status" class="tag">Online</div>
                        <div class="tag" style="border: 1px solid ${securityStatus.trusted ? 'var(--success)' : 'var(--danger)'}">
                            🛡️ ${securityStatus.network}
                        </div>
                    </div>
                </header>
                
                <div class="container">
                    <!-- 1. Agents Panel -->
                    <div class="panel" id="agents-panel">
                        <div class="panel-header">
                            <div class="panel-title-row">
                                <span class="panel-title">👥 Active Agents</span>
                                <span class="tag" id="agent-count">0</span>
                            </div>
                            <div class="filter-bar">
                                <input type="text" id="filter-agent-text" class="filter-input" placeholder="Search ID/Role...">
                                <select id="filter-agent-team" class="filter-input">
                                    <option value="">All Teams</option>
                                    <option value="Core-System">Core-System</option>
                                    <option value="Freelancers">Freelancers</option>
                                </select>
                                <select id="filter-agent-sec" class="filter-input" style="width: 70px;">
                                    <option value="">Lvl</option>
                                    <option value="10">L10</option>
                                    <option value="5">L5</option>
                                    <option value="1">L1</option>
                                </select>
                            </div>
                        </div>
                        <div class="panel-content" id="map-content">
                            <!-- Table inserted by JS -->
                        </div>
                    </div>

                    <!-- 2. Network Logs -->
                    <div class="panel" id="network-panel">
                        <div class="panel-header">
                            <div class="panel-title-row">
                                <span class="panel-title">📡 Network Grid</span>
                                <div style="display:flex; gap:5px;">
                                    <button id="btn-view-traffic" class="tag" style="cursor:pointer; background:var(--accent); color:#fff; border:none;" onclick="toggleNetView('TRAFFIC')">TRAFFIC</button>
                                    <button id="btn-view-security" class="tag" style="cursor:pointer; opacity:0.5; border:1px solid var(--accent); color:var(--accent);" onclick="toggleNetView('SECURITY')">ALERTS</button>
                                    <button id="btn-view-topology" class="tag" style="cursor:pointer; opacity:0.5; border:1px solid var(--accent); color:var(--accent);" onclick="toggleNetView('TOPOLOGY')">GRAPH</button>
                                </div>
                            </div>
                            <div class="metrics-bar" id="net-metrics">
                                <!-- Metrics -->
                            </div>
                            <div class="filter-bar">
                                <input type="text" id="filter-net-text" class="filter-input" placeholder="Search Source/Target...">
                                <select id="filter-net-status" class="filter-input">
                                    <option value="">All Status</option>
                                    <option value="DELIVERED">Delivered</option>
                                    <option value="BLOCKED">Blocked</option>
                                    <option value="DROPPED">Dropped</option>
                                </select>
                            </div>
                        </div>
                        <div class="panel-content" id="network-content">
                            <!-- Table inserted by JS -->
                        </div>
                    </div>

                    <!-- 3. Global Tasks -->
                    <div class="panel" id="tasks-panel">
                        <div class="panel-header">
                            <div class="panel-title-row">
                                <span class="panel-title">📋 Task Matrix</span>
                                <span class="tag" id="task-count">0</span>
                            </div>
                            <div class="filter-bar">
                                <input type="text" id="filter-task-text" class="filter-input" placeholder="Search Tasks...">
                                <select id="filter-task-status" class="filter-input">
                                    <option value="">All Status</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="COMPLETED">Completed</option>
                                    <option value="BLOCKED">Blocked</option>
                                </select>
                                <select id="filter-task-pri" class="filter-input" style="width: 80px;">
                                    <option value="">Priority</option>
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                </select>
                            </div>
                        </div>
                        <div class="panel-content" id="tasks-content">
                            <!-- Table inserted by JS -->
                        </div>
                    </div>
                </div>

                <!-- Divine Intervention -->
                <div class="command-container">
                    <div style="color: var(--accent); font-size: 1.2rem;">⚡</div>
                    <input type="text" id="cmd-input" class="cmd-input-lg" placeholder="Divine Intervention: Inject Command (e.g., /create title:Refactor priority:high)">
                    <button class="cmd-btn-lg" onclick="sendCommand()">EXECUTE</button>
                </div>

                <!-- Task Modal -->
                <div id="task-modal" class="modal-overlay">
                    <div class="modal">
                        <div class="modal-header">
                            <h3 style="margin:0; font-weight: 400;" id="modal-title">Task Details</h3>
                            <button onclick="closeModal()" style="background:none; border:none; color:var(--text-secondary); cursor:pointer; font-size:1.5rem;">&times;</button>
                        </div>
                        <div class="modal-body" id="modal-body"></div>
                        <div class="modal-footer">
                            <span style="font-size:0.75rem; color:var(--text-secondary); text-transform: uppercase; letter-spacing: 1px;">Task Traceability System v2.0</span>
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
                        expandedRows: new Set(),
                        view: { net: 'TRAFFIC' },
                        filters: {
                            agent: { text: '', team: '', sec: '' },
                            task: { text: '', status: '', pri: '' },
                            net: { text: '', status: '' }
                        },
                        sort: {
                            agent: { col: 'id', asc: true },
                            task: { col: 'updated_at', asc: false },
                            net: { col: 'timestamp', asc: false }
                        }
                    };

                    function toggleNetView(view) {
                        state.view.net = view;
                        document.getElementById('btn-view-traffic').style.opacity = view === 'TRAFFIC' ? '1' : '0.5';
                        document.getElementById('btn-view-security').style.opacity = view === 'SECURITY' ? '1' : '0.5';
                        document.getElementById('btn-view-topology').style.opacity = view === 'TOPOLOGY' ? '1' : '0.5';
                        renderNetworkTable();
                    }

                    // Setup Listeners
                    ['filter-agent-text', 'filter-agent-team', 'filter-agent-sec'].forEach(id => {
                        document.getElementById(id).addEventListener('input', e => {
                            state.filters.agent[id.split('-')[2]] = e.target.value;
                            renderMapTable();
                        });
                    });

                    ['filter-task-text', 'filter-task-status', 'filter-task-pri'].forEach(id => {
                        document.getElementById(id).addEventListener('input', e => {
                            state.filters.task[id.split('-')[2]] = e.target.value;
                            renderTasksTable();
                        });
                    });

                    ['filter-net-text', 'filter-net-status'].forEach(id => {
                        document.getElementById(id).addEventListener('input', e => {
                            state.filters.net[id.split('-')[2]] = e.target.value;
                            renderNetworkTable();
                        });
                    });

                    document.getElementById('cmd-input').addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') sendCommand();
                    });

                    // Helper: Sort
                    function sortData(data, key, asc) {
                        return [...data].sort((a, b) => {
                            let valA = key.split('.').reduce((o, i) => o?.[i], a);
                            let valB = key.split('.').reduce((o, i) => o?.[i], b);
                            if (typeof valA === 'string') valA = valA.toLowerCase();
                            if (typeof valB === 'string') valB = valB.toLowerCase();
                            if (valA < valB) return asc ? -1 : 1;
                            if (valA > valB) return asc ? 1 : -1;
                            return 0;
                        });
                    }

                    // Helper: Highlight
                    function highlight(text) {
                        return text; // Placeholder for search highlight
                    }

                    async function updateData() {
                        try {
                            const [mapRes, taskRes, netRes, secRes] = await Promise.all([
                                fetch('/api/map'),
                                fetch('/api/tasks'),
                                fetch('/api/network'),
                                fetch('/api/security/logs')
                            ]);
                            
                            // Map returns object by teams, flatten it for table
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

                            // Render
                            renderMapTable();
                            renderTasksTable();
                            renderNetworkTable();
                            
                            document.getElementById('connection-status').innerText = 'Online';
                            document.getElementById('connection-status').style.color = 'var(--success)';
                        } catch (e) {
                            console.error('Update failed', e);
                            document.getElementById('connection-status').innerText = 'Offline';
                            document.getElementById('connection-status').style.color = 'var(--danger)';
                        }
                    }

                    // Helper: Toggle Row
                    function toggleRow(rowId) {
                        const detailsRow = document.getElementById('details-' + rowId);
                        const mainRow = document.getElementById('row-' + rowId);
                        if (!detailsRow || !mainRow) return;

                        if (state.expandedRows.has(rowId)) {
                            state.expandedRows.delete(rowId);
                            detailsRow.classList.remove('show');
                            mainRow.classList.remove('expanded');
                        } else {
                            state.expandedRows.add(rowId);
                            detailsRow.classList.add('show');
                            mainRow.classList.add('expanded');
                        }
                    }

                    // --- RENDERERS ---

                    function renderMapTable() {
                        const container = document.getElementById('map-content');
                        let data = state.agents.filter(a => {
                            const f = state.filters.agent;
                            return (f.text === '' || a.id.includes(f.text) || JSON.stringify(a.capabilities).includes(f.text)) &&
                                   (f.team === '' || a.team === f.team) &&
                                   (f.sec === '' || a.security_level == f.sec);
                        });

                        data = sortData(data, state.sort.agent.col, state.sort.agent.asc);
                        document.getElementById('agent-count').innerText = data.length;

                        let html = '<table class="data-table">';
                        html += '<thead><tr>';
                        html += '<th onclick="setSort(\\'agent\\',\\'id\\')">ID/Nome</th>';
                        html += '<th onclick="setSort(\\'agent\\',\\'team\\')">Time</th>';
                        html += '<th onclick="setSort(\\'agent\\',\\'security_level\\')">Nível</th>';
                        html += '<th onclick="setSort(\\'agent\\',\\'network.ip\\')">IP Rede</th>';
                        html += '<th onclick="setSort(\\'agent\\',\\'current_task\\')">Atividade</th>';
                        html += '</tr></thead><tbody>';

                        data.forEach(a => {
                            const isBusy = a.current_task && a.current_task !== 'IDLE';
                            const statusColor = isBusy ? 'var(--warning)' : 'var(--success)';
                            const rowId = a.id.replace(/[^a-zA-Z0-9]/g, '');
                            const isExpanded = state.expandedRows.has(rowId);
                            
                            html += `
                                <tr id="row-${rowId}" class="main-row ${isExpanded ? 'expanded' : ''}" onclick="toggleRow('${rowId}')">
                                    <td>
                                        <div style="font-weight:600; color:var(--text-primary)">${a.name || a.id.substring(0,12)}</div>
                                        <div style="font-size:0.7em; color:var(--text-secondary); font-family:monospace">${a.id.substring(0,20)}</div>
                                    </td>
                                    <td>${a.team}</td>
                                    <td><span class="tag sec-${a.security_level}">L${a.security_level}</span></td>
                                    <td style="font-family:monospace">${a.network?.ip || '-'}</td>
                                    <td>
                                        <div style="display:flex; align-items:center; gap:6px;">
                                            <div style="width:6px; height:6px; border-radius:50%; background:${statusColor}"></div>
                                            <span style="font-size:0.75em">${isBusy ? a.current_task.substring(0,20)+'...' : 'Ocioso'}</span>
                                        </div>
                                    </td>
                                </tr>
                                <tr id="details-${rowId}" class="details-row ${isExpanded ? 'show' : ''}">
                                    <td colspan="5">
                                        <div class="details-content">
                                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
                                                <div>
                                                    <div style="margin-bottom:5px;"><strong style="color:var(--text-primary)">Função:</strong> ${a.role || 'N/A'}</div>
                                                    <div style="margin-bottom:5px;"><strong style="color:var(--text-primary)">ID Completo:</strong> ${a.id}</div>
                                                    <div><strong style="color:var(--text-primary)">Capacidades:</strong> ${a.capabilities ? a.capabilities.join(', ') : 'Nenhuma'}</div>
                                                </div>
                                                <div>
                                                    <div style="margin-bottom:5px;"><strong style="color:var(--text-primary)">Tarefa Atual:</strong></div>
                                                    <div style="background:rgba(0,0,0,0.3); padding:8px; border-radius:4px; font-size:0.9em;">
                                                        ${a.current_task || 'OCIOSO'}
                                                    </div>
                                                    <div style="margin-top:10px;">
                                                        <strong style="color:var(--text-primary)">Status:</strong> <span style="color:${statusColor}">${a.status || 'ATIVO'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        });
                        html += '</tbody></table>';
                        container.innerHTML = html;
                    }

                    function renderTasksTable() {
                        const container = document.getElementById('tasks-content');
                        let data = state.tasks.filter(t => {
                            const f = state.filters.task;
                            return (f.text === '' || t.title.toLowerCase().includes(f.text.toLowerCase()) || t.id.includes(f.text)) &&
                                   (f.status === '' || t.status === f.status) &&
                                   (f.pri === '' || t.priority === f.pri);
                        });

                        data = sortData(data, state.sort.task.col, state.sort.task.asc);
                        document.getElementById('task-count').innerText = data.length;

                        let html = `
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th onclick="setSort('task','title')">Tarefa</th>
                                        <th onclick="setSort('task','priority')">Prio</th>
                                        <th onclick="setSort('task','status')">Status</th>
                                        <th onclick="setSort('task','assignee')">Atribuído</th>
                                    </tr>
                                </thead>
                                <tbody>
                        `;

                        data.forEach(t => {
                            const secLevel = t.required_security_level || 1;
                            const rowId = t.id.replace(/[^a-zA-Z0-9]/g, '');
                            const isExpanded = state.expandedRows.has(rowId);
                            
                            html += `
                                <tr id="row-${rowId}" class="main-row ${isExpanded ? 'expanded' : ''}" draggable="true" ondragstart="drag(event, '${t.id}')" ondrop="drop(event, '${t.id}')" ondragover="allowDrop(event)" onclick="toggleRow('${rowId}')">
                                    <td>
                                        <div style="font-weight:600;">${t.title}</div>
                                        <div style="font-size:0.7em; color:var(--text-secondary)">ID: ${t.id.substring(0,8)} • L${secLevel}</div>
                                    </td>
                                    <td><span class="badge badge-${t.priority}">${t.priority}</span></td>
                                    <td><span class="badge badge-${t.status}">${t.status}</span></td>
                                    <td style="font-family:monospace; font-size:0.75em">${t.assignee ? t.assignee.substring(0,12) : '<span style="opacity:0.3">--</span>'}</td>
                                </tr>
                                <tr id="details-${rowId}" class="details-row ${isExpanded ? 'show' : ''}">
                                    <td colspan="4">
                                        <div class="details-content">
                                            <div style="margin-bottom:10px;">
                                                <strong style="color:var(--text-primary)">Descrição:</strong> ${t.description || 'Sem descrição'}
                                            </div>
                                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; font-size:0.75rem;">
                                                <div>
                                                    <div>ID Rastreio: ${t.trace_id || '-'}</div>
                                                    <div>ID Pai: ${t.parent_id || 'RAIZ'}</div>
                                                    <div>Criador: ${t.creator_id || '-'}</div>
                                                </div>
                                                <div style="text-align:right;">
                                                    <div>Criado em: ${new Date(t.created_at).toLocaleString()}</div>
                                                    <div>Atualizado em: ${new Date(t.updated_at).toLocaleString()}</div>
                                                    <button class="cmd-btn-lg" style="margin-top:5px; padding:4px 10px; font-size:0.7em;" onclick="openTask('${t.id}'); event.stopPropagation();">EDITAR / SUBTAREFAS</button>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        });
                        html += '</tbody></table>';
                        container.innerHTML = html;
                    }

                    async function renderNetworkTable() {
                        const container = document.getElementById('network-content');
                        
                        // TOPOLOGY VIEW
                        if (state.view.net === 'TOPOLOGY') {
                            container.innerHTML = '<div style="width:100%; height:100%; display:flex; justify-content:center; align-items:center; color:var(--text-secondary);">Carregando Topologia...</div>';
                            
                            let links = [];
                            try {
                                const res = await fetch('/api/topology');
                                links = await res.json();
                            } catch(e) { console.error('Erro ao buscar topologia:', e); }

                            container.innerHTML = '<canvas id="topo-canvas"></canvas>';
                            const canvas = document.getElementById('topo-canvas');
                            const ctx = canvas.getContext('2d');
                            
                            // Set Canvas Size
                            const rect = container.getBoundingClientRect();
                            canvas.width = rect.width;
                            canvas.height = rect.height;

                            // Prepare Graph Data
                            const nodes = state.agents.map(a => ({
                                id: a.id,
                                x: Math.random() * canvas.width * 0.8 + canvas.width * 0.1,
                                y: Math.random() * canvas.height * 0.8 + canvas.height * 0.1,
                                role: a.role || 'Agent',
                                color: a.id.includes('sec') ? '#da3633' : '#58a6ff'
                            }));
                            
                            // Map links to node objects
                            const edges = links.map(l => {
                                const s = nodes.find(n => n.id === l.source);
                                const t = nodes.find(n => n.id === l.target);
                                return s && t ? { source: s, target: t, weight: l.weight } : null;
                            }).filter(e => e !== null);

                            // Simple Layout (Center Attraction + Repulsion)
                            function tick() {
                                nodes.forEach(node => {
                                    // Repulsion
                                    nodes.forEach(other => {
                                        if (node === other) return;
                                        const dx = node.x - other.x;
                                        const dy = node.y - other.y;
                                        const dist = Math.sqrt(dx*dx + dy*dy) || 1;
                                        if (dist < 100) {
                                            const force = (100 - dist) / dist;
                                            node.x += dx * force * 0.05;
                                            node.y += dy * force * 0.05;
                                        }
                                    });
                                    // Center Attraction
                                    node.x += (canvas.width/2 - node.x) * 0.01;
                                    node.y += (canvas.height/2 - node.y) * 0.01;
                                });

                                // Draw
                                ctx.clearRect(0, 0, canvas.width, canvas.height);
                                
                                // Draw Edges
                                ctx.strokeStyle = 'rgba(88, 166, 255, 0.2)';
                                ctx.lineWidth = 1;
                                edges.forEach(e => {
                                    ctx.beginPath();
                                    ctx.moveTo(e.source.x, e.source.y);
                                    ctx.lineTo(e.target.x, e.target.y);
                                    ctx.stroke();
                                });

                                // Draw Nodes
                                nodes.forEach(n => {
                                    ctx.beginPath();
                                    ctx.arc(n.x, n.y, 6, 0, Math.PI * 2);
                                    ctx.fillStyle = n.color;
                                    ctx.fill();
                                    ctx.fillStyle = '#fff';
                                    ctx.font = '10px monospace';
                                    ctx.fillText(n.id.substring(0,8), n.x + 10, n.y + 3);
                                });
                                
                                requestAnimationFrame(tick);
                            }
                            
                            tick();
                            
                            // Update Metrics for Topology
                            document.getElementById('net-metrics').innerHTML = `
                                <div class="metric-box"><div class="metric-val" style="color:var(--accent)">${nodes.length}</div><div class="metric-lbl">Nós</div></div>
                                <div class="metric-box"><div class="metric-val" style="color:var(--success)">${edges.length}</div><div class="metric-lbl">Conexões</div></div>
                            `;
                            return;
                        }

                        const isSecurity = state.view.net === 'SECURITY';
                        
                        let data = isSecurity ? state.securityLogs : state.logs;
                        
                        // Apply Filters
                        data = data.filter(l => {
                            const f = state.filters.net;
                            if (isSecurity) {
                                return (f.text === '' || l.action.includes(f.text) || l.resource.includes(f.text)) &&
                                       (f.status === '' || l.severity === f.status); // Map status filter to severity for security
                            } else {
                                return (f.text === '' || l.from.includes(f.text) || l.to.includes(f.text) || l.type.includes(f.text)) &&
                                       (f.status === '' || l.status === f.status);
                            }
                        });

                        // Metrics update
                        if (isSecurity) {
                            const high = data.filter(l => l.severity === 'HIGH' || l.severity === 'CRITICAL').length;
                            const total = data.length;
                            document.getElementById('net-metrics').innerHTML = `
                                <div class="metric-box"><div class="metric-val" style="color:var(--text-primary)">${total}</div><div class="metric-lbl">Total de Alertas</div></div>
                                <div class="metric-box"><div class="metric-val" style="color:var(--danger)">${high}</div><div class="metric-lbl">Crítico/Alto</div></div>
                            `;
                        } else {
                            const blocked = data.filter(l => l.status === 'BLOCKED').length;
                            const delivered = data.filter(l => l.status === 'DELIVERED').length;
                            document.getElementById('net-metrics').innerHTML = `
                                <div class="metric-box"><div class="metric-val" style="color:var(--success)">${delivered}</div><div class="metric-lbl">Permitido</div></div>
                                <div class="metric-box"><div class="metric-val" style="color:var(--danger)">${blocked}</div><div class="metric-lbl">Bloqueado</div></div>
                            `;
                        }

                        data = sortData(data, state.sort.net.col, state.sort.net.asc);
                        
                        let html = '<table class="data-table"><thead><tr>';
                        
                        if (isSecurity) {
                            html += `
                                <th onclick="setSort('net','timestamp')">Horário</th>
                                <th onclick="setSort('net','severity')">Nível</th>
                                <th onclick="setSort('net','action')">Ação</th>
                                <th onclick="setSort('net','resource')">Alvo</th>
                            </tr></thead><tbody>`;
                            
                            data.slice(0, 100).forEach((l, index) => {
                                const time = new Date(l.timestamp).toLocaleTimeString().split(' ')[0];
                                const rowId = (l.id || l.timestamp + '-' + index).replace(/[^a-zA-Z0-9]/g, '');
                                const isExpanded = state.expandedRows.has(rowId);
                                
                                html += `
                                    <tr id="row-${rowId}" class="main-row ${isExpanded ? 'expanded' : ''}" onclick="toggleRow('${rowId}')">
                                        <td style="color:var(--text-secondary); font-family:monospace">${time}</td>
                                        <td><span class="tag" style="color: ${l.severity==='CRITICAL'||l.severity==='HIGH'?'var(--danger)':'var(--warning)'}">${l.severity}</span></td>
                                        <td style="font-weight:600">${l.action}</td>
                                        <td style="font-family:monospace; font-size:0.75em; color:var(--text-secondary)">${l.resource}</td>
                                    </tr>
                                    <tr id="details-${rowId}" class="details-row ${isExpanded ? 'show' : ''}">
                                        <td colspan="4">
                                            <div class="details-content">
                                                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                                                    <div>
                                                        <div><strong style="color:var(--text-primary)">Data Completa:</strong> ${new Date(l.timestamp).toLocaleString()}</div>
                                                        <div><strong style="color:var(--text-primary)">Ação:</strong> ${l.action}</div>
                                                        <div><strong style="color:var(--text-primary)">Recurso:</strong> ${l.resource}</div>
                                                    </div>
                                                    <div>
                                                        <div><strong style="color:var(--text-primary)">Detalhes:</strong></div>
                                                        <div style="background:rgba(0,0,0,0.3); padding:8px; border-radius:4px; font-size:0.8em; white-space:pre-wrap;">${JSON.stringify(l.details || {}, null, 2)}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            });
                        } else {
                            html += `
                                <th onclick="setSort('net','timestamp')">Horário</th>
                                <th onclick="setSort('net','status')">Status</th>
                                <th onclick="setSort('net','from')">Origem → Destino</th>
                                <th onclick="setSort('net','type')">Protocolo</th>
                            </tr></thead><tbody>`;
                            
                            data.slice(0, 100).forEach((l, index) => {
                                const time = new Date(l.timestamp).toLocaleTimeString().split(' ')[0];
                                const tip = getStatusTip(l.status);
                                const rowId = (l.id || l.timestamp + '-' + index).replace(/[^a-zA-Z0-9]/g, '');
                                const isExpanded = state.expandedRows.has(rowId);
                                
                                html += `
                                    <tr id="row-${rowId}" class="main-row ${isExpanded ? 'expanded' : ''}" onclick="toggleRow('${rowId}')">
                                        <td style="color:var(--text-secondary); font-family:monospace">${time}</td>
                                        <td><span class="log-status-${l.status} tooltip" data-tip="${tip}">${l.status}</span></td>
                                        <td style="font-family:monospace; font-size:0.75em">
                                            <span style="color:var(--accent)">${l.from.substring(0,8)}</span> 
                                            <span style="color:var(--text-secondary)">→</span> 
                                            <span style="color:var(--accent)">${l.to.substring(0,8)}</span>
                                        </td>
                                        <td>${l.type} <span style="font-size:0.7em; color:var(--text-secondary)">${l.reason || ''}</span></td>
                                    </tr>
                                    <tr id="details-${rowId}" class="details-row ${isExpanded ? 'show' : ''}">
                                        <td colspan="4">
                                            <div class="details-content">
                                                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                                                    <div>
                                                        <div><strong style="color:var(--text-primary)">Data Completa:</strong> ${new Date(l.timestamp).toLocaleString()}</div>
                                                        <div><strong style="color:var(--text-primary)">De:</strong> ${l.from}</div>
                                                        <div><strong style="color:var(--text-primary)">Para:</strong> ${l.to}</div>
                                                    </div>
                                                    <div>
                                                        <div><strong style="color:var(--text-primary)">Motivo/Erro:</strong> ${l.reason || '-'}</div>
                                                        <div><strong style="color:var(--text-primary)">Payload:</strong></div>
                                                        <div style="background:rgba(0,0,0,0.3); padding:8px; border-radius:4px; font-size:0.8em; white-space:pre-wrap;">${JSON.stringify(l.payload || {}, null, 2)}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            });
                        }
                        
                        html += '</tbody></table>';
                        container.innerHTML = html;
                    }

                    function getStatusTip(status) {
                        if (status === 'DELIVERED') return 'Autorizado: Origem Confiável & Nível OK';
                        if (status === 'BLOCKED') return 'Violação: IP Não Confiável ou Nível Baixo';
                        if (status === 'DROPPED') return 'Erro de Rede: Timeout ou Inacessível';
                        return 'Desconhecido';
                    }

                    // Drag & Drop & Modal logic from previous version
                    function allowDrop(ev) { ev.preventDefault(); }
                    function drag(ev, taskId) { ev.dataTransfer.setData("taskId", taskId); }
                    function drop(ev, targetTaskId) {
                        ev.preventDefault();
                        const sourceTaskId = ev.dataTransfer.getData("taskId");
                        if (sourceTaskId === targetTaskId) return;
                        
                        // API Call to update parent_id
                        fetch('/api/task/update', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: sourceTaskId, fields: { parent_id: targetTaskId } })
                        }).then(() => {
                            // Visual toast
                        alert(`Linked Task ${sourceTaskId} -> ${targetTaskId}`);
                        updateData();
                        });
                    }

                    async function openTask(id) {
                        const res = await fetch('/api/task?id=' + encodeURIComponent(id));
                        const data = await res.json();
                        const t = data.task;
                        if (!t) return;
                        
                        document.getElementById('modal-title').innerText = t.title;
                        const body = document.getElementById('modal-body');
                        
                        // Enhanced Modal Content
                        body.innerHTML = `
                            <div style="display:grid; grid-template-columns: 2fr 1fr; gap:20px;">
                                <div>
                                    <div style="font-size:0.75em; color:var(--text-secondary); margin-bottom:4px;">DESCRIÇÃO / CONTEXTO</div>
                                    <div style="background:var(--bg); padding:10px; border-radius:6px; border:1px solid var(--border); margin-bottom:15px;">
                                        ${t.description || 'Sem descrição.'}
                                    </div>
                                    
                                    <div style="font-size:0.75em; color:var(--text-secondary); margin-bottom:4px;">SUB-TAREFAS</div>
                                    <div style="background:var(--bg); border:1px solid var(--border); border-radius:6px; overflow:hidden;">
                                        ${(data.subTasks||[]).map(s => `
                                            <div style="padding:8px 12px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
                                                <span>${s.title}</span>
                                                <span class="badge badge-${s.status}" style="font-size:0.6em">${s.status}</span>
                                            </div>
                                        `).join('') || '<div style="padding:10px; color:var(--text-secondary); font-size:0.8em">Sem sub-tarefas</div>'}
                                        <div style="padding:8px; display:flex; gap:5px; background:rgba(255,255,255,0.02);">
                                            <input id="new-subtask" class="filter-input" placeholder="Nova sub-tarefa..." style="flex:1">
                                            <button class="cmd-btn-lg" style="padding:4px 10px; font-size:0.8em;" onclick="createSubTask('${t.id}', '${t.trace_id}')">+</button>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div style="margin-bottom:15px;">
                                        <label style="display:block; font-size:0.75em; color:var(--text-secondary); margin-bottom:4px;">STATUS</label>
                                        <select id="edit-status" class="cmd-input-lg" style="width:100%; padding:8px;">
                                            <option ${t.status==='PENDING'?'selected':''}>PENDING</option>
                                            <option ${t.status==='IN_PROGRESS'?'selected':''}>IN_PROGRESS</option>
                                            <option ${t.status==='COMPLETED'?'selected':''}>COMPLETED</option>
                                            <option ${t.status==='BLOCKED'?'selected':''}>BLOCKED</option>
                                        </select>
                                    </div>
                                    <div style="margin-bottom:15px;">
                                        <label style="display:block; font-size:0.75em; color:var(--text-secondary); margin-bottom:4px;">PRIORIDADE</label>
                                        <select id="edit-pri" class="cmd-input-lg" style="width:100%; padding:8px;">
                                            <option ${t.priority==='high'?'selected':''}>high</option>
                                            <option ${t.priority==='medium'?'selected':''}>medium</option>
                                            <option ${t.priority==='low'?'selected':''}>low</option>
                                        </select>
                                    </div>
                                    <div style="margin-bottom:15px;">
                                        <label style="display:block; font-size:0.75em; color:var(--text-secondary); margin-bottom:4px;">ATRIBUÍDO A</label>
                                        <input id="edit-assignee" class="cmd-input-lg" style="width:100%; box-sizing:border-box; padding:8px;" value="${t.assignee||''}">
                                    </div>
                                    <button class="cmd-btn-lg" style="width:100%; margin-top:10px;" onclick="saveTask('${t.id}')">SALVAR ALTERAÇÕES</button>
                                </div>
                            </div>
                            <div style="margin-top:20px; padding-top:15px; border-top:1px solid var(--border); font-size:0.75em; color:var(--text-secondary); font-family:monospace;">
                                TRACE_ID: ${t.trace_id} <br>
                                PARENT_ID: ${t.parent_id || 'RAIZ'} <br>
                                CRIADOR: ${t.creator_id}
                            </div>
                        `;
                        
                        document.getElementById('task-modal').classList.add('active');
                    }

                    function closeModal() {
                        document.getElementById('task-modal').classList.remove('active');
                    }

                    async function createSubTask(parentId, traceId) {
                        const title = document.getElementById('new-subtask').value;
                        if (!title) return;
                        await fetch('/api/task/create', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ title, parentId, traceId, priority: 'medium' })
                        });
                        openTask(parentId); // Reload
                    }

                    async function saveTask(id) {
                        const status = document.getElementById('edit-status').value;
                        const priority = document.getElementById('edit-pri').value;
                        const assignee = document.getElementById('edit-assignee').value;
                        await fetch('/api/task/update', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id, fields: { status, priority, assignee } })
                        });
                        closeModal();
                        updateData();
                    }

                    async function sendCommand() {
                        const input = document.getElementById('cmd-input');
                        const text = input.value;
                        if (!text) return;
                        
                        try {
                            const res = await fetch('/api/command', {
                                method: 'POST',
                                body: JSON.stringify({ text })
                            });
                            const data = await res.json();
                            alert(data.message);
                            input.value = '';
                            updateData();
                        } catch (e) {
                            alert('Command failed');
                        }
                    }

                    // Start
                    updateData();
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
            req.on('end', async () => {
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
                        
                        await taskManager.createTask(title, 'Created via Divine Intervention', priority, { origin: 'WebMap' }, 10, 'human-admin');
                        result.message = `Task "${title}" created.`;
                    } else if (cmd.text === '/clear') {
                        await taskManager.deleteAllTasks();
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
            const agents = await registry.listAgents();
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
            const tasks = await taskManager.listTasks();
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(tasks));
        } else if (pathname === '/api/task') {
            const id = url.searchParams.get('id');
            const task = await taskManager.getTask(id);
            const subTasks = task ? await taskManager.listSubTasks(task.id) : [];
            const relatedTasks = task && task.trace_id ? await taskManager.listRelatedByTrace(task.trace_id) : [];
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ task, subTasks, relatedTasks }));
        } else if (pathname === '/api/task/create') {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', async () => {
                try {
                    const { title, parentId, traceId, priority, assignee } = JSON.parse(body);
                    const task = await taskManager.createTask(
                        title, 
                        'Created via WebMap', 
                        priority || 'medium', 
                        { parent_id: parentId, trace_id: traceId, origin: 'WebMap' }, 
                        1, 
                        'human-admin',
                        parentId
                    );
                    if (assignee) {
                        await taskManager.updateTaskFields(task.id, { assignee });
                    }
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify(task));
                } catch (e) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid payload' }));
                }
            });
        } else if (pathname === '/api/task/update') {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', async () => {
                try {
                    const payload = JSON.parse(body);
                    
                    // Logic for parent/trace inheritance
                    if (payload.fields && payload.fields.parent_id) {
                        const parent = await taskManager.getTask(payload.fields.parent_id);
                        if (parent) {
                            payload.fields.trace_id = parent.trace_id;
                        }
                    }

                    const updated = await taskManager.updateTaskFields(payload.id, payload.fields || {});
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify(updated));
                } catch (e) {
                    console.error('Update Task Error:', e);
                    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ error: 'Invalid payload' }));
                }
            });
            return;
        } else if (pathname === '/api/network') {
            try {
                const logs = await dbManager.getNetworkLogs(100);
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify(logs));
            } catch (e) {
                // Fallback to file logs if DB fails or is empty initially
                const logs = SwarmNetwork.getLogs();
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify(logs));
            }
        } else if (pathname === '/api/security/logs') {
            try {
                const logs = await dbManager.getSecurityLogs(100);
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify(logs));
            } catch (e) {
                const logs = securityKernel.getSecurityLogs(100);
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify(logs));
            }
        } else if (pathname === '/api/topology') {
            try {
                const topology = await dbManager.getTopology();
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify(topology));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            }
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