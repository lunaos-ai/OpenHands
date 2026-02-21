# OpenHands Quick Reference Guide

## File Locations Quick Index

| Component | Key Files |
|-----------|-----------|
| **Main Configuration** | `config.template.toml` |
| **Agent System** | `openhands/controller/agent.py` (base), `openhands/agenthub/codeact_agent/` |
| **Events** | `openhands/events/action/`, `openhands/events/observation/` |
| **Runtime** | `openhands/runtime/base.py`, `openhands/runtime/impl/` |
| **Server API** | `openhands/app_server/v1_router.py` (V1), `openhands/server/listen.py` (V0) |
| **LLM Integration** | `openhands/llm/llm_registry.py`, `openhands/llm/router/` |
| **MCP Support** | `openhands/mcp/client.py`, `openhands/core/config/mcp_config.py` |
| **Microagents** | `openhands/microagent/`, `.openhands/microagents/` |
| **Storage** | `openhands/storage/` (conversations, secrets, settings) |
| **Integrations** | `openhands/integrations/` (GitHub, GitLab, etc) |
| **Security** | `openhands/security/` (Gray Swan, invariants) |
| **Frontend** | `frontend/src/` (React components, API client) |
| **Enterprise** | `enterprise/` (source-available, polyform licensed) |

## Key Architecture Decisions

| Aspect | Technology | Alternative |
|--------|-----------|-------------|
| **Agent Framework** | V1 Software Agent SDK | Legacy V0 (CodeActAgent) |
| **Web Framework** | FastAPI + Uvicorn | WebSockets only (legacy) |
| **Event System** | EventStream (message-based) | Direct function calls |
| **Runtime Default** | Docker | Local, Remote, Modal, Runloop |
| **LLM Support** | LiteLLM (100+ models) | OpenAI only |
| **Tool Discovery** | MCP (dynamic) | Static tool registry |
| **Knowledge Storage** | Microagents (Markdown) | System prompts only |
| **Conversation Store** | File/Memory/Redis | Custom implementations |
| **Authentication** | JWT + OAuth (enterprise) | API keys only |

## Configuration Hierarchy (Highest Priority First)

1. **Environment Variables** - `OPENHANDS_*`, `LLM_*`, `RUNTIME_*`
2. **config.toml File** - Local configuration
3. **Default Values** - Built-in defaults
4. **UI Overrides** - Per-session runtime configuration

## Critical Files for Integration

### For MCP Integration
- `openhands/mcp/client.py` - MCP client implementation
- `openhands/core/config/mcp_config.py` - MCP configuration
- `openhands/runtime/mcp/` - MCP runtime support

### For Agent Customization
- `openhands/controller/agent.py` - Base agent interface
- `openhands/core/config/agent_config.py` - Agent configuration
- `openhands/agenthub/codeact_agent/` - Reference implementation

### For Runtime Customization
- `openhands/runtime/base.py` - Runtime interface
- `openhands/runtime/impl/` - Runtime implementations
- `openhands/runtime/action_execution_server.py` - Action executor

### For API Integration
- `openhands/app_server/v1_router.py` - REST API routes
- `openhands/server/routes/` - Endpoint definitions
- `openhands/app_server/event/` - Event handling

## Essential Configuration Examples

### Enable MCP
```toml
[core]
enable_mcp = true

[[mcp]]
name = "my_tool"
type = "stdio"
command = "python"
args = ["-m", "my_tool"]
```

### Multiple LLM Providers
```toml
[llm]
model = "gpt-4o"
api_key = "sk-..."

[llm.claude]
model = "claude-opus"
api_key = "sk-..."
```

### Custom Runtime
```toml
[core]
runtime = "my_module.CustomRuntime"
```

### Enable Plan Mode
```toml
[agent]
enable_plan_mode = true
enable_task_tracker = true
enable_stuck_detection = true
```

## Common Extension Points

### 1. Create Custom Agent
**File:** `my_module/custom_agent.py`
**Extends:** `openhands.controller.agent.Agent`
**Key methods:** `get_system_message()`, `step()`

### 2. Create MCP Server
**Framework:** `fastmcp`
**Tools:** Decorated with `@app.tool()`
**Communication:** stdio, HTTP, or SSE

### 3. Create Microagent
**Format:** Markdown with YAML frontmatter
**Location:** `.openhands/microagents/`
**Triggers:** Keywords for auto-activation

### 4. Create Integration
**Base:** `openhands.integrations.service_types.GitService`
**Implements:** Authentication, repo ops, webhooks

### 5. Create Runtime
**Base:** `openhands.runtime.base.Runtime`
**Methods:** `run()`, `read()`, `write()`, `browse()`

## Important Classes to Know

| Class | Location | Purpose |
|-------|----------|---------|
| `Agent` | `openhands/controller/agent.py` | Base agent interface |
| `AgentController` | `openhands/controller/agent_controller.py` | V0 event loop driver |
| `Runtime` | `openhands/runtime/base.py` | Execution sandbox interface |
| `EventStream` | `openhands/events/event.py` | Central message hub |
| `Action` | `openhands/events/action/action.py` | Agent action base class |
| `Observation` | `openhands/events/observation/base.py` | Execution result |
| `MCPClient` | `openhands/mcp/client.py` | MCP tool wrapper |
| `AgentConfig` | `openhands/core/config/agent_config.py` | Agent configuration |
| `OpenHandsConfig` | `openhands/core/config/openhands_config.py` | System configuration |
| `BaseMicroagent` | `openhands/microagent/microagent.py` | Microagent loader |

