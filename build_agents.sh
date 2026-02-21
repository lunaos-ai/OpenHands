#!/bin/bash
set -e

echo "Building DevSecOps Guardian..."
docker build \
  --build-arg AGENT_DIR=devsecops-guardian \
  -t devsecops-guardian:latest .

echo "Building TestCraft AI..."
docker build \
  --build-arg AGENT_DIR=testcraft-ai \
  -t testcraft-ai:latest .

echo "Building API Builder Pro..."
docker build \
  --build-arg AGENT_DIR=api-builder-pro \
  -t api-builder-pro:latest .

echo "Building Documentation Dynamo..."
docker build \
  --build-arg AGENT_DIR=documentation-dynamo \
  -t documentation-dynamo:latest .

echo "All agents built successfully!"
