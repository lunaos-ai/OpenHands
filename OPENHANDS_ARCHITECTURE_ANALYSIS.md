# OpenHands Architecture, Capabilities & Integration Analysis

## Executive Summary

OpenHands is a comprehensive AI-driven development platform with a **dual-architecture approach**:
- **Legacy V0**: Traditional monolithic agent architecture (CodeAct Agent)
- **V1 (Current)**: Software Agent SDK-based architecture with modern app server

The platform is highly extensible through:
1. **MCP (Model Context Protocol)** - External tool integration
2. **Microagents** - Domain-specific prompts and knowledge
3. **Runtime Implementations** - Pluggable sandbox environments
4. **Integrations Framework** - Git providers, version control, issue tracking
5. **Custom Agents** - Implement Agent base class

---

## 1. CORE ARCHITECTURE

### 1.1 High-Level System Design

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                         │
│  - WebSocket client  - Model selector - Settings UI         │
│  - Chat interface    - File browser   - Microagent manager  │
└──────────────────────┬──────────────────────────────────────┘
                       │ WebSocket/HTTP
                       ▼
┌──────────────────────────────────────────────────────────────┐
│              OpenHands Server (FastAPI)                      │
│                                                              │
│  ┌─ V1 App Server ──────────────────────┐                  │
│  │ • REST API endpoints                 │                  │
│  │ • Conversation management            │                  │
│  │ • Event streaming & callbacks        │                  │
│  │ • Sandbox lifecycle management       │                  │
│  └──────────────────────────────────────┘                  │
│                                                              │
│  ┌─ V0 Legacy (Deprecated) ──────────────┐                │
│  │ • Agent Controller                    │                │
│  │ • Traditional event stream            │                │
│  │ • Session management                  │                │
│  └──────────────────────────────────────┘                  │
└──────────────────────┬───────────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
    ┌────────┐   ┌─────────┐   ┌──────────┐
    │ Agent  │   │ Runtime │   │ Storage  │
    │(SDK)   │   │         │   │          │
    └────────┘   └─────────┘   └──────────┘
         │             │             │
         ▼             ▼             ▼
    ┌────────┐   ┌──────────────┐  ┌──────────────┐
    │ LLM    │   │ Docker/Local │  │ Conversation │
    │ Router │   │ Remote/Modal │  │ Event Store  │
    └────────┘   └──────────────┘  └──────────────┘
         │
         ├─ MCP Clients (External Tools)
         ├─ Microagents (Domain Knowledge)
         └─ Integrations (GitHub, GitLab, etc)
