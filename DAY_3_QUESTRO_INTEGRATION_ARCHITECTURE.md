# DAY 3 - QUESTRO INTEGRATION ARCHITECTURE

**Date**: January 10, 2026
**Status**: Design Complete | Implementation In Progress
**Goal**: Integrate Questro testing platform with MCPOverflow connector generation

---

## SYSTEM ARCHITECTURE

```
┌────────────────────────────────────────────────────────────────────┐
│                        QUESTRO PLATFORM                             │
│               (AI-Powered Testing Platform SaaS)                    │
│                                                                     │
│  Frontend (React)              Backend (Express + Node.js)          │
│  ├─ Dashboard                  ├─ API Routes                       │
│  ├─ Test Management            ├─ Authentication                   │
│  └─ API Testing (NEW) ───────▶ └─ API Connector Service (NEW)     │
│                                       │                             │
└───────────────────────────────────────┼─────────────────────────────┘
                                        │ HTTP REST
                                        ▼
┌────────────────────────────────────────────────────────────────────┐
│                    MCPOVERFLOW AI ENGINE                            │
│                  (http://localhost:3001)                            │
│                                                                     │
│  Endpoints:                                                         │
│  ├─ POST /api/generate-connector     (sync)                        │
│  ├─ POST /api/jobs/generate-connector (async)                      │
│  ├─ GET  /api/jobs/:jobId            (status)                      │
│  └─ GET  /health                     (health check)                │
│                                       │                             │
└───────────────────────────────────────┼─────────────────────────────┘
                                        │ HTTP REST
                                        ▼
┌────────────────────────────────────────────────────────────────────┐
│                      OPENHANDS API                                  │
│                  (http://localhost:8000)                            │
│                                                                     │
│  ├─ FastAPI Server                                                 │
│  ├─ OpenHands SDK v1.1.0                                           │
│  ├─ LLM Integration (GPT-4)                                        │
│  └─ Code Generation Engine                                         │
└────────────────────────────────────────────────────────────────────┘
```

---

## INTEGRATION COMPONENTS

### 1. Questro Backend Integration

**New Module**: [qestro/backend/src/services/mcpoverflow-connector.service.ts](qestro/backend/src/services/mcpoverflow-connector.service.ts)

**Purpose**: Service layer to communicate with MCPOverflow AI Engine

**Key Features**:
- HTTP client for MCPOverflow API calls
- Async job management
- Status polling
- Error handling and retries
- Response caching

**Methods**:
```typescript
class MCPOverflowConnectorService {
  // Core generation
  async generateConnector(spec, options): Promise<Connector>
  async generateConnectorAsync(spec, options): Promise<JobResponse>

  // Job management
  async getJobStatus(jobId): Promise<JobStatus>
  async pollJobUntilComplete(jobId): Promise<Connector>

  // Analysis
  async analyzeAPI(spec): Promise<APIAnalysis>

  // Health
  async healthCheck(): Promise<HealthStatus>
}
```

**Configuration**:
```typescript
// backend/.env
MCPOVERFLOW_API_URL=http://localhost:3001
MCPOVERFLOW_API_KEY=<optional-for-local>
MCPOVERFLOW_TIMEOUT=300000  // 5 minutes
MCPOVERFLOW_RETRY_COUNT=3
MCPOVERFLOW_POLL_INTERVAL=5000  // 5 seconds
```

---

### 2. API Routes

**New Routes**: [qestro/backend/src/api/connectors/routes.ts](qestro/backend/src/api/connectors/routes.ts)

```typescript
// Connector Management
POST   /api/connectors/generate           // Generate connector
POST   /api/connectors/analyze            // Analyze API spec
GET    /api/connectors                    // List connectors
GET    /api/connectors/:id                // Get connector details
PUT    /api/connectors/:id                // Update connector
DELETE /api/connectors/:id                // Delete connector

// Job Management
GET    /api/connectors/jobs/:jobId        // Get job status
GET    /api/connectors/jobs                // List all jobs

// Test Management
POST   /api/connectors/:id/tests          // Generate tests
POST   /api/connectors/:id/validate       // Validate connector
POST   /api/connectors/:id/deploy         // Deploy connector

// Analytics
GET    /api/connectors/stats              // Usage statistics
```

---

### 3. Database Schema

**New Tables**:

