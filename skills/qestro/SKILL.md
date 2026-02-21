---
name: qestro
description: "Run tests, generate test cases, analyze failures, and gate deployments using the Qestro AI Testing Platform. Use `python3 {baseDir}/qestro_tools.py` or import QestroTools in agent code."
---

# Qestro AI Testing Platform

Use this skill when the user asks about QA, testing, test generation, failure analysis, or deployment readiness.

## Setup

Set these environment variables:

- `QESTRO_API_URL` — Default: `https://api.qestro.app`
- `QESTRO_API_KEY` — Your Qestro API key

## Capabilities

### 1. Dashboard — Check QA Health

```python
from qestro_tools import QestroTools
tools = QestroTools()
print(tools.get_dashboard())
```

### 2. Run Test Suites

```python
result = tools.run_suite("login-regression")
print(f"Run started: {result['data']['id']}")
```

### 3. Generate Tests from Descriptions

```python
result = tools.generate_tests("Test the Stripe checkout flow with expired cards")
print(result['data']['code'])
```

### 4. Analyze Failures

```python
failures = tools.get_failures()
for f in failures['data']:
    analysis = tools.analyze_failure(f['id'])
    print(f"Root cause: {analysis['data']['rootCause']}")
```

### 5. Deployment Gate

```python
gate = tools.check_deploy_gate()
if gate['gate'] == 'passed':
    print("✅ Safe to deploy")
else:
    print(f"❌ Blocked: coverage={gate['coverage']}%, pass_rate={gate['pass_rate']}%")
```

### 6. Self-Healing

```python
result = tools.trigger_self_healing()
print(f"Fixed {result['data']['fixed']} broken tests")
```
