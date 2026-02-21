# MCPoverflow + OpenHands Integration - Implementation Guide

Complete guide to implementing AI-powered connector generation in MCPoverflow using OpenHands.

## Overview

This integration adds six powerful AI capabilities to MCPoverflow:

1. **Natural Language Connector Builder** - Generate connectors from plain English
2. **Intelligent API Analysis** - Deep analysis of API specifications
3. **AI Code Generation** - Production-ready connector code
4. **Automatic Test Generation** - Comprehensive test suites
5. **Auto-Fix** - Automatically fix broken connectors
6. **Smart Documentation** - Complete documentation generation

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    MCPoverflow Frontend                       │
│                   (React + TypeScript)                        │
└───────────────────────────┬──────────────────────────────────┘
                            │ REST API
┌───────────────────────────▼──────────────────────────────────┐
│                    Go Backend API                             │
│                  (Gin Framework)                              │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  AI Handler (internal/ai/handlers.go)               │    │
│  │  - GenerateFromNaturalLanguage()                    │    │
│  │  - AnalyzeAPI()                                     │    │
│  │  - GenerateConnector()                              │    │
│  │  - GenerateTests()                                  │    │
│  │  - ValidateConnector()                              │    │
│  │  - FixConnector()                                   │    │
│  └─────────────────────┬───────────────────────────────┘    │
│                        │                                     │
│  ┌─────────────────────▼───────────────────────────────┐    │
│  │  OpenHands Service (internal/ai/service.go)         │    │
│  │  - Job Management                                   │    │
│  │  - HTTP Client for AI Engine                       │    │
│  └─────────────────────┬───────────────────────────────┘    │
└────────────────────────┼──────────────────────────────────────┘
                         │ HTTP
┌────────────────────────▼──────────────────────────────────────┐
│              AI Engine Bridge Server                          │
│              (Node.js + Express)                              │
│              packages/ai-engine/server.ts                     │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  OpenHands Adapter                                  │    │
│  │  (packages/ai-engine/openhands-adapter.ts)          │    │
│  │                                                      │    │
│  │  - analyzeAPI()                                     │    │
│  │  - generateConnector()                              │    │
│  │  - generateTests()                                  │    │
│  │  - validateConnector()                              │    │
│  │  - fixConnector()                                   │    │
│  │  - generateDocumentation()                          │    │
│  │  - generateFromDescription()                        │    │
│  └─────────────────────┬───────────────────────────────┘    │
└────────────────────────┼──────────────────────────────────────┘
                         │ HTTP/WebSocket
┌────────────────────────▼──────────────────────────────────────┐
│                     OpenHands AI                              │
│                   (Autonomous Agent)                          │
│                                                               │
│  - Code Analysis                                              │
│  - Code Generation                                            │
│  - Testing                                                    │
│  - Validation                                                 │
│  - Documentation                                              │
└───────────────────────────────────────────────────────────────┘
```

## Implementation Status

### ✅ Completed

1. **TypeScript OpenHands Adapter** (`packages/ai-engine/openhands-adapter.ts`)
   - Complete class with all methods
   - Type-safe interfaces
   - Error handling
   - Comprehensive prompts for each task

2. **Node.js Bridge Server** (`packages/ai-engine/server.ts`)
   - Express server exposing REST API
   - Health check endpoint
   - All AI endpoints implemented
   - Error handling and validation

3. **Go Backend Integration** (`services/api-service/internal/ai/`)
   - `handlers.go` - HTTP request handlers
   - `service.go` - OpenHands service client
   - `routes.go` - Route registration
   - Integrated into main routes

4. **Documentation**
   - AI Engine README
   - API endpoint documentation
   - Environment configuration
   - Docker setup

### 🚧 To Be Implemented

1. **Job Storage System**
   - Redis-based job queue
   - Job status persistence
   - Progress tracking
   - Result caching

2. **Frontend Components**
   - Natural Language input form
   - API analysis results UI
   - Connector generation wizard
   - Job status monitoring
   - Test results display

3. **Database Schema**
   - AI jobs table
   - Generated connectors storage
   - Test results storage
   - Usage analytics

4. **Testing**
   - Unit tests for handlers
   - Integration tests for API endpoints
   - E2E tests for full workflow

5. **Monitoring & Observability**
   - Prometheus metrics
   - Grafana dashboards
   - Error tracking
   - Performance monitoring

## Step-by-Step Setup

### Prerequisites

- Go 1.21+
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL
- Redis
- OpenHands instance (local or cloud)

### Step 1: Set Up OpenHands

#### Option A: Local OpenHands (Recommended for Development)

```bash
# Clone OpenHands
git clone https://github.com/All-Hands-AI/OpenHands.git
cd OpenHands

