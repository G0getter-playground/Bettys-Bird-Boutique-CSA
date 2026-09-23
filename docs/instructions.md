Component Breakdown
We’ll go into details below about each component, but you will be building a root_agent that you will be able to test using the adk web previewer. You’ll also be building three specific tools, using three different tool methods, that the root agent should use:

Product Database Tool: This tool provides access to product data stored in a relational database (e.g., Cloud SQL for MySQL). To do this, you will configure a connection and tools using Google's MCP Toolbox.
Document Q&A Tool: Answer questions about topics like hours and staff information from unstructured PDF documents. You will use a Vertex AI Search Datastore to store these documents and the google-cloud-discoveryengine library to query them.
General Knowledge Tool: Answer all other bird-related questions. For this, you will implement Grounding with Google Search through Gemini.
It is highly recommended that you test your agent incrementally as you build each component. This allows you to evaluate its performance and functionality at each stage of development.

Building the Agent: Step-by-Step Guide 🛠️
Prerequisites
Before you begin, ensure you have completed all instructions from the Environment Setup guide. This includes setting all required values for your Google Cloud project in the .env file.

Part 1: Create the Root Agent
Your first task is to build the basic agent framework. You will work primarily in the agent.py and agent-prompt.txt files. The provided __init__.py file should not require any edits.

Configure Session Storage: In agent.py, locate the comment prompting you to configure short-term session storage and add the required implementation.

Add a Guardrail: Edit the agent-prompt.txt file to include a simple guardrail. This should instruct the agent to only answer questions about birds or the store.

Experiment with Models: This is a good time to test different models to evaluate their performance and speed. Test at a minimum:

gemini-2.5-pro
gemini-2.5-flash
gemini-2.5-flash-lite
Test the Agent: Run the agent from your command line to ensure it works correctly. Open the URL it provides in your browser to interact with it.

Once the basic agent is working, you can begin adding tools. Remember to re-evaluate your prompt and model selection as you add new capabilities.

Part 2: Add the Product Database Tool
Next, you will connect the agent to your product pricing database using the MCP Toolbox.

Set Up the Database: If you haven't already, set up your Cloud SQL for MySQL database. Ensure it is running and you have its public IP address.
Populate the Database: Use the provided betty_db.sql file to create the database schema, create the product table, and populate it with data.
Configure User Access: Create a MySQL user with read permissions for the database and note the username and password.
Update Environment File: Add the MySQL connection details (host, username, password, port) to your .env file.
Define the Tool: Implement a new tool named get-product-price in the. This tool should query the database for a product's price based on its name.
Run the Toolbox Server: Start the server from your command line and add the provided URL to your .env file. Bash./toolbox --tools-file "tools.yaml"
Integrate with Agent: Update agents.py to access the get-product-price tool through the Toolbox. Adjust your agent's prompt if necessary to make it aware of this new tool.
Test the Integration: Relaunch your agent and test that it correctly calls the new tool to retrieve product prices.
Part 3: Add the Unstructured Data Tool
Now, integrate a tool that allows the agent to find information in PDF documents using Vertex AI Search.

Set Up Vertex AI Search: If you have not done so, create a Vertex AI Search Datastore. Connect it to a Google Cloud Storage (GCS) bucket where you will upload your documents.

Upload Documents: Upload the provided PDF documents to your GCS bucket. Verify in the Vertex AI Search console that the documents have been successfully indexed and are available for search.

Update Environment File: Add your Datastore configuration information to the .env file.

Create the Tool: Implement the search functionality in the datastore.py file.

Use the imported discoveryengine library from Google.
Complete the provided search() function template, experimenting with parameters to find the best results.
Create a tool function that calls your search() function.
Integrate with Agent: Update agents.py to add this new tool. Adjust your agent's prompt to guide it on when to use this document search capability.

Test the Tool: Test your agent again. Ask questions that can only be answered using the information in the PDF documents to confirm the tool is working correctly.

Part 4: Add the Grounding with Google Search Tool
Finally, add a tool that can answer general knowledge questions by using a model with Grounding with Google Search enabled.

Implement the AgentTool: Create this tool as an AgentTool. You can use the search_agent.py file as a starting point.
Configure the Grounded Model: Remember that this tool uses a separate model configuration from the root agent. You will need to define a new agent with its own prompt and model settings specifically for this search task.
Integrate with Agent: Update the main agents.py file one last time to add this final tool. Adjust the root agent's prompt as needed to help it delegate appropriate questions to this tool.
Assessment Instructions 📋
To complete your assessment, you will test your fully-integrated agent by engaging it in a conversation. You must capture and submit screenshots of this interaction as evidence of its functionality.

Testing Requirements
Your test conversation must demonstrate that the agent can correctly use all of its tools to answer a series of related questions.

Start a new conversation with your agent in the web previewer.

Ask questions that follow this sequence, adapting your phrasing as needed based on the agent's responses:

Test the Vertex AI Search Datastore tool:
When are you open on Thursday?
Who is Betty?
Test the Grounding with Google Search tool:
What kind of bird did she own?
What do they eat?
Test the Product Database tool:
Can I buy that from you?
Take screenshots that capture the entire conversation, clearly showing both your prompts and the agent's full responses for each step.

Submission Guidelines
Include the screenshots of your conversation as part of your final project submission.
For detailed evaluation criteria, refer to the official Project Rubric.
Next Steps: Further Enhancements 🚀
Expand the Product Info: To answer more user questions, add documents to your datastore—like return policy, holiday hours, sales, or your own staff bio—and test the agent’s responses before and after adding new information.
Make the Agent Date-Aware: Build a tool to give the agent the current date and day, so it can answer questions like “Are you open today?” accurately.
Boost Product Search: Create a tool that pulls the full product list so the agent can suggest matching items, even with typos. You can also try Vertex AI Search for structured data and compare which approach gives better results.