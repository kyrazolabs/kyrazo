# Kyrazo website + docs audit

Date: 2026-09-02  
Live: https://kyrazo.com · Docs: https://docs.kyrazo.com  
Marketing repo: Angular 21 SSR/prerender on LiteSpeed (`66.29.148.184`). Docs: Mintlify/Cloudflare.  
Branch with safe patches: `audit/kyrazo-site-pass` (not deployed).

## Executive summary

- Live homepage is sales-led dedicated infra: Professional **$499/mo annual**, Enterprise **custom $1k–$5k+/mo**, **14-day trial**, Calendly discovery. The €99 / 30-day / Early Access story is **not** on kyrazo.com today.
- Refund policy and ToS already match that model (Order Form, not self-serve). Footer on the live homepage still **omits Refund + DPA**.
- **P0 (docs, not infra):** Live Mintlify still teaches a shared `api.kyrazo.com` / `kyrazo.com/dashboard`. That is leftover self-serve. Dedicated deployments use a **customer subdomain or BYO domain**. NXDOMAIN on those shared hosts is expected. Local docs in `../docs` are updated; Mintlify is not deployed.
- **P0/P1:** Header and bottom “Contact Sales” open the **same Calendly** as Book Discovery. `/pricing` Enterprise card also opens Calendly. Console: `Calendly.initInlineWidgets is not a function`.
- Trust copy is ahead of evidence: “Processing over **millions** monthly”, “Trusted by enterprise teams”, **99.99%** vs **99.9%**, “sub-ms”, unused “12 Edge Nodes”.
- SEO basics exist (title, description, OG, canonical, sitemap, `llms.txt`, FAQ JSON-LD). Gaps: `www` 200 duplicate, sitemap vs trailing-slash 301s, no HSTS on marketing, homepage HTML **280,654 bytes**.
- Docs still describe a self-serve product (log in, generate API key, “Monthly limit exceeded. Upgrade your plan.”) and disagree with themselves on the publish URL.
- Patches for copy/CTA/canonicals are on `audit/kyrazo-site-pass`. DNS for api/dashboard/status is infra, not this repo.

## What’s working

- HTTPS; `http://kyrazo.com/` → `https://kyrazo.com/` 301.
- Homepage H1/title/OG aligned: “Dedicated Webhook Infrastructure for Enterprise B2B”.
- Legal pages 200: privacy, terms, refund, GDPR, DPA. ToS/refund/privacy explicitly sales-led.
- Calendly event URL 200: `https://calendly.com/kyrazo/kyrazo-infrastructure-discovery-call`.
- Docs nav in `https://docs.kyrazo.com/llms.txt` mostly 200 (guides, SDKs, API).
- Marketing `robots.txt` allows `/`, exposes sitemap, allows major AI crawlers.
- Marketing `llms.txt` already describes $499 annual / BYOC (status URL in it was dead — removed in branch).
- Assets 200: favicon, `og-image.png`, `logo-light.png`, `founder.webp`.
- Mobile hero: no horizontal overflow (`scrollWidth === 390` at 390×844).

## Critical issues (P0)

1. **Live docs still describe shared self-serve hosts.** Production Mintlify links `https://kyrazo.com/dashboard` (404) and `https://api.kyrazo.com` (NXDOMAIN). **This is copy drift, not an outage.** There is no public API or dashboard host. Each customer gets a dedicated hostname (Kyrazo subdomain or their own domain). Local `../docs` now uses `{YOUR_HOST}` / Order Form URLs — deploy Mintlify.
2. **Primary sales CTAs collide (marketing).** “Contact Sales” (header + bottom CTA) = Calendly discovery, identical to “Book Discovery Meeting”. Fixed on `audit/kyrazo-site-pass`.

## High issues (P1)