```

### 1.2 Directory Structure

```
/openhands/
├── agenthub/                    # Agent implementations (V0 - Legacy)
│   ├── codeact_agent/          # Main CodeAct agent with tools
│   ├── browsing_agent/         # Web browsing agent
│   ├── dummy_agent/            # Test agent
│   └── tools/                  # Tool implementations
│
├── app_server/                 # V1 - Modern FastAPI app server
│   ├── conversation/           # Conversation lifecycle management
│   ├── event/                  # Event storage and streaming
│   ├── event_callback/         # Webhook & event callbacks
│   ├── sandbox/                # Sandbox environment management
│   ├── services/               # Core services (JWT, etc)
│   ├── user/                   # User management
│   └── v1_router.py           # REST API routes
│
├── controller/                 # Agent orchestration (V0)
│   ├── agent_controller.py    # Main event loop driver
│   ├── agent.py               # Abstract base class
│   └── state/                 # State management
│
├── core/                       # Core configurations & constants
│   ├── config/                # Configuration classes
│   │   ├── agent_config.py   # Agent feature flags & settings
│   │   ├── sandbox_config.py # Sandbox runtime config
│   │   ├── mcp_config.py     # MCP server configuration
│   │   └── openhands_config.py # Main configuration file
│   ├── schema/               # Domain models
│   └── const/                # Constants
│
├── events/                    # Event system (Actions & Observations)
│   ├── action/               # Action types (bash, edit, browse, etc)
│   ├── observation/          # Observation responses
│   └── serialization/        # Event serialization/deserialization
│
├── runtime/                   # Execution sandbox abstractions
│   ├── base.py              # Abstract Runtime interface
│   ├── impl/                # Implementations (Docker, Local, Remote, Modal)
│   ├── mcp/                 # MCP server integration
│   ├── plugins/             # Plugin system (Jupyter, Skills)
│   └── browser/             # Browser environment
│
├── integrations/             # External platform integrations
│   ├── github/              # GitHub service & webhooks
│   ├── gitlab/              # GitLab service
│   ├── azure_devops/        # Azure DevOps
│   ├── bitbucket/           # Bitbucket
│   ├── forgejo/             # Forgejo
│   ├── protocols/           # Integration protocols
│   ├── provider.py          # Provider factory pattern
│   └── service_types.py     # Service type definitions
│
├── mcp/                      # Model Context Protocol client
│   ├── client.py            # MCP client implementation
│   ├── tool.py              # MCP tool wrapper
│   ├── error_collector.py   # Error handling
│   └── utils.py             # Utilities
│
├── microagent/              # Microagent system
│   ├── microagent.py        # Microagent loading & management
│   ├── types.py             # Microagent type definitions
│   └── prompts/             # Microagent prompt templates
│
├── resolver/                # Code patching and issue resolution
│   ├── issue_resolver.py   # Core resolver
│   ├── patching/           # Code patch application
│   └── prompts/            # Resolver prompts
│
├── memory/                   # Conversation memory & condensing
│   ├── conversation_memory.py # Memory management
│   ├── condenser/           # Memory condensation for context limits
│   └── prompts/             # Memory-related prompts
│
├── storage/                 # Data persistence
│   ├── conversation/       # Conversation storage
│   ├── secrets/            # Secrets store
│   ├── settings/           # Settings store
│   ├── data_models/        # Data models
│   ├── local.py           # File-based storage
│   ├── memory.py          # In-memory storage
│   └── web_hook.py        # Webhook batching
│
├── server/                 # V0 WebSocket server (Legacy)
│   ├── routes/            # API endpoints
│   ├── session/           # Session management
│   └── conversation_manager/ # Conversation lifecycle
│
├── llm/                    # Language model abstractions
│   ├── llm.py            # LLM base classes
│   ├── llm_registry.py   # Model registry
│   ├── router/           # Model routing/fallback
│   └── llm_utils.py      # LLM utilities
│
├── security/              # Security features
│   ├── grayswan/         # Gray Swan threat detection
│   ├── llm/              # LLM-based security
│   ├── invariant/        # Security invariants
│   └── analyzer.py       # Security analysis
│
└── utils/                # Utilities
    ├── prompt.py        # Prompt management
    ├── llm.py          # LLM utilities
    └── import_utils.py # Dynamic imports
```

### 1.3 Key Entry Points

**HTTP/API Entry Points:**
- `openhands/app_server/v1_router.py` - V1 REST API
- `openhands/server/listen.py` - V0 WebSocket server (legacy)

**Configuration:**
- `config.template.toml` - Configuration example
- `openhands/core/config/openhands_config.py` - Config loader

**Frontend:**
- `frontend/src/api/` - API client methods
- `frontend/src/services/` - Business logic services

---

## 2. CORE COMPONENTS & ABSTRACTIONS

### 2.1 Agent Architecture

**Base Agent Interface** (`openhands/controller/agent.py`):
```python
class Agent(ABC):
    def __init__(self, config: AgentConfig, llm_registry: LLMRegistry):
        self.llm = llm_registry.get_llm_from_agent_config(...)
        self.config = config
        self.tools = []
        self.mcp_tools = {}  # MCP-provided tools
    
    @abstractmethod
    def get_system_message(self) -> SystemMessageAction | None
    
    @abstractmethod
    async def step(self, state: State) -> Action
```

**Current Implementations:**
1. **CodeActAgent** (v2.2) - Unified code action space
   - Actions: bash, IPython, file edit, browser, message
   - Plugins: Jupyter, AgentSkills
   - Status: Active (V0, being migrated to SDK)

2. **V1 SDK Agent** - New architecture
   - Repository: `https://github.com/OpenHands/software-agent-sdk`
   - Status: Current development focus
   - Provides composable agent building blocks

### 2.2 Event System (Actions & Observations)

