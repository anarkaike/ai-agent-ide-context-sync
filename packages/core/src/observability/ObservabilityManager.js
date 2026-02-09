import { EventEmitter } from 'events';
import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import os from 'os';

/**
 * Observability Manager - Eventos unificados com tracing distribuído
 * Schema: { trace_id, span_id, parent_span_id, event_type, component, severity, timestamp, duration_ms, payload }
 */
class ObservabilityManager extends EventEmitter {
    constructor(options = {}) {
        super();
        this.options = {
            eventsDir: path.join(os.homedir(), '.ai-workspace', 'observability'),
            sampleRate: options.sampleRate || 1.0,
            enableConsole: options.enableConsole !== false,
            ...options
        };

        this.activeTraces = new Map(); // trace_id -> TraceContext
        this.activeSpans = new Map();  // span_id -> SpanContext
        this.summary = {
            period: new Date().toISOString().split('T')[0],
            total_events: 0,
            by_component: {},
            by_severity: { debug: 0, info: 0, warn: 0, error: 0, critical: 0 },
            avg_llm_duration_ms: 0,
            traces_completed: 0,
            traces_with_errors: 0,
            llm_durations: []
        };

        this.ensureDir();
        this.startSummaryUpdate();
    }

    ensureDir() {
        fs.ensureDirSync(this.options.eventsDir);
    }

    /**
     * Inicia um novo trace
     */
    startTrace(name, metadata = {}) {
        const trace_id = crypto.randomUUID();
        const traceCtx = {
            trace_id,
            name,
            started_at: Date.now(),
            metadata,
            spans: []
        };

        this.activeTraces.set(trace_id, traceCtx);

        // Emit evento de trace start
        this.emit({
            trace_id,
            span_id: trace_id, // Root span usa mesmo ID
            parent_span_id: null,
            event_type: 'trace.start',
            component: 'observability',
            severity: 'info',
            timestamp: new Date().toISOString(),
            duration_ms: null,
            payload: { name, metadata }
        });

        return traceCtx;
    }

    /**
     * Inicia um span dentro de um trace
     */
    startSpan(traceCtx, name, metadata = {}) {
        const span_id = crypto.randomUUID();
        const spanCtx = {
            span_id,
            trace_id: traceCtx.trace_id,
            name,
            started_at: Date.now(),
            metadata,
            parent_span_id: traceCtx.spans.length > 0 ? traceCtx.spans[traceCtx.spans.length - 1].span_id : null
        };

        this.activeSpans.set(span_id, spanCtx);
        traceCtx.spans.push(spanCtx);

        return spanCtx;
    }

    /**
     * Finaliza um span
     */
    endSpan(spanCtx, result = null, error = null) {
        const duration_ms = Date.now() - spanCtx.started_at;

        const event = {
            trace_id: spanCtx.trace_id,
            span_id: spanCtx.span_id,
            parent_span_id: spanCtx.parent_span_id,
            event_type: 'span.complete',
            component: spanCtx.metadata.component || 'unknown',
            severity: error ? 'error' : 'info',
            timestamp: new Date().toISOString(),
            duration_ms,
            payload: {
                name: spanCtx.name,
                result,
                error: error ? { message: error.message, stack: error.stack } : null,
                metadata: spanCtx.metadata
            }
        };

        this.emit(event);
        this.activeSpans.delete(spanCtx.span_id);

        // Atualizar métricas específicas
        if (spanCtx.metadata.component === 'llm' && duration_ms) {
            this.summary.llm_durations.push(duration_ms);
            this.updateAvgLLMDuration();
        }

        return event;
    }

    /**
     * Emite um evento genérico
     */
    emit(event) {
        // Validar schema mínimo
        if (!event.trace_id) event.trace_id = crypto.randomUUID();
        if (!event.span_id) event.span_id = crypto.randomUUID();
        if (!event.timestamp) event.timestamp = new Date().toISOString();
        if (!event.severity) event.severity = 'info';

        // Sampling
        if (Math.random() > this.options.sampleRate) {
            return;
        }

        // Sanitizar payload
        if (event.payload) {
            event.payload = this.sanitizePayload(event.payload);
        }

        // Atualizar summary
        this.updateSummary(event);

        // Persistir
        this.persistEvent(event);

        // Console output
        if (this.options.enableConsole) {
            this.logToConsole(event);
        }

        // Emit para listeners
        super.emit('event', event);
    }

    /**
     * Sanitiza payload para remover dados sensíveis
     */
    sanitizePayload(payload) {
        const sanitized = JSON.parse(JSON.stringify(payload));

        const sensitiveKeys = ['token', 'password', 'secret', 'key', 'authorization', 'credential'];
        const sanitize = (obj) => {
            if (typeof obj !== 'object' || obj === null) return obj;

            for (const key in obj) {
                if (typeof key === 'string' && sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
                    obj[key] = '[REDACTED]';
                } else if (typeof obj[key] === 'object') {
                    sanitize(obj[key]);
                }
            }
            return obj;
        };

        return sanitize(sanitized);
    }

