# Allié Engineering Roadmap & Architectural Upgrades

> A strategic preparation guide for senior/lead technical interviews. Use these topics to demonstrate forward-looking systems design, scalability awareness, and engineering maturity.

---

## The 3-Tier Horizon Framework (Quick Interview Pitch)

When asked: *"Where would you take the architecture next?"*, frame your answer across three timelines:

| Horizon | Focus | Key Upgrades |
|---|---|---|
| **Tier 1: Immediate** | Performance & Resilience | Streaming responses (SSE/TTFT), Rate limiting & LLM denial-of-wallet defense |
| **Tier 2: Architectural** | Distributed State | Redis caching + TTL eviction, WebSocket bi-directional agent handover |
| **Tier 3: Enterprise & SaaS** | Core Product Evolution | Vector RAG pipeline (Atlas Vector Search), Embeddable Web Component Widget SDK |

---

## 1. Vector Search & RAG (Retrieval-Augmented Generation)

### The Current Constraint
- Currently, store knowledge is injected directly into Gemini's system instruction (`${faqList}` and `${description}`).
- **Limitation:** For large stores with hundreds of products or multi-page return policies, context stuffing exhausts LLM token limits, degrades response quality ("lost in the middle"), and inflates API costs.

### The Engineered Solution
- **Pipeline:** Document Chunking $\rightarrow$ Embedding Generation (`text-embedding-004`) $\rightarrow$ Vector Store (MongoDB Atlas Vector Search or Qdrant) $\rightarrow$ Cosine Similarity Search $\rightarrow$ Dynamic Prompt Augmentation.
- On query arrival, generate an embedding for the user message, retrieve the top 3–5 most relevant chunks ($K=3$), and pass only those to the prompt.

### Ready-to-Speak Interview Pitch:
> *"Currently, Allié relies on direct prompt stuffing for FAQs. To handle large catalogs and enterprise manuals, I would migrate to a RAG pipeline using MongoDB Atlas Vector Search. By chunking knowledge documents and retrieving only the top-K semantically relevant snippets at inference time, we reduce token consumption by 70%, eliminate context-window exhaustion, and minimize hallucinations."*

---

## 2. Distributed Caching with Redis

### The Current Constraint
- Conversation state and user identity are cached in process-level JavaScript `Map()` objects (`inMemoryConversationStore`, `userNameMemoryStore`).
- **Limitation:** Memory is isolated to a single Node.js runtime. In a multi-instance production environment (behind an AWS ALB or across Kubernetes pods), instance A cannot access state stored on instance B without sticky sessions.

### The Engineered Solution
- Migrate to **Redis** (or managed Upstash Redis).
- Store active session JSON with an explicit **TTL** (e.g., 2 hours). Inactive sessions expire automatically without memory leaks.
- Use **Redis Pub/Sub** to broadcast admin replies across worker nodes.

### Ready-to-Speak Interview Pitch:
> *"Our in-memory Maps are great for sub-millisecond local lookups, but they bind session state to a single process. To scale horizontally across multiple stateless containers, I'd introduce a Redis cache layer. Redis gives us centralized sub-millisecond access across all worker nodes, automatic TTL cleanup for idle conversations, and eliminates the need for complex sticky session routing at the load balancer."*

---

## 3. WebSockets & Streaming Responses (Optimizing TTFT)

### The Current Constraint
- Client polling occurs every 2.5 seconds on `/api/chat/messages/:sessionId` to check for staff replies.
- The AI endpoint waits for the full text completion before returning the JSON payload.
- **Limitation:** High polling overhead, battery drain on mobile devices, and high perceived latency (customer waits 2–3 seconds looking at a spinner).

### The Engineered Solution
- **Transport:** Upgrade from polling to full-duplex **WebSockets (Socket.io)** or **Server-Sent Events (SSE)**.
- **Streaming:** Switch from `generateContent` to Gemini's `generateContentStream` API. Pipe response chunks directly to the client via SSE.

### Ready-to-Speak Interview Pitch:
> *"Currently, staff handoffs rely on a 2.5-second polling interval, and AI generation returns as a single batch. By adopting Server-Sent Events or WebSockets and hooking into Gemini's streaming API, we can stream tokens directly to the customer as they are generated. This drops our Time-to-First-Token (TTFT) from 2.5 seconds to under 400ms, making the conversation feel conversational and instantaneous."*

---

## 4. Embeddable Floating Widget SDK (Shadow DOM)

### The Current Constraint
- Support is currently accessed via a dedicated route (`/support/:businessId`).
- **Limitation:** Requires businesses to redirect customers away from their storefront rather than helping them in-place during checkout or browsing.

### The Engineered Solution
- Build an embeddable script: `<script src="https://cdn.allie.ai/widget.js" data-business-id="..."></script>`.
- Use a **Custom Element with Shadow DOM** (`attachShadow({ mode: 'closed' })`).
- This guarantees that host website styles (Bootstrap, Tailwind, custom WordPress CSS) cannot leak in and alter the chat bubble's layout or typography.

### Ready-to-Speak Interview Pitch:
> *"To turn Allié into a seamless plug-and-play SaaS for platforms like Shopify or WooCommerce, I would engineer a standalone widget SDK. By encapsulating the widget inside a closed Shadow DOM, we ensure complete style and script isolation so the host site's CSS can never break the widget's neo-brutalist UI."*

---

## 5. Production Hardening: Rate Limiting & PII Redaction

### The Current Constraint
- The `/api/chat` endpoint is publicly accessible without user authentication so anonymous visitors can get immediate support.
- **Limitation:** Vulnerable to automated denial-of-wallet scripts repeatedly invoking Gemini API keys or submitting abusive inputs.

### The Engineered Solution
- **Token-Bucket Rate Limiter:** Implement IP- and session-based throttling via `express-rate-limit` backed by Redis (e.g., max 25 messages per IP per 5 minutes).
- **PII Scrubbing:** Add a regex/NLP middleware layer that masks credit card numbers (Luhn check), Social Security numbers, and passwords before sending the message to Gemini or logging to MongoDB.

### Ready-to-Speak Interview Pitch:
> *"Since customer chat endpoints must be public, production hardening requires a token-bucket rate limiter to prevent denial-of-wallet attacks against our LLM budget. Furthermore, I would introduce a pre-processing middleware that strips PII like credit cards or credentials before the prompt touches the Gemini API, maintaining compliance with privacy standards."*

---

## 6. Database Analytics Offloading (MongoDB Aggregation)

### The Current Constraint
- In `backend/routes/analytics.js`, all conversations are loaded into Node.js memory, and loops calculate CSAT, escalation rates, and date buckets.
- **Limitation:** Fine for hundreds of chats; at 50,000+ records, loading full documents into Node memory triggers high heap usage and CPU blocking.

### The Engineered Solution
- Rewrite the endpoint using **MongoDB Aggregation Pipelines** (`$facet`, `$match`, `$group`, `$bucket`).
- Add compound indices on `{ businessId: 1, createdAt: -1 }` and `{ businessId: 1, status: 1 }`.

### Ready-to-Speak Interview Pitch:
> *"Our analytics currently compute metrics in Node.js process memory. At scale, this causes unnecessary garbage collection pauses and high memory consumption. Refactoring to MongoDB aggregation pipelines with compound indexes allows the database engine to perform parallel grouping and bucketing directly on indexed fields, returning calculated metrics in single-digit milliseconds."*

