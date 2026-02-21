#!/usr/bin/env python3
"""
OpenHands REST API Server
Provides REST API endpoints for MCPOverflow to use OpenHands capabilities
"""

import os
import json
import asyncio
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Store for async job tracking
jobs_store: Dict[str, Dict[str, Any]] = {}

app = FastAPI(
    title="OpenHands API Server",
    description="REST API for OpenHands AI code generation",
    version="1.0.0"
)

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response Models
class HealthResponse(BaseModel):
    healthy: bool
    version: str
    timestamp: str
    capabilities: List[str]

class ExecuteTaskRequest(BaseModel):
    taskType: str
    context: Dict[str, Any]
    prompt: str
    actions: Optional[List[str]] = None
    config: Optional[Dict[str, Any]] = None

class ExecuteTaskResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class AnalyzeAPIRequest(BaseModel):
    specType: str  # 'openapi', 'graphql', 'postman'
    spec: Dict[str, Any]

class GenerateConnectorRequest(BaseModel):
    name: str
    specType: str
    spec: Dict[str, Any]
    language: str  # 'typescript', 'go', 'python'
    runtime: str  # 'cloudflare-workers', 'vercel', 'lambda'
    authConfig: Optional[Dict[str, Any]] = None
    selectedEndpoints: Optional[List[str]] = None
    customizations: Optional[Dict[str, Any]] = None

# Health Check
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Check if OpenHands service is healthy"""
    try:
        # Try to import OpenHands
        import openhands
        from openhands import __version__

        return HealthResponse(
            healthy=True,
            version=__version__,
            timestamp=datetime.now().isoformat(),
            capabilities=[
                "analyze_api",
                "generate_connector",
                "generate_tests",
                "fix_connector",
                "generate_documentation",
            ]
        )
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"OpenHands not healthy: {str(e)}")

# Execute Generic Task
@app.post("/api/execute", response_model=ExecuteTaskResponse)
async def execute_task(request: ExecuteTaskRequest):
    """
    Execute a generic OpenHands task
    This is the main endpoint that MCPOverflow adapter calls
    """
    try:
        # Use litellm directly for simplicity
        import litellm

        api_key = os.getenv('OPENAI_API_KEY') or os.getenv('ANTHROPIC_API_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="No LLM API key configured")

        # Determine model
        model = request.config.get('llm', 'gpt-4') if request.config else 'gpt-4'
        if os.getenv('ANTHROPIC_API_KEY') and not os.getenv('OPENAI_API_KEY'):
            model = 'claude-3-5-sonnet-20241022'

        # Build the prompt with context
        full_prompt = f"""
Task Type: {request.taskType}

Context:
{json.dumps(request.context, indent=2)}

Task:
{request.prompt}

Please provide a detailed, structured response.
"""

        start_time = datetime.now()

        # Get completion using litellm directly
        messages = [{"role": "user", "content": full_prompt}]
        response = litellm.completion(
            model=model,
            messages=messages,
            temperature=0.3,
            api_key=api_key
        )

        duration = (datetime.now() - start_time).total_seconds()

        # Extract response
        result_text = response.choices[0].message.content

        return ExecuteTaskResponse(
            success=True,
            data={"result": result_text, "raw": result_text},
            metadata={
                "duration": duration,
                "model": model,
                "taskType": request.taskType,
            }
        )

    except Exception as e:
        import traceback
        return ExecuteTaskResponse(
            success=False,
            error=f"Task execution failed: {str(e)}",
            metadata={"traceback": traceback.format_exc()}
        )

# Analyze API Specification
@app.post("/api/analyze")
async def analyze_api(request: AnalyzeAPIRequest):
    """Analyze an API specification and extract key information"""
    prompt = f"""
Analyze this {request.specType} API specification and provide a structured analysis.

Specification:
{json.dumps(request.spec, indent=2)}

Provide:
1. API purpose and domain
2. Authentication methods
3. Rate limits (if any)
4. List of endpoints with methods
5. Data models/schemas
6. Best practices recommendations
7. Suggested MCP tool structure

Return as JSON with these keys:
{{
  "purpose": "...",
  "domain": "...",
  "authMethods": ["..."],
  "rateLimits": {{...}},
  "endpoints": [{{
    "path": "...",
    "method": "...",
    "description": "...",
    "parameters": [...],
    "responses": {{...}}
  }}],
  "dataModels": [...],
  "bestPractices": [...],
  "recommendedTools": [...]
}}
"""

    try:
        result = await execute_task(ExecuteTaskRequest(
            taskType="api_analysis",
            context={"specType": request.specType, "spec": request.spec},
            prompt=prompt,
        ))

        if not result.success:
            raise HTTPException(status_code=500, detail=result.error)

        # Try to parse as JSON
        try:
            analysis = json.loads(result.data["result"])
        except:
            # If not JSON, return raw text
            analysis = {"rawAnalysis": result.data["result"]}

        return {
            "success": True,
            "analysis": analysis,
            "metadata": result.metadata
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"API analysis failed: {str(e)}")

# Generate MCP Connector
@app.post("/api/generate-connector")
async def generate_connector(request: GenerateConnectorRequest):
    """Generate a complete MCP connector from API specification"""
    prompt = f"""
