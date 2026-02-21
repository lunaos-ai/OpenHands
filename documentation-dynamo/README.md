# Documentation Dynamo

**Documentation Dynamo** is an AI agent that ensures your documentation is never out of date. It continuously monitors your codebase and automatically updates READMEs, API docs, and diagrams.

## Features
- **Auto-Sync**: Updates docs when code changes.
- **Deep Understanding**: Reads code to generate accurate explanations.
- **Visuals**: Generates Mermaid diagrams for architecture.
- **Multi-Format**: Markdown, JSDoc, Python Docstrings, OpenAPI.

## Usage

To run the agent:

```bash
python3 documentation-dynamo/run_agent.py -t "Update the README.md to reflect recent changes"
```

You can also specify a file containing the task:
```bash
python3 documentation-dynamo/run_agent.py -f tasks/doc_update.txt
```