**Action Hierarchy:**
```
Action (Abstract)
├── CmdRunAction          # bash execution
├── IPythonRunCellAction  # Python code execution
├── FileReadAction        # File read
├── FileEditAction        # File modification
├── BrowseInteractiveAction # Web browsing
├── MessageAction         # User/agent communication
├── AgentFinishAction     # Task completion
├── CondensationRequestAction # Memory management
└── MCPAction            # MCP tool invocation
```

**Observation Types:**
```
Observation
├── CmdOutputObservation  # Command output
├── FileReadObservation   # File content
├── FileWriteObservation  # Write confirmation
├── BrowseObservation     # Browser state
└── AgentErrorObservation # Error information
```

**Event Flow:**
```
Agent generates Action 
    ↓
EventStream.publish(action)
    ↓
Runtime consumes action
    ↓
Runtime generates Observation
    ↓
EventStream.publish(observation)
    ↓
Agent consumes observation for next step
```

### 2.3 Runtime System

**Abstract Base** (`openhands/runtime/base.py`):
```python
class Runtime(ABC):
    async def run_action(self, action: Action) -> Observation
    
    @abstractmethod
    async def run(self, cmd: str) -> CmdOutputObservation
    
    @abstractmethod
    async def read(self, path: str) -> FileReadObservation
    
    @abstractmethod
    async def write(self, path: str, content: str) -> FileWriteObservation
    
    @abstractmethod
    async def browse(self, url: str) -> BrowseObservation
```

**Implementations:**
1. **Docker Runtime** (Default) - Local Docker containers
   - Isolated execution environment
   - Full sandbox isolation
   - Direct file access
   - Configuration: `runtime = "docker"`

2. **Local Runtime** - Direct host execution
   - No isolation (development only)
   - Configuration: `runtime = "local"`

3. **Remote Runtime** - HTTP-based remote execution
   - Connects to remote ActionExecutor server
   - Supports distributed execution
   - Configuration: `runtime = "openhands.runtime.impl.remote.RemoteRuntime"`

4. **Modal Runtime** - Modal cloud platform
   - Serverless execution
   - Configuration: `runtime = "openhands.runtime.impl.modal.ModalRuntime"`

5. **Runloop Runtime** - Runloop API
   - Specialized deployment platform
   - Configuration: `runtime = "openhands.runtime.impl.runloop.RunloopRuntime"`

### 2.4 LLM Router & Configuration

**LLM Registry** (`openhands/llm/llm_registry.py`):
- Manages multiple LLM instances
- Supports model routing and fallback
- Powered by **LiteLLM** (supports 100+ models)

**Supported Providers:**
- OpenAI (GPT-4, o1, o3, etc)
- Anthropic (Claude)
- Google (Gemini)
- Mistral
- Azure OpenAI
- Local models (Ollama, vLLM)
- Custom providers

**Configuration** (`config.toml`):
```toml
[llm]
model = "gpt-4o"
api_key = "sk-..."
base_url = ""  # Optional for custom providers

[llm.provider_name]  # Multiple LLM configs
model = "claude-opus"
api_key = "..."
```

### 2.5 MCP (Model Context Protocol) Integration

**MCPClient** (`openhands/mcp/client.py`):
- Connects to MCP servers (stdio, HTTP, SSE)
- Dynamically discovers and wraps tools
- Provides tools to agent as function calls

**Supported MCP Server Types:**
```python
MCPStdioServerConfig      # Local command execution
MCPSSEServerConfig        # HTTP Server-Sent Events
MCPSHTTPServerConfig      # Standard HTTP
```

**Configuration Example** (`config.toml`):
```toml
[[mcp]]
name = "my_mcp_server"
type = "stdio"
command = "python"
args = ["-m", "my_server"]

[[mcp]]
name = "remote_server"
type = "sse"
url = "https://api.example.com/mcp"
api_key = "sk-..."
```

**Key Features:**
- **Tool discovery** - Automatically lists available tools from server
- **Error handling** - Graceful failure handling via error_collector
- **Session management** - Per-conversation MCP sessions
- **Authentication** - API key support for HTTP servers

### 2.6 Storage & Persistence

