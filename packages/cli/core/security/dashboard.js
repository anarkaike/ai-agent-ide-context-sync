const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const url = require('url');
const EventEmitter = require('events');
const ApprovalLogger = require('./ApprovalLogger');

const PORT = parseInt(process.env.APP_DASH_PORT || '3333', 10);
const BASIC_USER = process.env.APP_DASH_USER || 'approver';
const BASIC_PASS = process.env.APP_DASH_PASSWORD || 'openclaw';
const HEARTBEAT_INTERVAL = 20_000;
const eventBus = new EventEmitter();
const logFile = ApprovalLogger.getLogFilePath();

const CHALLENGE = 'Basic realm="Approvals"';

function unauthorized(res) {
    res.writeHead(401, {
        'WWW-Authenticate': CHALLENGE,
        'Content-Type': 'text/plain; charset=utf-8'
    });
    res.end('Unauthorized');
}

function requireAuth(req, res) {
    const header = req.headers.authorization;
    if (!header) {
        unauthorized(res);
        return false;
    }

    const [scheme, payload] = header.split(' ');
    if (scheme !== 'Basic' || !payload) {
        unauthorized(res);
        return false;
    }

    const [user, pass] = Buffer.from(payload, 'base64')
        .toString('utf8')
        .split(':');

    if (user !== BASIC_USER || pass !== BASIC_PASS) {
        unauthorized(res);
        return false;
    }

    return true;
}

function readJson(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            if (!body) {
                resolve({});
                return;
            }
            try {
                resolve(JSON.parse(body));
            } catch (err) {
                reject(err);
            }
        });
        req.on('error', reject);
    });
}

function sseHandler(req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
    });
    res.write('\n');

    const push = payload => {
        const chunk = `event: log\ndata: ${JSON.stringify(payload)}\n\n`;
        res.write(chunk);
    };

    const heartbeat = setInterval(() => {
        res.write(':heartbeat\n\n');
    }, HEARTBEAT_INTERVAL);

    const listener = payload => push(payload);
    eventBus.on('log', listener);

    req.on('close', () => {
        clearInterval(heartbeat);
        eventBus.off('log', listener);
    });

    // Send snapshot
    const entries = ApprovalLogger.readEntries(1);
    if (entries.length) {
        push(entries[entries.length - 1]);
    }
}

function respondJson(res, payload) {
    const data = JSON.stringify(payload);
    res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8'
    });
    res.end(data);
}

