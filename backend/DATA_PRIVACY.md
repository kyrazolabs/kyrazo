# Data Privacy, Storage, and Retention Policy

## Physical Storage Locations

### Primary Data Storage

**Location**: Germany (Al-Manya)

- **Application Data (MongoDB)**: Stores user profiles, workspace configurations, authentication credentials (hashed), and billing metadata.
- **Analytics & Events (ClickHouse)**: Stores high-volume ingest events, delivery attempts, and system logs.

### Backup & Disaster Recovery

**Location**: Eastern Europe

- **Provider**: Cloudflare R2
- **Policy**: Encrypted snapshots and object storage backups are replicated to this region for disaster recovery purposes.

---

## Data Retention Policies

Specific retention periods are enforced at the database level via Time-To-Live (TTL) indexes:

| Data Category          | Retention Period | Storage Engine | Implementation Method                                              |
| :--------------------- | :--------------- | :------------- | :----------------------------------------------------------------- |
| **Ingest Events**      | **90 Days**      | ClickHouse     | `TTL created_at + INTERVAL 90 DAY`                                 |
| **Usage Metrics**      | **90 Days**      | MongoDB        | TTL Index on `Usage` collection                                    |
| **Processed Webhooks** | **30 Days**      | MongoDB        | TTL Index on `WebhookEventProcessed` collection                    |
| **Delivery Attempts**  | **Indefinite\*** | ClickHouse     | _Retained for audit trails unless manually purged_                 |
| **User/Account Data**  | **Indefinite**   | MongoDB        | Retained while active. Supports "Soft Delete" (`isActive: false`). |

> **Note**: "Indefinite" data is retained until the customer requests deletion or the account is terminated.

---

## Data Movement & Processing Flow

Data traverses the infrastructure via a secure, event-driven architecture designed to ensure integrity and isolation:

1.  **Ingestion (API)**:
    - Data enters via `backend/apis/integration` (Source Management) or Ingest Service.
    - Requests are authenticated and validated.
    - **Encryption in Transit**: All API endpoints are accessed via **HTTPS**, ensuring that data moving from the client to our servers is encrypted.
    - Sensitive payloads (headers, bodies) are **encrypted immediately** (AES-256-GCM) upon receipt before any persistence.

2.  **Event Bus (NATS JetStream)**:
    - Events are published to **NATS JetStream** clusters on specific subjects: `workspace.{id}.plan.{type}.events.>`.
    - **Security**: All internal traffic meant for the message broker is protected via **TLS 1.2+** (Production). This means **data moved by NATS is fully encrypted** in transit.
    - **Integrity**: Every message includes an **HMAC Signature** (timestamp + nonce + payload) which is verified by the Worker before processing to prevent tampering.

3.  **Processing (Worker Runtime)**:
    - Consumers in `backend/runtime/worker` subscribe to the NATS streams using concurrency control (Semaphores).
    - Messages are routed to the `Dispatcher` (for outgoing webhooks) or `Receiver` (for incoming events).
    - The system uses tenant-isolation logic to ensure data from one workspace does not leak to another.

4.  **Persistence (Storage)**:
    - **Batch Writing**: High-volume data (Events, Deliveries) is buffered and written to **ClickHouse** in batches by the `BatchWriter` service.
    - **Transactional**: Configuration and state changes are written to **MongoDB**.

---

## Encryption Standards & Implementation

We utilize **AES-256-GCM** for all application-level encryption, ensuring both confidentiality and authenticity. Keys are derived using **HKDF (SHA-256)** with a unique `ProjectID` or `WorkspaceID` context, ensuring strict tenant isolation.

### 1. Encryption at Rest (Database)

#### **MongoDB (Configuration & State)**

Specific sensitive fields are encrypted before being stored in documents:

- **Source Credentials**: API Keys, Service Secrets, and Basic Auth Passwords (e.g., in `Source.authentication.credentials`).
- **Target Secrets**: Webhook signing secrets and authentication tokens (e.g., `Target.secrets.value_enc`).
- **User Passwords**: Hashed (One-way) using **Bcrypt** (Cost 12).

#### **ClickHouse (High-Volume Events)**

To protect sensitive payload data, the following columns are **Encrypted (AES-256-GCM)** before insertion. Stored format: `iv:encrypted_content`.

| Table               | Encrypted Columns                  | Description                                      |
| :------------------ | :--------------------------------- | :----------------------------------------------- |
| `ingest_events`     | `headers`, `body`                  | Full HTTP request payload from external sources. |
| `delivery_attempts` | `request_header`, `request_body`   | Outgoing payload sent to targets.                |
| `delivery_attempts` | `response_header`, `response_body` | Responses received from targets.                 |

### 2. Encryption in Transit

- **Internal (Service-to-Service)**: All internal communication (Worker $\leftrightarrow$ NATS $\leftrightarrow$ API) uses **TLS 1.2+**, ensuring that **data moved by NATS is encrypted**.
- **External (Ingress/Egress)**: All public endpoints enforce **HTTPS (TLS 1.2+)**, ensuring that **APIs are encrypted** during data transfer.

---

## PDPL & GDPR Compliance Details

### 1. Data Residency & Sovereignty

- **Primary Processing**: Occurs in Germany (EU), fully compliant with GDPR data residency requirements.
- **Backup Location**: Eastern Europe (EU), ensuring data remains within the European Economic Area (EEA) protection scope.
- **PDPL (Saudi Arabia)**: Data stored in the EU is generally considered compliant under PDPL Article 29 (Cross-Border Transfer) due to the EU's robust data protection laws ("Adequate Level of Protection").

### 2. Right to Erasure (Deletion)

- **Automatic**: Transient data (Events, Usage, Logs) is strictly limited by the retention policies above, adhering to the "Storage Limitation" principle.
- **Manual**: User and Workspace data currently supports "Soft Delete" (Deactivation). Permanent physical erasure requires a Data Subject Access Request (DSAR) to be processed by an administrator.

### 3. Data Security & Minimization

- **Encryption**: Passwords are hashed using **Bcrypt**.
- **Minimization**: High-volume event payloads are automatically purged after 90 days to minimize risk exposure.
