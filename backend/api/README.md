# API

`backend/api`

HTTP APIs for the platform. The dashboard API serves the customer application, the ingest API receives webhooks, and the integration API is what customers call to manage their setup.

## Contents

### Folders

- [dashboard](dashboard/README.md) — the dashboard API is the management API behind the customer application
- [ingest](ingest/README.md) — the ingest API is the public edge that receives inbound webhooks, checks them, and hands them to the queue
- [integration](integration/README.md) — the integration API is the customer-facing API for sources, endpoints, namespaces, transforms, S3, and ASQS

## License

Copyright (c) 2026 Kyrazo LLC. All rights reserved. You may not use this folder for a commercial or a non-commercial purpose without written permission from Kyrazo LLC. See the [repository license](../../LICENSE).

The rules for changing this folder are in [CONTRIBUTING.md](CONTRIBUTING.md).
