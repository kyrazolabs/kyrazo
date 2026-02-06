# Kyrazo SEO & Brand Knowledge Base

## 1. System Context & Identity

**Product Name:** Kyrazo  
**Industry:** Developer Tools / Webhooks as a Service (WaaS)  
**Core Value Proposition:** A smart middleware layer for receiving, sending, and managing webhooks with enterprise-grade reliability.  
**Primary Differentiator (USP):** **Dedicated Workers Model.** Unlike competitors who use shared queues, Kyrazo allocates dedicated workers per client/plan, ensuring no noisy-neighbor issues, predictable performance, and high isolation.

### Target Audience

- **Primary:** Backend Developers, DevOps Engineers, System Architects.
- **Secondary:** CTOs of startups and scaling tech companies looking to offload infrastructure complexity.
- **Tone of Voice:** Technical, direct, authoritative, developer-friendly (no marketing fluff), and reliability-focused.

---

## 2. Core SEO Strategy

### A. Primary Keywords (Commercial Intent)

- _Focus:_ "Webhooks as a Service", "Managed Webhook Infrastructure", "Webhook Relay", "Webhook Gateway".
- _Action:_ Use these in H1 headers and opening paragraphs of landing pages.

### B. USP Keywords (Technical Differentiator)

- _Focus:_ "Dedicated webhook workers", "Isolated event processing", "Multi-tenant webhook isolation", "Predictable webhook latency", "Noisy neighbor webhook protection".
- _Action:_ Use these when describing the _Architecture_ or _Pricing_ tiers.

### C. Feature Keywords

- _Ingestion:_ "Webhook verification", "HMAC signature check", "Event parsing", "Webhook normalization".
- _Dispatch:_ "Webhook retry policies", "Automatic backoff strategy", "Webhook scheduling", "Event queueing".

### D. Integration Keywords (Long-tail)

- _Focus:_ "Stripe webhook integration", "GitHub webhook listener", "Resend event forwarding", "Slack webhook middleware".

---

## 3. Page-by-Page SEO Instructions

### Homepage (`/`)

- **Target Keyword:** Webhooks as a Service
- **H1 Title:** Kyrazo | Reliable Webhooks as a Service with Dedicated Workers
- **Meta Description:** Simplify your event architecture with Kyrazo. A managed webhook platform offering signature verification, automatic retries, and dedicated workers for predictable performance.
- **Content Focus:** High-level overview of Ingest -> Process -> Dispatch. Emphasize "Dedicated Workers" immediately.

### Feature Page: Ingestion (`/features/ingest`)

- **Target Keyword:** Secure Webhook Receiver / Ingestion
- **H1:** Secure Webhook Ingestion & Verification
- **Key Topics:** validating HMAC signatures automatically, normalizing payloads from providers (Stripe, GitHub), and persistent storage for audit logs.

### Feature Page: Dispatch (`/features/dispatch`)

- **Target Keyword:** Webhook Delivery Service
- **H1:** Reliable Webhook Dispatch & Retry Logic
- **Key Topics:** Smart backoff strategies (exponential, linear), dead-letter queues, scheduling events for future delivery.

### Feature Page: Dedicated Infrastructure (`/features/architecture`)

- **Target Keyword:** Isolated Webhook Infrastructure
- **H1:** The Dedicated Workers Architecture
- **Key Topics:** Explain how Client A's traffic never impacts Client B. Contrast this with "Shared Queues" used by competitors.

---

## 4. Content Generation Guidelines for AI Agents

When generating blog posts, documentation, or landing page copy, follow these rules:

**1. The "Problem -> Solution" Framework**

- **Bad:** "Kyrazo has a retry feature."
- **Good:** "Building retry logic is hard. Kyrazo handles exponential backoff automatically, so your team doesn't have to maintain custom queueing infrastructure."

**2. Technical Accuracy**

- Always mention **Security** when discussing ingestion (HMAC, Encryption).
- Always mention **Reliability** when discussing dispatch (Retries, DLQ).

**3. Comparison Strategy**

- If asked to compare Kyrazo to generic solutions, highlight the **Dedicated Workers** model.
- _Argument:_ "Other platforms share resources. If one user spikes, your webhooks slow down. Kyrazo guarantees your throughput with dedicated resources."

---

## 5. Technical SEO Requirements

- **Schema Markup:** Apply `SoftwareApplication` schema to the homepage.
- **Code Snippets:** When showing integration examples (e.g., Node.js SDK), ensure they are formatted in standard Markdown code blocks for readability.
- **Performance:** Emphasize "Low Latency" in all meta-descriptions related to event delivery.

---

## 6. Sample Content Prompts

**Prompt 1: Blog Post - The Reliability Angle**

> "Write a technical article titled 'Why Shared Queues Fail at Scale'. Explain the 'Noisy Neighbor' problem in cloud architecture and introduce Kyrazo's 'Dedicated Workers' model as the solution for consistent webhook latency."

**Prompt 2: Integration Guide - The How-To**

> "Create a step-by-step guide on 'How to Securely Handle Stripe Webhooks'. First, show the complexity of manually verifying signatures and handling retries in a Node.js Express app. Then, show how Kyrazo simplifies this by acting as the middleware that handles verification and guarantees delivery."
