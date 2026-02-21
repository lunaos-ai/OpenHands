#!/bin/bash

echo "=========================================="
echo "Testing OpenHands API - Code Generation"
echo "=========================================="
echo ""

echo "Test 1: Simple MCP Tool Generation"
echo "------------------------------------------"
curl -s -X POST http://localhost:8000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "code_generation",
    "context": {
      "language": "typescript",
      "purpose": "MCP weather tool"
    },
    "prompt": "Create a simple TypeScript function that defines an MCP tool for getting weather information. Include:\n1. Tool definition with name 'get_weather'\n2. Parameters: city (string), units (optional)\n3. Return type definition\n4. Basic implementation that returns mock data\n5. Type annotations\n\nJust output clean, production-ready TypeScript code."
  }' | python3 -m json.tool

echo ""
echo ""
echo "=========================================="
echo "Test completed!"
echo "=========================================="
