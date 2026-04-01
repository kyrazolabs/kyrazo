# Redis Key Naming Convention

This document defines the standard for Redis key naming across the Kyrazo backend to ensure consistency, prevent collisions, and improve maintainability.

## 1. General Format

All Redis keys must follow this pattern:
`[service/namespace]:[entity]:[attribute]:[id]`

- Use **colons (`:`)** as separators.
- Use **kebab-case** for static name parts.
- Values inside `${}` must always be the **unprefixed** version of the ID (use `unprefixId()`).

---

## 2. Standard Namespaces

| Namespace | Purpose | Example |
| :--- | :--- | :--- |
| `auth` | Sessions, OTP, 2FA, sensitive actions | `auth:otp:temp-2fa:${userId}` |
| `billing` | Subscriptions, plans, invoices | `billing:subscription:${workspaceId}` |
| `usage` | Event counts, metering, statistics | `usage:event-count:${workspaceId}:${month}` |
| `limit` | Rate limiting for API, Users, IPs | `limit:api-rate:${apiKey}` |
| `context` | Hierarchical relationships (Workspace -> Namespace) | `context:workspace:${workspaceId}:namespace:${namespaceId}` |

---

## 3. Current Key Audit & Migration Map

| Current Key | Proposed New Key | Reasoning |
| :--- | :--- | :--- |
| `workspace:${id}` | `billing:workspace-plan:${id}` | Avoids generic `workspace` namespace. |
| `workspace:subscription:${id}` | `billing:subscription:${id}` | More descriptive. |
| `usage:events:${id}:${month}` | `usage:event-count:${id}:${month}` | Avoids ambiguity with event objects. |
| `publish:api:${apiKey}` | `limit:api-rate:${apiKey}` | Clearer intent. |
| `publish:user:${userId}` | `limit:user-rate:${userId}` | Clearer intent. |
| `otp:temp_2fa:${id}` | `auth:otp:temp-2fa:${id}` | Follows auth namespace. |
| `sensitive:${action}` | `auth:sensitive-action:${action}` | Namespace grouping. |

---

## 4. Implementation Rules

1. **No Bare Keys**: Never use keys without a prefix (e.g., `user:123` is bad, `auth:user:123` is good).
2. **TTL Requirement**: All keys used for caching or temporary state **MUST** have a TTL (Time To Live).
3. **Cache Invalidation**: When an entity is updated in the database, all related Redis keys must be deleted or updated immediately.
4. **Idempotency**: Key names for the same entity must be consistent across all microservices.
