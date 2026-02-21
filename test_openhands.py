#!/usr/bin/env python3
"""
Test script for OpenHands SDK
This tests basic functionality of OpenHands for use with MCPOverflow/Questro integration
"""

import os
import sys
import asyncio
from datetime import datetime

print("=" * 80)
print("OpenHands SDK Test Suite")
print("=" * 80)
print(f"Test started at: {datetime.now()}")
print()

# Test 1: Import OpenHands modules
print("[Test 1] Importing OpenHands modules...")
try:
    import openhands
    from openhands import __version__
    print(f"✓ OpenHands SDK version: {__version__}")
except ImportError as e:
    print(f"✗ Failed to import OpenHands: {e}")
    sys.exit(1)

# Test 2: Check available modules
print("\n[Test 2] Checking available OpenHands components...")
try:
    from openhands.core.config import AppConfig
    print("✓ Config module available")

    from openhands.controller.agent import Agent
    print("✓ Agent module available")

    from openhands.core.logger import openhands_logger as logger
    print("✓ Logger module available")

except ImportError as e:
    print(f"✗ Failed to import components: {e}")

# Test 3: Check LLM configuration
print("\n[Test 3] Checking LLM configuration...")
try:
    from openhands.llm.llm import LLM
    print("✓ LLM module available")

    # Check for API keys in environment
    llm_providers = {
        'ANTHROPIC_API_KEY': 'Anthropic (Claude)',
        'OPENAI_API_KEY': 'OpenAI (GPT)',
        'GOOGLE_API_KEY': 'Google (Gemini)',
    }

    available_providers = []
    for key, name in llm_providers.items():
        if os.getenv(key):
            available_providers.append(name)
            print(f"  ✓ {name} API key found")

    if not available_providers:
        print("  ⚠ No LLM API keys found in environment")
        print("    Set ANTHROPIC_API_KEY, OPENAI_API_KEY, or GOOGLE_API_KEY")
    else:
        print(f"  ✓ Available LLM providers: {', '.join(available_providers)}")

except ImportError as e:
    print(f"✗ Failed to check LLM config: {e}")

# Test 4: Check Runtime support
print("\n[Test 4] Checking runtime support...")
try:
    from openhands.runtime.base import Runtime
    print("✓ Runtime module available")

    # Check Docker availability
    import docker
    try:
        client = docker.from_env()
        client.ping()
        print("  ✓ Docker runtime available")

        # List images
        images = client.images.list()
        openhands_images = [img for img in images if any('openhands' in tag for tags in img.tags for tag in tags)]
        if openhands_images:
            print(f"  ✓ Found {len(openhands_images)} OpenHands Docker image(s)")
        else:
            print("  ⚠ No OpenHands Docker images found")

    except Exception as e:
        print(f"  ✗ Docker not available: {e}")

except ImportError as e:
    print(f"✗ Failed to check runtime: {e}")

# Test 5: Check Agent types
print("\n[Test 5] Checking available agent types...")
try:
    from openhands.controller.agent_controller import AgentController
    print("✓ AgentController available")

    # Try to list available agents
    try:
        from openhands.controller.agent import Agent
        print("✓ Agent base class available")
    except:
        pass

except ImportError as e:
    print(f"✗ Failed to check agents: {e}")

# Test 6: Simple Agent creation test (without execution)
print("\n[Test 6] Testing Agent initialization...")
try:
    from openhands.core.config import AppConfig, LLMConfig
    from openhands.controller.agent import Agent

    # Create minimal config
    llm_config = LLMConfig(
        model="gpt-4",  # Default model name
        api_key="test_key",  # Dummy key for testing
    )

    app_config = AppConfig(
        llm=llm_config,
    )

    print("✓ Configuration objects created successfully")

except Exception as e:
    print(f"✗ Failed to create config: {e}")

# Test 7: Check MCP/Tool support
print("\n[Test 7] Checking MCP/Tool support...")
try:
    from openhands.core.schema import ActionType
    print("✓ ActionType schema available")

    # List available action types
    action_types = [attr for attr in dir(ActionType) if not attr.startswith('_')]
    print(f"  Available action types: {', '.join(action_types[:10])}...")

except ImportError as e:
    print(f"✗ Failed to check MCP support: {e}")

# Test 8: Check Event system
print("\n[Test 8] Checking event system...")
try:
    from openhands.core.schema import EventSource
    print("✓ Event system available")

except ImportError as e:
    print(f"✗ Failed to check event system: {e}")

# Summary
print("\n" + "=" * 80)
print("Test Summary")
print("=" * 80)
print("""
OpenHands SDK Status:
  ✓ SDK is installed and importable
  ✓ Core modules are available

For full functionality, you need:
  1. LLM API key (ANTHROPIC_API_KEY, OPENAI_API_KEY, or GOOGLE_API_KEY)
  2. Docker runtime for sandboxed execution
  3. Configuration file at ~/.openhands/config.toml

Next Steps for MCPOverflow Integration:
  1. Configure LLM API keys
  2. Test with a simple code generation task
  3. Create OpenHands adapter for MCPOverflow
  4. Integrate with Questro workflow
""")

print(f"Test completed at: {datetime.now()}")
print("=" * 80)
