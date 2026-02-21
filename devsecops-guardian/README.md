# DevSecOps Guardian

**DevSecOps Guardian** is an autonomous AI agent designed to integrate security into your development workflow. Built on top of OpenHands, it continuously scans your codebase, identifies vulnerabilities, and automatically proposes fixes.

## Features
- **Automated Security Audits**: Scans for OWASP Top 10 vulnerabilities.
- **Auto-Fix**: Proposes PRs to fix identified issues.
- **Compliance Checks**: Ensures code meets security standards.

## Usage

To run the agent:

```bash
python3 devsecops-guardian/run_agent.py -t "Scan this repository for vulnerabilities"
```

You can also specify a file containing the task:
```bash
python3 devsecops-guardian/run_agent.py -f tasks/security_audit.txt
```
