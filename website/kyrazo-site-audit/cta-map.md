# CTA map

Live destinations as of 2026-09-02. Recommended column is what `audit/kyrazo-site-pass` implements (or infra still required).

| Visible label | Surface | Current href / action | Destination type | Works? | Matches enterprise positioning? | Recommended |
|---|---|---|---|---|---|---|
| Contact Sales | Header | Calendly popup `kyrazo-infrastructure-discovery-call` | Calendly | Popup URL 200; console error on inline widget | Weak — same dest as Book Discovery | `mailto:sales@kyrazo.com?subject=Kyrazo%20Sales%20Inquiry` |
| Book Discovery Meeting | Hero | Calendly popup | Calendly | URL 200 | Yes | Keep Calendly popup |
| Read Docs | Hero | `https://docs.kyrazo.com` (new tab) | Docs | 200 | Yes | Keep |
| 14-Day Trial badge | Hero | `routerLink="legal/refund-policy"` (relative, missing leading `/`) | Legal | Likely works from `/`; fragile | Yes | `routerLink="/legal/refund-policy"` |
| GDPR Ready badge | Hero | `/legal/gdpr` | Legal | 200 | Yes | Keep |
| DPA Available badge | Hero | `/legal/dpa` | Legal | 200 | Yes | Keep |
| Book a Discovery Call | Comparison | Calendly popup | Calendly | URL 200 | Yes | Keep |
| Book Discovery Call | Home pricing (Professional) | Calendly popup | Calendly | URL 200 | Yes | Keep |
| Contact Enterprise Sales | Home pricing (Enterprise) | `mailto:sales@kyrazo.com?subject=Enterprise%20Plan%20Inquiry` | mailto | n/a | Yes | Keep |
| Book Discovery Call / Contact Enterprise Sales | `/pricing` cards | **Both** open Calendly (`pricing-card.component.ts`) | Calendly | URL 200 | No — Enterprise should be sales email | Enterprise → mailto sales; Professional → Calendly |
| Book Discovery Meeting | Bottom CTA | Calendly popup | Calendly | URL 200 | Yes | Keep |
| Contact Sales | Bottom CTA | Calendly popup (same as Book Discovery) | Calendly | URL 200 | No | `mailto:sales@kyrazo.com` |
| Or read the documentation → | Bottom CTA | `https://docs.kyrazo.com` | Docs | 200 | Yes | Keep |
| Inline Calendly embed | Book a Discovery Meeting section | `data-url` Calendly + `initInlineWidgets()` | Calendly | **Broken** — `TypeError: window.Calendly?.initInlineWidgets is not a function` | Intended yes | Guard optional call; verify widget.js API |
| Contact us | FAQ | `mailto:support@kyrazo.com` | mailto | n/a | Support, not sales | Keep; add sales for commercial Qs |
| Documentation | Footer (CTA) | `https://docs.kyrazo.com` | Docs | 200 | Yes | Keep |
| API Reference | Footer (CTA) | `https://docs.kyrazo.com/api-reference` → 301 → `/introduction` | Docs | 200 | Yes | Link `/api-reference/introduction` |
| About Us | Footer | `/about` | Internal | 200 | Yes | Keep |
| Pricing | Footer | `/pricing` | Internal | 200 | Yes | Keep |
| Support | Footer | `mailto:support@kyrazo.com` | mailto | n/a | Yes | Keep |
| Privacy / Terms / GDPR | Footer (CTA) | routerLinks | Legal | 200 | Incomplete legal set | Add Refund + DPA |
| Refund / DPA | `footer.component.html` (unused on landing) | routerLinks | Legal | 200 | Yes | Wire or copy into CTA footer |
| Dashboard (live Mintlify navbar) | Docs | `https://dash.kyrazo.com` | Shared dashboard | NXDOMAIN — expected | No | “Get access” → kyrazo.com (done in local docs) |
| Kyrazo Dashboard (live Quickstart) | Docs | `https://kyrazo.com/dashboard` | Shared dashboard | **404** | No — leftover self-serve | Dedicated hostname from Order Form |
| Network Status | Unused footer | `https://status.kyrazo.com` | Status | NXDOMAIN | — | Removed from unused footer |
| billing@ / privacy@ / legal@ | Legal pages | mailto | mailto | n/a | Yes | Keep |
