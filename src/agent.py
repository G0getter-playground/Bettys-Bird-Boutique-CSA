import os
from google.adk.agents import Agent
from google.adk.sessions import InMemorySessionService

# Configure short-term session to use the in-memory service
# Using InMemorySessionService for single-session context management.
# This provides conversation history within a session without requiring
# persistent storage across sessions, which aligns with project requirements.
session_service = InMemorySessionService()

# Read the instructions from a file in the same
# directory as this agent.py file.
script_dir = os.path.dirname(os.path.abspath(__file__))
instruction_file_path = os.path.join(script_dir, "agent-prompt.txt")
with open(instruction_file_path, "r") as f:
    instruction = f.read()

# Import tools
from .datastore import get_datastore_search_tool
from .search_agent import get_search_agent_tool
from .toolbox_tools import get_database_tool

# Set up the tools that we will be using for the root agent
# Filter out None values in case any tool fails to load
tools = [
    tool for tool in [
        get_datastore_search_tool(),
        get_search_agent_tool(),
        get_database_tool(),
    ] if tool is not None
]

# Create our agent
# Model: gemini-2.5-flash — reliable function calling with ADK, cheap and fast.
root_agent = Agent(
    name="betty_bird_brain",
    instruction=instruction,
    model="gemini-2.5-flash",
    tools=tools,
)