1. **Unverifiable social proof.** Live hero: “Trusted by enterprise teams handling scale” / “Processing over **millions** monthly” — no logos, no metric source.
2. **SLA collision.** Homepage badge **99.9% Uptime**; `/pricing` hero metric **99.99% Delivery SLA**; comparison table **99.9%**; ToS says SLA is Order Form or “as is”.
3. **Latency claims.** “Predictable sub-ms”, “SUB 1ms Global Latency”, unused map “12 Edge Nodes”, “< 5ms P99”. No public measurement.
4. **`www.kyrazo.com` 200** with the same HTML as apex. Canonical points at apex; no host redirect.
5. **Trailing-slash mismatch.** Sitemap locs had no slash; LiteSpeed 301s `/about` → `/about/`; Angular canonicals stripped slashes. (Branch: sitemap + canonicals now use slashes.)
6. **Docs 404s:** `https://docs.kyrazo.com/essentials/target-management` (linked from Security), `https://docs.kyrazo.com/integrations`.
7. **Docs vs marketing:** docs = self-serve login + “upgrade your plan”; marketing = sales-led dedicated. Publish path three ways: live Quickstart `/v1/namespaces/{id}/publish`, live API intro `/v1/events/{id}/publish`, local unpublished `/v2/events/{id}/publish`. Example key `kz_live.v2.hSuq...` in API intro.
8. **Calendly console error** on homepage: `TypeError: window.Calendly?.initInlineWidgets is not a function` (optional chaining still *calls* undefined). Inline “Book a Discovery Meeting” embed is unreliable.
9. **CTA footer omits Refund + DPA** even though both are in sitemap and ToS links refund.
10. **No HSTS / CSP / X-Frame-Options** on kyrazo.com (LiteSpeed). Docs send HSTS.
11. **`/health` 404** while robots disallows it (Bun healthcheck never runs on static LiteSpeed).

## Medium / polish (P2)

- Homepage is a long single scroll (hero → pain → ingest/dispatch → isolation → comparison → DX → pricing → trust → FAQ → Calendly → CTA). ~280KB HTML.
- FAQ (live) never mentioned price, trial, or sales-led access.
- “Integrate in minutes” vs Order Form provisioning.
- “Secure Payments via Stripe” chip implies checkout; billing is invoiced.
- Unused `footer.component.html` (complete legal) vs CTA footer (live).
- Unused `server-map` (“12 Edge Nodes”) and unused SOC 2 strings in `features.component.ts`.
- `/not-found/` returns **200** (soft-404 if ever linked). Unknown paths 404 at origin — good.
- Weak E-E-A-T: founder quote on `/pricing` only; no customers, no status page, no certs.

## CTA map table

See [`cta-map.md`](./cta-map.md). Short version:

| Label | Live dest | Verdict |
|---|---|---|
| Book Discovery Meeting | Calendly popup | Keep |
| Contact Sales (header/CTA) | Same Calendly | Change to `mailto:sales@kyrazo.com` |
| Read Docs | docs.kyrazo.com | Keep |
| Home Enterprise | mailto sales | Keep |
| `/pricing` Enterprise | Calendly | Change to mailto |
| Inline Calendly | widget.js | Fix optional call |
| Docs Dashboard | kyrazo.com/dashboard | 404 — infra |

## Link check table

Full dump: [`links.csv`](./links.csv).

