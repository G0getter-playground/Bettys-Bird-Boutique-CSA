# Betty's Bird Brain — AI Customer Service Agent

A multi-tool customer service agent for a fictional bird specialty boutique. Built on Google ADK (Gemini 2.5 Flash) with a custom Apple-aesthetic Next.js chat frontend that streams tool-call lifecycle events as they fire.

**Stack:** Python · Google ADK · MCP Toolbox · Cloud SQL (MySQL) · Vertex AI Search · Google Search grounding · Next.js 16 · React 19 · Tailwind 4 · Playwright · axe-core.

```
┌──────────────┐  POST /api/chat ──►  ┌──────────────────┐  POST /run_sse ──►  ┌──────────────┐
│ Next.js UI   │  ◄── NDJSON stream   │ Next.js bridge   │  ◄── SSE stream     │ ADK API srv  │
│ (port 3002)  │      (UiEvent JSON)  │ /api/chat route  │      (Event JSON)   │ (port 8093)  │
└──────────────┘                      │ + adk-adapter.ts │                     └──────┬───────┘
                                      └──────────────────┘                            │
                                                                          ┌───────────┼───────────┐
                                                                          ▼           ▼           ▼
                                                                   ┌──────────┐ ┌──────────┐ ┌────────────┐
                                                                   │ MCP      │ │ Vertex   │ │ Google     │
                                                                   │ Toolbox  │ │ AI       │ │ Search     │
                                                                   │ → MySQL  │ │ Search   │ │ (grounded) │
                                                                   │ :5001    │ │ datastore│ │            │
                                                                   └──────────┘ └──────────┘ └────────────┘
```

## Run locally

Pre-requisites: Python 3.11+, Node 20+, `gcloud auth application-default login` already run, `src/.env` populated.

Open **three terminals** from the repo root:

```bash
# Terminal 1 — MCP Toolbox (product price tool, port 5001)
./run_toolbox.sh

# Terminal 2 — ADK API server (port 8093; 8000 is reserved for the Udacity reviews dashboard)
set -a; source src/.env; set +a
./venv/bin/adk api_server --port 8093 --allow_origins http://localhost:3002 .

# Terminal 3 — Next.js chat UI (port 3002)
cd web && npm install && npm run dev
```

Open <http://localhost:3002>.

### Verifying it works

```bash
# Python integration tests (14, ~45s) — needs Terminal 1 running
./venv/bin/python -m pytest

# Frontend E2E + a11y (6 tests, ~35s) — needs Terminals 1 and 2 running
cd web && npx playwright test
```

### Tech stack

| Layer            | Choice                              | Why                                                       |
| ---------------- | ----------------------------------- | --------------------------------------------------------- |
| Agent runtime    | Google ADK + Gemini 2.5 Flash       | Reliable function calling, multi-tool orchestration       |
| Product DB tool  | MCP Toolbox → Cloud SQL MySQL       | Declarative SQL-tool wiring, kept out of agent code       |
| Docs search      | Vertex AI Search w/ Extractive spec | Verbatim PDF excerpts beat raw embeddings for store info  |
| Web search       | ADK `google_search` AgentTool       | Built-in grounding with citations                         |
| Frontend         | Next.js 16 App Router · React 19    | Server component proxy, RSC + streaming-first             |
| Streaming bridge | Custom `lib/adk-adapter.ts`         | ~150 LOC, translates ADK Event JSON → typed UI events     |
| Test harness     | pytest · Playwright · axe-core      | Live infra tests + end-to-end UI + WCAG A/AA audit        |

---



*Prepared by: Solution Architect Team*  
*For: Betty's Bird Boutique Management*

---

## Executive Summary

Your new AI Customer Service Agent represents a strategic investment in modern customer engagement technology. This intelligent system transforms your basic website into a powerful customer acquisition and retention tool, designed specifically for your bird specialty retail business.

### Key Technical Highlights

- **Google ADK Framework**: Enterprise-grade agent development kit with Gemini 2.5 Flash model
- **Multi-Tool Orchestration**: Coordinated access to three specialized information sources
- **MCP Toolbox Integration**: Seamless Cloud SQL connectivity for product database queries
- **Vertex AI Search Datastore**: Semantic search over PDF documents with citation support
- **Google Search Grounding**: Real-time web information retrieval with source attribution
- **Prompt-Based Guardrails**: Topic boundaries and safety constraints
- **Session Context Management**: InMemorySessionService for multi-turn conversation continuity

### Business Impact
- **24/7 Customer Support** - Never miss a customer inquiry, even after hours
- **Increased Store Visits** - AI strategically directs online browsers to your physical location
- **Expert Knowledge at Scale** - Every customer receives expert-level bird care guidance
- **Competitive Advantage** - Stand out from big-box pet stores with personalized service

