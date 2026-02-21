#!/usr/bin/env python3
"""Compatibility wrapper around the shared OpenHands bridge API library."""

from openhands_shared.bridge_api import app, run_server


if __name__ == '__main__':
    run_server()
