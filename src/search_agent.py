import os
from google.adk.agents import Agent
from google.adk.tools import AgentTool, google_search

# Definition of an agent tool that accesses Grounding with Google Search

# Read the instructions from a file in the same
# directory as this file.
script_dir = os.path.dirname(os.path.abspath(__file__))
instruction_file_path = os.path.join(script_dir, "search-prompt.txt")
with open(instruction_file_path, "r") as f:
  instruction = f.read()

# Specialized search agent for general bird knowledge questions, grounded with google_search.
search_agent = Agent(
    name="bird_knowledge_search",
    instruction=instruction,
    model="gemini-2.5-flash",
    tools=[google_search],
)

# Wrap the search agent as an AgentTool so it can be used by the root agent
def get_search_agent_tool():
    """
    Returns an AgentTool wrapper around the search agent.
    This allows the root agent to delegate general bird knowledge questions
    to this specialized search agent.
    """
    return AgentTool(agent=search_agent)