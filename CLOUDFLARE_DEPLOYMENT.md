# MCPoverflow AI Engine - Cloudflare Deployment Guide

Complete guide to deploying the MCPoverflow AI Engine to Cloudflare Workers.

## Overview

The AI Engine can be deployed to Cloudflare Workers for:
- **Global Edge Network** - Low latency worldwide
- **Auto-scaling** - Handle traffic spikes automatically
- **Cost-effective** - Pay only for what you use
- **Built-in KV Storage** - For job queue management
- **High Availability** - 99.99% uptime SLA

## Architecture on Cloudflare

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Global Network                 │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │         AI Engine Worker                           │    │
│  │         (Edge Compute)                             │    │
│  │                                                     │    │
│  │  - HTTP API endpoints                              │    │
│  │  - OpenHands adapter                               │    │
│  │  - Job processing                                  │    │
│  └────────────┬───────────────────┬───────────────────┘    │
│               │                   │                         │
│  ┌────────────▼─────┐  ┌──────────▼─────────┐             │
│  │   KV Storage     │  │   Durable Objects  │             │
│  │   (Job Queue)    │  │   (Future: Long    │             │
│  │                  │  │    Running Tasks)  │             │
│  └──────────────────┘  └────────────────────┘             │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │   OpenHands     │
                  │   AI Service    │
                  └─────────────────┘
```

## Prerequisites

### 1. Cloudflare Account
```bash
# Sign up at https://dash.cloudflare.com/sign-up
# Free tier includes:
# - 100,000 requests/day
# - 1GB KV storage
# - 10ms CPU time per request
```

### 2. Install Wrangler CLI
```bash
npm install -g wrangler

# Login to Cloudflare
wrangler login
```

### 3. Get Account ID
```bash
# Find in Cloudflare Dashboard > Workers & Pages > Overview
# Or run:
wrangler whoami
```

## Quick Deployment

### Option 1: Automated Script (Recommended)

```bash
cd mcpoverflow

# Run deployment script
./deploy-cloudflare.sh deploy

# This will:
# 1. Check prerequisites
# 2. Create KV namespaces
# 3. Set secrets
# 4. Build worker
# 5. Deploy to Cloudflare
```

### Option 2: Manual Deployment

```bash
cd packages/ai-engine

# 1. Install dependencies
npm install

# 2. Configure wrangler.toml
# Add your account_id to wrangler.toml

# 3. Create KV namespace
npm run cf:create-kv

# 4. Set secrets
wrangler secret put OPENHANDS_API_KEY
wrangler secret put OPENHANDS_API_URL

# 5. Build and deploy
npm run build:worker
npm run deploy
```

## Configuration

### 1. Update wrangler.toml

```toml
name = "mcpoverflow-ai-engine"
main = "src/worker.ts"
compatibility_date = "2024-01-15"
node_compat = true

# Add your Cloudflare account ID
account_id = "your-account-id-here"

# KV Namespaces
[[kv_namespaces]]
binding = "AI_JOBS"
id = "your-production-kv-id"
preview_id = "your-preview-kv-id"
```

### 2. Set Environment Variables

Production environment:
```bash
cd packages/ai-engine

# Set secrets (not visible in dashboard)
echo "your-openhands-key" | wrangler secret put OPENHANDS_API_KEY
echo "https://your-openhands-url" | wrangler secret put OPENHANDS_API_URL

# Set public variables (visible in dashboard)
wrangler secret put OPENHANDS_LLM  # claude-3.5-sonnet
```

### 3. Custom Domain (Optional)

Add to `wrangler.toml`:
```toml
routes = [
  { pattern = "ai.mcpoverflow.io", custom_domain = true }
]
```

Or configure in Cloudflare Dashboard:
1. Go to Workers & Pages > Your Worker
2. Click "Triggers" tab
3. Add custom domain

## Deployment Environments

### Staging Environment

```bash
./deploy-cloudflare.sh deploy-staging

# Or manually:
cd packages/ai-engine
npm run deploy:staging
```

Staging URL: `https://mcpoverflow-ai-engine.staging-workers.dev`

### Production Environment

```bash
./deploy-cloudflare.sh deploy-production

# Or manually:
cd packages/ai-engine
npm run deploy:production
```

Production URL: `https://mcpoverflow-ai-engine.workers.dev`

## Testing Deployment

### 1. Health Check