```typescript
// api_connectors table
interface APIConnector {
  id: string;                    // UUID
  userId: string;                // FK to users
  projectId: string;             // FK to projects
  name: string;                  // "Stripe Payment Connector"
  description: string;

  // API Spec
  specType: 'openapi' | 'graphql' | 'postman';
  spec: object;                  // Original API specification

  // Generation Config
  language: 'typescript' | 'go' | 'python';
  runtime: 'cloudflare-workers' | 'vercel' | 'lambda';

  // Generated Artifacts
  code: string;                  // Generated connector code
  tests: string;                 // Generated test suite
  documentation: string;         // Generated docs

  // Status
  status: 'draft' | 'generating' | 'ready' | 'failed' | 'deployed';
  generationJobId: string;       // MCPOverflow job ID

  // Metadata
  aiModel: string;               // 'gpt-4'
  generatedAt: Date;
  tokensUsed: number;
  generationDurationMs: number;

  // Deployment
  deployedAt: Date;
  deploymentUrl: string;
  deploymentStatus: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// connector_jobs table
interface ConnectorJob {
  id: string;                    // UUID (matches MCPOverflow jobId)
  connectorId: string;           // FK to api_connectors
  userId: string;

  type: 'generate' | 'tests' | 'validate';
  status: 'queued' | 'processing' | 'completed' | 'failed';

  // Timing
  startedAt: Date;
  completedAt: Date;
  durationMs: number;

  // Results
  result: object;
  error: string;

  createdAt: Date;
  updatedAt: Date;
}

// connector_endpoints table
interface ConnectorEndpoint {
  id: string;
  connectorId: string;           // FK to api_connectors

  method: string;                // GET, POST, etc.
  path: string;                  // /v1/customers
  operationId: string;           // createCustomer
  description: string;

  // Schemas
  requestSchema: object;
  responseSchema: object;

  // Testing
  hasMockData: boolean;
  testCount: number;

  createdAt: Date;
  updatedAt: Date;
}
```

**Migration**: [qestro/backend/migrations/001_add_api_connectors.sql](qestro/backend/migrations/001_add_api_connectors.sql)

---

### 4. Frontend Components

**New Pages**:

```
qestro/frontend/src/pages/
├── api-testing/
│   ├── Dashboard.tsx              // Overview of all connectors
│   ├── ConnectorList.tsx          // List all connectors
│   ├── ConnectorCreate.tsx        // Create wizard
│   ├── ConnectorDetails.tsx       // View/edit connector
│   └── ConnectorTests.tsx         // Run tests interface
```

**New Components**:

```
qestro/frontend/src/components/connectors/
├── ConnectorCard.tsx              // Connector summary card
├── ConnectorForm.tsx              // Create/edit form
├── SpecUploader.tsx               // Upload OpenAPI/GraphQL
├── LanguageSelector.tsx           // TypeScript/Go/Python
├── RuntimeSelector.tsx            // Cloudflare/Vercel/Lambda
├── CodePreview.tsx                // View generated code
├── TestRunner.tsx                 // Execute tests
├── JobStatusBadge.tsx             // Job status indicator
└── DeploymentPanel.tsx            // Deploy to runtime
```

**Service Layer**:

```typescript
// frontend/src/services/api-connector.service.ts

class APIConnectorService {
  async createConnector(data): Promise<Connector>;
  async listConnectors(projectId): Promise<Connector[]>;
  async getConnector(id): Promise<Connector>;
  async updateConnector(id, data): Promise<Connector>;
  async deleteConnector(id): Promise<void>;

  async getJobStatus(jobId): Promise<JobStatus>;
  async generateTests(connectorId): Promise<Tests>;
  async validateConnector(connectorId): Promise<ValidationResult>;
  async deployConnector(connectorId): Promise<DeploymentResult>;
}
```

---

## USER FLOWS

### Flow 1: Create Connector from OpenAPI Spec

```
1. User navigates to "API Testing" section
   ↓
2. Clicks "+ New Connector"
   ↓
3. Connector Creation Wizard opens:

   Step 1: Upload Specification
   - Drag & drop OpenAPI JSON/YAML file
   - Or paste spec URL
   - Or paste spec content directly

   Step 2: Configure Options
   - Connector name
   - Language: TypeScript / Go / Python
   - Runtime: Cloudflare Workers / Vercel / Lambda
   - Select specific endpoints (optional)

   Step 3: Generate
   - Click "Generate Connector"
   - Shows progress: "Analyzing API..." → "Generating code..." → "Complete!"
   - Display generated code preview

   Step 4: Review & Save
   - Review connector code
   - Review auto-generated tests
   - Save to project
   ↓
4. Connector saved and ready for use
```

### Flow 2: Generate Tests for Existing Connector

```
1. User opens connector details page
   ↓
2. Clicks "Generate Tests" button
   ↓
3. System calls MCPOverflow
   ↓
4. Tests generated and displayed
   ↓
5. User can run tests immediately
```

### Flow 3: Deploy Connector

```
1. User has ready connector
   ↓
2. Clicks "Deploy" button
   ↓
3. Selects deployment target:
   - Cloudflare Workers
   - Vercel Edge Functions
   - AWS Lambda
   ↓
4. System deploys connector
   ↓
5. Deployment URL provided
   ↓
6. Connector ready for API calls
```

---

## IMPLEMENTATION PLAN

### Phase 1: Backend Service Layer (Hours 1-2)

**Tasks**:
1. Create `MCPOverflowConnectorService` class
2. Implement HTTP client with axios
3. Add health check endpoint integration
4. Implement sync connector generation
5. Implement async connector generation
6. Add job status polling
7. Add error handling and retries

