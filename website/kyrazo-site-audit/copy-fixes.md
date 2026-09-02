# Copy fixes

Keep current enterprise positioning. Do not restore €99 / Go Starter / Early Access.

These snippets are implemented on `audit/kyrazo-site-pass` unless noted.

## Homepage hero

**Before (live):**
```
Trusted by enterprise teams handling scale
Processing over millions monthly
```

**After:**
```
Sales-led onboarding. Isolated infrastructure reserved for your workload.
```

H1 stays: `Dedicated Webhook Infrastructure for Enterprise B2B`.

Subhead stays: `Physically isolated compute, databases, and delivery workers reserved exclusively for your workload. Zero noisy-neighbor performance degradation. Zero shared database memory.`

## Comparison

**Before:**
```
Deterministic Latency
Predictable sub-ms performance you can set your clock to.
```

**After:**
```
Predictable Latency
No competing for shared-tenant capacity. Your workers serve only your events.
```

## Dedicated workers metrics

**Before:** `0ms` / `Cross-Project Lag` / `Runtime isolation ensures zero interference.`

**After:** `Zero` / `Shared Tenants` / `Runtime isolation means other customers cannot contend for your workers.`

## Developer experience

**Before:** `Integrate in minutes.` + “reduce setup complexity and helping you integrate quickly”

**After:** `SDKs ready after provisioning.` + “Once your dedicated environment is live, integrate with documented APIs and official SDKs for Node.js, Python, and Go.”

## Pricing (homepage + `/pricing`)

Keep:
- Professional `$499/month`, `Annual contract required`
- Enterprise `Custom ($1,000–$5,000+ / month)`
- Dedicated environment after paid onboarding (no unpaid trial)
- Onboarding fee `$500–$1,500`

**Before (`/pricing` metrics):**
```
SUB 1ms / Global Latency / Edge-optimized mesh ensures instant data relay worldwide.
∞ SCALE / … handles millions of concurrent events without throttling.
99.99% / Delivery SLA / Redundant multi-region mesh…
```

**After:**
```
ISOLATED / Dedicated Compute / Reserved workers and database memory for your workload only.
∞ SCALE / Dedicated workers sized to your contract — not a shared multi-tenant queue.
99.9% / Uptime SLA / Professional includes a 99.9% uptime SLA. Custom SLAs available on Enterprise.
```

## FAQ

Replace the five generic items with:

1. **What is Kyrazo?** Dedicated webhook infrastructure for enterprise B2B. Each customer gets physically isolated compute, databases, and delivery workers… no noisy-neighbor sharing.
2. **Is Kyrazo self-serve?** No. Access is provisioned after a discovery meeting and an executed Order Form. There is no public signup or in-product checkout.
3. **How much does Professional cost?** $499 per month on an annual contract. Enterprise custom $1,000–$5,000+/mo. Onboarding $500–$1,500.
4. **Do you offer a free trial?** No. Discovery is free. Dedicated infra is provisioned only after an Order Form and the onboarding fee.
5. **What happens if a destination endpoint is unavailable?** Configurable retries; failures recorded.
6. **Do I need to modify my existing code?** Often no, after provisioning. SDKs for Node.js, Python, Go.

Mirror the same answers in FAQPage JSON-LD (`page-schemas.ts`).

## Refund policy alignment

Refund policy: no unpaid trial. Discovery is free. Dedicated infra is provisioned only after Order Form + onboarding fee ($500–$1,500), non-refundable once provisioning starts. Annual fees non-refundable after the paid term begins. Refunds only for duplicate charges / billing errors.

## Trust / certifications

**Before:** “infrastructure and certifications your enterprise requires”

**After:** “Isolated infrastructure, encryption in transit and at rest, and GDPR-ready data handling.”

Do not claim SOC 2. Dead copy in `features.component.ts` (`SOC 2 Type II Certified`) neutralized.

## Docs intro (sibling repo `/docs`, not deployed)

Live docs still read as self-serve WaaS:

**Before (live Quickstart):**
```
1. Log in to the Kyrazo Dashboard (https://kyrazo.com/dashboard).
```

**After (local docs):**
```
1. After your dedicated environment is provisioned, open the dashboard URL
   from your Order Form (a Kyrazo subdomain or your own domain).
   There is no shared public dashboard.
```

API examples use `https://{YOUR_HOST}` — not `api.kyrazo.com`. Do not stand up a shared API/dashboard host.

## Stripe footer chip

**Before:** `Secure Payments via Stripe` (implies self-serve checkout)

**After:** `Invoices via Stripe`
