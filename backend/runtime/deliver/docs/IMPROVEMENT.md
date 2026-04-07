## 🧠 Worker Performance Improvements

### Goal

Increase message processing throughput from **2 messages/second** to the maximum achievable rate.

---

### 1. Optimize NATS JetStream Usage

#### **a. Enable WorkQueue Retention Policy**

Use the **WorkQueue** retention policy so each message is consumed **only once** by one worker.
This prevents unnecessary reprocessing and speeds up message turnover.

```json
{
  "retention": "workqueue"
}
```

---

#### **b. Enable Message De-duplication**

Activate **message duplication control** to prevent the same message from being stored multiple times if published repeatedly within a short period.

```json
{
  "duplicate_window": "2s"
}
```

This reduces stream load and avoids redundant processing.

---

#### **c. Test Different Acknowledgment Policies**

| Ack Policy             | Behavior                                                                          | When to Use                                          |
| ---------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **all**                | One acknowledgment covers a batch of messages. Fewer ACKs, less network overhead. | When message loss is acceptable or worker is stable. |
| **explicit (default)** | Each message must be acknowledged individually. More reliable, slightly slower.   | When message reliability is critical.                |

**Example: AckPolicy = all**

```json
{
  "ack_policy": "all"
}
```

**Example: AckPolicy = explicit**

```json
{
  "ack_policy": "explicit",
  "ack_wait": "30s"
}
```

Recommendation:
Start with **AckPolicy = all** and benchmark. Switch to **explicit** only if message loss occurs.

---

### 2. Reduce External Data Latency

#### **a. Replace Direct MongoDB Calls**

Accessing MongoDB directly for each message adds network and I/O latency.

Use **Redis Data Integration (RDI)** or **in-memory caching** for high-frequency lookups.

Workflow:

1. Cache frequently used or static data in Redis.
2. Refresh cache asynchronously when MongoDB data changes.
3. Worker fetches data from Redis instead of MongoDB.

Result:
Reduced I/O wait and faster message handling.

---

### 3. Additional Recommendations

* **Batch processing:** Pull multiple messages per request instead of one.
* **Parallelism:** Use multiple worker instances or threads (clustered mode).
* **Persistent connections:** Avoid reconnecting to NATS for each message.
* **Profiling:** Measure time spent in I/O vs computation using tools like `perf_hooks` (Node.js).

---

### ✅ Summary

| Area                   | Optimization              | Expected Gain                               |
| ---------------------- | ------------------------- | ------------------------------------------- |
| Retention Policy       | WorkQueue                 | Prevents duplication, faster queue turnover |
| De-duplication         | Avoids storing duplicates | Reduces stream pressure                     |
| AckPolicy = all        | Fewer ACKs                | Less network traffic                        |
| Redis Caching          | Reduces DB calls          | Faster data retrieval                       |
| Batching / Parallelism | Process multiple msgs     | Higher throughput                           |