# Install dependencies
pip install -e .

# Configure
export OPENHANDS_API_KEY="your-api-key"
export LLM_API_KEY="your-llm-api-key"  # Anthropic or OpenAI

# Start OpenHands
python -m openhands.server.listen --port 3000
```

#### Option B: OpenHands Cloud

```bash
# Sign up at https://www.all-hands.dev/
# Get your API endpoint and key
export OPENHANDS_API_URL="https://api.all-hands.dev"
export OPENHANDS_API_KEY="your-cloud-api-key"
```

### Step 2: Set Up AI Engine Bridge Server

```bash
cd packages/ai-engine

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Edit .env:
# OPENHANDS_API_URL=http://localhost:3000
# OPENHANDS_API_KEY=your-key
# OPENHANDS_LLM=claude-3.5-sonnet
# OPENHANDS_RUNTIME=docker

# Start development server
npm run dev

# Or build and run production
npm run build
npm start
```

The AI Engine will start on `http://localhost:3001`

### Step 3: Configure Go Backend

```bash
cd services/api-service

# Add to your .env or environment:
export OPENHANDS_API_URL="http://localhost:3001"
export OPENHANDS_API_KEY="your-bridge-api-key"

# Install Go dependencies
go mod download

# Build
go build -o bin/api-service ./cmd/main.go

# Run
./bin/api-service
```

### Step 4: Verify Integration

```bash
# 1. Check AI Engine health
curl http://localhost:3001/health

# Expected response:
# {
#   "status": "healthy",
#   "service": "openhands-bridge",
#   "openhands": {
#     "healthy": true,
#     "version": "0.1.0",
#     "latency": 45
#   }
# }

# 2. Check Go API health
curl http://localhost:8080/health

# 3. Test API analysis endpoint
curl -X POST http://localhost:8080/api/v1/ai/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "specType": "openapi",
    "spec": {
      "openapi": "3.0.0",
      "info": {
        "title": "Test API",
        "version": "1.0.0"
      },
      "paths": {
        "/users": {
          "get": {
            "summary": "List users",
            "responses": {
              "200": {
                "description": "Success"
              }
            }
          }
        }
      }
    }
  }'
```

## Usage Examples

### 1. Natural Language Connector Generation

```bash
curl -X POST http://localhost:8080/api/v1/ai/generate/natural-language \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "description": "Create a connector for the Stripe API. I need to be able to create customers, manage subscriptions, and process one-time payments. Use TypeScript and deploy to Cloudflare Workers."
  }'

# Response:
# {
#   "jobId": "uuid-here",
#   "status": "pending",
#   "message": "Natural language connector generation started",
#   "estimatedMs": 180000
# }

# Check job status:
curl http://localhost:8080/api/v1/ai/jobs/{jobId} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. API Analysis

```bash
curl -X POST http://localhost:8080/api/v1/ai/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d @openapi-spec.json

# Response includes:
# - API purpose and domain
# - Authentication methods
# - Rate limits
# - Endpoint categorization
# - Data models
# - Recommended MCP tools
# - Best practices
```

### 3. Connector Generation

```bash
curl -X POST http://localhost:8080/api/v1/ai/generate/connector \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "stripe-connector",
    "specType": "openapi",
    "spec": { ... },
    "language": "typescript",
    "runtime": "cloudflare-workers",
    "authConfig": {
      "type": "apikey",
      "config": {
        "headerName": "Authorization",
        "prefix": "Bearer"
      }
    },
    "selectedEndpoints": [
      "/v1/customers",
      "/v1/subscriptions",
      "/v1/charges"
    ]
  }'
