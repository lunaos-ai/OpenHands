#!/bin/bash

# Stop all integration services
# Created: January 10, 2026

echo "=========================================="
echo "  Stopping Integration Stack"
echo "=========================================="
echo ""

# Read PIDs if available
if [ -f .server_pids ]; then
    PIDS=$(cat .server_pids)
    echo "Killing processes: $PIDS"
    kill $PIDS 2>/dev/null
    rm .server_pids
    echo "✓ Stopped services from .server_pids"
fi

# Kill by port
echo "Cleaning up ports..."

# Port 8000 (OpenHands)
PIDS_8000=$(lsof -ti:8000 2>/dev/null)
if [ ! -z "$PIDS_8000" ]; then
    echo "Killing processes on port 8000: $PIDS_8000"
    kill -9 $PIDS_8000 2>/dev/null
    echo "✓ Cleaned port 8000"
fi

# Port 3001 (MCPOverflow)
PIDS_3001=$(lsof -ti:3001 2>/dev/null)
if [ ! -z "$PIDS_3001" ]; then
    echo "Killing processes on port 3001: $PIDS_3001"
    kill -9 $PIDS_3001 2>/dev/null
    echo "✓ Cleaned port 3001"
fi

echo ""
echo "=========================================="
echo "  All Services Stopped"
echo "=========================================="
echo ""
