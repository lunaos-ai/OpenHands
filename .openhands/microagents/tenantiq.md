---
name: tenantiq
type: knowledge
triggers:
  - tenantiq
  - microsoft 365
  - m365 tenant
  - tenant management
  - azure ad
  - entra id
  - license optimization
  - mfa compliance
---

# TenantIQ Expert Microagent

You are an expert in TenantIQ — a multi-tenant SaaS platform for Microsoft 365 management.

## Platform Overview

TenantIQ manages Microsoft 365 environments for multiple customer tenants simultaneously:
- **Organizations** = Your customers (e.g., "Acme Corp IT")
- **Tenants** = Customer Microsoft 365 environments (e.g., "acme.onmicrosoft.com")
- **Platform Users** = Customer admins who use TenantIQ
- **M365 Users** = Employees in the customer's Microsoft 365

## Production URLs

- **API**: `https://api.tenantiq.app` (Cloudflare Workers)
- **Web**: `https://app.tenantiq.app` (Cloudflare Pages)
- **Health**: `https://api.tenantiq.app/health`

## Architecture (Cloudflare-Native)

```
Cloudflare Workers (API)
├── D1 Database (SQLite) — tenant data, users, licenses, alerts
├── KV Namespace — sessions, cache, rate limits
├── R2 Bucket — exports, compliance reports
├── Queues — background M365 sync jobs
└── Durable Objects — stateful tenant events

Cloudflare Pages (Web App)
└── SvelteKit — management dashboard
```

## Database Tables (D1 SQLite)

```sql
organizations       -- Your customers
tenants             -- Customer M365 environments
platform_users      -- Customer admins
users_cache         -- M365 users (synced from Graph API)
licenses_cache      -- M365 licenses
user_licenses       -- License assignments
security_alerts     -- Security/cost alerts (with severity: low/medium/high/critical)
webhook_configs     -- OpenClaw channel configs
webhook_deliveries  -- Webhook audit log
```

## Key API Routes

```
GET  /health                                    — Health + DB status
POST /api/auth/login                            — Platform user login
GET  /api/tenants                               — List customer tenants
POST /api/tenants/:id/sync                      — Trigger M365 sync
GET  /api/tenants/:id/alerts                    — Security/cost alerts
GET  /api/tenants/:id/users                     — M365 users
GET  /api/tenants/:id/licenses                  — License usage

# AI Engine (OpenHands-powered)
GET  /api/ai/status                             — OpenClaw connection status
GET  /api/ai/agents                             — Available Luna agents
POST /api/ai/security-scan/:tenantId            — AI security posture analysis
POST /api/ai/license-optimize/:tenantId         — AI license waste detection
POST /api/ai/ask/:tenantId                      — Natural language tenant Q&A
POST /api/ai/chain/:tenantId                    — Multi-agent analysis chain

# OpenClaw / Webhooks
POST /api/tenants/:id/webhooks/config           — Configure webhook channel
POST /api/webhooks/deliver                      — Trigger alert delivery
```

## AI Features (via OpenClaw/OpenHands)

TenantIQ integrates with OpenHands AI engine for intelligent analysis:

### Available Agents
- `365-security` — M365 security posture analysis
- `license-optimizer` — License waste and cost savings
- `compliance-auditor` — SOC2/GDPR/ISO27001 compliance
- `code-review` — Tenant policy/config review

### Multi-Agent Chains
- `security-audit` — Full security assessment
- `compliance-check` — Compliance gap analysis
- `cost-review` — Cost optimization scan
- `full-assessment` — Complete tenant health report

## Microsoft Graph Integration

TenantIQ uses delegated OAuth to access customer M365 tenants:

```typescript
// Auth flow: customer clicks "Connect M365"
const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?
  client_id=${AZURE_CLIENT_ID}
  &scope=https://graph.microsoft.com/.default
  &prompt=admin_consent
  &redirect_uri=https://app.tenantiq.app/auth/callback`;

// After OAuth: store customer tokens in D1 tenants table
// Use customer tokens to call Graph API for their data
```

## Deployment

All managed via Wrangler:

```bash
# Deploy API
wrangler deploy

# Run migrations
wrangler d1 execute tenantiq-production --remote --file=migrations/0001_initial_d1.sql

# Set secrets
wrangler secret put AZURE_CLIENT_ID
wrangler secret put OPENCLAW_URL
wrangler secret put OPENCLAW_SERVICE_KEY

# View logs
wrangler tail

# Query D1 database
wrangler d1 execute tenantiq-production --remote --command="SELECT * FROM organizations;"
```

## OpenClaw Integration (Webhook Channels)

TenantIQ sends alerts to 6 messaging platforms via OpenClaw:
- Slack, Microsoft Teams, Discord, WhatsApp, Telegram, iMessage

Alert format delivered:
```json
{
  "event": "security_alert",
  "tenant": "Acme Corp",
  "severity": "critical",
  "title": "5 users without MFA detected",
  "recommendations": ["Enable MFA policy", "Review conditional access"]
}
```

## Common Development Tasks

### Add a new API route
```typescript
// apps/api/src/routes/my-route.ts
import { Hono } from 'hono';
import type { AppEnv } from '../index';
import { getDb } from '../lib/db';

export const myRoutes = new Hono<AppEnv>();

myRoutes.get('/', async (c) => {
  const db = getDb(c.env);
  // D1 query using Drizzle
  return c.json({ result: 'ok' });
});
```

### Query D1 database (Drizzle + SQLite)
```typescript
import { getDb } from '../lib/db';
import { tenants, securityAlerts } from '@tenantiq/db';
import { eq, and } from 'drizzle-orm';

const db = getDb(c.env);

// Select
const tenant = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);

// Insert with D1
await db.insert(securityAlerts).values({
  tenantId,
  alertType: 'security_risk',
  severity: 'high',
  title: 'MFA not enforced',
  status: 'active',
}).onConflictDoNothing();
```

### Use AI engine
```typescript
import { getOpenClawBridge } from '../lib/openclaw-bridge';

const bridge = getOpenClawBridge(c.env);
if (bridge) {
  const result = await bridge.runAgent('365-security', tenantContext);
  console.log(result.output);
}
```

## Alert Severity Levels
- `low` — informational, no immediate action
- `medium` — review within 7 days
- `high` — action within 24-48 hours
- `critical` — immediate action required

## Key Files

```
apps/api/src/
├── index.ts                          — Main app, Env types, route mounting
├── lib/
│   ├── db.ts                         — Drizzle D1 client
│   ├── openclaw-bridge.ts            — OpenHands AI engine client
│   └── validate-env.ts               — Secret validation
├── routes/
│   ├── ai-engine.ts                  — /api/ai/* routes (AI features)
│   ├── tenants.ts                    — Tenant CRUD
│   ├── alerts.ts                     — Security/cost alerts
│   ├── webhooks/openclaw.ts          — Webhook delivery
│   └── integrations/openclaw.ts     — OpenClaw channel status
└── cron/
    ├── user-sync.ts                  — Sync M365 users every 6h
    ├── security-scan.ts              — Scan for risks every hour
    └── compliance-scan.ts            — Daily compliance check

packages/db/src/
├── schema.ts                         — Drizzle schema (PostgreSQL-style, being migrated to D1)
└── migrations/
    └── 0001_initial_d1.sql           — D1/SQLite schema

apps/web/src/routes/
├── integrations/openclaw/+page.svelte — OpenClaw management UI
└── ...
```
