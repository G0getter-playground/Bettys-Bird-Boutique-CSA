"""
Live tests for the Google Search agent tool (Gemini-grounded).

Requires GOOGLE_API_KEY in src/.env.
"""
import asyncio
import os
import uuid

import pytest


@pytest.fixture(scope="module", autouse=True)
def _env():
    from dotenv import load_dotenv
    PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    load_dotenv(os.path.join(PROJECT_ROOT, "src", ".env"))
    if not os.environ.get("GOOGLE_API_KEY"):
        pytest.skip("GOOGLE_API_KEY not set; cannot exercise Gemini-backed search agent")


def test_search_agent_tool_constructs():
    from src.search_agent import get_search_agent_tool
    tool = get_search_agent_tool()
    assert tool is not None
    # AgentTool should wrap our search_agent
    from src.search_agent import search_agent
    assert getattr(tool, "agent", None) is search_agent


def test_search_agent_answers_bird_care_question():
    """
    Drive the bird-knowledge search agent directly via a Runner and assert we
    get a non-error, non-empty response. Content varies (it's a live web
    search), so we only check non-emptiness and absence of apology markers.
    """
    from google.adk.runners import Runner
    from google.adk.sessions import InMemorySessionService
    from google.genai import types

    from src.search_agent import search_agent

    session_service = InMemorySessionService()
    runner = Runner(
        agent=search_agent,
        session_service=session_service,
        app_name="betty_search_agent_test",
        auto_create_session=True,
    )

    async def go():
        session_id = str(uuid.uuid4())
        msg = types.Content(role="user", parts=[types.Part(
            text="What do parakeets eat in the wild?"
        )])
        text = ""
        async for event in runner.run_async(
            user_id="pytest_user", session_id=session_id, new_message=msg
        ):
            if event.content and event.content.parts:
                for p in event.content.parts:
                    if p.text:
                        text += p.text
        return text

    response = asyncio.run(go())
    assert response, "Empty response from search agent"
    lowered = response.lower()
    forbidden = ["i'm having trouble", "having a hiccup", "i apologize",
                 "trouble accessing"]
    for f in forbidden:
        assert f not in lowered, (
            f"Search agent returned apology phrase {f!r} in:\n{response[:1000]}"
        )
