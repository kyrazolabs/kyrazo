# Monorepo Workspace

This repository is a **monorepo** managed with [bun workspaces](https://bun.sh/docs/install/workspaces).
It contains multiple applications and shared packages used across different services.

---

## 📂 Project Structure

.
├── apps
│ ├── mail # Mail sending server
│ ├── mediatr # API Gateway server
│ └── web # React-based web client
│
└── packages
  ├── bullmq # Shared BullMQ configurations
  └── utils # Shared utilities and helpers


---

## 🚀 Applications

### 1. **Mail Server (`./apps/mail`)**
- Handles **transactional and campaign email sending**.  
- Uses **[Resend](https://resend.com/)** for reliable email delivery.  
- Provides a minimal API for sending and tracking emails.  

**Tech stack**:
- Node.js  
- TypeScript  
- Resend API  
- [BullMQ](https://docs.bullmq.io/)

---

### 2. **Mediatr Server (`./apps/mediatr`)**
- Acts as an **API Gateway / Mediator** between services.  
- Built on top of **[Hono](https://hono.dev/)** for ultra-fast and minimal web APIs.  
- Central entry point for routing, authentication, and proxying requests.  

**Tech stack**:
- Node.js  
- TypeScript  
- Hono framework  
- [BullMQ](https://docs.bullmq.io/)

---

### 3. **Web Client (`./apps/web`)**
- React-based **frontend client**.  
- Provides a user-friendly UI to interact with backend services.  
- Supports modern frontend tooling and development experience.

---

## 📦 Shared Packages

### 1. **BullMQ Config (`./packages/bullmq`)**
- Provides **centralized queue configuration** for all services.  
- Abstracts away low-level BullMQ setup so that each app can directly import pre-configured queues.  
- Ensures **standardized retry logic, concurrency limits, and error handling** across all job queues.  
- Can be extended for:
  - Priority queues (high / medium / low)  
  - Delayed jobs & scheduled jobs  
  - Event listeners (completed, failed, stalled, etc.)  

**Tech stack**:
- [BullMQ](https://docs.bullmq.io/)  
- TypeScript  

---

### 2. **Utils (`./packages/utils`)**
- A **shared utility library** containing common helpers, types, and constants.  
- Used by all apps (`mail`, `mediatr`, `web`) to avoid duplication.  
- Typical functionality includes:  
  - **Logger** (standardized logging format for all services)  
  - **Error handler** (centralized error object + stack tracing)  
  - **Date/time utilities** (formatting, parsing, relative times)  
  - **Environment loader** (typed env config using `zod` or `dotenv`)  
  - **Shared types & schemas** (so all apps speak the same language)  

**Tech stack**:
- Node.js  
- TypeScript

---

**Getting Started**:
```bash
# Install dependencies (root)
bun install

# Build all packages and apps (root)
bun run build

# Start development servers (root)
bun run dev