```

### 4. Test Generation

```bash
curl -X POST http://localhost:8080/api/v1/ai/generate/tests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "connectorId": "connector-uuid",
    "language": "typescript"
  }'
```

### 5. Auto-Fix Broken Connector

```bash
curl -X POST http://localhost:8080/api/v1/ai/fix \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "connectorId": "connector-uuid",
    "error": {
      "message": "API endpoint /v1/customers not found",
      "stack": "...",
      "apiResponse": {
        "status": 404,
        "body": "Endpoint has been moved to /v2/customers"
      }
    }
  }'
```

## API Endpoints Reference

### POST /api/v1/ai/generate/natural-language
Generate connector from natural language description.

**Request:**
```json
{
  "description": "string (required)"
}
```

**Response:**
```json
{
  "jobId": "string",
  "status": "pending",
  "message": "string",
  "estimatedMs": 180000
}
```

### POST /api/v1/ai/analyze
Analyze API specification.

**Request:**
```json
{
  "specType": "openapi|graphql|postman",
  "spec": { ... }
}
```

**Response:**
```json
{
  "purpose": "string",
  "domain": "string",
  "authMethods": ["string"],
  "endpoints": [...],
  "dataModels": ["string"],
  "recommendedTools": ["string"],
  "bestPractices": ["string"]
}
```

### POST /api/v1/ai/generate/connector
Generate MCP connector code.

**Request:**
```json
{
  "name": "string",
  "specType": "openapi|graphql|postman",
  "spec": { ... },
  "language": "typescript|go|python",
  "runtime": "cloudflare-workers|vercel|lambda|docker",
  "authConfig": {
    "type": "apikey|oauth|jwt|none",
    "config": { ... }
  },
  "selectedEndpoints": ["string"],
  "customizations": { ... }
}
```

### POST /api/v1/ai/generate/tests
Generate test suite for connector.

**Request:**
```json
{
  "connectorId": "string",
  "language": "typescript|go|python"
}
```

### POST /api/v1/ai/validate
Validate connector by running tests.

**Request:**
```json
{
  "connectorId": "string"
}
```

**Response:**
```json
{
  "valid": true,
  "issues": [],
  "testResults": {
    "passed": 45,
    "failed": 0,
    "skipped": 2,
    "duration": 12500
  },
  "performance": {
    "avgResponseTime": 145.5,
    "p95ResponseTime": 250.0,
    "p99ResponseTime": 380.0
  }
}
```

### POST /api/v1/ai/fix
Fix broken connector automatically.

**Request:**
```json
{
  "connectorId": "string",
  "error": {
    "message": "string",
    "stack": "string",
    "apiResponse": { ... }
  }
}
```

**Response:**
```json
{
  "fixed": true,
  "fixedCode": "string",
  "explanation": "string",
  "confidence": 0.95,
  "changes": ["string"]
}
```

### GET /api/v1/ai/jobs/:jobId
Get status of async AI job.

**Response:**
```json
{
  "jobId": "string",
  "status": "pending|processing|completed|failed",
  "progress": 75,
  "result": { ... },
  "error": "string",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:32:45Z"
}
```

## Docker Deployment

### docker-compose.yml

```yaml
version: '3.8'

