### Week 6 (Feb 1 - Feb 4, 2026)

_Released: 2026-02-04_

#### Added

- **Dashboard (Client):** Introduced comprehensive event type suggestions for GitHub, Slack, PayPal, Shopify, Stripe, and Webflow to streamline source configuration.
- **Dashboard (Client):** Added support for selecting HTTP methods (POST, PUT, PATCH) when configuring dispatch targets and ingest endpoints.
- **Backend API (Worker):** Agents now support custom HTTP methods and headers for outgoing dispatch requests, allowing for more flexible system integrations.
- **Backend API (Ingest):** Implemented automated event type extraction from incoming payloads for supported services.
- **Website:** Launched the official Kyrazo blog with full article pages, CMS integration, and Markdown rendering support.

#### Changed

- **Backend API (Integration):** Standardized allowed HTTP methods for targets and endpoints to strictly include POST, PUT, and PATCH.
- **Website:** Enabled server-side rendering (SSR) for all blog routes to improve search engine visibility and initial page load speed.

#### Fixed

- **Runtime (Worker):** Corrected a logic error in webhook delivery status where 404 responses were erroneously marked as successfully delivered.

#### Security

- **Backend API (Integration):** Enhanced security by removing sensitive authentication secrets from source responses and providing a dedicated update endpoint.

#### Performance

- **Website:** Optimized metadata and sitemap structures for better indexing and discoverability.
