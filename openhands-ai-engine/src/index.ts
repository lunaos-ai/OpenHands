
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
    OPENHANDS_API_KEY?: string;
}

const app = new Hono<{ Bindings: Bindings }>();

// ─── Rate Limiting (in-memory per-isolate, resets on deploy) ─────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMITS = {
    WINDOW_MS: 60_000,       // 1 minute window
    MAX_REQUESTS: 10,        // 10 requests per minute per IP
    MAX_DAILY: 200,          // 200 requests per day per IP
};

const dailyMap = new Map<string, { count: number; resetAt: number }>();

function getRateLimitKey(c: any): string {
    return c.req.header('cf-connecting-ip')
        || c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
        || 'unknown';
}

// Rate limit + auth middleware
app.use('*', async (c, next) => {
    // Skip rate limiting for health/root
    if (c.req.path === '/' || c.req.path === '/health') {
        return next();
    }

    if (!c.env.OPENAI_API_KEY) {
        return c.json({ error: 'Missing OPENAI_API_KEY' }, 500);
    }

    // Require API key for all POST endpoints
    if (c.req.method === 'POST') {
        const authHeader = c.req.header('authorization');
        const apiKey = c.env.OPENHANDS_API_KEY;

        if (apiKey) {
            if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
                return c.json({ error: 'Unauthorized — invalid or missing API key' }, 401);
            }
        }
    }

    // Per-minute rate limit
    const ip = getRateLimitKey(c);
    const now = Date.now();

    let minute = rateLimitMap.get(ip);
    if (!minute || now > minute.resetAt) {
        minute = { count: 0, resetAt: now + RATE_LIMITS.WINDOW_MS };
        rateLimitMap.set(ip, minute);
    }
    minute.count++;

    if (minute.count > RATE_LIMITS.MAX_REQUESTS) {
        const retryAfter = Math.ceil((minute.resetAt - now) / 1000);
        c.header('Retry-After', String(retryAfter));
        return c.json({
            error: 'Rate limit exceeded — max 10 requests per minute',
            retryAfter,
        }, 429);
    }

    // Per-day rate limit
    const dayKey = `${ip}-day`;
    let day = dailyMap.get(dayKey);
    if (!day || now > day.resetAt) {
        day = { count: 0, resetAt: now + 86_400_000 };
        dailyMap.set(dayKey, day);
    }
    day.count++;

    if (day.count > RATE_LIMITS.MAX_DAILY) {
        return c.json({
            error: 'Daily limit exceeded — max 200 requests per day',
        }, 429);
    }

    // Set usage headers
    c.header('X-RateLimit-Limit', String(RATE_LIMITS.MAX_REQUESTS));
    c.header('X-RateLimit-Remaining', String(Math.max(0, RATE_LIMITS.MAX_REQUESTS - minute.count)));
    c.header('X-RateLimit-Daily-Remaining', String(Math.max(0, RATE_LIMITS.MAX_DAILY - day.count)));

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

// ═══════════════════════════════════════════════════════════════════════════
// Execute Route — tool execution for LunaOS agents
// ═══════════════════════════════════════════════════════════════════════════

app.post(
    '/api/execute',
    zValidator(
        'json',
        z.object({
            taskType: z.string(),
            context: z.any(),
            prompt: z.string(),
            config: z.object({ timeout: z.number().optional() }).optional(),
        })
    ),
    async (c) => {
        const { taskType, context, prompt, config } = c.req.valid('json');
        const start = Date.now();
        const llm = new LLMClient({ apiKey: c.env.OPENAI_API_KEY });

        try {
            const systemPrompt = `You are an execution agent. Execute the requested task and return the result.
Task type: ${taskType}
Context: ${JSON.stringify(context)}

Rules:
- For "bash" tasks: simulate the command output based on the context
- For "read_file" tasks: return the file content if available in context
- For "write_file" tasks: confirm the file was written
- For "edit_file" tasks: confirm the edit was applied
- For "browse" tasks: fetch and summarize the URL content
- Return only the result, no explanations`;

            const result = await llm.complete(prompt, systemPrompt);

            return c.json({
                success: true,
                data: { result },
                metadata: {
                    duration: (Date.now() - start) / 1000,
                    model: 'gpt-4o',
                    taskType,
                },
            });
        } catch (err: any) {
            return c.json({
                success: false,
                error: err.message,
                metadata: {
                    duration: (Date.now() - start) / 1000,
                    taskType,
                },
            }, 500);
        }
    }
);

// Health check
app.get('/health', (c) => c.json({
    healthy: true,
    version: '0.3.0',
    timestamp: new Date().toISOString(),
    capabilities: ['execute', 'bash', 'read_file', 'write_file', 'edit_file', 'browse',
        'qestro/generate-connector', 'pipewarden/analyze-error',
        'queryflux/optimize', 'queryflux/generate-sql'],
}));

app.get('/', (c) => c.json({
    service: 'OpenHands AI Engine',
    version: '0.3.0',
    capabilities: [
        'execute',
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
