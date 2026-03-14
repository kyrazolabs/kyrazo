# Contributing to Analytics Writer

Thank you for contributing to the Analytics Writer service.
This document defines the rules, standards, and expectations for contributions.

---

## 🎯 Contribution Goals

- Maintain **write performance**
- Preserve **idempotency**
- Avoid **schema explosion**
- Keep the system **horizontally scalable**

---

## 🧠 Architectural Rules (MANDATORY)

### 1. No Raw Events

❌ Do NOT store raw payloads  
✅ Only aggregated counters

---

### 2. Aggregation First

- All writes must be **aggregated**
- No per-event inserts
- Use batch UPSERTs only

---

### 3. Single Responsibility

Each class must do ONE thing:

- Consumer → fetch data
- Aggregator → compute + persist
- Rollup → aggregate resolutions
- Retention → cleanup only

---

### 4. Idempotency Is Required

All write operations MUST be safe to retry.

If your logic cannot be retried safely → it is invalid.

---

## 🧩 Adding a New Metric

1. Add a nullable column to the schema
2. Update the relevant aggregator
3. Ensure rollups include the metric
4. Add retention coverage if needed

❌ Do NOT create a new table unless absolutely required

---

## 🗂 Adding a New Dimension

Examples:

- region
- connector_type
- worker_id

Rules:

- Nullable column
- Included in primary key
- Indexed only if necessary

---

## 🧪 Testing Guidelines

- Test aggregation logic in isolation
- Validate UPSERT behavior
- Verify rollup correctness
- Ensure retries do not double-count

---

## 🚫 Anti-Patterns (Rejected PRs)

- Using `KEYS` in Redis
- Row-level deletes on large tables
- Synchronous per-event DB writes
- Coupling analytics with dashboard logic
- Hardcoding time windows

---

## 📦 Code Style

- TypeScript strict mode
- Classes over functions
- Explicit types
- No hidden side effects

---

## 🛡 Review Checklist

Before submitting:

- [ ] Is this idempotent?
- [ ] Is this horizontally scalable?
- [ ] Does this increase DB load?
- [ ] Can this be rolled up?
- [ ] Can this be deleted safely?

If any answer is ❌ → revise.

---

## 🧠 Final Note

This service is **infrastructure-critical**.
Optimizations and safety matter more than convenience.

When in doubt:

> Aggregate earlier. Store less. Scale horizontally.

---

Thank you for contributing 🚀
