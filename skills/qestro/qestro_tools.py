"""
Qestro Testing Tools for OpenHands Agents

Provides tool functions that any OpenHands agent (TestAgent, DevSecOps,
CodeReview) can call to leverage Qestro's AI testing platform.

Usage:
    from qestro_tools import QestroTools
    tools = QestroTools()
    dashboard = tools.get_dashboard()
"""

import os
import json
import urllib.request
import urllib.error
from typing import Any, Optional


class QestroTools:
    """Stateless client for calling Qestro API from OpenHands agents."""

    def __init__(self):
        self.api_url = os.environ.get("QESTRO_API_URL", "https://api.qestro.app")
        self.api_key = os.environ.get("QESTRO_API_KEY", "")

    def _request(self, method: str, path: str, data: Optional[dict] = None) -> dict:
        url = f"{self.api_url}/api{path}"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }
        body = json.dumps(data).encode() if data else None
        req = urllib.request.Request(url, data=body, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.loads(resp.read().decode())
        except urllib.error.HTTPError as e:
            return {"error": True, "status": e.code, "message": e.read().decode()}
        except Exception as e:
            return {"error": True, "message": str(e)}

    # ── Dashboard ───────────────────────────────────────────────────
    def get_dashboard(self) -> dict:
        """Get QA dashboard stats: pass rate, coverage, security grade."""
        return self._request("GET", "/dashboard/stats")

    # ── Test Execution ──────────────────────────────────────────────
    def run_suite(self, suite_name: str, browser: str = "chromium") -> dict:
        """Execute a named test suite and return the run ID."""
        return self._request("POST", "/tests/execute", {
            "suite": suite_name,
            "browser": browser,
        })

    def get_run_status(self, run_id: str) -> dict:
        """Poll the status of a running test suite."""
        return self._request("GET", f"/automation-runs/{run_id}")

    # ── AI Test Generation ──────────────────────────────────────────
    def generate_tests(self, scenario: str, platform: str = "web") -> dict:
        """Generate Playwright/Cypress tests from a natural language scenario."""
        return self._request("POST", "/ai/generate-test", {
            "scenario": scenario,
            "platform": platform,
        })

    # ── Failure Analysis ────────────────────────────────────────────
    def get_failures(self, limit: int = 5) -> dict:
        """Get recent test failures."""
        return self._request("GET", f"/automation-runs?status=failed&limit={limit}")

    def analyze_failure(self, test_id: str) -> dict:
        """Get AI-powered root cause analysis for a failed test."""
        return self._request("POST", "/ai/analyze-failure", {"testId": test_id})

    # ── Self-Healing ────────────────────────────────────────────────
    def trigger_self_healing(self) -> dict:
        """Trigger AI self-healing to fix broken selectors/flaky tests."""
        return self._request("POST", "/ai/self-healing/trigger", {})

    # ── Deployment Gate ─────────────────────────────────────────────
    def check_deploy_gate(self) -> dict:
        """Check if tests pass the deployment gate criteria."""
        dashboard = self.get_dashboard()
        if dashboard.get("error"):
            return {"gate": "blocked", "reason": "Cannot reach Qestro API"}

        data = dashboard.get("data", {})
        execution = data.get("execution", {})
        coverage = execution.get("coverage", 0)
        pass_rate = execution.get("statusBreakdown", {}).get("passed", 0)

        gate_passed = coverage >= 80 and pass_rate >= 95
        return {
            "gate": "passed" if gate_passed else "blocked",
            "coverage": coverage,
            "pass_rate": pass_rate,
            "thresholds": {"min_coverage": 80, "min_pass_rate": 95},
        }
