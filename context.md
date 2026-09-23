# Architecture

## System

```mermaid
flowchart LR
    User([User]) -->|types| UI[Next.js Chat UI<br/>:3002]
    UI -->|POST /api/chat| Bridge[Next.js API route<br/>web/lib/adk-adapter.ts]
    Bridge -->|create session<br/>+ run_sse| ADK[Google ADK<br/>api_server :8093]
    ADK -->|Gemini API| LLM[(Gemini 2.5 Flash)]
    LLM -.->|decides tool| ADK
    ADK -->|HTTP| Toolbox[MCP Toolbox<br/>:5001]
    ADK -->|gRPC| Vertex[Vertex AI Search<br/>datastore]
    ADK -->|Built-in tool| GSearch[Google Search<br/>grounding]
    Toolbox -->|MySQL| CloudSQL[(Cloud SQL<br/>betty.products)]
    Vertex -->|reads| GCS[(GCS bucket<br/>3 PDFs)]
    ADK -->|SSE Event stream| Bridge
    Bridge -->|NDJSON UiEvent stream| UI

    classDef user fill:#fef3c7,stroke:#92400e,color:#92400e;
    classDef frontend fill:#dbeafe,stroke:#1e40af,color:#1e40af;
    classDef agent fill:#fce7f3,stroke:#9d174d,color:#9d174d;
    classDef data fill:#d1fae5,stroke:#065f46,color:#065f46;
    class User user;
    class UI,Bridge frontend;
    class ADK,LLM agent;
    class Toolbox,Vertex,GSearch,CloudSQL,GCS data;
```

## Request lifecycle

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant UI as Next.js UI
    participant BR as Bridge<br/>(adk-adapter)
    participant ADK as ADK api_server
    participant LLM as Gemini 2.5 Flash
    participant T as Tool<br/>(Toolbox / Vertex / Search)

    U->>UI: "How much is a bird feeder?"
    UI->>BR: POST /api/chat
    BR->>ADK: POST /sessions (first call only)
    ADK-->>BR: sessionId
    BR->>ADK: POST /sessions/{id}:run_sse (message)
    ADK->>LLM: prompt + tool schemas
    LLM-->>ADK: function_call(get-product-price)
    ADK->>BR: SSE event: tool_call
    BR->>UI: UiEvent: tool_call (chip appears)
    ADK->>T: invoke tool
    T-->>ADK: {"price":"25.00"}
    ADK->>BR: SSE event: tool_response
    BR->>UI: UiEvent: tool_response (chip ✓)
    ADK->>LLM: tool result + history
    LLM-->>ADK: streamed text parts
    loop per token chunk
        ADK->>BR: SSE event: text_delta
        BR->>UI: UiEvent: text_delta
    end
    ADK->>BR: SSE event: done
    BR->>UI: UiEvent: done
```

## Agent composition

```mermaid
flowchart TB
    Root[betty_bird_brain<br/>root agent<br/>gemini-2.5-flash]

    Root --> P1[agent-prompt.txt<br/>persona + guardrails]
    Root --> S[InMemorySessionService]

    Root --> T1[get-product-price<br/>MCP tool]
    Root --> T2[search_datastore<br/>FunctionTool]
    Root --> T3[bird_knowledge_search<br/>AgentTool]

    T1 --> Cfg1[tools.yaml<br/>MySQL source<br/>+ LIKE statement]
    T2 --> Cfg2[Discovery Engine<br/>SearchRequest<br/>+ ExtractiveContentSpec]
    T3 --> Sub[bird_knowledge_search<br/>sub-agent<br/>gemini-2.5-flash]
    Sub --> GS[google_search<br/>built-in grounding tool]

    classDef root fill:#fce7f3,stroke:#9d174d,color:#9d174d;
    classDef cfg fill:#fef3c7,stroke:#92400e,color:#92400e;
    classDef tool fill:#dbeafe,stroke:#1e40af,color:#1e40af;
    classDef sub fill:#e9d5ff,stroke:#6b21a8,color:#6b21a8;
    class Root,Sub root;
    class P1,S,Cfg1,Cfg2 cfg;
    class T1,T2,T3,GS tool;
```

## Frontend streaming bridge

```mermaid
flowchart LR
    subgraph ADK[ADK SSE Event types]
        E1[part: text]
        E2[part: functionCall]
        E3[part: functionResponse]
        E4[turn complete]
    end

    subgraph Adapter[web/lib/adk-adapter.ts]
        F[translate event<br/>per part]
    end

    subgraph UI[UiEvent types]
        U1[session]
        U2[tool_call]
        U3[tool_response]
        U4[text_delta]
        U5[done]
    end

    E1 --> F --> U4
    E2 --> F --> U2
    E3 --> F --> U3
    E4 --> F --> U5
    F --> U1

    subgraph React[React client]
        State[ChatMessage state<br/>+ ToolEvent[]]
    end

    U1 --> State
    U2 --> State
    U3 --> State
    U4 --> State
    U5 --> State

    classDef adk fill:#fce7f3,stroke:#9d174d,color:#9d174d;
    classDef ui fill:#dbeafe,stroke:#1e40af,color:#1e40af;
    classDef bridge fill:#fef3c7,stroke:#92400e,color:#92400e;
    class E1,E2,E3,E4 adk;
    class U1,U2,U3,U4,U5 ui;
    class F,State bridge;
```

## Deployment topology

```mermaid
flowchart TB
    subgraph Local[Local machine — three processes]
        L1[Next.js dev :3002]
        L2[ADK api_server :8093]
        L3[MCP Toolbox binary :5001]
        L1 -.->|HTTP| L2
        L2 -.->|HTTP| L3
    end

    subgraph GCP[Google Cloud — project second-brain-463904]
        G1[Vertex AI Search<br/>engine betty-bird-boutique-datastore]
        G2[Cloud SQL MySQL<br/>instance betty-bird-db]
        G3[GCS bucket<br/>bird-boutique-docs]
        G4[Gemini API<br/>gemini-2.5-flash]
        G3 -.->|indexed by| G1
    end

    L2 -.->|Discovery Engine API| G1
    L3 -.->|mysql conn| G2
    L2 -.->|generateContent| G4

    classDef local fill:#dbeafe,stroke:#1e40af,color:#1e40af;
    classDef cloud fill:#d1fae5,stroke:#065f46,color:#065f46;
    class L1,L2,L3 local;
    class G1,G2,G3,G4 cloud;
```
