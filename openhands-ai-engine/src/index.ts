
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { LLMClient } from './lib/llm';
import { ConnectorGenerator } from './services/connector-generator';
import { TrafficAnalyst } from './services/traffic-analyst';
import { QueryOptimizer } from './services/query-optimizer';
import { OpenClawBridge } from './services/openclaw-bridge';

type Bindings = {
    OPENAI_API_KEY: string;
    OPENCLAW_URL?: string;
    OPENCLAW_SERVICE_KEY?: string;
}

const app = new Hono<{ Bindings: Bindings }>();

// Middleware to initialize services
app.use('*', async (c, next) => {
    if (!c.env.OPENAI_API_KEY) {
        return c.json({ error: 'Missing OPENAI_API_KEY' }, 500);
    }
    await next();
});

// --- Qestro Routes ---

app.post(
    '/api/qestro/generate-connector',
    zValidator(
        'json',
        z.object({
            spec: z.any(),
            language: z.string().default('typescript'),
        })
    ),
    async (c) => {
        const { spec, language } = c.req.valid('json');
        const llm = new LLMClient({ apiKey: c.env.OPENAI_API_KEY });
        const generator = new ConnectorGenerator(llm);

        const result = await generator.generateConnector(spec, language);
        return c.json(result);
    }
);

// --- PipeWarden Routes ---

app.post(
    '/api/pipewarden/analyze-error',
    zValidator(
        'json',
        z.object({
            errorLog: z.string(),
            context: z.string(),
        })
    ),
    async (c) => {
        const { errorLog, context } = c.req.valid('json');
        const llm = new LLMClient({ apiKey: c.env.OPENAI_API_KEY });
        const analyst = new TrafficAnalyst(llm);

        const result = await analyst.analyzeError(errorLog, context);
        return c.json(result);
    }
);

// --- QueryFlux Routes ---

app.post(
    '/api/queryflux/optimize',
    zValidator(
        'json',
        z.object({
            query: z.string(),
            schema: z.string(),
        })
    ),
    async (c) => {
        const { query, schema } = c.req.valid('json');
        const llm = new LLMClient({ apiKey: c.env.OPENAI_API_KEY });
        const optimizer = new QueryOptimizer(llm);

        const result = await optimizer.optimizeSQL(query, schema);
        return c.json(result);
    }
);

app.post(
    '/api/queryflux/generate-sql',
    zValidator(
        'json',
        z.object({
            prompt: z.string(),
            schema: z.string(),
        })
    ),
    async (c) => {
        const { prompt, schema } = c.req.valid('json');
        const llm = new LLMClient({ apiKey: c.env.OPENAI_API_KEY });
        const optimizer = new QueryOptimizer(llm);

        const result = await optimizer.nlToSQL(prompt, schema);
        return c.json({ sql: result });
    }
);

app.get('/', (c) => c.json({
    service: 'OpenHands AI Engine',
    version: '0.2.0',
    capabilities: [
        'qestro/generate-connector',
        'pipewarden/analyze-error',
        'queryflux/optimize',
        'queryflux/generate-sql',
        'luna/run',
        'luna/chain',
        'luna/search',
        'luna/agents',
        'luna/channels',
        'luna/status',
    ],
    openclaw: c.env.OPENCLAW_URL ? 'connected' : 'not_configured',
}));

// ═══════════════════════════════════════════════════════════════════════════
// Luna / OpenClaw Integration Routes
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Helper to get OpenClaw bridge instance.
 * Returns null if OpenClaw is not configured.
 */
function getOpenClawBridge(env: Bindings): OpenClawBridge | null {
    if (!env.OPENCLAW_URL) return null;
    return new OpenClawBridge(env.OPENCLAW_URL, env.OPENCLAW_SERVICE_KEY || '');
}

// POST /api/luna/run — Run a Luna agent via OpenClaw
app.post(
    '/api/luna/run',
    zValidator(
        'json',
        z.object({
            agent: z.string(),
            context: z.string(),
            provider: z.string().optional().default('deepseek'),
        })
    ),
    async (c) => {
        const bridge = getOpenClawBridge(c.env);
        if (!bridge) {
            return c.json({ error: 'OpenClaw not configured. Set OPENCLAW_URL env var.' }, 503);
        }

        const { agent, context, provider } = c.req.valid('json');
        const result = await bridge.runAgent(agent, context, { provider });
        return c.json(result);
    }
);

// POST /api/luna/chain — Run a multi-agent chain
app.post(
    '/api/luna/chain',
    zValidator(
        'json',
        z.object({
            preset: z.string(),
            context: z.string(),
            provider: z.string().optional().default('deepseek'),
        })
    ),
    async (c) => {
        const bridge = getOpenClawBridge(c.env);
        if (!bridge) {
            return c.json({ error: 'OpenClaw not configured. Set OPENCLAW_URL env var.' }, 503);
        }

        const { preset, context, provider } = c.req.valid('json');
        const result = await bridge.runChain(preset, context, { provider });
        return c.json(result);
    }
);

// POST /api/luna/search — Semantic RAG search
app.post(
    '/api/luna/search',
    zValidator(
        'json',
        z.object({
            query: z.string(),
            topK: z.number().optional().default(5),
        })
    ),
    async (c) => {
        const bridge = getOpenClawBridge(c.env);
        if (!bridge) {
            return c.json({ error: 'OpenClaw not configured. Set OPENCLAW_URL env var.' }, 503);
        }

        const { query, topK } = c.req.valid('json');
        const results = await bridge.search(query, topK);
        return c.json(results);
    }
);

// GET /api/luna/agents — List available agents
app.get('/api/luna/agents', async (c) => {
    const bridge = getOpenClawBridge(c.env);
    if (!bridge) {
        return c.json({ error: 'OpenClaw not configured. Set OPENCLAW_URL env var.' }, 503);
    }

    const agents = await bridge.listAgents();
    return c.json({ agents });
});

// GET /api/luna/channels — List integration channels
app.get('/api/luna/channels', async (c) => {
    const bridge = getOpenClawBridge(c.env);
    if (!bridge) {
        return c.json({ error: 'OpenClaw not configured. Set OPENCLAW_URL env var.' }, 503);
    }

    const channels = await bridge.listChannels();
    return c.json(channels);
});

// GET /api/luna/status — System status
app.get('/api/luna/status', async (c) => {
    const bridge = getOpenClawBridge(c.env);
    if (!bridge) {
        return c.json({
            openclaw: 'not_configured',
            hint: 'Set OPENCLAW_URL and OPENCLAW_SERVICE_KEY in .dev.vars',
        }, 503);
    }

    try {
        const [health, status] = await Promise.all([
            bridge.healthCheck(),
            bridge.getStatus(),
        ]);
        return c.json({ health, status, openclaw: 'connected' });
    } catch (err: any) {
        return c.json({ openclaw: 'error', error: err.message }, 500);
    }
});

export default app;
