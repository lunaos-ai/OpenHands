# openhands_shared

Reusable OpenHands bridge components that can be shared across projects.

## Exports

- `app`: FastAPI app exposing bridge endpoints
- `run_server()`: helper to run the bridge server with uvicorn

```python
from openhands_shared.bridge_api import app, run_server

# programmatic
run_server(host='0.0.0.0', port=8000)
```

## Endpoints

- `GET /health`
- `POST /api/execute`
- `POST /api/analyze`
- `POST /api/generate-connector`
- `POST /api/generate-tests`
- `POST /api/fix`

## Backward compatibility

`openhands_api_server.py` remains available as a wrapper:

```bash
poetry run python openhands_api_server.py
```