```bash
# Get your worker URL from deployment output
WORKER_URL="https://mcpoverflow-ai-engine.workers.dev"

# Test health endpoint
curl $WORKER_URL/health

# Expected response:
# {
#   "status": "healthy",
#   "service": "mcpoverflow-ai-engine",
#   "environment": "production",
#   "openhands": {
#     "healthy": true,
#     "version": "0.1.0",
#     "latency": 45
#   },
#   "timestamp": "2024-01-15T10:30:00.000Z"
# }
```

### 2. Test API Analysis

```bash
curl -X POST $WORKER_URL/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "specType": "openapi",
    "spec": {
      "openapi": "3.0.0",
      "info": {"title": "Test API", "version": "1.0.0"},
      "paths": {
        "/users": {
          "get": {"summary": "List users"}
        }
      }
    }
  }'
```

### 3. Test Job Creation

```bash
curl -X POST $WORKER_URL/api/generate-from-description \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Create a simple connector for GitHub API"
  }'

# Response:
# {
#   "jobId": "uuid-here",
#   "status": "pending",
#   "message": "Natural language generation started",
#   "estimatedMs": 180000
# }

# Check job status:
curl $WORKER_URL/api/jobs/{jobId}
```

## Monitoring

### View Real-time Logs

```bash
cd packages/ai-engine

# Stream live logs
wrangler tail

# Or use the deployment script
cd ../..
./deploy-cloudflare.sh logs
```

### Analytics Dashboard

View in Cloudflare Dashboard:
1. Go to Workers & Pages
2. Select your worker
3. Click "Metrics" tab

Metrics available:
- Requests per second
- CPU time used
- Success rate
- Error rate
- P50/P95/P99 latency

### Set Up Alerts

1. Go to Cloudflare Dashboard > Notifications
2. Create new notification
3. Select "Workers" category
4. Configure thresholds:
   - Error rate > 5%
   - CPU time > 80% limit
   - Request rate > expected

## Update Go Backend

After deploying AI Engine to Cloudflare, update your Go backend configuration:

```bash
# Update .env
OPENHANDS_API_URL=https://mcpoverflow-ai-engine.workers.dev

# Or set environment variable
export OPENHANDS_API_URL=https://mcpoverflow-ai-engine.workers.dev

# Restart Go API service
./deploy-ai.sh restart
```

## Scaling & Performance

### Request Limits

Free tier limits:
- 100,000 requests/day
- 10ms CPU time per request
- 128MB memory per request

Paid tier ($5/month):
- 10M requests/month included
- 50ms CPU time per request
- 128MB memory per request
- Additional requests: $0.50/million

### Optimization Tips

1. **Use KV for Caching**
```typescript
// Cache API analysis results
const cacheKey = `analysis:${hash(spec)}`;
const cached = await env.AI_JOBS.get(cacheKey);
if (cached) {
  return JSON.parse(cached);
}

// ... perform analysis ...

await env.AI_JOBS.put(cacheKey, JSON.stringify(result), {
  expirationTtl: 3600, // 1 hour cache
});
```

2. **Optimize Bundle Size**
```bash
# Use esbuild minification
npm run build:worker -- --minify

# Analyze bundle
npx esbuild src/worker.ts --bundle --analyze
```

3. **Background Jobs with Durable Objects**
For long-running AI operations, use Durable Objects:

```typescript
// Future enhancement
export class AIJobProcessor {
  async fetch(request: Request) {
    // Process long-running job
  }
}
```

## Troubleshooting

### Worker Not Responding

```bash
# Check deployment status
cd packages/ai-engine
wrangler deployments list

# View recent logs
wrangler tail --format=pretty

# Check worker health
curl https://mcpoverflow-ai-engine.workers.dev/health
```

### KV Namespace Issues

```bash
# List KV namespaces
wrangler kv:namespace list

# Check KV contents
wrangler kv:key list --namespace-id=YOUR_KV_ID

# Get specific key
wrangler kv:key get JOB_ID --namespace-id=YOUR_KV_ID
```

### OpenHands Connection Timeout

```typescript
// Increase timeout in openhands-adapter.ts
constructor(config?: OpenHandsConfig) {
  this.config = {
    timeout: 300000, // 5 minutes for Cloudflare
  };
}
```

### CPU Time Limit Exceeded

If hitting 50ms CPU limit:
1. Upgrade to paid plan ($5/month)
2. Optimize code (reduce blocking operations)
3. Use Durable Objects for long tasks
4. Cache results aggressively

### Bundle Too Large

```bash
# Current bundle size
npm run build:worker

# Reduce bundle:
# 1. Remove unused dependencies
# 2. Use dynamic imports
# 3. Enable tree-shaking
```