## Your New AI Assistant: "Betty's Bird Brain"

Meet your new digital employee - an AI agent that knows your store as well as your best staff member. This intelligent assistant has been trained specifically for Betty's Bird Boutique to provide exceptional customer service while driving foot traffic to your store.

### What Your AI Agent Does

**Product & Pricing Expert**
- Instantly answers price questions for any item in your inventory
- Provides detailed product information and comparisons
- Suggests complementary items (bird + cage + food bundles)
- Always available, never "off shift"

**Store Ambassador**
- Shares your store's unique history and mission
- Provides accurate hours, location, and contact information
- Introduces customers to your knowledgeable staff
- Highlights what makes Betty's special vs. competitors

**Bird Care Specialist**
- Offers expert advice on bird care, feeding, and behavior
- Stays current with latest avian health recommendations
- Helps match customers with the right bird species
- Builds trust through knowledgeable guidance

**Smart Business Protector**
- Only discusses birds and your store - stays on brand
- **Never takes orders online** - drives customers to visit in person
- Maintains professional, helpful tone at all times
- Protects your business from liability with appropriate disclaimers

## Architecture Overview

### System Architecture Diagrams

![Overall System Architecture](docs/diagrams/01-system-architecture.svg)

The AI Customer Service Agent is built on a sophisticated multi-tier architecture that integrates three primary information sources to deliver intelligent, contextual responses to customer inquiries. The overall system architecture shows the complete technology stack from customer interfaces through the Google ADK layer to data sources and infrastructure.

![Data Flow Architecture](docs/diagrams/02-data-flow.svg)

The data flow architecture illustrates how customer requests are processed through the system, from initial input through tool selection and execution to final response generation.

### Component Architecture

![Component Architecture](docs/diagrams/03-component-architecture.svg)

The component architecture provides a detailed view of the internal structure, showing how the agent framework, tools layer, data access components, and storage systems work together to deliver intelligent responses.

### Agent Decision Flow

![Agent Decision Flow](docs/diagrams/04-agent-decision-flow.svg)

The agent decision flow diagram demonstrates the sophisticated logic used to process customer inquiries, including guardrails, intent classification, tool selection, and response synthesis.

### Integration Architecture

![Integration Architecture](docs/diagrams/05-integration-architecture.svg)

The integration architecture shows how the AI agent connects with external systems, third-party services, and your existing business infrastructure through secure API gateways and data integration layers.

## How Your AI Works: Three Smart Information Sources

Your AI agent is powered by three intelligent information systems that work together seamlessly:

### 1. Your Product Database
**What it does**: Instantly accesses your complete inventory and pricing
**Business value**: Customers get immediate, accurate pricing without calling or visiting
**Example**: *"Customer asks: 'How much is a large parakeet cage?' AI responds instantly with current pricing and suggests accessories."*

### 2. Your Store Knowledge Base
**What it does**: Remembers everything about your store from uploaded documents
**Business value**: Consistent, accurate information about your business 24/7
**Example**: *"Customer asks: 'Are you open on Sundays?' AI provides exact hours and suggests best times to visit for bird selection."*

### 3. Current Bird Care Information
**What it does**: Stays updated with latest bird care research and trends
**Business value**: Positions you as the expert resource customers trust
**Example**: *"Customer asks: 'What's the latest on parrot nutrition?' AI shares current best practices and suggests products you carry."*

## Real Customer Conversations

### Scenario 1: Price Inquiry
```
Customer: "Hi! I'm looking for canary food. What do you have?"

Betty's Bird Brain: "Hello! I'd be happy to help you find canary food. Let me
check our current selection and pricing..."

[Searches product database]

Betty's Bird Brain: "We carry several excellent canary foods:
- Premium Canary Seed Mix (5lb) - $12.99
- Organic Canary Blend (3lb) - $15.49
- Canary Treat Sticks (pack of 6) - $7.99

I'd recommend visiting our store to see the quality difference - our staff can
show you which blend works best for your canary's age and activity level.
We're open until 7pm today!"
```

### Scenario 2: Bird Care Advice
```
Customer: "My parakeet seems to be molting. Is this normal?"

Betty's Bird Brain: "Molting is completely normal for parakeets! Let me share
what's currently recommended for supporting your bird during this time..."

[Searches current bird care information]

Betty's Bird Brain: "Yes, annual molting is healthy and natural. During molting,
parakeets benefit from:
- Higher protein diet (14-16% vs normal 12%)
- Extra vitamin A sources
- Stress reduction

We carry molting support supplements and can recommend the best foods. Our
staff member Sarah is our molting specialist - she has 15 years of experience
with parakeets. Would you like to schedule a visit to discuss your specific
bird's needs?"
```