**Conversation Storage** (`openhands/storage/conversation/`):
- Stores conversation history and events
- Metadata tracking (status, creation time, etc)
- Event serialization/deserialization

**Settings Storage** (`openhands/storage/settings/`):
- User settings persistence
- File-based or custom backends

**Secrets Management** (`openhands/storage/secrets/`):
- Encrypted secret storage
- API keys, credentials
- Access control per conversation

**Event Streaming:**
- Redis-backed event streaming (optional)
- In-memory fallback
- Webhook callbacks for external systems

---

## 3. EXTENSIBILITY MECHANISMS

### 3.1 Microagent System

**What are Microagents?**
- Markdown files with YAML frontmatter
- Domain-specific knowledge/prompts
- Dynamically loaded into LLM context
- Trigger-based activation

**Microagent Types:**
1. **Public Microagents** - `microagents/` directory
2. **Repository Microagents** - `.openhands/microagents/` 
3. **Third-party** - `.cursorrules`, `agents.md`

**Microagent Structure:**
```markdown
---
name: "python-expert"
version: "1.0.0"
triggers:
  - "python"
  - "django"
description: "Specialized knowledge for Python development"
---

# Python Development Expert Microagent

You are an expert Python developer with deep knowledge of...
```

**Loading Behavior:**
- Without triggers: Always loaded
- With triggers: Loaded when user message matches trigger keywords
- Managed by `BaseMicroagent` class
- Frontend has microagent management UI

### 3.2 Custom Agent Implementation

**Example: Creating a Custom Agent**

```python
from openhands.controller.agent import Agent
from openhands.core.config import AgentConfig
from openhands.events.action import Action
from openhands.controller.state.state import State

class CustomAgent(Agent):
    VERSION = '1.0'
    sandbox_plugins = [...]  # Plugins to install
    
    def __init__(self, config: AgentConfig, llm_registry):
        super().__init__(config, llm_registry)
        self.tools = self._setup_tools()
    
    def get_system_message(self):
        # Return SystemMessageAction with prompt & tools
        pass
    
    async def step(self, state: State) -> Action:
        # Implement one-step agent logic
        # Generate Action based on State
        pass
```

**Registration:**
```toml
[agent]
classpath = "my_module.CustomAgent"  # Fully qualified class path
```

### 3.3 Runtime Implementation

**Example: Custom Runtime**

```python
from openhands.runtime.base import Runtime
from openhands.events.observation import CmdOutputObservation

class CustomRuntime(Runtime):
    async def run(self, cmd: str) -> CmdOutputObservation:
        # Implement command execution
        # Return CmdOutputObservation with output & exit code
        pass
    
    async def read(self, path: str) -> FileReadObservation:
        # Implement file reading
        pass
    
    async def write(self, path: str, content: str) -> FileWriteObservation:
        # Implement file writing
        pass
    
    # ... other methods
```

**Registration:**
```toml
[core]
runtime = "my_module.CustomRuntime"
```

### 3.4 Integration Framework

**Integration Pattern** (`openhands/integrations/`):

```
Provider (Abstract Factory)
├── GitHubService
├── GitLabService  
├── AzureDevOpsService
├── BitBucketService
└── ForgejoService

Each Service provides:
├── Authentication
├── Repository operations
├── Pull request management
├── Branch operations
├── Webhook handling
└── Microagent parsing
```

**Integration Features:**
- OAuth authentication
- Branch/PR creation and management
- Webhook integration for event streaming
- Microagent extraction from repositories
- Issue tracking integration

### 3.5 Plugin System

**Plugin Types:**
1. **AgentSkillsRequirement** - Python functions available to agent
2. **JupyterRequirement** - Jupyter kernel for Python execution
3. **BrowserRequirement** - Web browsing environment

**Location:** `openhands/runtime/plugins/`

**Plugin Interface:**
```python
class PluginRequirement(ABC):
    def __init__(self, config):
        self.config = config
    
    async def initialize(self, runtime: Runtime):
        # Setup plugin in runtime
        pass
```

---

## 4. KEY CAPABILITIES & FEATURES

### 4.1 Core AI Agent Capabilities

1. **Code Execution**
   - Bash command execution
   - Python/IPython support
   - Interactive REPL access

