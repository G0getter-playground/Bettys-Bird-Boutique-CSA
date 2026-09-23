
import os
import sys
import json
import asyncio
import uuid
from dotenv import load_dotenv

# Load environment variables before importing agent which uses them
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
print(f"DEBUG: TOOLBOX_URL={os.environ.get('TOOLBOX_URL')}")

from google.genai import types
from google.adk.runners import Runner
from src.agent import root_agent, session_service

# Simple HTML template for the transcript
HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>Betty's Bird Boutique Agent Demo</title>
    <style>
        body {{ font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f5f5f5; }}
        .chat-container {{ background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
        .message {{ margin-bottom: 20px; padding: 15px; border-radius: 8px; }}
        .user {{ background-color: #e3f2fd; margin-left: 20%; border-bottom-right-radius: 2px; }}
        .agent {{ background-color: #f1f8e9; margin-right: 20%; border-bottom-left-radius: 2px; }}
        .sender {{ font-weight: bold; margin-bottom: 5px; color: #555; }}
        .content {{ white-space: pre-wrap; line-height: 1.5; }}
        h1 {{ text-align: center; color: #333; }}
    </style>
</head>
<body>
    <h1>Betty's Bird Boutique Agent Demo</h1>
    <div class="chat-container">
        {messages}
    </div>
</body>
</html>
"""

MESSAGE_TEMPLATE = """
        <div class="message {role}">
            <div class="sender">{sender}</div>
            <div class="content">{content}</div>
        </div>
"""

async def run_query(runner, q, session_id):
    print(f"Calling runner.run_async for query: {q}")
    response_text = ""
    
    try:
        new_message = types.Content(role='user', parts=[types.Part(text=q)])
        
        async for event in runner.run_async(
            user_id="demo_user",
            session_id=session_id,
            new_message=new_message
        ):
            if event.content and event.content.parts:
                for part in event.content.parts:
                    if part.text:
                        response_text += part.text
                        # Print streaming chunks if needed, or just accumulate
                        print(part.text, end="", flush=True)
        print() # Newline after response
        return response_text
    
    except Exception as e:
        print(f"\nError invoking run_async: {e}")
        return f"Error: {e}"

async def main():
    print("Starting Betty's Bird Boutique Agent Demo...")
    
    # Initialize Runner
    runner = Runner(
        agent=root_agent,
        session_service=session_service,
        app_name="betty_bird_boutique",
        auto_create_session=True
    )
    
    questions = [
        "What are store working hours?",
        "Who is betty?"
    ]
    
    transcript_html_parts = []
    
    print(f"Agent Name: {root_agent.name}")
    
    session_id = str(uuid.uuid4())
    print(f"Session ID: {session_id}")
    
    for q in questions:
        print(f"\nUser: {q}")
        transcript_html_parts.append(MESSAGE_TEMPLATE.format(role="user", sender="Customer", content=q))
        
        # Invoke runner
        answer_text = await run_query(runner, q, session_id)
            
        print(f"Agent (Full): {answer_text}")
        transcript_html_parts.append(MESSAGE_TEMPLATE.format(role="agent", sender="Betty's Bird Brain", content=answer_text))

    # Save HTML
    try:
        html_content = HTML_TEMPLATE.format(messages="".join(transcript_html_parts))
        output_path = os.path.join(os.path.dirname(__file__), "demo_transcript.html")
        with open(output_path, "w") as f:
            f.write(html_content)
        
        print(f"\nTranscript saved to: {output_path}")
    except Exception as e:
        print(f"Error saving HTML: {e}")

if __name__ == "__main__":
    asyncio.run(main())
