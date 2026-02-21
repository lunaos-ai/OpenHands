# OpenHands Shared

Reusable OpenHands bridge package for projects that need a lightweight REST adapter.

## Features

- FastAPI app with bridge endpoints:
  - `GET /health`
  - `POST /api/execute`
  - `POST /api/analyze`
  - `POST /api/generate-connector`
  - `POST /api/generate-tests`
  - `POST /api/fix`
- Programmatic API (`app`, `run_server`)
- CLI entrypoint (`openhands-shared-server`)

## Install

```bash
pip install openhands-shared
```

## Run

```bash
openhands-shared-server
```

Or in Python:

```python
from openhands_shared.bridge_api import app, run_server

run_server(host='0.0.0.0', port=8000)
```

## Required environment

At least one model key is required for `/api/execute` and derivative endpoints:

- `OPENAI_API_KEY`, or
- `ANTHROPIC_API_KEY`

## Release

Build + validate artifacts:

```bash
./scripts/release.sh
```

Publish to PyPI:

```bash
TWINE_USERNAME=__token__ TWINE_PASSWORD=<pypi-token> ./scripts/release.sh --publish
```