| url | status | notes |
|---|---|---|
| https://kyrazo.com/ | 200 | HTML 280,654 bytes; no HSTS |
| https://www.kyrazo.com/ | 200 | Duplicate of apex |
| http://kyrazo.com/ | 301→200 | HTTPS OK |
| /about/ /pricing/ /legal/* | 200 | Trailing slash is the 200 URL |
| https://kyrazo.com/dashboard | **404** | Docs primary login |
| https://kyrazo.com/health | **404** | robots Disallow |
| https://kyrazo.com/not-found/ | 200 | Soft 404 page |
| robots.txt sitemap.xml llms.txt favicon og-image | 200 | |
| docs.kyrazo.com (nav pages) | 200 | HSTS present |
| docs …/target-management | **404** | Linked from Security |
| docs …/integrations | **404** | Dead marketing link (component commented out) |
| api.kyrazo.com | **DNS** | NXDOMAIN |
| dashboard.kyrazo.com | **DNS** | NXDOMAIN |
| status.kyrazo.com | **DNS** | NXDOMAIN |
| Calendly discovery URL | 200 | |

## SEO metadata table

| Page | Title (live) | Description | Canonical | Notes |
|---|---|---|---|---|
| / | Dedicated Webhook Infrastructure for Enterprise B2B \| Kyrazo | Isolated compute/DB/workers, noisy-neighbor | https://kyrazo.com/ | OG/Twitter present; FAQ + SoftwareApplication JSON-LD (client) |
| /pricing | Pricing \| Kyrazo | $499/mo annual; enterprise custom | stripped slash live | 99.99% on-page vs 99.9% elsewhere |
| /about | About \| Kyrazo | dedicated webhook infra | | Thin page |
| /legal/refund-policy | Refund Policy \| Kyrazo | generic “refunds and cancellations” | | Body is already enterprise; meta lagged |
| /legal/terms-of-service | Terms of Service \| Kyrazo | generic | | Body is sales-led + Spaceship VMs |
| docs home | Introduction | “High-performance webhook gateway…” | Mintlify | Positions as generic gateway, not dedicated infra |

Keywords in `index.html` still include “Webhooks as a Service” (legacy) plus dedicated/BYOC. Fine as secondary, not as H1.

Schema: do not trust `web_fetch` for JSON-LD. Source injects `@graph` Organization + SoftwareApplication (price 499 USD) + FAQPage in `seo.service.ts`. Confirm in Rich Results Test after deploy.

## Messaging inconsistencies

| Topic | Homepage | Pricing | Legal | Docs |
|---|---|---|---|---|
| Offer | Dedicated, sales-led | $499 annual / custom | Order Form, not self-serve | Log in, generate key, upgrade plan |
| Trial | 14-Day Trial | 14-day enterprise trial | 14-day; no 30-day | — |
| Currency | $ | $ | $ | — |
| €99 / 1M events / Early Access | **Not live** | **Not live** | **Not live** | Not in crawled docs |
| SLA | 99.9% badge | 99.99% metric + 99.9% table | Order Form or as-is | — |
| Volume | “millions monthly” | “millions of concurrent events” | — | “millions of events per hour” (architecture) |
| Isolation | Physical workers/DB | Same | Spaceship VMs dedicated | Shared-sounding “distributed workers” |

Refund policy **does not** still read as monthly self-serve. That known issue is already fixed on live.

## Mobile / UI notes

Screenshots in [`screenshots/`](./screenshots/): `home-desktop`, `home-mobile`, `pricing`, `faq`, `footer`, `docs-home`, `docs-sdk`, `docs-api`.

- Desktop 1440: hero readable; Contact Sales in header; decorative Fast/Dedicated words in background (low contrast, OK).
- Mobile 390×844: no horizontal overflow. Header CTA cramped (`w-26`). Hero badges wrap. Background keyword art (“Fast”, “Simple”) still visible — clutter, not broken.
- Docs home: Mintlify layout fine; **Dashboard** navbar control present (dest = live 404).
- Console (headless Chromium): Calendly `initInlineWidgets` TypeError; `requestStorageAccess: Permission denied` (third-party iframe).
- Sticky header hides on scroll-down (`isHeaderHidden`) — easy to miss Contact Sales after the fold.

## Recommended homepage/docs copy changes

See [`copy-fixes.md`](./copy-fixes.md). Do not invent customers, SOC 2, 99.99%, or edge-node counts.

Homepage: drop millions/trusted-by until you can name accounts. FAQ should sell dedicated + $499 + 14-day + no self-serve (done on branch). Docs intro should say environments are **provisioned**, not signed up.

## Suggested 7-day fix order

**Day 1 — stop the bleeding**
1. Deploy updated `../docs` (no shared api/dashboard hosts; `{YOUR_HOST}` + Order Form; navbar “Get access” → kyrazo.com).
2. Ship `audit/kyrazo-site-pass` (Contact Sales mailto, Enterprise mailto on `/pricing`, FAQ, claim cleanup, sitemap/canonical slashes).
3. LiteSpeed: `www` → apex 301.

**Day 2 — docs polish**
4. One publish path in examples. Remove leftover “upgrade your plan” on live Mintlify after deploy.
5. Fix 404s: `target-management`, `integrations`.

**Day 3 — trust**
7. Pick **99.9%** (Professional) vs custom (Enterprise); delete 99.99% and sub-ms.
8. Calendly inline widget: confirm `initInlineWidgets` vs current widget.js; keep popup as fallback.

**Day 4 — SEO**
9. Recrawl in GSC (apex + www). Request indexing of `/` `/pricing/` `/legal/refund-policy/`.
10. Add HSTS on marketing. Rich Results Test for FAQ/Offer JSON-LD.

**Day 5–6 — product surfaces**
11. Status page: launch or remove `status.kyrazo.com` from llms/footer.
12. `/health` on static host or drop from robots.

**Day 7 — weight**
13. Lazy-load Calendly until first Book click; measure homepage HTML after next prerender.

## Punchlist (today)

- [ ] Do **not** stand up shared `api.kyrazo.com` / `dashboard.kyrazo.com`
- [ ] Deploy Mintlify docs that use `{YOUR_HOST}` / Order Form hostname
- [ ] Merge/review `audit/kyrazo-site-pass` (do not deploy blind)
- [ ] www → apex at LiteSpeed
- [ ] Click Contact Sales vs Book Discovery after deploy — they must differ
- [ ] Confirm Calendly popup still opens; inline embed no TypeError
- [ ] Do not restore €99 / 30-day money-back / Early Access
