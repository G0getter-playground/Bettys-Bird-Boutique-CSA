# Screenshots - Betty's Bird Boutique Agent

These screenshots demonstrate the working agent for the Betty's Bird Boutique project submission.

## Screenshot Summary

| File | Description | Criteria |
|------|-------------|----------|
| `01-database-tool-bird-feeder-price.png` | Database tool query for bird feeder price ($25.00) | 5, 7 |
| `02-all-tools-comprehensive-demo.png` | Comprehensive demo showing ALL 3 tools in one session | 2, 5, 9, 12 |
| `03-datastore-tool-store-info.png` | Datastore tool queries for staff info, history, etc. | 9 |
| `04-database-tool-multiple-products.png` | Multiple database queries (sunflower seeds, millet, cuttlebone) | 5, 7 |

---

## Detailed Screenshot Descriptions

### 01-database-tool-bird-feeder-price.png
- **Query:** "What is the price of a bird feeder?"
- **Tool Used:** `get-product-price`
- **Result:** Bird feeder - $25.00
- **Session ID:** Visible at top
- **Criteria:** 5 (Database tool usage), 7 (SQL tool configuration)

### 02-all-tools-comprehensive-demo.png
- **Tools Demonstrated:**
  - `bird_knowledge_search` - Cockatiels info from web search
  - `search_datastore` - Store hours from PDF documents
  - `get-product-price` - Multiple product prices
- **Key Responses:**
  - Store hours: 9 AM - 7 PM Mon-Sat, 10 AM - 5 PM Sundays
  - Product prices: Sunflower seeds $22.50, Millet $8.00, Cuttlebone $4.25
- **Session ID:** Visible at top
- **Criteria:** 2 (Agent execution), 5 (Database), 9 (Datastore), 12 (Search)

### 03-datastore-tool-store-info.png
- **Queries:**
  - "Who works at the store?"
  - "When did Betty's Bird Boutique open?"
  - "Who is Betty?"
- **Tool Used:** `search_datastore`
- **Data Source:** PDF documents (bettys-staff.pdf, bettys-history.pdf)
- **Session ID:** Visible at top
- **Criteria:** 9 (Datastore tool usage)

### 04-database-tool-multiple-products.png
- **Queries:**
  - "Price of sunflower seeds?" → $22.50
  - "How much is millet?" → $8.00
  - "What does cuttlebone cost?" → $4.25
- **Tool Used:** `get-product-price`
- **Session ID:** Visible at top
- **Criteria:** 5, 7 (Multiple database queries demonstrating LIKE wildcard matching)

---

## Criteria Coverage

| Criteria | Description | Screenshot(s) |
|----------|-------------|---------------|
| 2 | Agent execution with session ID | All screenshots |
| 5 | Database tool usage | 01, 02, 04 |
| 7 | SQL tool configuration (LIKE + wildcards) | 01, 04 |
| 9 | Datastore tool usage | 02, 03 |
| 12 | Google Search tool usage | 02 |
