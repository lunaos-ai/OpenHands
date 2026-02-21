/**
 * OpenClaw Integration for OpenHands AI Engine
 *
 * Provides OpenHands with access to all LunaOS/OpenClaw capabilities:
 *   - 28+ specialized AI coding agents
 *   - Multi-agent chains
 *   - RAG semantic search
 *   - File indexing
 *
 * This module acts as a typed HTTP client to the OpenClaw Backend Service,
 * enabling OpenHands to use Luna agents as tools in its workflows.
 *
 * Usage:
 *   const oc = new OpenClawBridge(env.OPENCLAW_URL, env.OPENCLAW_SERVICE_KEY);
 *   const result = await oc.runAgent('code-review', sourceCode);
 *   const searchResults = await oc.search('authentication middleware');
 */

export interface OpenClawConfig {
    baseUrl: string;
    serviceKey: string;
}

export interface AgentResult {
    output: string;
    executionId: string;
    durationMs: number;
    agent: string;
    provider: string;
}

export interface SearchResult {
    results: Array<{
        id: string;
        score: number;
        content: string;
        metadata: Record<string, any>;
    }>;
    total: number;
    searchTimeMs: number;
}

export class OpenClawBridge {
    private baseUrl: string;
    private serviceKey: string;

    constructor(baseUrl: string, serviceKey: string) {
        this.baseUrl = baseUrl || 'http://localhost:8790';
        this.serviceKey = serviceKey || '';
    }

    /**
     * Run a LunaOS agent.
     *
     * @param agent - Agent slug (e.g. 'code-review', '365-security', 'testing-validation')
     * @param context - The code or context for the agent to analyze
     * @param opts - Optional: provider, userId
     */
    async runAgent(
        agent: string,
        context: string,
        opts?: { provider?: string; userId?: string },
    ): Promise<AgentResult> {
        const result = await this.bridgeCall('run', {
            agent,
            context,
            provider: opts?.provider || 'deepseek',
        }, opts?.userId);

        return {
            output: result.data?.output || '',
            executionId: result.data?.executionId || result.requestId,
            durationMs: result.durationMs,
            agent,
            provider: opts?.provider || 'deepseek',
        };
    }

    /**
     * Run a multi-agent chain.
     *
     * @param preset - Chain preset (e.g. 'full-review', 'security-audit', 'deploy')
     * @param context - The code or context to analyze
     */
    async runChain(
        preset: string,
        context: string,
        opts?: { provider?: string; userId?: string },
    ): Promise<any> {
        return this.bridgeCall('chain', {
            preset,
            context,
            provider: opts?.provider || 'deepseek',
        }, opts?.userId);
    }

    /**
     * Search indexed codebase using RAG.
     *
     * @param query - Natural language search query
     * @param topK - Number of results (default 5)
     */
    async search(query: string, topK = 5): Promise<SearchResult> {
        const result = await this.bridgeCall('search', { query, topK });
        return result.data as SearchResult;
    }

    /**
     * Index files for RAG search.
     */
    async indexFiles(
        files: Array<{ path: string; content: string }>,
        repoName?: string,
    ): Promise<any> {
        return this.bridgeCall('index', { files, repoName });
    }

    /**
     * List available agents.
     */
    async listAgents(): Promise<string[]> {
        const result = await this.bridgeCall('agents', {});
        return result.data?.agents || [];
    }

    /**
     * Get system status.
     */
    async getStatus(): Promise<any> {
        const result = await this.bridgeCall('status', {});
        return result.data;
    }

    /**
     * List available integration channels.
     */
    async listChannels(): Promise<any> {
        const res = await fetch(`${this.baseUrl}/bridge/channels`, {
            headers: {
                'X-Service-Key': this.serviceKey,
                'X-Request-Source': 'openhands',
            },
        });
        return res.json();
    }

    /**
     * Health check.
     */
    async healthCheck(): Promise<any> {
        const res = await fetch(`${this.baseUrl}/health`, {
            headers: { 'X-Request-Source': 'openhands' },
        });
        return res.json();
    }

    // ─── Internal ───────────────────────────────────────────────────────

    private async bridgeCall(
        action: string,
        payload: Record<string, any>,
        userId?: string,
    ): Promise<any> {
        const response = await fetch(`${this.baseUrl}/bridge/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Service-Key': this.serviceKey,
                'X-User-Id': userId || 'openhands',
                'X-Request-Source': 'openhands',
            },
            body: JSON.stringify({
                action,
                source: 'openhands',
                payload,
                correlationId: crypto.randomUUID(),
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`OpenClaw bridge error (${response.status}): ${err}`);
        }

        return response.json();
    }
}
