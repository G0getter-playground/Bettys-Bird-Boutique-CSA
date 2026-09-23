"""
Shared pytest fixtures for the Betty's Bird Boutique test suite.

These tests run against live infrastructure:
- Vertex AI Search datastore (uses ADC)
- MCP Toolbox on http://127.0.0.1:5001 (start with `./run_toolbox.sh`)
- MySQL on Cloud SQL (proxied via toolbox)
- Gemini API (via GOOGLE_API_KEY)

The src/.env file is loaded automatically by the toolbox_tools and the run_demo
entrypoint; many of these tests deliberately do NOT pre-load env so that we can
exercise the import-order bug paths.
"""
import os
import sys

import pytest

# Make sure the project root is on sys.path so that `import src.foo` works
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)


ENV_PATH = os.path.join(PROJECT_ROOT, "src", ".env")


def _load_env():
    """Load src/.env into os.environ (idempotent)."""
    from dotenv import load_dotenv
    load_dotenv(ENV_PATH, override=False)


@pytest.fixture()
def env_loaded():
    """Ensure src/.env is loaded into os.environ for tests that need it."""
    _load_env()
    return True


@pytest.fixture(scope="session")
def project_root():
    return PROJECT_ROOT
