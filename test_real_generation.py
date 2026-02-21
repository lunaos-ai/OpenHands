#!/usr/bin/env python3
"""
Real OpenHands Code Generation Test
Tests actual code generation with OpenAI GPT-4
"""

import os
import sys
from datetime import datetime
from pathlib import Path

print("=" * 80)
print("OpenHands Real Code Generation Test")
print("=" * 80)
print(f"Started at: {datetime.now()}\n")

# Set API key from environment
api_key = os.getenv('OPENAI_API_KEY')
if not api_key:
    print("❌ OPENAI_API_KEY not found in environment")
    print("Please run: export OPENAI_API_KEY='your-key'")
    sys.exit(1)

print(f"✓ OpenAI API key found (ending in ...{api_key[-4:]})\n")

# Test: Generate a simple MCP connector function
print("[Test] Generating a simple MCP tool function...")
print("Task: Create a Python function that generates a simple weather MCP tool\n")

try:
    # Import required modules
    from openhands.controller.agent_controller import AgentController
    from openhands.core.config import LLMConfig, AgentConfig, SandboxConfig
    from openhands.events.action import MessageAction
    from openhands.events.observation import NullObservation
    from openhands.runtime.client.runtime import EventStreamRuntime

    print("✓ Successfully imported OpenHands modules\n")

    # Create workspace
    workspace_dir = Path("/tmp/openhands-test-workspace")
    workspace_dir.mkdir(exist_ok=True, parents=True)
    print(f"✓ Workspace created: {workspace_dir}\n")

    # Configure LLM
    llm_config = LLMConfig(
        model="gpt-4",
        api_key=api_key,
        temperature=0.3,
    )
    print("✓ LLM configured (GPT-4)\n")

    # Configure sandbox
    sandbox_config = SandboxConfig(
        use_host_network=False,
        enable_auto_lint=True,
        timeout=300,
    )

    # Configure agent
    agent_config = AgentConfig(
        name="CodeActAgent",
        llm_config=llm_config,
        sandbox_config=sandbox_config,
    )
    print("✓ Agent configured (CodeActAgent)\n")

    print("=" * 80)
    print("Starting code generation...")
    print("=" * 80)
    print()

    # Create runtime
    runtime = EventStreamRuntime(
        config=agent_config,
        event_stream=None,
        sid="test-session",
        plugins=[],
    )

    # Create controller
    controller = AgentController(
        agent=agent_config,
        max_iterations=10,
        max_budget_per_task=0.5,
        agent_to_llm_config={agent_config.name: llm_config},
        agent_configs={agent_config.name: agent_config},
    )

    print("✓ Controller initialized\n")

    # Define the task
    task = """
Create a Python file called 'weather_mcp_tool.py' that implements a simple MCP tool for getting weather information.

The file should include:
1. A function called 'get_weather' that takes a city name as parameter
2. Returns a dictionary with mock weather data (temperature, conditions, humidity)
3. Proper docstrings
4. Type hints
5. A simple example of how to use it

Make it clean, production-ready code with good comments.
"""

    print("Task assigned to OpenHands:")
    print("-" * 80)
    print(task)
    print("-" * 80)
    print()

    # Create message action
    action = MessageAction(content=task)

    # Run the agent
    print("⏳ OpenHands is working...")
    print("   This may take 30-60 seconds...\n")

    result = controller.step(action)

    print("=" * 80)
    print("Generation Complete!")
    print("=" * 80)
    print()

    # Check if file was created
    output_file = workspace_dir / "weather_mcp_tool.py"
    if output_file.exists():
        print("✅ SUCCESS! File generated successfully!\n")
        print("Generated file: weather_mcp_tool.py")
        print("-" * 80)
        with open(output_file, 'r') as f:
            content = f.read()
            print(content)
        print("-" * 80)
        print()
        print(f"File saved to: {output_file}")
        print(f"File size: {len(content)} characters")
        print()
    else:
        print("⚠️  File not found at expected location")
        print(f"Workspace contents: {list(workspace_dir.iterdir())}")
        print()

    # Print agent's response
    print("\nAgent Response:")
    print("-" * 80)
    print(f"Status: {result}")
    print("-" * 80)

except ImportError as e:
    print(f"❌ Import error: {e}")
    print("\nTrying alternative simpler test...")
    print()

    # Fallback: Test LLM directly
    try:
        from openhands.llm.llm import LLM

        llm = LLM(model="gpt-4", api_key=api_key)

        prompt = """Generate a simple Python function that creates an MCP weather tool.

Just output the code, no explanations:"""

        print("Testing LLM directly...")
        response = llm.completion(
            messages=[{"role": "user", "content": prompt}]
        )

        print("\n✅ LLM Response received!")
        print("-" * 80)
        print(response.choices[0].message.content)
        print("-" * 80)

    except Exception as e2:
        print(f"❌ Also failed: {e2}")

except Exception as e:
    print(f"❌ Error during generation: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 80)
print("Test Summary")
print("=" * 80)
print("""
This test demonstrates OpenHands' code generation capabilities.

For MCPOverflow integration, this same approach will be used to:
1. Analyze API specifications
2. Generate complete MCP connectors
3. Create test suites
4. Generate documentation

Next: Integrate this with MCPOverflow's existing adapter!
""")

print(f"\nCompleted at: {datetime.now()}")
print("=" * 80)