**Deliverables**:
- [qestro/backend/src/services/mcpoverflow-connector.service.ts](qestro/backend/src/services/mcpoverflow-connector.service.ts)
- [qestro/backend/src/config/mcpoverflow.config.ts](qestro/backend/src/config/mcpoverflow.config.ts)
- Unit tests

---

### Phase 2: API Routes (Hours 2-3)

**Tasks**:
1. Create connector routes module
2. Implement connector generation endpoint
3. Implement connector CRUD endpoints
4. Implement job management endpoints
5. Add authentication middleware
6. Add rate limiting
7. Add input validation

**Deliverables**:
- [qestro/backend/src/api/connectors/routes.ts](qestro/backend/src/api/connectors/routes.ts)
- [qestro/backend/src/api/connectors/controller.ts](qestro/backend/src/api/connectors/controller.ts)
- [qestro/backend/src/api/connectors/validators.ts](qestro/backend/src/api/connectors/validators.ts)
- Integration tests

---

### Phase 3: Database Integration (Hour 3)

**Tasks**:
1. Create database migration
2. Define Drizzle ORM schemas
3. Create repository layer
4. Implement CRUD operations
5. Add indexes for performance

**Deliverables**:
- [qestro/backend/migrations/001_add_api_connectors.sql](qestro/backend/migrations/001_add_api_connectors.sql)
- [qestro/backend/src/db/schemas/connectors.schema.ts](qestro/backend/src/db/schemas/connectors.schema.ts)
- [qestro/backend/src/repositories/connector.repository.ts](qestro/backend/src/repositories/connector.repository.ts)

---

### Phase 4: Frontend Components (Hours 4-6)

**Tasks**:
1. Create API Testing dashboard page
2. Build connector creation wizard
3. Implement spec uploader component
4. Add code preview component
5. Build test runner interface
6. Add deployment panel
7. Implement real-time status updates

**Deliverables**:
- [qestro/frontend/src/pages/api-testing/*](qestro/frontend/src/pages/api-testing/)
- [qestro/frontend/src/components/connectors/*](qestro/frontend/src/components/connectors/)
- [qestro/frontend/src/services/api-connector.service.ts](qestro/frontend/src/services/api-connector.service.ts)
- Component tests

---

### Phase 5: End-to-End Testing (Hours 6-7)

**Tasks**:
1. Test connector generation flow
2. Test job status polling
3. Test error scenarios
4. Test with real API specs (GitHub, Stripe)
5. Load testing
6. Performance optimization

**Deliverables**:
- E2E test suite
- Performance benchmarks
- Bug fixes

---

### Phase 6: Documentation (Hour 8)

**Tasks**:
1. Update README
2. Write API documentation
3. Create user guide
4. Add inline code comments
5. Create Day 3 summary

**Deliverables**:
- [DAY_3_SUMMARY.md](DAY_3_SUMMARY.md)
- [QUESTRO_API_CONNECTOR_GUIDE.md](QUESTRO_API_CONNECTOR_GUIDE.md)
- Updated documentation

---

## CONFIGURATION

### Environment Variables

**Questro Backend** ([qestro/backend/.env](qestro/backend/.env)):
```bash
# MCPOverflow Integration
MCPOVERFLOW_API_URL=http://localhost:3001
MCPOVERFLOW_API_KEY=
MCPOVERFLOW_TIMEOUT=300000
MCPOVERFLOW_RETRY_COUNT=3
MCPOVERFLOW_POLL_INTERVAL=5000
MCPOVERFLOW_MAX_CONNECTORS_PER_USER=50
MCPOVERFLOW_MAX_CONNECTORS_PER_PROJECT=20
```

---

## SUCCESS METRICS

### Technical Metrics
- Connector generation success rate: >95%
- Average generation time: <30 seconds
- API response time: <100ms
- Error rate: <5%

### Business Metrics
- Connectors created in Day 3: >3
- End-to-end test success: 100%
- Integration points working: 100%
- Documentation complete: 100%

---

## RISK MITIGATION

### Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| MCPOverflow downtime | High | Health check before calls, graceful degradation |
| Generation failures | Medium | Retry logic, error messages, manual override |
| Database schema conflicts | Medium | Careful migration testing, rollback plan |
| Frontend/backend mismatch | Low | TypeScript types, API contract testing |

---

## NEXT STEPS

### Immediate (Next Hour)
1. Implement MCPOverflowConnectorService
2. Create API routes
3. Test with existing MCPOverflow endpoints

### Short-term (Hours 2-4)
4. Add database schema
5. Build frontend wizard
6. Test end-to-end flow

### Medium-term (Hours 5-8)
7. Add deployment features
8. Performance testing
9. Documentation
10. Create Day 3 summary

---

## CURRENT STATUS

**Completed**:
- Architecture design
- Integration planning
- Component identification

**In Progress**:
- Service layer implementation

**Next**:
- Create MCPOverflowConnectorService
- Implement API routes
- Test integration

---

**Document Version**: 1.0
**Last Updated**: January 10, 2026
**Status**: Ready for Implementation
**Estimated Completion**: 8 hours
