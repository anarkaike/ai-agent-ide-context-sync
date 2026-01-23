const fs = require('fs');
const path = require('path');
const os = require('os');
const yaml = require('js-yaml');

const https = require('https');
const { exec } = require('child_process');
const crypto = require('crypto');
const http = require('http');

const log = (msg) => console.log(msg);

// Configuração OAuth (Default para App de Teste/Dev)
// Em produção, deve vir de variáveis de ambiente ou config segura
const CLIENT_ID = process.env.CLICKUP_CLIENT_ID || 'M8T6716765565565'; // Placeholder
const REDIRECT_URI = 'http://localhost:3636/callback';
const AUTH_URL = 'https://app.clickup.com/api';
const TOKEN_URL = 'https://api.clickup.com/api/v2/oauth/token';

const getAuthTokenPath = () => path.join(os.homedir(), '.junie', 'clickup-auth.json');

const openUrl = (url) => {
  const start = (process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open');
  exec(`${start} "${url}"`);
};

// PKCE Helpers
const generateCodeVerifier = () => {
  return base64UrlEncode(crypto.randomBytes(32));
};

const generateCodeChallenge = (verifier) => {
  const hash = crypto.createHash('sha256').update(verifier).digest();
  return base64UrlEncode(hash);
};

const base64UrlEncode = (buffer) => {
  return buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

const cmdAuth = async () => {
  log('\n🔐 Iniciando autenticação OAuth 2.1 (ClickUp)...');
  
  const verifier = generateCodeVerifier();
  const challenge = generateCodeChallenge(verifier);
  
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:3636`);
    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      if (code) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h1>Autenticado!</h1><p>Pode fechar esta janela e voltar ao terminal.</p>');
        server.close();
        
        try {
          await exchangeCodeForToken(code, verifier);
        } catch (err) {
          log(`❌ Erro na troca de token: ${err.message}`);
        }
      } else {
        res.writeHead(400);
        res.end('Código não encontrado.');
      }
    }
  }).listen(3636, '127.0.0.1');

  // Incluindo PKCE params
  const authUrl = `${AUTH_URL}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&code_challenge=${challenge}&code_challenge_method=S256`;
  log(`🌍 Abrindo navegador: ${authUrl}`);
  openUrl(authUrl);
};

const exchangeCodeForToken = async (code, verifier) => {
  // Se tivermos SECRET no env, usamos (fluxo web tradicional).
  // Se não, tentamos PKCE enviando code_verifier (se a API suportar fluxo público).
  const clientSecret = process.env.CLICKUP_CLIENT_SECRET;
  
  const payload = {
    client_id: CLIENT_ID,
    code: code,
    grant_type: 'authorization_code', // Geralmente necessário
  };

  if (clientSecret) {
    payload.client_secret = clientSecret;
  } else {
    // Tentativa PKCE sem secret
    // Se a API exigir secret mesmo com PKCE, falhará aqui sem a env var.
    payload.code_verifier = verifier;
  }

  const body = JSON.stringify(payload);

  const req = https.request(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': body.length,
    },
  }, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      if (res.statusCode === 200) {
        const tokenData = JSON.parse(data);
        saveToken(tokenData.access_token);
        log('✅ Token obtido e salvo com sucesso!');
      } else {
        log(`❌ Falha na autenticação: ${data}`);
      }
    });
  });
  
  req.on('error', (e) => log(`Erro request: ${e.message}`));
  req.write(body);
  req.end();
};

const saveToken = (token) => {
  const p = getAuthTokenPath();
  writeJsonSafe(p, { access_token: token, updated_at: new Date().toISOString() });
};

const getStoredToken = () => {
  const p = getAuthTokenPath();
  const data = readJsonSafe(p);
  return data ? data.access_token : null;
};

const callClickUpApi = async (path, method = 'GET', body = null) => {
  const token = getStoredToken() || process.env.CLICKUP_API_TOKEN;
  if (!token) throw new Error('Token não encontrado. Rode "ai-doc clickup auth" ou defina CLICKUP_API_TOKEN.');

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.clickup.com',
      path: `/api/v2${path}`,
      method: method,
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
        } else {
          reject(new Error(`API Error ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
};

const readJsonSafe = (filePath) => {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
};

const writeJsonSafe = (filePath, value) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf-8');
};

const ensureWorkspace = () => {
  const projectRoot = process.cwd();
  const wsPath = path.join(projectRoot, '.ai-workspace');
  if (!fs.existsSync(wsPath)) {
    throw new Error('Workspace não encontrado. Rode "ai-doc init" primeiro.');
  }
  const liveStateDir = path.join(wsPath, 'live-state');
  if (!fs.existsSync(liveStateDir)) fs.mkdirSync(liveStateDir, { recursive: true });
  return { projectRoot, wsPath, liveStateDir };
};

const detectMcpClickUp = () => {
  const candidates = [
    path.join(os.homedir(), '.junie', 'mcp', 'mcp.json'),
    path.join(os.homedir(), '.mcp', 'servers.json'),
    path.join(process.cwd(), '.ai-workspace', 'memory', 'system-config.json'),
    path.join(process.cwd(), '.mcp.config.json'),
  ];
  const found = candidates
    .filter((p) => fs.existsSync(p))
    .map((p) => ({ path: p, json: readJsonSafe(p) }));

  let active = false;
  let endpoint = null;
  for (const item of found) {
    const data = item.json;
    if (!data) continue;
    const endpoints = JSON.stringify(data).toLowerCase();
    if (endpoints.includes('clickup') && endpoints.includes('mcp')) {
      active = true;
      endpoint = (data.clickup?.endpoint) || (data.servers?.clickup) || null;
      break;
    }
  }
  // Environment hint
  const envEndpoint = process.env.MCP_CLICKUP_ENDPOINT || process.env.CLICKUP_MCP_ENDPOINT;
  if (envEndpoint) {
    active = true;
    endpoint = endpoint || envEndpoint;
  }
  return { active, endpoint, foundPaths: found.map(f => f.path) };
};

const fetchOpenTasksViaMcp = async () => {
  try {
    const user = await callClickUpApi('/user');
    if (!user || !user.user) {
      return { tasks: [], blocked: 'Falha ao autenticar usuário ClickUp.' };
    }
    const userId = user.user.id;
    
    const teams = await callClickUpApi('/team');
    if (!teams.teams || teams.teams.length === 0) {
      return { tasks: [], blocked: 'Usuário sem workspaces no ClickUp.' };
    }
    
    // Usa o primeiro workspace encontrado ou o definido via env
    const teamId = process.env.CLICKUP_TEAM_ID || teams.teams[0].id;
    
    if (teams.teams.length > 1 && !process.env.CLICKUP_TEAM_ID) {
      log(`⚠️  Múltiplos workspaces encontrados. Usando: ${teams.teams[0].name} (${teamId})`);
      log('💡 Defina CLICKUP_TEAM_ID no .env para forçar um workspace específico.');
    }
    
    // Busca tasks atribuídas ao usuário (abertas)
    const tasksData = await callClickUpApi(`/team/${teamId}/task?assignees[]=${userId}&include_closed=false`);
    
    return { 
      tasks: tasksData.tasks || [], 
      blocked: null 
    };
  } catch (err) {
    // Se erro for 401, token expirou ou inválido
    if (err.message.includes('401')) {
      return { tasks: [], blocked: 'Token inválido ou expirado. Rode "ai-doc clickup auth".' };
    }
    return { 
      tasks: [], 
      blocked: `Erro na comunicação com ClickUp: ${err.message}` 
    };
  }
};

const slugify = (text) => text.toString().toLowerCase()
  .replace(/\s+/g, '-')
  .replace(/[^\w\-]+/g, '')
  .replace(/\-\-+/g, '-')
  .replace(/^-+/, '')
  .replace(/-+$/, '');

const getNextId = (activeDir, completedDir) => {
  const getNumbers = (dir) => {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
      .filter(f => f.startsWith('task-') && f.endsWith('.md'))
      .map(f => {
        const match = f.match(/task-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      });
  };
  const ids = [...getNumbers(activeDir), ...getNumbers(completedDir)];
  const maxId = Math.max(0, ...ids);
  return String(maxId + 1).padStart(3, '0');
};

const findLocalTaskByClickUpId = (clickupId, activeDir, completedDir) => {
  const scan = (dir) => {
    if (!fs.existsSync(dir)) return null;
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const p = path.join(dir, file);
      const content = fs.readFileSync(p, 'utf-8');
      const { frontmatter } = readFrontmatter(content);
      if (frontmatter.clickup_id && String(frontmatter.clickup_id) === String(clickupId)) {
        return p;
      }
    }
    return null;
  };
  return scan(activeDir) || scan(completedDir);
};

const cmdPull = async (args) => {
  if (args.length < 1) {
    log('❌ Uso: ai-doc clickup pull <clickup-task-id>');
    return;
  }
  const clickupId = args[0];
  
  try {
    log(`📥 Puxando task ${clickupId}...`);
    const task = await callClickUpApi(`/task/${clickupId}`);
    
    if (task.err || !task.id) {
      throw new Error(task.err || 'Task não encontrada ou erro desconhecido.');
    }
    
    const { wsPath } = ensureWorkspace();
    const activeDir = path.join(wsPath, 'tasks', 'active');
    const completedDir = path.join(wsPath, 'tasks', 'completed');
    if (!fs.existsSync(activeDir)) fs.mkdirSync(activeDir, { recursive: true });
    if (!fs.existsSync(completedDir)) fs.mkdirSync(completedDir, { recursive: true });
    
    // Verifica se já existe vínculo
    const existingPath = findLocalTaskByClickUpId(task.id, activeDir, completedDir);
    if (existingPath) {
      log(`⚠️  Task já importada anteriormente:`);
      log(`📄 ${path.relative(process.cwd(), existingPath)}`);
      log('💡 Use "ai-doc clickup push" se quiser atualizar o remoto, ou edite localmente.');
      return;
    }
    
    const localId = getNextId(activeDir, completedDir);
    const title = task.name;
    const filename = `task-${localId}-${slugify(title)}.md`;
    const filePath = path.join(activeDir, filename);
    
    const content = `---
id: task-${localId}
title: ${title}
status: ${task.status?.status === 'complete' ? 'completed' : 'in_progress'}
created_at: ${new Date().toISOString()}
clickup_id: ${task.id}
clickup_url: ${task.url}
objectives:
  - [ ] Importado do ClickUp
deliverables:
  - [ ] 
---

# ${title}

## Contexto
Importado via ClickUp MCP.
Status original: ${task.status?.status}
Prioridade: ${task.priority?.priority || 'normal'}

## Descrição Original
${task.description || '(Sem descrição)'}

## Plano de Ação
- [ ] Revisar contexto
`;

    fs.writeFileSync(filePath, content, 'utf-8');
    log(`✅ Task criada: ${filename}`);
    log(`🔗 Vinculada a ClickUp #${task.id}`);
    
  } catch (err) {
    log(`❌ Erro: ${err.message}`);
  }
};

const cmdDetect = async () => {
  const info = detectMcpClickUp();
  const token = getStoredToken();
  log('\n=== 🔎 Detecção MCP ClickUp ===\n');
  log(`Ativo (MCP Config): ${info.active ? 'sim' : 'não'}`);
  log(`Autenticado (OAuth): ${!!token ? 'sim' : 'não'}`);
  log(`Endpoint: ${info.endpoint || 'API Oficial'}`);
  if (info.foundPaths.length > 0) {
    log('Arquivos de configuração encontrados:');
    info.foundPaths.forEach((p) => log(`- ${p}`));
  }
};

const cmdCacheSync = async () => {
  const { liveStateDir } = ensureWorkspace();
  const cachePath = path.join(liveStateDir, 'clickup-open-tasks.json');
  const detection = detectMcpClickUp();
  const result = await fetchOpenTasksViaMcp();
  const payload = {
    meta: {
      updated_at: new Date().toISOString(),
      mcp_active: detection.active,
      endpoint: detection.endpoint || null,
      blocked: result.blocked || null,
    },
    tasks: result.tasks || [],
  };
  writeJsonSafe(cachePath, payload);
  log(`\n✅ Cache sincronizado: ${path.relative(process.cwd(), cachePath)}`);
  log(`Tarefas abertas: ${payload.tasks.length}`);
  if (payload.meta.blocked) {
    log(`⚠️ Aviso: ${payload.meta.blocked}`);
  }
};

const readFrontmatter = (content) => {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return { frontmatter: {}, body: content };
  const fm = yaml.load(match[1]) || {};
  const body = content.slice(match[0].length);
  return { frontmatter: fm, body };
};

const writeFrontmatter = (fm, body) => {
  const front = `---\n${yaml.dump(fm).trim()}\n---\n\n`;
  return `${front}${body}`;
};

const resolveLocalTask = (partialId) => {
  const { wsPath } = ensureWorkspace();
  const activeDir = path.join(wsPath, 'tasks', 'active');
  if (!fs.existsSync(activeDir)) return null;
  
  // Tenta match exato primeiro (task-ID-slug.md)
  // Assumindo formato task-{id}-...
  const exactCandidates = fs.readdirSync(activeDir).filter(f => {
    return f === partialId || f === partialId + '.md' || f.startsWith(`${partialId}-`);
  });

  let candidates = exactCandidates.length > 0 ? exactCandidates : fs.readdirSync(activeDir).filter(f => f.includes(partialId) && f.endsWith('.md'));

  if (candidates.length === 0) return null;
  
  // Se houver mais de um, tenta o mais curto (geralmente o ID exato) ou o primeiro
  const chosen = candidates.sort((a, b) => a.length - b.length)[0];

  const filePath = path.join(activeDir, chosen);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { frontmatter, body } = readFrontmatter(raw);
  
  return { filePath, frontmatter, body, clickupId: frontmatter.clickup_id };
};

const cmdPush = async (args) => {
  if (args.length < 1) {
    log('❌ Uso: ai-doc clickup push <local-task-id>');
    return;
  }
  const localId = args[0];
  const task = resolveLocalTask(localId);
  
  if (!task) {
    log('❌ Task local não encontrada.');
    return;
  }
  
  if (!task.clickupId) {
    log('❌ Task não vinculada ao ClickUp (sem clickup_id no frontmatter).');
    log(`💡 Use: ai-doc clickup link ${localId} <clickup-id>`);
    return;
  }
  
  try {
    log(`📤 Atualizando ClickUp #${task.clickupId}...`);
    
    // Update name/description
    await callClickUpApi(`/task/${task.clickupId}`, 'PUT', {
      name: task.frontmatter.title,
      description: task.body.trim(),
    });
    
    // Update status if needed (separate call often required)
    if (task.frontmatter.status) {
       // Mapeamento simples de status local -> clickup
       // Ajuste conforme os status do seu espaço no ClickUp
       const statusMap = {
         'in_progress': 'in progress',
         'completed': 'complete',
         'pending': 'to do',
         'blocked': 'blocked',
         'review': 'in review'
       };
       // Tenta mapeamento ou usa raw (lowercase), ou raw original
       const normalized = task.frontmatter.status.toLowerCase();
       const clickupStatus = statusMap[normalized] || normalized || task.frontmatter.status;
       
       await callClickUpApi(`/task/${task.clickupId}`, 'PUT', { status: clickupStatus });
    }
    
    log('✅ Task atualizada no ClickUp com sucesso.');
  } catch (err) {
    log(`❌ Erro ao atualizar ClickUp: ${err.message}`);
  }
};

const cmdComment = async (args) => {
  if (args.length < 2) {
    log('❌ Uso: ai-doc clickup comment <task-id> "Comentário..."');
    return;
  }
  const id = args[0];
  const text = args.slice(1).join(' ');
  
  // Tenta resolver como local task primeiro
  const localTask = resolveLocalTask(id);
  const clickupId = localTask ? localTask.clickupId : id; // Fallback para ID direto se não achar local
  
  if (!clickupId) {
    log('❌ ID inválido ou task não vinculada.');
    return;
  }
  
  try {
    log(`💬 Enviando comentário para #${clickupId}...`);
    await callClickUpApi(`/task/${clickupId}/comment`, 'POST', {
      comment_text: text,
      notify_all: true
    });
    log('✅ Comentário enviado.');
  } catch (err) {
    log(`❌ Erro ao comentar: ${err.message}`);
  }
};

const cmdStatus = async (args) => {
  if (args.length < 2) {
    log('❌ Uso: ai-doc clickup status <task-id> <new-status>');
    return;
  }
  const id = args[0];
  const status = args[1];
  
  const localTask = resolveLocalTask(id);
  const clickupId = localTask ? localTask.clickupId : id;
  
  if (!clickupId) {
    log('❌ ID inválido ou task não vinculada.');
    return;
  }
  
  try {
    log(`🔄 Alterando status de #${clickupId} para "${status}"...`);
    await callClickUpApi(`/task/${clickupId}`, 'PUT', { status: status });
    log('✅ Status atualizado.');
  } catch (err) {
    log(`❌ Erro ao atualizar status: ${err.message}`);
  }
};

const cmdLink = async (args) => {
  if (args.length < 2) {
    log('❌ Uso: ai-doc clickup link <task-id> <clickup-id>');
    return;
  }
  const { wsPath } = ensureWorkspace();
  const [taskId, clickupId] = args;
  const activeDir = path.join(wsPath, 'tasks', 'active');
  const candidates = fs.readdirSync(activeDir).filter(f => f.includes(taskId) && f.endsWith('.md'));
  if (candidates.length === 0) {
    log('❌ Arquivo de task não encontrado em tasks/active.');
    return;
  }
  const filePath = path.join(activeDir, candidates[0]);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { frontmatter, body } = readFrontmatter(raw);
  frontmatter.clickup_id = clickupId;
  const next = writeFrontmatter(frontmatter, body);
  fs.writeFileSync(filePath, next, 'utf-8');
  log(`✅ Vinculada: ${taskId} ↔ ClickUp ${clickupId}`);
  log(`📄 Atualizado: ${path.relative(process.cwd(), filePath)}`);
};

module.exports = async (args = []) => {
  const sub = (args[0] || '').toLowerCase();
  const params = args.slice(1);
  switch (sub) {
    case 'auth':
      await cmdAuth();
      break;
    case 'detect':
      await cmdDetect();
      break;
    case 'cache-sync':
      await cmdCacheSync();
      break;
    case 'link':
      await cmdLink(params);
      break;
    case 'pull':
      await cmdPull(params);
      break;
    case 'push':
      await cmdPush(params);
      break;
    case 'comment':
      await cmdComment(params);
      break;
    case 'status':
      await cmdStatus(params);
      break;
    default:
      log('\n📎 ClickUp MCP\n');
      log('  ai-doc clickup auth              Autenticar via OAuth 2.1');
      log('  ai-doc clickup detect            Verifica MCP ClickUp ativo');
      log('  ai-doc clickup cache-sync        Atualiza cache de tasks abertas');
      log('  ai-doc clickup pull <id>         Importa task do ClickUp');
      log('  ai-doc clickup push <id>         Atualiza task no ClickUp');
      log('  ai-doc clickup comment <id> ".." Adiciona comentário');
      log('  ai-doc clickup status <id> <st>  Altera status no ClickUp');
      log('  ai-doc clickup link <id> <cup>   Vínculo local ↔ ClickUp');
  }
};
