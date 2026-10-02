# Kyrazo

Kyrazo is a webhook platform. It receives webhooks from services such as Stripe, Shopify, GitHub, Slack, PayPal, and Webflow, transforms them, and delivers them to the endpoints a customer configures.

The platform is built and owned by [Kyrazo LLC](https://kyrazo.com). This repository is private. It is not open source.

## Repository

| Directory | What it contains |
| --- | --- |
| `backend/` | HTTP APIs, workers, and background services. Bun and TypeScript, with a Rust load balancer. |
| `dashboard/` | Customer application. Angular. |
| `website/` | Marketing site at [kyrazo.com](https://kyrazo.com). |
| `docs/` | Product documentation. |
| `sdks/` | Server SDKs for JavaScript, Python, and Go. |

`backend/` is organized as `api/` (dashboard, ingest, and integration), `services/` (load balancer, orchestrator, ingestor, mail, crons), `runtime/` (worker and deliver), and `shared/`. MongoDB holds accounts and configuration. ClickHouse holds event and delivery history. NATS moves work between services. Dragonfly is the cache and queue.

Every source folder under those five directories has its own `README.md` and `CONTRIBUTING.md`. The README says what that folder is. The contributing guide repeats the permission rule and names the command to run for that package.

## License

Copyright (c) 2026 Kyrazo LLC. All rights reserved.

You may not use, copy, modify, or share any part of this repository for a commercial purpose or a non-commercial purpose unless Kyrazo LLC has given you written permission. See [LICENSE](LICENSE).

Permission requests go to [legal@kyrazo.com](mailto:legal@kyrazo.com).

## Contributing

Contributions are accepted only with prior written permission from Kyrazo LLC. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.
