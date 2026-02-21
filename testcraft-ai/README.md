# TestCraft AI

**TestCraft AI** is an autonomous AI agent designed to revolutionize your testing strategy. It analyzes your codebase and auto-generates comprehensive test suites, ensuring high coverage and robust software.

## Features
- **Auto-Generated Tests**: Creates Unit, Integration, and E2E tests.
- **Coverage Guarantee**: Aims for high code coverage.
- **Framework Agnostic**: Supports major testing frameworks (Pytest, Jest, etc.).
- **Self-Healing**: Updates tests when code changes.

## Usage

To run the agent:

```bash
python3 testcraft-ai/run_agent.py -t "Generate unit tests for src/"
```

You can also specify a file containing the task:
```bash
python3 testcraft-ai/run_agent.py -f tasks/generate_tests.txt
```
