In this course, Udacity offers you a federated user account, a temporary Google Cloud Platform user account with limited permissions. We call it a Cloud Lab. You can use the Cloud Lab for educational purposes only.

Before you begin, be sure to log out of any GCP accounts you may already have running. Next, click on the Cloud Resources tab to generate the temporary GCP credentials (access keys). You can click on the Open Cloud Console button to go to the GCP console. Review the screenshot below for guidance.



## GCP Account Restrictions

### 1. Session Limit

Note that there is a certain session time limit. If reached, you will automatically be timed out. As long as you have not used your entire allocated budget, your work will be saved. **You can re-launch using the same "Launch Cloud Gateway" button in the left navigation menu to return to your session.**

### 3. Budget

All Google services are a pay-as-you-go service. Udacity has set a budget for each student to complete their course work. Please understand that these credits are limited and available for you to use judiciously. The budget for this entire course is  **$25** . Although, we find about $10 sufficient for most to complete this course.

> If you hit your budget, your session will time out and your work will be lost and unrecoverable.

### 4. No Extra Credits

We recommend you shut down/delete every Google Cloud resource (e.g., Vertex AI Endpoints, Vertex AI Search apps, and Cloud SQL instances) immediately after usage or if you are stepping away for a few hours. Otherwise, you will run out of your allocated budget.

Udacity will not provide additional credits. In case you exhaust your credits:

* You will lose your progress on the Google Cloud console.
* You will have to use your personal Google Cloud account to finish the remaining course/program.

To better understand pricing, see the [Google Cloud Pricing(opens in a new tab)](https://cloud.google.com/pricing) for all available services.


Project Environment
This project is built on a modern, cloud-native stack that combines local Python development with powerful Google Cloud Platform (GCP) services. You will use the Google Agent Development Kit (ADK) to orchestrate these components and build a sophisticated AI agent.

The core components of the environment are:

Google Cloud Platform (GCP): The backbone of the project, providing AI, database, and search capabilities.
Vertex AI: For running powerful Gemini family models that give the agent its intelligence.
Cloud SQL for MySQL: A managed relational database for storing structured product data.
Vertex AI Search: A search engine for querying unstructured data from PDF documents.
IAM & Admin: For securely managing access to your GCP resources via a Service Account.
Python 3: The programming language used for all the agent's logic and tool integrations.
Google Agent Development Kit (ADK): The central framework you will use to define, configure, and run the agent and its tools.
Local Machine Instructions
To run this project on your local machine, you will need to configure your environment to connect securely to Google Cloud.

1. Install Dependencies: First, you need to install all the required Python libraries. You can do this using uv and the requirements.txt file provided in the workspace:

uv pip install -r requirements.txt
2. Configure Environment Variables (.env file): A critical part of your setup is the .env file. This file keeps sensitive information (like API keys and passwords) and environment-specific settings out of your code. You will need to create this file in the /project/ directory and populate it with the following variables:

GOOGLE_CLOUD_PROJECT: The unique ID of your Google Cloud project.
GOOGLE_CLOUD_LOCATION: The GCP region for your resources (e.g., global or us-central1).
DATASTORE_PROJECT_ID: The project ID where your Vertex AI Search app is located.
DATASTORE_ENGINE_ID: The unique ID generated for your Vertex AI Search app.
MYSQL_HOST: The public IP address of your Cloud SQL for MySQL instance.
MYSQL_USER & MYSQL_PASSWORD: The username and password for your MySQL database.
GOOGLE_APPLICATION_CREDENTIALS: The absolute file path to your downloaded service account JSON key.
Workspace Instructions
The project workspace is structured to be modular and easy to navigate. Here are the key files and directories you will be working with:

agent.py: The main file where you will define and configure your root agent.
datastore.py, search_agent.py: Files where you will implement specific tools for searching documents and the web.
tools.yaml: The configuration file for the MCP Toolbox, which defines how your agent connects to the MySQL database.
requirements.txt: A list of all the Python libraries required for the project, including:
google-adk: The core library for the Agent Development Kit.
google-cloud-discoveryengine: The Python client for interacting with Vertex AI Search.
toolbox-core: The Python client for the MCP Toolbox.
/docs/: This folder contains supplementary materials, including the database schema (betty_db.sql) and the PDF documents (bettys-history.pdf, etc.) that you will use to populate your Vertex AI Search datastore.
