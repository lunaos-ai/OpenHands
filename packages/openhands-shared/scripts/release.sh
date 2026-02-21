#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# Ensure release tooling exists in the current Python env.
python - <<'PY'
import importlib.util
import subprocess
import sys

missing = [m for m in ("build", "twine") if importlib.util.find_spec(m) is None]
if missing:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "--quiet", *missing])
PY

python -m build
python -m twine check dist/*

echo
if [[ "${1:-}" == "--publish" ]]; then
  : "${TWINE_USERNAME:?TWINE_USERNAME is required (usually __token__)}"
  : "${TWINE_PASSWORD:?TWINE_PASSWORD is required (PyPI token)}"
  python -m twine upload dist/*
  echo "Published to PyPI."
else
  echo "Release artifacts validated."
  echo "To publish:"
  echo "  TWINE_USERNAME=__token__ TWINE_PASSWORD=<pypi-token> ./scripts/release.sh --publish"
fi