function handleDashboardHtml(res) {
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Painel de Aprovações</title>
    <style>
        :root {
            font-family: "Inter", system-ui, sans-serif;
            background:#0f172a;color:#f8fafc;
        }
        body {
            margin:0;
            padding:0;
            background:radial-gradient(circle at top,#1d4ed8,#0f172a 70%);
            min-height:100vh;
        }
        header {
            padding:1rem;
            text-align:center;
            background:rgba(15,23,42,.8);
            position:sticky;
            top:0;
            z-index:10;
            backdrop-filter:blur(8px);
        }
        header h1 {
            margin:0;
            font-size:1.2rem;
            letter-spacing:.05em;
        }
        #entries {
            max-width:960px;
            margin:1.5rem auto;
            display:grid;
            gap:1rem;
            padding:0 1rem 3rem;
        }
        .entry {
            border:1px solid rgba(148,163,184,.2);
            border-radius:12px;
            padding:1rem 1.25rem;
            background:#020617;
            box-shadow:0 15px 40px rgba(15,23,42,.4);
        }
        .entry strong {
            font-size:1rem;
            text-transform:uppercase;
            letter-spacing:.1em;
        }
        .entry-header {
            display:flex;
            justify-content:space-between;
            align-items:center;
            font-size:.85rem;
            color:#94a3b8;
        }
        .entry-body {
            margin-top:.75rem;
            line-height:1.5;
            color:#e2e8f0;
        }
        .entry-footer {
            margin-top:1rem;
            display:flex;
            justify-content:flex-end;
            gap:.5rem;
        }
        button {
            border:none;
            border-radius:999px;
            padding:.4rem .9rem;
            font-size:.85rem;
            cursor:pointer;
            transition:.2s ease;
        }
        button[data-decision="approve"] {
            background:#22c55e;
            color:#0f172a;
        }
        button[data-decision="reject"] {
            background:#ef4444;
            color:#fff;
        }
        button:hover {
            transform:translateY(-1px);
            box-shadow:0 12px 24px rgba(15,23,42,.3);
        }
        .badge {
            font-size:.7rem;
            padding:.15rem .5rem;
            border-radius:999px;
            background:rgba(14,165,233,.15);
            color:#38bdf8;
            margin-left:.25rem;
        }
        footer {
            text-align:center;
            color:#94a3b8;
            font-size:.75rem;
            padding-bottom:1rem;
        }
    </style>
</head>
<body>
    <header>
        <h1>Painel de aprovações · OpenClaw / Nanobot</h1>
    </header>
    <section id="entries"></section>
    <footer>Atualizações por SSE · Porta ${PORT}</footer>
    <script>
        const container = document.getElementById('entries');
        let entriesState = [];

        function render() {
            if (entriesState.length === 0) {
                container.innerHTML = '<div style="text-align:center;color:#94a3b8;">Sem registros ainda.</div>';
                return;
            }

            container.innerHTML = entriesState.map((entry, index) => {
                const score = entry.score ?? '-';
                const reasons = entry.threats?.map(t => t.reason).join(' · ') || 'Nenhuma';
                return \`
                    <article class="entry">
                        <div class="entry-header">
                            <strong>\${entry.action}</strong>
                            <span>\${entry.timestamp}</span>
                        </div>
                        <div class="entry-body">
                            <p><span class="badge">\${entry.agentId || 'agent-unknown'}</span> · Nivel: \${entry.level}</p>
                            <p>\${entry.reason || 'Sem motivo registrado'}</p>
                            <p style="font-size:.85rem;color:#e0e7ff;">Score: \${score}</p>
                            <p style="font-size:.75rem;color:#94a3b8;">Tags: \${reasons}</p>
                        </div>
                        <div class="entry-footer">
                            <button data-index="\${index}" data-decision="approve">Aprovar</button>
                            <button data-index="\${index}" data-decision="reject">Rejeitar</button>
                        </div>
                    </article>
                \`;
            }).join('');
        }

        async function fetchEntries() {
            const res = await fetch('/api/entries');
            const data = await res.json();
            entriesState = data.reverse();
            render();
        }

        async function postDecision(entry, decision) {
            await fetch('/api/decision', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    agentId: entry.agentId,
                    decision,
                    context: entry.context,
                    reason: \`\${entry.action} via painel\`,
                    meta: { origin: 'dashboard', previous: entry }
                })
            });
        }

        container.addEventListener('click', event => {
            const button = event.target.closest('button[data-decision]');
            if (!button) return;
            const index = Number(button.dataset.index);
            const entry = entriesState[index];
            if (!entry) return;
            const decision = button.dataset.decision === 'approve' ? 'approved' : 'rejected';
            postDecision(entry, decision).catch(console.error);
        });

        const source = new EventSource('/events');
        source.addEventListener('log', event => {
            try {
                const payload = JSON.parse(event.data);
                entriesState.unshift(payload);
                if (entriesState.length > 100) {
                    entriesState = entriesState.slice(0, 100);
                }
                render();
            } catch (error) {
                console.error('Malformado SSE', error);
            }
        });

        source.addEventListener('error', () => {
            console.warn('SSE desconectado, tentando reconectar...');
        });

        fetchEntries();
    </script>
</body>
</html>
`;

    res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8'
    });
    res.end(html);
}

async function decisionHandler(req, res) {
    try {
        const payload = await readJson(req);
        if (!payload.agentId || !payload.decision) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'agentId and decision required' }));
            return;
        }

        const entry = {
            action: 'manual-decision',
            level: 'APPROVAL',
            agentId: payload.agentId,
            reason: payload.reason || 'Ação manual via painel',
            context: payload.context || null,
            meta: {
                decision: payload.decision,
                origin: payload.meta?.origin || 'dashboard',
                previous: payload.meta?.previous || null
            }
        };

        ApprovalLogger.logDecision(entry);
        eventBus.emit('log', entry);
        respondJson(res, { status: 'ok' });
    } catch (err) {
        res.writeHead(422, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
    }
}

function handler(req, res) {
    if (!requireAuth(req, res)) return;

    const parsed = url.parse(req.url, true);
    const { pathname } = parsed;

    if (req.method === 'GET' && pathname === '/') {
        handleDashboardHtml(res);
        return;
    }

    if (req.method === 'GET' && pathname === '/api/entries') {
        const entries = ApprovalLogger.readEntries(200);
        respondJson(res, entries);
        return;
    }

    if (req.method === 'POST' && pathname === '/api/decision') {
        decisionHandler(req, res);
        return;
    }

    if (req.method === 'GET' && pathname === '/events') {
        sseHandler(req, res);
        return;
    }

    res.writeHead(404);
    res.end('Not Found');
}

const server = http.createServer(handler);

fs.watchFile(logFile, { interval: 1000 }, (curr, prev) => {
    if (curr.mtimeMs <= prev.mtimeMs) return;
    const entries = ApprovalLogger.readEntries(1);
    if (entries.length) {
        eventBus.emit('log', entries[entries.length - 1]);
    }
});

server.listen(PORT, () => {
    console.log(`🚀 Painel de aprovações rodando em http://localhost:${PORT}`);
    console.log(`   IP tailscale pode acessar via http://<TAILSCALE_IP>:${PORT}`);
});

process.on('SIGINT', () => {
    fs.unwatchFile(logFile);
    server.close(() => process.exit(0));
});

