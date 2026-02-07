#!/usr/bin/env node
"use strict";

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');
const yaml = require('js-yaml');

const projectRoot = process.env.CRON_PROJECT_ROOT || process.cwd();
const workspaceRoot = process.env.CRON_WORKSPACE || projectRoot;
const agentId = process.env.CRON_AGENT_ID || 'agent-nanobot';
const followUpTemplate = process.env.CRON_FOLLOWUP_PROMPT || 'Continue the agent loop after this result:\n\n{{result_summary}}';
const avoidReentry = process.env.CRON_SKIP_IF_BUSY === '1';

const tasksDir = path.join(workspaceRoot, '.ai-workspace', 'tasks');
const activeDir = path.join(tasksDir, 'active');
const completedDir = path.join(tasksDir, 'completed');
const stateDir = path.join(workspaceRoot, '.ai-workspace', 'cron-state');
const statePath = path.join(stateDir, `${agentId}.json`);
const aiDocCli = path.join(__dirname, '..', 'cli', 'ai-doc.js');

function log(...args) {
    console.log('[agent-cron]', ...args);
}

function readState() {
    if (!fs.existsSync(statePath)) return { processed: [] };
    try {
        return JSON.parse(fs.readFileSync(statePath, 'utf-8'));
    } catch (e) {
        return { processed: [] };
    }
}

function writeState(state) {
    if (!fs.existsSync(stateDir)) {
        fs.mkdirSync(stateDir, { recursive: true });
    }
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf-8');
}

function parseFrontmatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return {};
    try {
        return yaml.load(match[1]) || {};
    } catch {
        return {};
    }
}

function extractResultSnippet(body) {
    const match = body.match(/##\s*(Resultado|Resultado Final|Resultado|Solução|Output|Resultado Lösning)[\s\S]*?(?=\n##|$)/i);
    if (match) {
        return match[0].replace(/##[^\n]*\n/, '').trim();
    }
    const afterPlan = body.split('## Plano de Ação')[1];
    if (afterPlan) {
        return afterPlan.trim().split('\n').slice(0, 6).join(' ');
    }
    return body.trim().split('\n').slice(0, 6).join(' ');
}

function gatherCompleted() {
    if (!fs.existsSync(completedDir)) return [];
    return fs.readdirSync(completedDir)
        .filter(file => file.endsWith('.md'))
        .map(file => {
            const filePath = path.join(completedDir, file);
            const stat = fs.statSync(filePath);
            return { file, filePath, mtimeMs: stat.mtimeMs };
        })
        .sort((a, b) => a.mtimeMs - b.mtimeMs);
}

function getActiveAgentTasks() {
    if (!fs.existsSync(activeDir)) return [];
    return fs.readdirSync(activeDir)
        .filter(file => file.endsWith('.md'))
        .map(file => {
            const filePath = path.join(activeDir, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const metadata = parseFrontmatter(content);
            return { file, metadata };
        })
        .filter(item => (item.metadata.from_agent || '').includes(agentId));
}

function renderPrompt(template, context) {
    return template.replace(/{{\s*([\w_]+)\s*}}/g, (_, token) => context[token] || '');
}

function delegatePrompt(prompt) {
    const resolvedPrompt = prompt.replace(/"/g, '\\"');
    const result = spawnSync('node', [aiDocCli, 'swarm', 'delegate', agentId, resolvedPrompt], {
        cwd: projectRoot,
        env: { ...process.env }
    });

    if (result.error) {
        log('delegate error', result.error.message);
        return false;
    }

    if (result.status !== 0) {
        log('delegate exited with', result.status);
        if (result.stderr) log(result.stderr.toString());
        return false;
    }

    log('delegate output:', result.stdout.toString());
    return true;
}

function orchestrate() {
    if (!agentId) {
        log('No CRON_AGENT_ID defined; aborting.');
        return;
    }

    const activeTasks = getActiveAgentTasks();
    if (avoidReentry && activeTasks.length > 0) {
        log(`Agent ${agentId} already has ${activeTasks.length} active task(s); skipping this run.`);
        return;
    }

    const state = readState();
    const completed = gatherCompleted();
    const toProcess = [];

    for (const entry of completed) {
        if (state.processed?.includes(entry.file)) continue;
        const content = fs.readFileSync(entry.filePath, 'utf-8');
        const metadata = parseFrontmatter(content);
        if (!metadata.from_agent || metadata.from_agent !== agentId) continue;
        if (metadata.status && metadata.status !== 'completed') continue;
        toProcess.push({ ...entry, metadata, content });
    }

    if (toProcess.length === 0) {
        log('Nenhuma conclusão nova detectada');
        return;
    }

    for (const entry of toProcess) {
        const body = entry.content.replace(/^---[\s\S]*?---/, '').trim();
        const resultSummary = extractResultSnippet(body);
        const context = {
            result_summary: resultSummary,
            agent_id: agentId,
            title: entry.metadata.title || entry.file
        };

        const template = entry.metadata.next_step_prompt || followUpTemplate;
        const prompt = renderPrompt(template, context);
        if (!prompt.trim()) {
            log('Sem prompt de acompanhamento; pulei', entry.file);
            state.processed = [...(state.processed || []), entry.file];
            continue;
        }

        log(`Novo resultado (${entry.file}); prompt preparado:\n${prompt}`);
        const ok = delegatePrompt(prompt);
        if (!ok) {
            log('Falha ao delegar; preservando o arquivo para reprocessar.');
            continue;
        }

        state.processed = [...(state.processed || []), entry.file];
        state.lastTriggered = entry.file;
        writeState(state);
    }

    writeState(state);
}

orchestrate();
