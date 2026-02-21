# Use Python 3.12+ (OpenHands requires modern Python)
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install OpenHands dependencies
# (Assumes we are in the OpenHands repo root)
COPY pyproject.toml poetry.lock ./
RUN pip install poetry
RUN poetry config virtualenvs.create false \
    && poetry install --no-dev --no-interaction --no-ansi

# Copy core OpenHands code
COPY openhands ./openhands

# ARG for the specific agent directory (e.g., devsecops-guardian)
ARG AGENT_DIR
# ARG for the agent module name (e.g., devsecops_guardian.src.security_agent.security_agent)
ARG AGENT_MODULE

# Copy the specific agent code
COPY ${AGENT_DIR} ./${AGENT_DIR}

# Copy the runner script specifically
COPY ${AGENT_DIR}/run_agent.py ./run_agent.py

# Set environment variables
ENV PYTHONPATH=/app
ENV AGENT_CLS="SecurityAgent"
# ^ Override this at runtime or build time if needed, though run_agent.py usually handles it

# Entrypoint
ENTRYPOINT ["python3", "run_agent.py"]
CMD ["-t", "Wait for instructions"]
