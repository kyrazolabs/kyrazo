# PATCHES.md

Marketing site repo: `/home/nxion/The Forge/Projects/SaaS/Kyrazo/website`  
Branch: `audit/kyrazo-site-pass`  
Do **not** deploy until reviewed.

Docs live on Mintlify (`../docs`). Dashboard is `../dashboard`. Those are **not** patched in this branch except notes below.

## Implemented in this branch (website)

| File | Change |
|---|---|
| `src/app/pages/landing/components/header/header.component.ts` | Contact Sales → `mailto:sales@kyrazo.com` |
| `src/app/pages/landing/components/cta/cta.component.ts` | Contact Sales → mailto; Book Discovery stays Calendly |
| `src/app/pages/landing/components/cta/cta.component.html` | Add Refund + DPA; API ref → `/introduction`; Stripe chip → “Invoices via Stripe” |
| `src/app/pages/landing/components/faq/faq.component.ts` | Sales-led FAQ (price, trial, no self-serve) |
| `src/app/core/seo/page-schemas.ts` | FAQ JSON-LD matches visible FAQ; trailing-slash URLs |
| `src/app/core/services/seo.service.ts` | Canonicals keep trailing slash on inner pages (match LiteSpeed 200s) |
| `src/app/pages/landing/components/hero/hero.component.html` | Drop “millions monthly”; fix trial badge `routerLink` |
| `src/app/pages/landing/components/comparison/comparison.component.html` | Drop unverifiable sub-ms claim |
| `src/app/pages/landing/components/dedicated-workers/dedicated-workers.component.html` | `0ms` → `Zero` shared tenants |
| `src/app/pages/landing/components/dedicated-workers/dedicated-workers.component.ts` | Soften sub-100ms / 10k workers |
| `src/app/pages/landing/components/dev-exp/dev-exp.component.html` | “in minutes” → after provisioning |
| `src/app/pages/landing/components/features/features.component.ts` | Drop sub-ms, outage guarantees, SOC 2, “zero data loss” |
| `src/app/pages/landing/components/features/diagrams/server-map.component.ts` | Drop 12 edge nodes / sub-ms (component unused on live home) |
| `src/app/pages/landing/components/trust/trust.component.html` | Drop “certifications” claim |
| `src/app/pages/pricing/pricing.page.html` | Align metrics with 99.9% SLA; drop SUB 1ms / millions concurrent |
| `src/app/pages/pricing/components/pricing-card/pricing-card.component.ts` | Enterprise CTA → mailto (was Calendly) |
| `src/app/shared/services/calendly.service.ts` | Optional-call Calendly APIs (`initInlineWidgets?.()` ) |
| `src/app/app.routes.ts` | Refund meta description |
| `src/server.ts` | www → apex 301 (Bun/Docker only) |
| `public/sitemap.xml` | Trailing slashes on all locs |
| `public/llms.txt` | Trailing slashes; drop dead status host; add sales@ |

## Not implemented here (infra / other repos)

1. **Do not create shared `api.kyrazo.com` / `dashboard.kyrazo.com`.** NXDOMAIN is correct. Docs must use the customer’s dedicated hostname (subdomain or BYO domain). Local `../docs` is updated; live Mintlify is not.
2. **LiteSpeed `www` → apex 301** — live is static LiteSpeed (`66.29.148.184`). `server.ts` redirect will not run there. Add host rewrite in Spaceship/LiteSpeed:
   - `www.kyrazo.com` → `https://kyrazo.com$request_uri` 301
3. **HSTS + security headers** on marketing (none today). Docs already send HSTS via Cloudflare. Add at LiteSpeed:
   - `Strict-Transport-Security: max-age=63072000; includeSubDomains`
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`
4. **Mintlify docs** (`../docs`): Dashboard URL, publish path (`/v1/namespaces` vs `/v1/events` vs local `/v2/events`), live-looking API key in examples, `LimitExceededError` / “upgrade your plan”, 404 `/essentials/target-management`, 404 `/integrations`. Local docs already differ from production — deploy only after dashboard DNS is live.
5. **Homepage HTML weight (~280KB)** — Angular prerender + PrimeNG. Defer Calendly widget.js until CTA click; trim unused PrimeNG.
6. **`/health` 404 on LiteSpeed** — Bun handler never runs on static host. Either prerender a health file or drop the robots disallow.

## Verify after merge (do not skip)

```
bun run typecheck
bun run build
```

Then click: header Contact Sales (mailto), hero Book Discovery (Calendly popup), `/pricing` Enterprise (mailto), inline Calendly section (no console TypeError).
