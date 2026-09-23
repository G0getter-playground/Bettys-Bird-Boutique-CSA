"""
End-to-end smoke tests against the root agent.

Drives `src.agent.root_agent` with three query types (datastore, database,
web search) and asserts none of the responses contain apology/hiccup phrases.

These tests cost a handful of Gemini calls -- they exist precisely so that the
closure-capture bug would be caught at the user-visible level. Keep query
count low.
"""
import asyncio
import os
import uuid

import pytest


@pytest.fixture(scope="module", autouse=True)
def _env_and_toolbox():
    from dotenv import load_dotenv
    PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    load_dotenv(os.path.join(PROJECT_ROOT, "src", ".env"))
    if not os.environ.get("GOOGLE_API_KEY"):
        pytest.skip("GOOGLE_API_KEY not set")
    # Toolbox reachability
    import requests
    url = os.environ.get("TOOLBOX_URL", "http://127.0.0.1:5001").rstrip("/")
    try:
        r = requests.get(f"{url}/api/toolset", timeout=2)
        r.raise_for_status()
    except Exception as e:
        pytest.skip(f"MCP Toolbox not reachable: {e}")


APOLOGY_MARKERS = [
    "i'm having trouble",
    "having trouble accessing",
    "having a hiccup",
    "i apologize",
    "i'm sorry",
    "trouble accessing",
    "configuration is missing",
    "not set",
    "error searching datastore",
]


def _assert_not_apologetic(text: str, query: str):
    assert text, f"Empty response for query: {query!r}"
    low = text.lower()
    for marker in APOLOGY_MARKERS:
        assert marker not in low, (
            f"Apology/error marker {marker!r} found in response to {query!r}:\n"
            f"{text[:1500]}"
        )


@pytest.fixture(scope="module")
def runner_and_session():
    from google.adk.runners import Runner
    from src.agent import root_agent, session_service
    runner = Runner(
        agent=root_agent,
        session_service=session_service,
        app_name="betty_e2e_test",
        auto_create_session=True,
    )
    return runner, str(uuid.uuid4())


async def _ask(runner, session_id, query: str) -> str:
    from google.genai import types
    msg = types.Content(role="user", parts=[types.Part(text=query)])
    text = ""
    async for event in runner.run_async(
        user_id="pytest_e2e", session_id=session_id, new_message=msg
    ):
        if event.content and event.content.parts:
            for p in event.content.parts:
                if p.text:
                    text += p.text
    return text


def test_root_agent_datastore_query(runner_and_session):
    runner, sid = runner_and_session
    q = "What are the store's hours?"
    response = asyncio.run(_ask(runner, sid, q))
    _assert_not_apologetic(response, q)


def test_root_agent_database_query(runner_and_session):
    runner, sid = runner_and_session
    q = "How much does a bird feeder cost?"
    response = asyncio.run(_ask(runner, sid, q))
    _assert_not_apologetic(response, q)
    # We should see the actual price come through ($25)
    assert "25" in response, (
        f"Expected price 25 to appear in agent response; got:\n{response[:1500]}"
    )


def test_root_agent_websearch_query(runner_and_session):
    runner, sid = runner_and_session
    q = "What's a good diet for a budgie?"
    response = asyncio.run(_ask(runner, sid, q))
    _assert_not_apologetic(response, q)
