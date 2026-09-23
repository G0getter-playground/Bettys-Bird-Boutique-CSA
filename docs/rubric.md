# Rubric
Use this project rubric to understand and assess the project criteria.

## Root Agent

| Criteria | Submission Requirements |
|----------|------------------------|
| Create and configure a root agent. | • An agent object of type `Agent` is created in the `agent.py` file.<br>• The agent object is configured with a `name` and `description` suitable for a bird shop customer service agent.<br>• The agent is configured with an `instruction` parameter that reads from the `agent-prompt.txt` file.<br>• The agent is configured with all required tools (database, datastore search, and web search). |
| Configure the agent's session storage and select an appropriate LLM. | • An `InMemorySessionService` is properly imported and instantiated in the `agent.py` file.<br>• A gemini model is specified for the agent.<br>• A comment in the `agent.py` file justifies the model selection. |
| Design and implement an effective agent prompt. | • The agent-prompt.txt file defines a clear persona for the bird shop customer service agent.<br>• The prompt includes explicit guidelines for when and how the agent should use its tools (database for product pricing, datastore for store info, web search for current trends).<br>• The prompt sets clear boundaries that the agent should focus on bird-related topics and Betty's Bird Boutique operations. |
| Demonstrate successful agent execution and tool usage. | • The submission includes screenshots of conversations with the agent showing session IDs.<br>• Screenshots demonstrate the agent successfully using all three tools (database, datastore search, and web search) in a single conversation.<br>• For each tool call, screenshots show the detailed request and response, including any tool-specific outputs |

## Product databases through MCP Toolbox

| Criteria | Submission Requirements |
|----------|------------------------|
| Configure database source and implement secure SQL tool. | • The tools.yaml file contains a source with a clear, descriptive name that identifies the data source.<br>• Source specifies kind: mysql and uses environment variables for host, port, user, and password with ${VAR_NAME} notation.<br>• Tool has appropriate name with kind: mysql-sql and clear description for querying product pricing.<br>• Tool has one string parameter with relevant name and description.<br>• SQL statement uses LIKE comparison with wildcards and positional parameter (?) to search product names in the products table. |
| Implement ToolboxSyncClient to load database tool. | • Imports ToolboxSyncClient from toolbox_core.<br>• Uses os.environ.get("TOOLBOX_URL", "http://127.0.0.1:5000(opens in a new tab)") for toolbox URL (no trailing slash).<br>• Creates ToolboxSyncClient with the URL.<br>• Loads database tool using db_client.load_tool() and includes in agent's tools list. |
| Demonstrate successful database tool usage in agent conversations. | • Screenshots show conversations with the agent successfully using the database tool.<br>• Screenshots capture both user requests for product information and agent responses with database results.<br>• Tool calls show detailed request and response information including successful product queries and appropriate handling of not-found scenarios. |

## Search Tools (Vertex AI & Datastore)

| Criteria | Submission Requirements |
|----------|------------------------|
| Implement search() function using discoveryengine library with proper configuration and attribution. | • The "datastore.py" file contains updates to the search() function using the discoveryengine library from Google.<br>• Uses object classes from google.cloud.discoveryengine_v1 library OR documents which alternative classes are used.<br>• If code is based on Google sample, must state so and explain choices.<br>• Request object (type SearchRequest) contains minimum attributes: serving config, query parameter, and content search spec of appropriate type.<br>• Should include other search specification parameters for fine-grained results. |
| Create properly documented Vertex AI Search Tool function with environment variables and result processing. | • Converts search results to list of strings using appropriate iteration and content extraction.<br>• Separate tool function calls search function with appropriate parameters and returns processed results.<br>• Tool definition uses docstring comments.<br>• Project ID, engine ID, and location read from environment variables with appropriate defaults.<br>• Tool function takes search query parameter and calls search with environment configuration values. |
| Code demonstrating datastore tool integration | • The code in "agent.py" imports the tool defined in "datastore.py" and makes this tool available to the root agent.<br>• The datastore search tool must be defined in the same file as search() which should be "datastore.py".<br>• The "agent.py" file must import the tool function from "datastore.py" and include it in the list of tools to be sent to the root agent constructor. |
| Demonstrate operation of the datastore tool as part of a conversation with the agent. | • Screenshots from conversations with the agent illustrating successful tool calls.<br>• Screenshots should capture details of both the request and the response.<br>• The response is not expected to answer the question, but should contain part of the source document that will. |

## Grounding with Google Search

| Criteria | Submission Requirements |
|----------|------------------------|
| Code demonstrating an agent tool that uses Grounding with Google Search to answer questions and correct the incorporation of this tool as part of the root agent configuration. | • Code in "search_agent.py" file creates an Agent object with appropriate name and description for search functionality.<br>• Agent includes google_search tool imported from google.adk.tools in its tools list.<br>• Creates AgentTool wrapper around the search agent for integration with root agent.<br>• Root agent imports and includes the search agent tool in its tools list. |
| Demonstrate evaluation and selection of an appropriate model and prompt for the search agent. | • Search agent uses an appropriate Gemini 2.0 or 2.5 family model with comments explaining the choice.<br>• Model selection considers performance requirements for search functionality.<br>• The prompt in "search-prompt.txt" contains an appropriate prompt for the search agent's role.<br>• Prompt design is suitable for handling search-related queries. |
| Demonstrate operation of the search tool as part of a conversation with the agent. | • Screenshots from conversations with the agent illustrating successful searches using the Google Search grounding tool.<br>• Screenshots should capture details of both the request and the response.<br>• Evidence shows the agent using web search to answer questions requiring external or real-time information.<br>• Search responses include visible attribution or sources indicating grounded search results. |

## General coding best practices

| Criteria | Submission Requirements |
|----------|------------------------|
| Demonstrate proper division of tasks into different tools and splitting of tools into appropriate functions. | • Tool-related functions are defined in separate files (e.g., datastore.py, search_agent.py) and imported into agent.py.<br>• Helper functions are co-located in the same file as the tool functions that use them.<br>• Variable and function names are descriptive and follow a discernible naming convention (e.g., snake_case).<br>• The code includes comments and docstrings at appropriate places. |

## Suggestions to Make Your Project Stand Out

### 1. Expand Your Knowledge Base

Consider adding more documents that describe the store. What other information might customers want to know about the store or birds?

Some suggestions to try:

- Return policy
- Special holiday hours
- Promotions or sales
- Staff bios (insert yourself!)

Test conversations both before and after adding new information to see how the agent's responses improve.

### 2. Add Date Awareness

Although you have store hours, the agent doesn't know today's date, so it can't answer "Are you open today?". Create a tool that provides the current date and day of the week**.**

### 3. Improve Product Matching

The database currently requires fairly exact product name matching. You can improve this in two ways:

- **Vertex AI Search approach**: Use Vertex AI Search with structured data.
- **Product list approach**: Create a tool that retrieves all product names and embeds them in the conversation for similarity matching.

Try both approaches and compare:

- Which gives better results with typos or partial names?
- What are the performance trade-offs?
- How do they handle edge cases?