    /**
     * Persiste evento em arquivo diário
     */
    persistEvent(event) {
        const date = event.timestamp.split('T')[0];
        const filePath = path.join(this.options.eventsDir, `events-${date}.jsonl`);

        const line = JSON.stringify(event) + '\n';
        fs.appendFileSync(filePath, line, { encoding: 'utf8' });
    }

    /**
     * Log para console com cores
     */
    logToConsole(event) {
        const colors = {
            debug: '\x1b[36m',   // cyan
            info: '\x1b[32m',    // green
            warn: '\x1b[33m',    // yellow
            error: '\x1b[31m',   // red
            critical: '\x1b[35m' // magenta
        };

        const reset = '\x1b[0m';
        const color = colors[event.severity] || colors.info;

        const duration = event.duration_ms ? ` ${event.duration_ms}ms` : '';
        const component = event.component ? ` [${event.component}]` : '';
        const span = event.span_id !== event.trace_id ? `:${event.span_id.slice(0, 8)}` : '';

        console.log(
            `${color}${event.severity.toUpperCase()}${reset} ` +
            `${event.trace_id.slice(0, 8)}${span}${component} ` +
            `${event.event_type}${duration}`
        );
    }

    /**
     * Atualiza métricas de summary
     */
    updateSummary(event) {
        this.summary.total_events++;

        // Por componente
        if (!this.summary.by_component[event.component]) {
            this.summary.by_component[event.component] = 0;
        }
        this.summary.by_component[event.component]++;

        // Por severidade
        if (this.summary.by_severity[event.severity] !== undefined) {
            this.summary.by_severity[event.severity]++;
        }

        // Traces com erros
        if (event.event_type === 'trace.complete' && event.payload.has_errors) {
            this.summary.traces_with_errors++;
        }
    }

    /**
     * Atualiza média de duração LLM
     */
    updateAvgLLMDuration() {
        if (this.summary.llm_durations.length === 0) return;

        const sum = this.summary.llm_durations.reduce((a, b) => a + b, 0);
        this.summary.avg_llm_duration_ms = Math.round(sum / this.summary.llm_durations.length);
    }

    /**
     * Inicia atualização periódica do summary
     */
    startSummaryUpdate() {
        setInterval(() => {
            this.saveSummary();
        }, 60000); // A cada minuto
    }

    /**
     * Salva summary em disco
     */
    saveSummary() {
        const summaryPath = path.join(this.options.eventsDir, 'summary.json');
        fs.writeJsonSync(summaryPath, this.summary, { spaces: 2 });
    }

    /**
     * Carrega summary do disco
     */
    loadSummary() {
        const summaryPath = path.join(this.options.eventsDir, 'summary.json');
        if (fs.existsSync(summaryPath)) {
            this.summary = fs.readJsonSync(summaryPath);
        }
        return this.summary;
    }

    /**
     * Busca traces com filtros
     */
    getTraces(filters = {}) {
        const { component, severity, limit = 100, date } = filters;
        const targetDate = date || new Date().toISOString().split('T')[0];
        const filePath = path.join(this.options.eventsDir, `events-${targetDate}.jsonl`);

        if (!fs.existsSync(filePath)) return [];

        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.trim().split('\n').filter(Boolean);
        const events = lines.map(line => JSON.parse(line));

        // Agrupar por trace_id
        const traces = new Map();
        for (const event of events) {
            if (!traces.has(event.trace_id)) {
                traces.set(event.trace_id, {
                    trace_id: event.trace_id,
                    spans: [],
                    started_at: event.timestamp,
                    has_errors: false
                });
            }

            traces.get(event.trace_id).spans.push(event);
            if (event.severity === 'error' || event.severity === 'critical') {
                traces.get(event.trace_id).has_errors = true;
            }
        }

        // Aplicar filtros
        let result = Array.from(traces.values());

        if (component) {
            result = result.filter(trace =>
                trace.spans.some(span => span.component === component)
            );
        }

        if (severity) {
            result = result.filter(trace =>
                trace.spans.some(span => span.severity === severity)
            );
        }

        // Ordenar por started_at (mais recentes primeiro)
        result.sort((a, b) => new Date(b.started_at) - new Date(a.started_at));

        return result.slice(0, limit);
    }

    /**
     * Busca eventos com filtros
     */
    getEvents(filters = {}) {
        const { component, severity, trace_id, limit = 100, date } = filters;
        const targetDate = date || new Date().toISOString().split('T')[0];
        const filePath = path.join(this.options.eventsDir, `events-${targetDate}.jsonl`);

        if (!fs.existsSync(filePath)) return [];

        const content = fs.readFileSync(filePath, 'utf8');
        let events = content.trim().split('\n').filter(Boolean).map(line => JSON.parse(line));

        // Aplicar filtros
        if (component) {
            events = events.filter(event => event.component === component);
        }

        if (severity) {
            events = events.filter(event => event.severity === severity);
        }

        if (trace_id) {
            events = events.filter(event => event.trace_id === trace_id);
        }

        // Ordenar por timestamp (mais recentes primeiro)
        events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        return events.slice(0, limit);
    }
}

export default ObservabilityManager;
