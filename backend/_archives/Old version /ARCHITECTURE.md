workers/src/
├── consumers/
│   ├── events/
│   │   ├── event.consumer.ts          # Main event consumer (current)
│   │   ├── event.router.ts            # Routes events to specific handlers
│   │   └── event.dispatcher.ts        # Dispatches to target URLs
│   │
│   └── jobs/
│       ├── event.processor.ts         # Processes events from queue
│       └── delivery.handler.ts        # Handles delivery logic
│
├── services/
│   ├── delivery/
│   │   ├── delivery.service.ts       # Core delivery service
│   │   ├── retry.service.ts          # Retry logic with backoff
│   │   └── rate.limiter.ts           # Rate limiting per service
│   │
│   ├── transformers/
│   │   ├── base.transformer.ts       # Base transformation logic
│   │   ├── payload.transformer.ts    # Payload transformation
│   │   └── signature.generator.ts    # Webhook signature generation
│   │
│   └── validators/
│       ├── base.validator.ts         # Base validation logic
│       ├── payload.validator.ts      # Payload validation
│       └── security.validator.ts     # Security validation
│
├── handlers/
│   ├── services/
│   │   ├── index.ts                  # Service handler registry
│   │   ├── paypal/
│   │   │   ├── paypal.handler.ts     # PayPal-specific logic
│   │   │   ├── paypal.transformer.ts # PayPal payload transformation
│   │   │   └── paypal.validator.ts   # PayPal validation
│   │   ├── stripe/
│   │   │   ├── stripe.handler.ts     # Stripe-specific logic
│   │   │   ├── stripe.transformer.ts # Stripe payload transformation
│   │   │   └── stripe.validator.ts   # Stripe validation
│   │   ├── github/
│   │   │   ├── github.handler.ts     # GitHub-specific logic
│   │   │   ├── github.transformer.ts # GitHub payload transformation
│   │   │   └── github.validator.ts   # GitHub validation
│   │   └── shopify/
│   │       ├── shopify.handler.ts    # Shopify-specific logic
│   │       ├── shopify.transformer.ts# Shopify payload transformation
│   │       └── shopify.validator.ts  # Shopify validation
│   │
│   └── targets/
│       ├── target.manager.ts         # Manages target URLs
│       ├── target.validator.ts       # Validates target URLs
│       └── target.health.ts          # Health checks for targets
│
├── processors/
│   ├── event.processor.ts            # Main event processing
│   ├── delivery.processor.ts         # Delivery processing
│   └── batch.processor.ts            # Batch processing for efficiency
│
├── middleware/
│   ├── auth.middleware.ts            # Authentication middleware
│   ├── rate.limit.middleware.ts      # Rate limiting middleware
│   ├── security.middleware.ts        # Security middleware
│   └── logging.middleware.ts         # Logging middleware
│
├── utils/
│   ├── http.client.ts                # HTTP client for deliveries
│   ├── retry.utils.ts                # Retry utilities
│   ├── crypto.utils.ts               # Cryptographic utilities
│   └── logger.ts                     # Logging utilities
│
├── config/
│   ├── services/
│   │   ├── index.ts                  # Service configurations
│   │   ├── paypal.config.ts          # PayPal configuration
│   │   ├── stripe.config.ts          # Stripe configuration
│   │   ├── github.config.ts          # GitHub configuration
│   │   └── shopify.config.ts         # Shopify configuration
│   │
│   └── delivery/
│       ├── delivery.config.ts        # Delivery configuration
│       ├── retry.config.ts           # Retry configuration
│       └── timeout.config.ts         # Timeout configuration
│
├── types/
│   ├── services/
│   │   ├── index.ts                  # Service type definitions
│   │   ├── paypal.types.ts           # PayPal types
│   │   ├── stripe.types.ts           # Stripe types
│   │   ├── github.types.ts           # GitHub types
│   │   └── shopify.types.ts          # Shopify types
│   │
│   ├── delivery/
│   │   ├── delivery.types.ts         # Delivery types
│   │   ├── retry.types.ts            # Retry types
│   │   └── response.types.ts         # Response types
│   │
│   └── events/
│       ├── event.types.ts            # Event types
│       └── payload.types.ts          # Payload types
│
├── constants/
│   ├── services/
│   │   ├── index.ts                  # Service constants
│   │   ├── paypal.constants.ts       # PayPal constants
│   │   ├── stripe.constants.ts       # Stripe constants
│   │   └── github.constants.ts       # GitHub constants
│   │
│   └── delivery/
│       ├── delivery.constants.ts     # Delivery constants
│       └── retry.constants.ts        # Retry constants
│
├── repositories/
│   ├── delivery.repo.ts              # Delivery repository
│   ├── event.repo.ts                 # Event repository
│   └── target.repo.ts                # Target repository
│
└── core/
    ├── event.bus.ts                  # Event bus for internal communication
    ├── service.registry.ts           # Service registry
    └── metrics.collector.ts          # Metrics collection