services:
  # AI Engine Bridge Server
  ai-engine:
    build: ./packages/ai-engine
    container_name: mcpoverflow-ai-engine
    ports:
      - "3001:3001"
    environment:
      - OPENHANDS_API_URL=${OPENHANDS_API_URL}
      - OPENHANDS_API_KEY=${OPENHANDS_API_KEY}
      - OPENHANDS_LLM=claude-3.5-sonnet
      - OPENHANDS_RUNTIME=docker
      - NODE_ENV=production
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
    networks:
      - mcpoverflow-network

  # Go API Service
  api-service:
    build: ./services/api-service
    container_name: mcpoverflow-api
    ports:
      - "8080:8080"
    environment:
      - OPENHANDS_API_URL=http://ai-engine:3001
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - ai-engine
      - postgres
      - redis
    restart: unless-stopped
    networks:
      - mcpoverflow-network

  postgres:
    image: postgres:15-alpine
    container_name: mcpoverflow-postgres
    environment:
      - POSTGRES_DB=mcpoverflow
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - mcpoverflow-network

  redis:
    image: redis:7-alpine
    container_name: mcpoverflow-redis
    volumes:
      - redis-data:/data
    networks:
      - mcpoverflow-network

networks:
  mcpoverflow-network:
    driver: bridge

volumes:
  postgres-data:
  redis-data:
```

### Start Everything

```bash
docker-compose up -d
```

## Environment Variables

### AI Engine (.env)
```bash
OPENHANDS_BRIDGE_PORT=3001
OPENHANDS_API_URL=http://localhost:3000
OPENHANDS_API_KEY=your-key
OPENHANDS_LLM=claude-3.5-sonnet
OPENHANDS_RUNTIME=docker
NODE_ENV=production
LOG_LEVEL=info
```

### Go Backend (.env)
```bash
# OpenHands Integration
OPENHANDS_API_URL=http://localhost:3001
OPENHANDS_API_KEY=your-bridge-key

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/mcpoverflow
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key

# Server
PORT=8080
ENVIRONMENT=production
```

## Monitoring

### Prometheus Metrics

The Go backend exposes metrics at `/metrics`:

- `ai_requests_total` - Total AI requests
- `ai_request_duration_seconds` - Request duration
- `ai_request_errors_total` - Error count
- `ai_job_queue_size` - Current job queue size
- `ai_active_jobs` - Currently processing jobs

### Grafana Dashboard

Import the dashboard from `monitoring/grafana/ai-dashboard.json`

Key metrics to monitor:
- Request rate
- Error rate
- Average response time
- P95/P99 latency
- Job queue depth
- OpenHands connection status

## Troubleshooting

### AI Engine Connection Issues

**Problem:** Go backend cannot connect to AI Engine

**Solution:**
```bash
# Check AI Engine is running
curl http://localhost:3001/health

# Check Go backend can reach it
curl -v http://localhost:3001/health

# Check Docker network if using containers
docker network inspect mcpoverflow-network
```

### OpenHands Timeout

**Problem:** Requests to OpenHands time out

**Solution:**
```typescript
// Increase timeout in openhands-adapter.ts
constructor(config?: OpenHandsConfig) {
  this.config = {
    timeout: 300000, // 5 minutes
  };
}
```

### High Memory Usage

**Problem:** AI Engine consuming too much memory

**Solution:**
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm start

# Or in Dockerfile:
ENV NODE_OPTIONS="--max-old-space-size=4096"
```

### Job Queue Backing Up

**Problem:** Jobs are queuing faster than processing

**Solution:**
1. Scale AI Engine horizontally
2. Implement job priority queue
3. Add more OpenHands instances
4. Cache common results

## Next Steps

1. **Implement Job Storage**
   - Use Redis for job queue
   - Store results in PostgreSQL
   - Add progress tracking

2. **Build Frontend Components**
   - Natural language input form
   - Real-time job progress
   - Result visualization

3. **Add Caching**
   - Cache API analyses
   - Cache common connectors
   - Implement CDN for generated code

4. **Implement Webhooks**
   - Notify on job completion
   - Integration with CI/CD
   - Slack/Discord notifications

5. **Add Analytics**
   - Track usage patterns
   - Monitor success rates
   - Identify popular APIs

## Support

For issues and questions:
- GitHub Issues: https://github.com/mcpoverflow/mcpoverflow/issues
- Documentation: https://docs.mcpoverflow.dev
- Discord: https://discord.gg/mcpoverflow

## License

MIT
