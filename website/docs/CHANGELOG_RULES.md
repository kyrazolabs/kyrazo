# Changelog Rules

This document outlines the rules and structure for generating changelog entries for the Kyrazo platform.

## Project Overview

Kyrazo is a distributed SaaS platform composed of multiple repositories and services:

1.  **Website Repository (kyrazo.com)**
    - Landing pages
    - Legal pages
    - Blog system

2.  **Client Dashboard (dash.kyrazo.com)**
    - User dashboard UI
    - Configuration, analytics visualization, and account management

3.  **Backend Platform (multiple APIs)**
    - Dashboard APIs
    - Ingest API
    - Integration API
    - Scheduler API

4.  **Runtime Layer**
    - **Agent:**
        - Installed once per server
        - Manages lifecycle of workers (start, stop, scale, terminate)
        - Allocates workers strictly based on customer plan limits
    - **Workers:**
        - Each worker runs on exactly ONE CPU core (single-core only)
        - No multi-core or shared-core execution
        - Workers are isolated per customer
        - Example: Customer A → 2 workers, Customer B → 4 workers

5.  **Services**
    - **Analytics Service:**
        - Central analytics pipeline
        - Collects events and metrics from ALL workers
        - Processes and stores pre-aggregated, ready-to-read data
        - API responses require NO filtering or transformation
    - **Mail Queue Service:**
        - Manages email delivery queues
        - Handles daily reports, weekly reports, and scheduled notifications

6.  **Additional Repositories**
    - SDKs repository
    - Documentation repository

## Changelog Purpose

The goal is to write changelog entries that:

- Are accurate.
- Are concise but informative.
- Follow the official Changelog Structure.
- Clearly communicate impact to developers, operators, and customers.

## Release Schedule

- Changelogs can be published at any time during the week.
- There is no fixed release window; document changes as they are released.

## General Rules

1.  Always write in English.
2.  Never invent features, fixes, or changes.
3.  Base entries **ONLY** on provided commits, diffs, PR descriptions, or release notes.
4.  Do **NOT** include marketing language.
5.  Do **NOT** include implementation trivia unless it affects users or operators.
6.  Use clear, professional, neutral technical language.
7.  Each changelog entry must clearly state:
    - **What** changed.
    - **Where** it changed (service / repo / component).
    - **Who** is affected (if applicable).

## Changelog Structure

Follow this structure **EXACTLY**. Only include sections that have actual entries.

- Added
- Changed
- Fixed
- Removed
- Deprecated
- Security
- Performance
- Infrastructure

## Scope Awareness

Always identify the scope of each change:

- Website
- Dashboard (Client)
- Backend API (specify which API)
- Runtime (Agent or Worker)
- Analytics Service
- Mail Queue Service
- SDKs
- Documentation
- Infrastructure

**Never mix scopes in a single entry.**

## Specific Domain Rules

### Runtime-Specific Rules

- Any change affecting the following must be explicitly labeled as **Runtime-related**:
    - Worker lifecycle
    - CPU core allocation
    - Customer isolation
    - Scaling logic
- Always mention whether the change affects the **Agent**, **Worker**, or **Both**.

### Analytics Rules

- If a change impacts analytics data, specify whether it affects:
    - Ingestion
    - Processing
    - Aggregation
    - Exposure via API
- Never imply real-time guarantees unless explicitly stated.

### Mail Queue Rules

- Email-related changes must specify:
    - Queue behavior
    - Scheduling behavior
    - Delivery guarantees (if changed)

## Output Format

- Use Markdown.
- Use bullet points under each section.
- One logical change per bullet point.
- No emojis.
- No bold exaggeration.
- No speculative statements.

## Example Entry

### Week 12 (March 18 - March 24, 2024)

_Released: 2024-03-20_

#### Added

- **Dashboard (Client):** Introduced new "Audit Log" view in Settings to track team activity.
- **Backend API (Ingest):** Added `X-Kyrazo-Source` header validation to block malformed requests.

#### Changed

- **Runtime (Worker):** Optimized memory allocation for idle workers, reducing footprint by ~15%.
- **Analytics Service:** Aggregated metrics are now stored in 5-minute buckets instead of 1-minute to improve query performance.

#### Fixed

- **Website:** Fixed broken link on the "Terms of Service" footer.
- **Mail Queue Service:** Resolved an issue where retries were not exponential for 5xx errors.

---

**Note:** Act as a strict, detail-oriented release engineer. If information is insufficient to write a correct changelog entry, omit the entry rather than guess.
