"""
Live tests for the MCP Toolbox database tool.

Requires the MCP Toolbox server running on TOOLBOX_URL (default 127.0.0.1:5001).
Start it with:    ./run_toolbox.sh
"""
import os

import pytest
import requests


@pytest.fixture(scope="module")
def toolbox_url(request):
    # Load env once for the module
    from dotenv import load_dotenv
    PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    load_dotenv(os.path.join(PROJECT_ROOT, "src", ".env"))
    url = os.environ.get("TOOLBOX_URL", "http://127.0.0.1:5001").rstrip("/")
    # Reachability probe -- skip if not running
    try:
        r = requests.get(f"{url}/api/toolset", timeout=2)
        r.raise_for_status()
    except Exception as e:
        pytest.skip(f"MCP Toolbox not reachable at {url}: {e}")
    return url


def test_toolbox_server_reachable(toolbox_url):
    r = requests.get(f"{toolbox_url}/api/toolset", timeout=5)
    r.raise_for_status()
    payload = r.json()
    assert "tools" in payload
    assert "get-product-price" in payload["tools"], (
        f"get-product-price not advertised by toolbox: {list(payload['tools'])}"
    )


def test_get_database_tool_loads(toolbox_url):
    from src.toolbox_tools import get_database_tool
    tool = get_database_tool()
    assert tool is not None, "get_database_tool() returned None"


def test_get_product_price_bird_feeder(toolbox_url):
    """
    Call get-product-price with 'bird feeder' and assert $25.00 is in the result.
    The toolbox tool wraps a SQL LIKE query so 'bird feeder' should match a row
    where price = 25.00.
    """
    from src.toolbox_tools import get_database_tool
    tool = get_database_tool()
    assert tool is not None
    # ToolboxSyncTool is callable: invoke with kwargs matching the parameter name
    result = tool(product_name="bird feeder")
    text = str(result).lower()
    # Be tolerant about formatting -- accept "25" with .00, .0, etc.
    assert "25" in text, f"Expected price 25 in result; got: {result!r}"
    assert "bird feeder" in text or "feeder" in text, (
        f"Expected product name in result; got: {result!r}"
    )