2. **File Operations**
   - Read files
   - Modify files (str_replace editor)
   - LLM-based file editing

3. **Web Browsing**
   - Interactive browsing with visual markers
   - Screenshot capture
   - Set of Marks (SoM) visual parsing

4. **Memory Management**
   - Conversation condensation
   - Context window optimization
   - Long-term task tracking

5. **Security Features**
   - Gray Swan threat detection
   - Security invariant checking
   - Action confirmation system

### 4.2 Agentic Features

1. **Plan Mode** (`enable_plan_mode`)
   - Long-horizon task planning
   - Task tracker tool
   - Structured goal decomposition

2. **Stuck Detection** (`enable_stuck_detection`)
   - Loop detection
   - Automatic recovery
   - Max iteration limits

3. **History Truncation** (`enable_history_truncation`)
   - Automatic context window management
   - Session continuation across limits

4. **Model Routing**
   - Fallback models
   - Provider switching
   - Cost optimization

### 4.3 Multi-User & Enterprise Features

1. **User Management**
   - JWT authentication
   - Per-user conversation isolation
   - Settings per user

2. **API Key Management**
   - Per-user API keys
   - Secure storage
   - Per-conversation overrides

3. **Webhooks & Event Callbacks**
   - Event streaming to external systems
   - Batch webhook delivery
   - Custom event handlers

4. **Conversation Lifecycle**
   - Create, pause, resume, delete
   - Conversation sharing
   - Metadata tracking

### 4.4 Configuration & Customization

**Configuration Priority** (highest to lowest):
1. Environment variables
2. `config.toml` file
3. Default values
4. Runtime overrides (UI)

**Customizable Settings:**
- Agent class and configuration
- LLM model and parameters
- Runtime type and options
- Sandbox plugins
- Enable/disable tools
- Memory condenser strategy
- Security settings
- File upload restrictions

---

## 5. DEPLOYMENT OPTIONS

### 5.1 Local Development
```bash
make build
make run
# Starts: Backend (http://localhost:3000) + Frontend
```

### 5.2 Docker Deployment
```bash
docker-compose up
# Pre-configured with runtime container
```

### 5.3 Kubernetes/Enterprise
```bash
# See openhands/enterprise/
# Self-hosted cloud deployment
# Custom runtime support via Remote Runtime
```

### 5.4 Containerized Runtimes
- Default: `ghcr.io/openhands/runtime:1.1-nikolaik`
- Can be customized or replaced
- Supports any Docker image as sandbox

---

## 6. API & INTEGRATION POINTS

### 6.1 REST API Endpoints

**Conversation Management:**
```
POST /api/v1/conversations        # Create conversation
GET  /api/v1/conversations/{id}   # Get conversation
GET  /api/v1/conversations        # List conversations
DELETE /api/v1/conversations/{id} # Delete conversation
```

**Event Streaming:**
```
GET /api/v1/conversations/{id}/events  # Server-sent events
POST /api/v1/conversations/{id}/events # Create event
```

**Settings & Configuration:**
```
GET  /api/v1/settings             # Get user settings
POST /api/v1/settings             # Save settings
```

**File Operations:**
```
GET  /api/v1/conversations/{id}/files/{path}  # Read file
POST /api/v1/conversations/{id}/files/{path}  # Write file
```

**MCP Management:**
```
GET  /api/v1/mcp-servers          # List configured MCP servers
POST /api/v1/mcp-servers          # Add MCP server
DELETE /api/v1/mcp-servers/{id}   # Remove MCP server
```

### 6.2 WebSocket Protocol (Legacy V0)

**Connection:**
```javascript
ws://localhost:3000/ws
```

**Message Format:**
```json
{
  "action": "start",
  "args": {
    "task": "write hello world script"
  }
}
```

### 6.3 Python SDK (OpenHands Software Agent SDK)

- Repository: `https://github.com/OpenHands/software-agent-sdk`
- Composable agent building blocks
- Headless agent execution
- Custom workflow orchestration

---

## 7. RECOMMENDATIONS FOR INTEGRATION WITH QUESTRO & MCPOVERFLOW

### 7.1 Integration Strategy Options