### Scenario 3: Store Information
```
Customer: "I'm new to the area. Can you tell me about your store?"

Betty's Bird Brain: "Welcome to our community! Betty's Bird Boutique has been
serving local bird lovers since 1987..."

[Searches store knowledge base]

Betty's Bird Brain: "We're a family-owned specialty bird store with over 35
years of experience. Unlike big pet stores, we focus exclusively on birds -
from hand-fed baby birds to expert care advice.

Our current hours are:
- Monday-Friday: 9am-7pm
- Saturday: 9am-6pm
- Sunday: 11am-4pm

We're located at [address] with plenty of parking. Our staff includes certified
avian specialists, and we often have hand-fed babies available. Would you like
to know about any specific type of bird?"
```

## Business Benefits & ROI

### Immediate Benefits (Week 1)
- **24/7 Availability** - Capture inquiries outside business hours
- **Instant Responses** - No more "I'll call you back" scenarios
- **Consistent Information** - Every customer gets the same accurate details
- **Professional Image** - Modern, tech-forward customer experience

### Medium-term Impact (1-3 Months)
- **Increased Foot Traffic** - AI specifically drives online browsers to visit
- **Higher Conversion Rates** - Expert guidance builds confidence to purchase
- **Staff Efficiency** - Reduce repetitive questions, focus on sales
- **Customer Retention** - Superior service experience vs. competitors

### Long-term Competitive Advantage (3+ Months)
- **Market Differentiation** - Only bird store in area with AI assistance
- **Customer Data Insights** - Understand common questions and preferences
- **Scalable Growth** - Handle increased customer volume without hiring
- **Brand Authority** - Known as the "tech-savvy bird experts"

## Strategic Implementation Approach

### Phase 1: Foundation (Completed)
- **AI Agent Development** - Custom-trained for your business
- **Product Database Integration** - Connected to your inventory system
- **Store Knowledge Upload** - Your business information digitized
- **Safety Guardrails** - Programmed to protect your business interests

### Phase 2: Launch Preparation (Next Steps)
- **Staff Training** - How to work alongside AI, handle escalations
- **Website Integration** - Seamless chat interface on your site
- **Testing Period** - Supervised conversations to refine responses
- **Performance Monitoring** - Track customer satisfaction and conversion

### Phase 3: Optimization (Ongoing)
- **Analytics Review** - Monthly performance reports and insights
- **Continuous Improvement** - Refine responses based on real interactions
- **Feature Expansion** - Add new capabilities based on customer needs
- **ROI Measurement** - Track increased visits and sales attribution

## Risk Management & Quality Assurance

### Business Protection Features
- **Topic Boundaries** - Only discusses birds and your store operations
- **No Online Orders** - Always directs customers to visit in person
- **Professional Tone** - Maintains your brand voice and values
- **Liability Disclaimers** - Appropriate medical and care disclaimers
- **Escalation Protocols** - Knows when to direct customers to human staff

### Quality Monitoring
- **Conversation Logs** - Review all interactions for quality
- **Performance Metrics** - Track response accuracy and customer satisfaction
- **Regular Updates** - Keep bird care information current with latest research
- **Staff Oversight** - Human team remains in control of customer relationships

## Performance Metrics & Success Tracking

### Key Performance Indicators (KPIs)
- **Customer Engagement Rate** - Percentage of website visitors who interact with AI
- **Conversation Completion Rate** - How many conversations lead to store visit commitment
- **Response Accuracy** - Customer satisfaction with AI answers (monthly surveys)
- **Conversion Attribution** - Store visits directly attributed to AI interactions
- **Operating Cost Reduction** - Decreased phone inquiries and staff time savings

### Monthly Reporting Dashboard
Your solution includes a performance dashboard tracking:
- **Conversation Volume** - Number of customer interactions daily/weekly
- **Popular Questions** - Most common inquiries (helps with inventory planning)
- **Peak Usage Times** - When customers are most active online
- **Referral Success** - How many AI conversations result in store visits
- **Customer Sentiment** - Positive/negative feedback analysis

### Success Benchmarks
- **Month 1 Target**: 50+ meaningful customer conversations
- **Month 3 Target**: 15% increase in new customer visits
- **Month 6 Target**: 25% reduction in repetitive staff phone calls
- **Year 1 Target**: Measurable ROI through increased sales attribution

## Technical Architecture (For Your IT Support)

### System Overview
Your AI solution is built on enterprise-grade Google Cloud infrastructure:

**AI Engine**: Google's Gemini 2.5 Flash
- Chosen for speed, accuracy, and cost-effectiveness
- Specifically optimized for customer service conversations
- Handles complex multi-turn conversations naturally

**Data Sources**:
1. **Product Database** - Your existing inventory system
2. **Store Knowledge Base** - Uploaded PDF documents about your business
3. **Live Web Information** - Current bird care research and trends

