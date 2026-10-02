# Services

`backend/services`

Long-running processes that sit behind the APIs: the load balancer, orchestrator, ingestor, mailer, and billing cron.

## Contents

### Folders

- [crons](crons/README.md) — scheduled jobs
- [ingestor](ingestor/README.md) — the ingestor reads events off the stream and writes them into ClickHouse for history, analytics, and billing
- [loadbalancer](loadbalancer/README.md) — the Rust load balancer spreads inbound traffic across API instances and exposes health checks
- [mail](mail/README.md) — mailQ sends product email
- [orchestrator](orchestrator/README.md) — the orchestrator coordinates worker placement and talks to Coolify for deployment actions

## License

Copyright (c) 2026 Kyrazo LLC. All rights reserved. You may not use this folder for a commercial or a non-commercial purpose without written permission from Kyrazo LLC. See the [repository license](../../LICENSE).

The rules for changing this folder are in [CONTRIBUTING.md](CONTRIBUTING.md).
