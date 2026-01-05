# Subscriptions & Billing Domain Implementation

This document describes the production-ready Subscriptions & Billing domain implementation for the Hookify API.

## Overview

The billing system provides comprehensive subscription management with the following features:

- **Plans Management**: CRUD operations for subscription plans (admin-only)
- **Subscription Lifecycle**: Create, activate, cancel, and change plans
- **Usage Tracking**: Monitor and enforce plan limits
- **Stripe Integration**: Payment processing and webhooks
- **Background Jobs**: Automated renewals and usage aggregation
- **Event Publishing**: NATS events for system integration

## Architecture

```
Controllers → Services → Repositories → DTOs
    ↓
  Models (MongoDB)
    ↓
Background Jobs (BullMQ)
    ↓
Event Publishing (NATS)
```

## API Endpoints

### Plans (Admin Only)
```
POST   /v1/plans                      # Create plan
GET    /v1/plans                      # List plans
GET    /v1/plans/:slug                # Get plan by slug
PATCH  /v1/plans/:id                  # Update plan
DELETE /v1/plans/:id                  # Delete plan
```

### Subscriptions
```
POST   /v1/subscriptions              # Create subscription
GET    /v1/subscriptions              # List workspace subscriptions
GET    /v1/subscriptions/:id          # Get subscription
POST   /v1/subscriptions/:id/change-plan  # Change plan
POST   /v1/subscriptions/:id/cancel      # Cancel subscription
GET    /v1/subscriptions/limits       # Check usage limits
```

## Database Models

### Plan Model
- **name**: Plan display name
- **slug**: Unique identifier
- **priceCents**: Price in cents
- **currency**: Currency code (USD, EUR, GBP)
- **interval**: Billing interval (month/year)
- **features**: JSON object with plan features
- **limits**: Usage limits (events per minute/day, max concurrent)
- **stripePriceId**: Stripe price ID mapping
- **isActive**: Plan availability status

### Subscription Model
- **workspaceId**: Associated workspace
- **userId**: Subscription owner
- **planId**: Current plan
- **planSnapshot**: Embedded plan data at subscription time
- **status**: active | trial | past_due | canceled | incomplete
- **stripeSubscriptionId**: Stripe subscription ID
- **currentPeriodStart/End**: Billing period dates
- **trialEnd**: Trial expiration date
- **quantity**: Number of seats/units
- **metadata**: Additional subscription data

## Key Features

### 1. Plan Snapshots
Subscriptions store a complete snapshot of the plan at creation time to ensure billing consistency even if plans change.

### 2. Usage Limits
- **eventsPerSecond**: Rate limiting per second
- **eventsPerMonth**: Monthly usage cap
- **maxProjects**: Maximum projects per workspace
- **maxMembers**: Maximum team members per workspace
- **maxConnectors**: Maximum webhook connectors
- **maxIntegrations**: Maximum integrations
- **maxConcurrent**: Maximum concurrent connections

### 3. Subscription States
- **incomplete**: Created but not paid/activated
- **trial**: In trial period
- **active**: Fully active subscription
- **past_due**: Payment failed
- **canceled**: User canceled

### 4. Security & Authorization
- Workspace membership validation
- Role-based access (admin for plan management)
- Rate limiting on all endpoints
- Input validation with Zod schemas

## Environment Variables

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
BILLING_BASE_URL=http://localhost:3003
BILLING_ADMIN_EMAIL=admin@hookify.com

# Redis/BullMQ (existing)
REDIS_HOST=localhost
REDIS_PORT=6379

# NATS (existing)
NATS_SERVERS=nats://localhost:4222
```

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install stripe bullmq
   ```

2. **Configure Stripe**
   - Create Stripe account
   - Set up webhook endpoints for events
   - Configure products and prices

3. **Database Setup**
   - Models auto-create indexes on first run
   - Ensure MongoDB connection is configured

4. **Start Services**
   ```bash
   # Start the API server
   npm run dev

   # Start background jobs (separate process)
   # Implementation needed for job scheduling
   ```

## Testing

### Manual Testing
```bash
# Create a plan (requires admin auth)
curl -X POST http://localhost:3003/v1/plans \
  -H "Authorization: Bearer <admin-token>" \
  -H "x-workspace-id: <workspace-id>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pro Plan",
    "slug": "pro",
    "priceCents": 2900,
    "currency": "USD",
    "interval": "month",
    "features": {"webhooks": true, "analytics": true},
    "limits": {
      "eventsPerMinute": 1000,
      "eventsPerDay": 50000,
      "maxConcurrent": 10
    }
  }'

# List plans (public)
curl http://localhost:3003/v1/plans
```

### Stripe Webhook Testing
```bash
# Use Stripe CLI for webhook testing
stripe listen --forward-to localhost:3003/v1/payments/webhook
```

## Future Extensions

### Payments Module
- Stripe checkout session creation
- Webhook event processing
- Customer management
- Invoice handling

### Billing Module
- Invoice generation
- Usage-based billing
- Prorated changes
- Billing portal integration

### Background Jobs
- Subscription renewals
- Usage aggregation
- Failed payment retries
- Trial expiration handling

### Analytics & Monitoring
- Usage metrics
- Revenue tracking
- Churn analysis
- Billing event logging

## Production Considerations

- **Idempotency**: All critical operations support idempotency keys
- **Error Handling**: Comprehensive error responses with proper HTTP codes
- **Logging**: Structured logging for debugging and monitoring
- **Data Retention**: TTL indexes for temporary data cleanup
- **Scalability**: Efficient database queries with proper indexing
- **Security**: Input validation, authentication, and authorization

## File Structure

```
src/
├── config/
│   └── stripe.ts                    # Stripe client config
├── modules/
│   ├── plans/                       # Plan management
│   │   ├── plan.controller.ts
│   │   ├── plan.service.ts
│   │   ├── plan.repo.ts
│   │   ├── plan.dto.ts
│   │   └── plan.routes.ts
│   └── subscriptions/               # Subscription management
│       ├── subscription.controller.ts
│       ├── subscription.service.ts
│       ├── subscription.repo.ts
│       ├── subscription.dto.ts
│       └── subscription.routes.ts
├── shared/
│   ├── models/                      # Database models
│   │   ├── plan.model.ts
│   │   ├── subscription.model.ts
│   │   ├── customer.model.ts
│   │   ├── invoice.model.ts
│   │   ├── usage.model.ts
│   │   └── webhook_events_processed.model.ts
│   └── types/
│       └── billing.types.ts         # TypeScript interfaces
└── core/
    └── jobs/
        └── billing.jobs.ts          # Background job definitions
```

This implementation provides a solid foundation for a production billing system with room for extension as business needs grow.