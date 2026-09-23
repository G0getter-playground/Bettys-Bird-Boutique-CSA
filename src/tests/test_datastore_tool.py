"""
Live end-to-end tests for the Vertex AI Search datastore tool.

These hit the real Vertex AI Search engine using ADC. They require:
- gcloud auth application-default login already done
- DATASTORE_PROJECT_ID / DATASTORE_ENGINE_ID configured in src/.env
"""
import pytest


@pytest.fixture()
def search_fn(env_loaded):
    """Return the inner search_datastore callable from the tool."""
    from src.datastore import get_datastore_search_tool
    tool = get_datastore_search_tool()
    fn = getattr(tool, "func", None) or getattr(tool, "fn", None)
    assert fn is not None, f"Could not extract callable from tool: {tool!r}"
    return fn


def _assert_non_error(result: str, query: str):
    assert isinstance(result, str), f"Expected str, got {type(result)}"
    lowered = result.lower()
    forbidden = [
        "configuration is missing",
        "not set",
        "error searching datastore",
        "authentication error",
        "resource not found",
    ]
    for needle in forbidden:
        assert needle not in lowered, (
            f"Datastore returned error-like result for query {query!r}:\n{result}"
        )
    assert len(result) > 50, (
        f"Result suspiciously short for query {query!r}:\n{result}"
    )


def test_datastore_search_store_hours(search_fn):
    result = search_fn("store hours")
    _assert_non_error(result, "store hours")
    # We expect some indication of hours (days of the week or "open"/"closed")
    hits = ["monday", "tuesday", "wednesday", "thursday", "friday",
            "saturday", "sunday", "open", "close", "hour", "am", "pm"]
    assert any(h in result.lower() for h in hits), (
        f"Expected hours-related content in result; got:\n{result[:1500]}"
    )


def test_datastore_search_who_is_betty(search_fn):
    result = search_fn("who is Betty")
    _assert_non_error(result, "who is Betty")
    # Should mention Betty or the boutique
    assert "betty" in result.lower(), (
        f"Expected 'betty' in result; got:\n{result[:1500]}"
    )


def test_datastore_tool_returns_string(search_fn):
    """The tool must return a string (ADK FunctionTool contract)."""
    result = search_fn("anything")
    assert isinstance(result, str)