Generate a production-ready MCP connector with these specifications:

Name: {request.name}
Language: {request.language}
Runtime: {request.runtime}
API Spec Type: {request.specType}

API Specification:
{json.dumps(request.spec, indent=2)}

Authentication Config:
{json.dumps(request.authConfig, indent=2) if request.authConfig else "None"}

Selected Endpoints:
{json.dumps(request.selectedEndpoints, indent=2) if request.selectedEndpoints else "All endpoints"}

Requirements:
1. Generate complete {request.language} code for {request.runtime}
2. Implement MCP tool definitions for each API endpoint
3. Include proper error handling
4. Add authentication using the provided config
5. Include TypeScript types (if applicable)
6. Add comprehensive comments
7. Follow best practices for {request.runtime}

Output Structure:
- Main connector file
- Types/interfaces file
- Configuration file
- README with usage examples

Return the generated code organized by file.
"""

    try:
        result = await execute_task(ExecuteTaskRequest(
            taskType="connector_generation",
            context={
                "name": request.name,
                "language": request.language,
                "runtime": request.runtime,
                "spec": request.spec
            },
            prompt=prompt,
        ))

        if not result.success:
            raise HTTPException(status_code=500, detail=result.error)

        return {
            "success": True,
            "connector": {
                "name": request.name,
                "language": request.language,
                "runtime": request.runtime,
                "code": result.data["result"],
                "files": [
                    {
                        "path": f"{request.name}/index.{_get_file_ext(request.language)}",
                        "content": result.data["result"]
                    }
                ]
            },
            "metadata": result.metadata
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Connector generation failed: {str(e)}")

# Generate Tests
@app.post("/api/generate-tests")
async def generate_tests(request: Dict[str, Any]):
    """Generate test suite for a connector"""
    connector_code = request.get("connectorCode", "")
    language = request.get("language", "typescript")

    prompt = f"""
Generate comprehensive tests for this {language} MCP connector:

{connector_code}

Include:
1. Unit tests for each tool
2. Integration tests with mocked API responses
3. Error handling tests
4. Edge case tests
5. Test fixtures

Use appropriate testing framework:
- TypeScript: Jest/Vitest
- Python: pytest
- Go: testing package

Return complete test file(s).
"""

    try:
        result = await execute_task(ExecuteTaskRequest(
            taskType="test_generation",
            context={"language": language, "code": connector_code},
            prompt=prompt,
        ))

        if not result.success:
            raise HTTPException(status_code=500, detail=result.error)

        return {
            "success": True,
            "tests": result.data["result"],
            "metadata": result.metadata
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Test generation failed: {str(e)}")

# Fix Connector
@app.post("/api/fix")
async def fix_connector(request: Dict[str, Any]):
    """Automatically fix a broken connector"""
    connector_id = request.get("connectorId")
    error_details = request.get("error", {})
    connector_code = request.get("connectorCode", "")

    prompt = f"""
Fix this MCP connector that is experiencing errors:

Connector Code:
{connector_code}

Error Details:
{json.dumps(error_details, indent=2)}

Please:
1. Identify the root cause
2. Fix the issue
3. Ensure backward compatibility
4. Explain what was fixed

Return the fixed code and explanation.
"""

    try:
        result = await execute_task(ExecuteTaskRequest(
            taskType="connector_fix",
            context={"connectorId": connector_id, "error": error_details},
            prompt=prompt,
        ))

        if not result.success:
            raise HTTPException(status_code=500, detail=result.error)

        return {
            "success": True,
            "fixedCode": result.data["result"],
            "explanation": "Code has been fixed based on error analysis",
            "metadata": result.metadata
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Connector fix failed: {str(e)}")

# Helper function
def _get_file_ext(language: str) -> str:
    extensions = {
        'typescript': 'ts',
        'javascript': 'js',
        'python': 'py',
        'go': 'go',
    }
    return extensions.get(language.lower(), 'txt')

# Main entry point
def run_server(host: str = '0.0.0.0', port: int = 8000, log_level: str = 'info') -> None:
    print('=' * 80)
    print('OpenHands API Server')
    print('=' * 80)
    print(f'Starting server on http://localhost:{port}')
    print()
    print('API Key Status:')
    if os.getenv('OPENAI_API_KEY'):
        print('  ✓ OPENAI_API_KEY configured')
    if os.getenv('ANTHROPIC_API_KEY'):
        print('  ✓ ANTHROPIC_API_KEY configured')
    if not (os.getenv('OPENAI_API_KEY') or os.getenv('ANTHROPIC_API_KEY')):
        print('  ⚠ No API keys found - server will not function properly')
    print()
    print('Endpoints:')
    print('  GET  /health - Health check')
    print('  POST /api/execute - Execute generic task')
    print('  POST /api/analyze - Analyze API specification')
    print('  POST /api/generate-connector - Generate MCP connector')
    print('  POST /api/generate-tests - Generate tests')
    print('  POST /api/fix - Fix broken connector')
    print()
    print('=' * 80)
    print()

    uvicorn.run(app, host=host, port=port, log_level=log_level)


def main() -> None:
    """CLI entrypoint for running the bridge API server."""
    run_server()


if __name__ == '__main__':
    main()
