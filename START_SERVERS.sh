#!/bin/bash

# Questro + MCPOverflow + OpenHands Integration
# Startup Script for All Services
# Created: January 10, 2026

echo "=========================================="
echo "  Starting Integration Stack"
echo "=========================================="
echo ""

# Set API Key
export OPENAI_API_KEY="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"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Starting OpenHands API Server (Port 8000)${NC}"
echo "Location: /Users/shaharsolomon/dev/projects/08_open_source/OpenHands"
cd /Users/shaharsolomon/dev/projects/08_open_source/OpenHands
poetry run python openhands_api_server.py &
OPENHANDS_PID=$!
echo -e "${GREEN}✓ OpenHands API started (PID: $OPENHANDS_PID)${NC}"
echo ""

sleep 3

echo -e "${YELLOW}Step 2: Starting MCPOverflow AI Engine (Port 3001)${NC}"
echo "Location: /Users/shaharsolomon/dev/projects/03_Enterprize_application/products/devx-platform/mcpoverflow/packages/ai-engine"
cd /Users/shaharsolomon/dev/projects/03_Enterprize_application/products/devx-platform/mcpoverflow/packages/ai-engine
npm run dev &
MCPOVERFLOW_PID=$!
echo -e "${GREEN}✓ MCPOverflow AI Engine started (PID: $MCPOVERFLOW_PID)${NC}"
echo ""

sleep 5

echo -e "${YELLOW}Step 3: Testing Services${NC}"
echo ""

echo "Testing OpenHands API..."
OPENHANDS_HEALTH=$(curl -s http://localhost:8000/health | python3 -c "import sys, json; print(json.load(sys.stdin)['healthy'])" 2>/dev/null || echo "false")
if [ "$OPENHANDS_HEALTH" = "True" ]; then
    echo -e "${GREEN}✓ OpenHands API: Healthy${NC}"
else
    echo -e "${YELLOW}⚠ OpenHands API: Starting up...${NC}"
fi

echo "Testing MCPOverflow AI Engine..."
MCPOVERFLOW_HEALTH=$(curl -s http://localhost:3001/health | python3 -c "import sys, json; print(json.load(sys.stdin)['status'])" 2>/dev/null || echo "unknown")
if [ "$MCPOVERFLOW_HEALTH" != "unknown" ]; then
    echo -e "${GREEN}✓ MCPOverflow AI Engine: Running${NC}"
else
    echo -e "${YELLOW}⚠ MCPOverflow AI Engine: Starting up...${NC}"
fi

echo ""
echo "=========================================="
echo "  Services Started!"
echo "=========================================="
echo ""
echo "Access Points:"
echo "  OpenHands API:      http://localhost:8000"
echo "  MCPOverflow Engine: http://localhost:3001"
echo ""
echo "Health Checks:"
echo "  curl http://localhost:8000/health"
echo "  curl http://localhost:3001/health"
echo ""
echo "To stop services:"
echo "  kill $OPENHANDS_PID $MCPOVERFLOW_PID"
echo ""
echo "Or use:"
echo "  ./STOP_SERVERS.sh"
echo ""
echo "Process IDs saved to .server_pids"
echo "$OPENHANDS_PID $MCPOVERFLOW_PID" > /Users/shaharsolomon/dev/projects/08_open_source/OpenHands/.server_pids

echo "Press Ctrl+C to stop all services"
echo ""

# Wait for both processes
wait