## API Endpoints Cheat Sheet

### Conversations
```
POST   /api/v1/conversations
GET    /api/v1/conversations
GET    /api/v1/conversations/{id}
DELETE /api/v1/conversations/{id}
```

### Events
```
GET    /api/v1/conversations/{id}/events
POST   /api/v1/conversations/{id}/events
```

### Settings
```
GET  /api/v1/settings
POST /api/v1/settings
```

### Files
```
GET  /api/v1/conversations/{id}/files/{path}
POST /api/v1/conversations/{id}/files/{path}
```

### MCP
```
GET    /api/v1/mcp-servers
POST   /api/v1/mcp-servers
DELETE /api/v1/mcp-servers/{id}
```

## Environment Variables

### LLM Configuration
- `LLM_MODEL` - Default model
- `LLM_API_KEY` - API key for LLM
- `LLM_BASE_URL` - Custom provider URL
- `REASONING_EFFORT` - o-series model parameter

### Runtime Configuration
- `RUNTIME` - Runtime type (docker, local, remote)
- `SANDBOX_RUNTIME_CONTAINER_IMAGE` - Container image
- `WORKSPACE_MOUNT_PATH` - Host workspace path
- `SANDBOX_USER_ID` - Sandbox user ID

### Server Configuration
- `FRONTEND_PORT` - Frontend port (default: 3001)
- `BACKEND_PORT` - Backend port (default: 3000)
- `FRONTEND_HOST` - Frontend host binding
- `BACKEND_HOST` - Backend host binding

### Development
- `DEBUG` - Enable debug logging
- `LOG_ALL_EVENTS` - Log all events
- `INSTALL_DOCKER` - Auto-install Docker (0/1)

## Testing Commands

```bash
# Unit tests
poetry run pytest tests/unit/test_*.py

# Specific test
poetry run pytest tests/unit/test_agent.py -v

# Run with coverage
poetry run pytest tests/unit/ --cov=openhands

# Frontend tests
cd frontend && npm run test

# Linting
pre-commit run --all-files --config ./dev_config/python/.pre-commit-config.yaml
```

## Development Commands

```bash
# Build everything
make build

# Start backend only
make start-backend

# Start frontend only
make start-frontend

# Run full application
make run

# Run in Docker
make docker-run

# Development in Docker
make docker-dev

# View help
make help
```

## Key Dependencies

| Package | Purpose | Version |
|---------|---------|---------|
| `fastapi` | Web framework | Latest |
| `litellm` | LLM abstraction | >=1.74.3 |
| `fastmcp` | MCP client | ^2.12.4 |
| `docker` | Container management | Latest |
| `playwright` | Web automation | ^1.55.0 |
| `python-jwt` | Authentication | ^2.9.0 |
| `redis` | Caching/sessions | >=5.2,<7.0 |
| `poetry` | Package management | ^2.1.2 |

## Common Patterns

### Adding a Tool to Agent
1. Create tool class inheriting from Tool base
2. Register in agent's `self.tools` list
3. Add to system message function calls
4. Agent LLM learns to call it

### Adding Configuration Option
1. Add field to config class (e.g., `AgentConfig`)
2. Add entry to `config.template.toml`
3. Use via `config.field_name` in code
4. Document in README

### Creating Custom Integration
1. Inherit from `GitService` or specific service type
2. Implement required abstract methods
3. Add authentication handling
4. Register in provider factory
5. Add configuration section in `config.toml`

### Extending Runtime
1. Inherit from `Runtime` base class
2. Implement action execution methods
3. Return appropriate Observation objects
4. Register via `runtime = "path.to.Custom"`
5. Add configuration in `SandboxConfig`

## Performance Tuning

### Context Window Optimization
- Enable condenser: `enable_default_condenser = true`
- Configure in `condenser` section of config
- Types: `LLMSummarizingCondenserConfig`, `ConversationWindowCondenserConfig`

### Model Routing
- Set fallback models in `model_routing` config
- Use cheaper models for initial analysis
- Route to expensive models for critical decisions

### Caching
- Redis backed conversation caching
- Event stream optimization
- LLM response caching (if supported by provider)

## Monitoring & Debugging

### Enable Debug Logging
```bash
export DEBUG=1
# Logs saved to logs/llm/ directory
```

### Event Trajectory
```toml
[core]
save_trajectory_path = "./trajectories"
save_screenshots_in_trajectory = false
```

### Health Check
```
GET /health
```

## Deployment Checklist

- [ ] Install Python 3.12
- [ ] Install Docker
- [ ] Configure LLM API key
- [ ] Set up workspace mount path
- [ ] Configure runtime type
- [ ] Enable required features in agent config
- [ ] Set up storage backend (file/Redis)
- [ ] Configure webhooks if needed
- [ ] Set up HTTPS certificates
- [ ] Run database migrations (enterprise)
- [ ] Test MCP servers
- [ ] Verify microagents load
- [ ] Set up monitoring/logging
- [ ] Create admin user account

## Security Hardening

- [ ] Use HTTPS in production
- [ ] Set strong JWT secret
- [ ] Enable action confirmation for sensitive commands
- [ ] Configure file upload restrictions
- [ ] Set up rate limiting
- [ ] Enable security analyzer
- [ ] Use dedicated service account (not root)
- [ ] Isolate Docker runtime
- [ ] Encrypt secrets at rest
- [ ] Monitor agent actions
- [ ] Regular security updates
- [ ] Audit trail for agent actions

---

**Document Version:** 1.0
**OpenHands Version:** v1.1.0
**Last Updated:** January 2025