#### Option A: Direct MCP Integration (Recommended)
**Approach:** Implement MCPOverflow as an MCP server

**Pros:**
- Minimal code changes needed
- Leverage existing MCP client infrastructure
- Hot-pluggable tool discovery
- Works with both V0 and V1

**Implementation:**
1. Create MCPOverflow MCP server
2. Configure in `config.toml`:
```toml
[[mcp]]
name = "mcpoverflow"
type = "stdio"
command = "python"
args = ["-m", "mcpoverflow.server"]
```
3. OpenHands automatically discovers tools
4. Agent can invoke tools transparently

**Effort:** Low (1-2 weeks)

#### Option B: Microagent System
**Approach:** Create specialized Questro/MCPOverflow microagents

**Pros:**
- Knowledge injection without tool integration
- Cheaper than MCP (no execution overhead)
- Easy to update/maintain
- Works instantly

**Implementation:**
1. Create `.openhands/microagents/questro.md`
2. Include specialized prompts, examples, workflows
3. Optionally add triggers for auto-activation

**Effort:** Very low (1 week)

#### Option C: Native Integration Plugin
**Approach:** Implement as Python module in `openhands/integrations/`

**Pros:**
- Deepest integration possible
- Direct access to OpenHands internals
- Can modify core behavior

**Cons:**
- Requires maintaining code in OpenHands repo
- More complex
- Tighter coupling

**Effort:** High (2-4 weeks)

#### Option D: Fork & Customize
**Approach:** Fork OpenHands, create Questro edition

**Pros:**
- Complete control
- Can customize everything
- Direct deployment control

**Cons:**
- Maintenance burden (merge upstream changes)
- Duplicate effort
- Harder to stay up-to-date

**Effort:** Medium-High (3-6 weeks)

### 7.2 Recommended Integration Path

**Phase 1: Foundation** (Week 1-2)
1. Create MCPOverflow MCP server implementation
2. Add Questro microagents to knowledge base
3. Test with CodeAct agent in local OpenHands

**Phase 2: Enhancement** (Week 3-4)
1. Create Questro-specific integration layer
2. Add custom runtime if needed
3. Implement Questro-specific agents if desired
4. Add webhook callbacks for event streaming

**Phase 3: Deployment** (Week 5-6)
1. Package as Docker containers
2. Add Kubernetes support (enterprise)
3. Create deployment documentation
4. Implement CI/CD pipeline

### 7.3 Key Integration Points

#### 1. MCP Server for MCPOverflow
```python
# mcpoverflow_server.py
from fastmcp import Server

app = Server("mcpoverflow")

@app.tool()
def search_overflow(query: str) -> str:
    """Search Stack Overflow and return solutions"""
    # Implementation
    pass

@app.tool()
def get_code_snippet(id: str) -> str:
    """Get code snippet from Stack Overflow"""
    # Implementation
    pass
```

#### 2. Microagent for Questro Integration
```markdown
---
name: "questro-expert"
triggers:
  - "questro"
  - "create"
  - "deploy"
description: "Questro platform expert"
---

You are an expert in Questro, a DevOps platform for...
```

#### 3. Custom Questro Integration Service
```python
# openhands/integrations/questro/questro_service.py
class QuestroService(GitService):
    def __init__(self, token: str):
        self.client = QuestroClient(token)
    
    async def create_deployment(self, config: dict):
        # Delegate to Questro
        pass
```

#### 4. Event Callbacks for External Sync
```toml
[[webhooks]]
url = "https://questro.api/webhooks/openhands"
events = ["conversation:created", "task:completed", "error:occurred"]
```

### 7.4 Specific Questro Integration Needs

**1. Deployment Orchestration**
- OpenHands can create/manage Questro pipelines
- MCP tools for pipeline creation, execution, monitoring
- Webhook feedback on deployment status

**2. PipeWarden Integration**
- Create pipelines from natural language descriptions
- Agent understands pipeline syntax
- Validates and tests before deployment

**3. Infrastructure as Code**
- Microagent with IaC templates
- Agent can generate CloudFormation, Terraform, etc
- Integration with Questro's deployment engine