## Rollback Deployment

### List Deployments

```bash
cd packages/ai-engine
wrangler deployments list
```

### Rollback to Previous Version

```bash
# Using script
./deploy-cloudflare.sh rollback

# Or manually
cd packages/ai-engine
wrangler rollback <deployment-id>
```

## Cost Estimation

### Free Tier
- **Cost**: $0/month
- **Limits**: 100K requests/day
- **Best for**: Development, testing, small projects

### Paid Plan ($5/month)
- **Cost**: $5/month base + usage
- **Includes**: 10M requests/month
- **Additional**: $0.50 per million requests

### Example Costs

**Small SaaS (10K daily users)**
- Requests: ~300K/day = 9M/month
- Cost: $5/month (within free tier)

**Medium SaaS (100K daily users)**
- Requests: ~3M/day = 90M/month
- Cost: $5 + (80M × $0.50/1M) = $45/month

**Large SaaS (1M daily users)**
- Requests: ~30M/day = 900M/month
- Cost: $5 + (890M × $0.50/1M) = $450/month

Compare to:
- AWS Lambda: ~$800/month
- Google Cloud Run: ~$600/month
- Traditional servers: $2,000+/month

## Security Best Practices

### 1. Protect Secrets

```bash
# Never commit secrets to git
# Always use wrangler secret put

echo "secret" | wrangler secret put SECRET_NAME
```

### 2. Rate Limiting

Add to worker:
```typescript
// Rate limit by IP
const rateLimiter = new RateLimiter({
  limit: 100,
  window: 60000, // 1 minute
});

if (!await rateLimiter.check(clientIP)) {
  return c.json({ error: 'Rate limit exceeded' }, 429);
}
```

### 3. CORS Configuration

```typescript
// Restrict origins
cors({
  origin: [
    'https://mcpoverflow.com',
    'https://app.mcpoverflow.io',
  ],
  credentials: true,
})
```

### 4. Input Validation

```typescript
// Validate all inputs
if (!isValidSpec(spec)) {
  return c.json({ error: 'Invalid specification' }, 400);
}
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Deploy to Cloudflare

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install dependencies
        run: cd packages/ai-engine && npm install

      - name: Build worker
        run: cd packages/ai-engine && npm run build:worker

      - name: Deploy to Cloudflare
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          workingDirectory: packages/ai-engine
          command: deploy --env production
```

### Environment Variables for CI

```bash
# Set in GitHub Settings > Secrets
CLOUDFLARE_API_TOKEN=your-token
CLOUDFLARE_ACCOUNT_ID=your-account-id
OPENHANDS_API_KEY=your-key
OPENHANDS_API_URL=your-url
```

## Custom Domain Setup

### 1. Add Domain to Cloudflare

1. Go to Cloudflare Dashboard
2. Add your domain
3. Update nameservers at your registrar

### 2. Configure Worker Route

```toml
# In wrangler.toml
routes = [
  { pattern = "ai.mcpoverflow.io/*", zone_name = "mcpoverflow.io" }
]
```

### 3. Deploy

```bash
npm run deploy
```

### 4. Verify

```bash
curl https://ai.mcpoverflow.io/health
```

## Support & Resources

### Documentation
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [KV Storage Docs](https://developers.cloudflare.com/workers/runtime-apis/kv/)

### Community
- [Cloudflare Discord](https://discord.gg/cloudflaredev)
- [Workers Forum](https://community.cloudflare.com/c/developers/workers/)
- [MCPoverflow Discord](https://discord.gg/mcpoverflow)

### Get Help
- GitHub Issues: https://github.com/mcpoverflow/mcpoverflow/issues
- Email: support@mcpoverflow.com

## Next Steps

After successful deployment:

1. ✅ **Update Go Backend** - Point to Worker URL
2. ✅ **Configure Custom Domain** - Use your own domain
3. ✅ **Set Up Monitoring** - Enable alerts
4. ✅ **Implement Caching** - Reduce costs
5. ✅ **Add Analytics** - Track usage
6. ✅ **Test Load** - Verify performance
7. ✅ **Document** - Update team docs

## Conclusion

Your AI Engine is now running on Cloudflare's global edge network with:
- ⚡ Low latency worldwide
- 📈 Auto-scaling capabilities
- 💰 Cost-effective pricing
- 🔒 Built-in DDoS protection
- 📊 Real-time analytics

Enjoy your blazing-fast AI-powered connector generation! 🚀