**Security Features**:
- Enterprise-level data protection
- No customer data stored permanently
- All conversations encrypted
- Compliance with privacy regulations

### Integration Points
- **Website Integration** - Simple chat widget for your website
- **Database Connection** - Secure link to your inventory system
- **Document Management** - Easy upload system for store information updates
- **Monitoring Dashboard** - Real-time performance tracking

## Next Steps & Implementation Timeline

### Week 1: Final Preparation
- [ ] Staff training on working with AI assistant
- [ ] Website integration and testing
- [ ] Final conversation quality review
- [ ] Launch communication to customers

### Week 2-4: Soft Launch
- [ ] Limited rollout with monitoring
- [ ] Daily conversation review and refinement
- [ ] Staff feedback integration
- [ ] Customer experience optimization

### Month 2-3: Full Deployment
- [ ] Complete website integration
- [ ] Performance metrics establishment
- [ ] Monthly review processes
- [ ] Success story documentation

### Ongoing: Optimization
- [ ] Monthly performance reviews
- [ ] Quarterly feature enhancements
- [ ] Annual technology updates
- [ ] Competitive advantage maintenance

## Support & Maintenance

### Technical Support
- **24/7 System Monitoring** - Automated alerts for any issues
- **Monthly Performance Reviews** - Detailed analytics and recommendations
- **Quarterly Updates** - New features and capability improvements
- **Emergency Support** - Immediate response for critical issues

### Business Support
- **Staff Training Sessions** - Ongoing education for your team
- **Customer Feedback Analysis** - Regular review of customer interactions
- **Competitive Analysis** - Keeping you ahead of other pet stores
- **Growth Planning** - Scaling the system as your business grows

## Investment Summary & ROI Expectations

### Implementation Investment
- **AI Development** - Completed
- **System Integration** - Completed
- **Testing & Quality Assurance** - Completed
- **Staff Training & Launch Support** - Included

### Expected Return on Investment
- **Year 1**: 20-30% increase in new customer acquisition
- **Year 2**: 15-25% reduction in customer service costs
- **Year 3**: Market leadership in local bird specialty retail
- **Ongoing**: Sustainable competitive advantage

### Cost Savings Opportunities
- **Reduced Phone Time** - Staff can focus on in-person sales
- **After-Hours Capture** - Never miss a potential customer inquiry
- **Consistent Information** - No more missed details or incorrect pricing
- **Expert Positioning** - Justifies premium pricing vs. big-box competitors

---

## Appendix: Technical Documentation

*The following section contains technical information for your development team and IT support personnel.*

<details>
<summary><strong>Click to view technical implementation details</strong></summary>

### System Requirements
- Python 3.8+ runtime environment
- Google Cloud Project with billing enabled
- Vertex AI API and Discovery Engine API access
- MySQL database (local or Cloud SQL)
- MCP Toolbox server for database integration

### Core Dependencies
```
google-adk>=1.13.0
google-cloud-discoveryengine>=0.13.11
toolbox-core>=0.5.0
```

### Environment Configuration
Key environment variables for system operation:
```bash
GOOGLE_CLOUD_PROJECT="your-project-id"
SEARCH_ENGINE_ID="your-search-engine-id"
DB_HOST="localhost"
DB_PORT="3306"
TOOLBOX_URL="http://127.0.0.1:5000"
```

### Database Schema
```sql
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    in_stock BOOLEAN DEFAULT TRUE
);
```

### File Structure
```
src/
├── agent.py              # Main agent configuration
├── agent-prompt.txt      # Agent personality & instructions
├── datastore.py          # Vertex AI Search integration
├── search_agent.py       # Google Search tool
├── toolbox_tools.py      # Database connectivity
├── tools.yaml           # MCP Toolbox configuration
└── docs/                # Store information PDFs
```

### Deployment Commands
```bash
# Local development
python agent.py

# Cloud deployment
gcloud run deploy betty-bird-agent \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

</details>

---

## Project Contacts

**Solution Architect**: Development Team Lead
**Technical Support**: 24/7 monitoring and maintenance
**Business Liaison**: Customer success and training

**Project Repository**: [https://github.com/Imsharad/ai-customer-service-agent-google-adk](https://github.com/Imsharad/ai-customer-service-agent-google-adk)

---

### Ready to Transform Your Customer Experience?

Your AI Customer Service Agent is ready to revolutionize how Betty's Bird Boutique serves customers. This intelligent system represents a strategic investment in modern customer engagement technology, designed specifically to drive foot traffic and build lasting customer relationships.

**Next Step**: Schedule your staff training session to begin your journey toward 24/7 intelligent customer service.

> **Betty's Bird Boutique** - *Leading the future of specialty pet retail with AI-powered customer care*