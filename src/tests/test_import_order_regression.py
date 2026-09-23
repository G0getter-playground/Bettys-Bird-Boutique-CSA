"""
Regression test for the closure-capture / import-order bug.

The bug: `src/agent.py` calls `get_datastore_search_tool()` at module import time.
If env vars (DATASTORE_PROJECT_ID, DATASTORE_ENGINE_ID, ...) are captured at
tool-construction time, they will be empty whenever `src.agent` is imported
*before* `load_dotenv()` is invoked. The user-visible symptom is the agent
politely apologizing because the tool returns an error string the LLM treats as
a soft failure.

The fix in `src/datastore.py` is to read env vars *inside* the inner
`search_datastore` function, so dotenv loads happening later still take effect.

We use a subprocess so we can guarantee the import order. The parent test
process likely already has both `src.agent` and dotenv loaded.
"""
import os
import subprocess
import sys

import pytest

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
PYTHON = os.path.join(PROJECT_ROOT, "venv", "bin", "python")


def _run(snippet: str, extra_env: dict | None = None) -> subprocess.CompletedProcess:
    env = {k: v for k, v in os.environ.items()
           if not k.startswith("DATASTORE_")
           and not k.startswith("GOOGLE_CLOUD_")
           and k not in ("TOOLBOX_URL", "MYSQL_HOST", "MYSQL_USER",
                         "MYSQL_PASSWORD", "MYSQL_PORT")}
    # Keep GOOGLE_API_KEY out so we don't accidentally rely on it for these tests
    env.pop("GOOGLE_API_KEY", None)
    env["PYTHONPATH"] = PROJECT_ROOT
    if extra_env:
        env.update(extra_env)
    return subprocess.run(
        [PYTHON, "-c", snippet],
        cwd=PROJECT_ROOT,
        capture_output=True,
        text=True,
        env=env,
        timeout=120,
    )


def test_datastore_works_when_env_loaded_after_agent_import():
    """
    Repro the exact production import order:
      1. import src (which imports agent, which calls get_datastore_search_tool())
      2. THEN load_dotenv(src/.env)
      3. Invoke the tool's underlying callable
    With the bug, step 1 would capture empty env vars and step 3 would return
    the "Datastore configuration is missing" error string. With the fix, the
    env read happens at call time so step 3 must succeed.
    """
    # Strategy: simulate the closure-capture scenario by ensuring env is EMPTY
    # at tool construction time and only populated afterwards. We bypass the
    # `src` package __init__ side effects by loading datastore.py via
    # importlib from its file path -- this avoids running src/agent.py which
    # would call the toolbox factory and that factory's internal load_dotenv()
    # would silently populate DATASTORE_* env vars for us.
    snippet = r"""
import os, sys, traceback, importlib.util

# Sanity: env should NOT have datastore config yet
for k in ("DATASTORE_PROJECT_ID", "DATASTORE_ENGINE_ID", "DATASTORE_LOCATION"):
    assert k not in os.environ, f"test pollution: {k} already set"

# Step 1: import datastore.py DIRECTLY by file path to avoid running
# src/__init__.py and src/agent.py (which transitively call the toolbox
# factory and load_dotenv).
spec = importlib.util.spec_from_file_location(
    "datastore_isolated",
    os.path.join("src", "datastore.py"),
)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

# Step 2: Construct the tool while env is STILL empty -- this is the moment
# the old bug captured empty values.
tool = mod.get_datastore_search_tool()
assert "DATASTORE_PROJECT_ID" not in os.environ, (
    "datastore module unexpectedly populated env at import"
)

# Step 3: NOW load dotenv (this is what run_demo.py does after-the-fact).
from dotenv import load_dotenv
load_dotenv(os.path.join("src", ".env"))
assert os.environ.get("DATASTORE_PROJECT_ID"), "dotenv failed to populate env"

# Step 4: invoke the tool. With the closure bug, the tool would have captured
# empty env values at construction time and return a "configuration is missing"
# string. With the fix (read env at call time inside search_datastore), this
# returns a real result.
fn = tool.func if hasattr(tool, "func") else tool.fn
try:
    result = fn("store hours")
except Exception as e:
    print("EXCEPTION_LINE:" + repr(e))
    traceback.print_exc()
    sys.exit(2)

if "configuration is missing" in result.lower() or "project_id: not set" in result.lower():
    print("BUG_REPRODUCED_LINE:" + result[:500])
    sys.exit(1)
print("RESULT_OK_LINE:" + result[:200].replace("\n", " | "))
"""
    cp = _run(snippet)
    assert cp.returncode == 0, (
        f"Closure-capture regression detected (rc={cp.returncode}).\n"
        f"stdout:\n{cp.stdout}\n"
        f"stderr:\n{cp.stderr}"
    )
    assert "RESULT_OK_LINE:" in cp.stdout, (
        f"Did not get expected OK marker.\nstdout:\n{cp.stdout}\nstderr:\n{cp.stderr}"
    )


def test_database_tool_works_when_env_loaded_after_agent_import():
    """
    The toolbox tool factory currently calls load_dotenv() inside itself, so it
    is robust to the import-order issue *only* because of that self-load.
    This test pins that behavior: if someone removes the internal load_dotenv
    AND does not switch to call-time env reads, this test will fail.

    Requires the MCP Toolbox to be running on TOOLBOX_URL.
    """
    snippet = r"""
import os, sys
# Sanity: TOOLBOX_URL not set yet
assert "TOOLBOX_URL" not in os.environ, "test pollution"
# Step 1: import the database tool factory without any prior dotenv call
from src.toolbox_tools import get_database_tool

# Do NOT call load_dotenv ourselves -- the tool factory should still work
# because its current implementation self-loads .env. If that contract breaks,
# this test fails.
tool = get_database_tool()
if tool is None:
    print("FAIL_LINE: get_database_tool returned None")
    sys.exit(1)
print("RESULT_OK_LINE:" + type(tool).__name__)
"""
    cp = _run(snippet)
    assert cp.returncode == 0, (
        f"DB tool failed when env loaded after agent import.\n"
        f"stdout:\n{cp.stdout}\nstderr:\n{cp.stderr}"
    )


def test_search_agent_constructs_when_env_loaded_after_agent_import():
    """
    search_agent.py constructs the Agent (and the AgentTool wrapper) at import
    time. The model is a hard-coded literal so there is no env capture, but we
    pin this with a test: importing src before any env load must still produce
    a usable AgentTool.
    """
    snippet = r"""
import os, sys
assert "GOOGLE_API_KEY" not in os.environ, "test pollution"
from src.search_agent import get_search_agent_tool
tool = get_search_agent_tool()
assert tool is not None
print("RESULT_OK_LINE:" + type(tool).__name__)
"""
    cp = _run(snippet)
    assert cp.returncode == 0, (
        f"search_agent failed to construct without env preload.\n"
        f"stdout:\n{cp.stdout}\nstderr:\n{cp.stderr}"
    )