**4. Multi-Environment Workflows**
- Agents understand dev/staging/prod environments
- Coordinate deployments across environments
- Validate against Questro policies

### 7.5 Effort Estimation

| Component | Approach | Effort | Value |
|-----------|----------|--------|-------|
| MCPOverflow MCP | Build MCP server | 1-2 weeks | High |
| Questro Microagent | Knowledge injection | 3-5 days | High |
| Questro Integration | Native service | 2-3 weeks | Medium |
| Custom Questro Agent | Agent implementation | 2-3 weeks | Medium |
| Enterprise Package | K8s + docs | 2-3 weeks | Low |
| **Total** | **All features** | **6-10 weeks** | **Very High** |

**Recommended MVP:** MCP + Microagent (1.5-2 weeks)

---

## 8. TECHNOLOGY STACK

### Backend
- **Language:** Python 3.12
- **Framework:** FastAPI + Uvicorn
- **LLM Integration:** LiteLLM (100+ model support)
- **Process Management:** Asyncio, pexpect
- **Container Runtime:** Docker, Kubernetes support
- **Storage:** File-based, Redis, PostgreSQL (enterprise)
- **Authentication:** JWT, OAuth (enterprise)
- **Protocols:** WebSocket, HTTP/SSE, stdio (MCP)

### Frontend
- **Framework:** React 18+
- **State Management:** Redux/Zustand
- **HTTP Client:** TanStack Query (React Query)
- **WebSocket:** Socket.IO
- **Build:** Vite
- **Package Manager:** npm/pnpm

### Development
- **Package Manager:** Poetry (Python)
- **Testing:** pytest (unit), vitest (frontend)
- **Linting:** ruff, mypy, ESLint
- **Pre-commit:** Git hooks for code quality
- **CI/CD:** GitHub Actions

---

## 9. SECURITY CONSIDERATIONS

### Sandbox Isolation
- Docker container per session (default)
- User isolation within container
- Volume mounting restrictions
- No root access to host

### Secret Management
- Encrypted storage
- Per-conversation isolation
- Never logged or exposed
- Secure transmission

### Code Execution Safety
- Gray Swan threat detection
- Security invariant checking
- Action confirmation system
- Command filtering

### API Security
- JWT authentication
- HTTPS enforcement (production)
- Rate limiting support
- CORS configuration

---

## 10. PERFORMANCE CONSIDERATIONS

### Scalability
- Stateless server design (except session state)
- Horizontal scaling ready
- Redis for distributed sessions
- Remote runtime for distributed execution

### Resource Efficiency
- LLM context optimization (condenser)
- Token counting and limiting
- Lazy loading of tools/integrations
- Efficient event streaming

### Observability
- Structured logging (JSON)
- Debug mode for LLM prompts/responses
- Event trajectory recording
- Webhook event delivery tracking

---

## 11. MAINTENANCE & UPDATES

### Version Tracking
- Current: v1.1.0 (as of repo snapshot)
- Using semantic versioning
- Enterprise and OSS in sync

### Breaking Changes
- V0→V1 migration in progress
- Legacy code marked with "Tag: Legacy-V0"
- New code targets Software Agent SDK

### Upgrade Path
1. Test in dev environment
2. Backup user data/conversations
3. Update Docker images
4. Run migrations (if any)
5. Clear LLM cache (optional)

---

## CONCLUSION

OpenHands is a sophisticated, production-ready AI development platform with:

1. **Strong Extensibility**
   - MCP for tool integration
   - Microagents for knowledge injection
   - Custom agents/runtimes
   - Integration framework

2. **Modern Architecture**
   - V1 SDK-based future direction
   - Event-driven design
   - Modular components
   - Cloud-native ready

3. **Enterprise Capabilities**
   - Multi-user support
   - Custom authentication
   - Webhook integrations
   - Kubernetes deployment

4. **Integration Friendly**
   - Well-documented APIs
   - Configuration-driven
   - Multiple runtime options
   - Flexible storage backends

**For Questro integration**, a **hybrid approach** combining:
- **MCP Server** for MCPOverflow tool discovery
- **Microagent** for Questro knowledge
- **Custom integration** for deep platform features

Offers the best balance of **effort vs. value** with **6-10 weeks** to full implementation.
