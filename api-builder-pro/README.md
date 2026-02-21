# API Builder Pro

**API Builder Pro** is an AI agent that turns natural language into production-ready APIs. It automates the entire backend development lifecycle, from schema design to documentation.

## Features
- **Natural Language to API**: Describe your app, get an API.
- **Auto-Generated Docs**: OpenAPI/Swagger standard.
- **Production Ready**: Includes Auth, Rate Limiting, and Database migrations.
- **Client SDKs**: Generates client libraries automatically.

## Usage

To run the agent:

```bash
python3 api-builder-pro/run_agent.py -t "Create a stored procedure for user login"
```

You can also specify a file containing the task:
```bash
python3 api-builder-pro/run_agent.py -f tasks/api_spec.txt
```
