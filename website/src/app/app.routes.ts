import { Routes } from '@angular/router';
import { pricingResolver } from '@core/resolvers/pricing.resolver';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('@pages/landing/landing-layout').then(
                (p) => p.LandingLayoutComponent,
            ),
        children: [
            {
                path: '',
                loadComponent: () =>
                    import('@pages/landing/home/landing.page').then(
                        (p) => p.LandingPage,
                    ),
                data: {
                    title: 'Reliable Webhooks as a Service',
                    meta: {
                        description:
                            'Simplify your event architecture with Kyrazo. A managed webhook platform offering signature verification, automatic retries, and dedicated workers.',
                        keywords:
                            'Webhooks as a Service, Managed Webhook Infrastructure, Webhook Relay, Dedicated Workers, Webhook Isolation, Kyrazo, Webhook Retry',
                    },
                },
            },
            {
                path: 'legal/privacy-policy',
                loadComponent: () =>
                    import('@pages/legal/policies/privacy/privacy.page').then(
                        (p) => p.PrivacyPage,
                    ),
                data: {
                    title: 'Privacy Policy - Kyrazo',
                    meta: {
                        description:
                            "Read Kyrazo's Privacy Policy to understand how we collect, use, and protect your data.",
                    },
                },
            },
            {
                path: 'legal/refund-policy',
                loadComponent: () =>
                    import('@pages/legal/policies/refund/refund.page').then(
                        (p) => p.RefundPage,
                    ),
                data: {
                    title: 'Refund Policy - Kyrazo',
                    meta: {
                        description:
                            "Kyrazo's Refund Policy. Understand our terms for refunds and cancellations.",
                    },
                },
            },
            {
                path: 'legal/terms-of-service',
                loadComponent: () =>
                    import('@pages/legal/terms-of-service/terms-of-service').then(
                        (p) => p.TermsOfService,
                    ),
                data: {
                    title: 'Terms of Service - Kyrazo',
                    meta: {
                        description:
                            "Kyrazo's Terms of Service. Read the rules and regulations for using our platform.",
                    },
                },
            },
            {
                path: 'legal/gdpr',
                loadComponent: () =>
                    import('@pages/legal/policies/gdpr/gdpr.page').then(
                        (p) => p.GDPRPage,
                    ),
                data: {
                    title: 'GDPR Compliance - Kyrazo',
                    meta: {
                        description:
                            "Kyrazo's commitment to GDPR and data protection. Learn about your rights and how we handle your data.",
                    },
                },
            },
            {
                path: 'legal/dpa',
                loadComponent: () =>
                    import('@pages/legal/policies/dpa/dpa.page').then(
                        (p) => p.DPAPage,
                    ),
                data: {
                    title: 'Data Processing Agreement - Kyrazo',
                    meta: {
                        description:
                            "Kyrazo's Data Processing Agreement (DPA). Understand how we process personal data on your behalf.",
                    },
                },
            },
            {
                path: 'blog',
                loadChildren: () =>
                    import('./pages/blog/blog.routes').then(
                        (m) => m.BLOG_ROUTES,
                    ),
                data: {
                    title: 'Blog',
                    meta: {
                        description:
                            'Kyrazo Blog - Latest updates and articles.',
                    },
                },
            },
            {
                path: 'features/ingest',
                loadComponent: () =>
                    import('@pages/features/ingest/ingest.page').then(
                        (p) => p.IngestPage,
                    ),
                data: {
                    title: 'Secure Webhook Ingestion & Verification',
                    meta: {
                        description:
                            'Securely receive webhooks from any provider. Kyrazo handles HMAC signature verification, payload normalization, and event logging automatically.',
                        keywords:
                            'Webhook Ingestion, HMAC Verification, Webhook Receiver, Secure Webhooks, Stripe Webhooks, GitHub Webhooks, Event Normalization',
                    },
                },
            },
            {
                path: 'features/dispatch',
                loadComponent: () =>
                    import('@pages/features/dispatch/dispatch.page').then(
                        (p) => p.DispatchPage,
                    ),
                data: {
                    title: 'Reliable Webhook Dispatch & Retry Logic',
                    meta: {
                        description:
                            'Guarantee webhook delivery with Kyrazo. Automatic retries with exponential backoff, dead-letter queues, and event scheduling.',
                        keywords:
                            'Webhook Dispatch, Webhook Retries, Exponential Backoff, Dead Letter Queue, Reliability, Event Scheduling, Webhook Delivery',
                    },
                },
            },
            {
                path: 'features/architecture',
                loadComponent: () =>
                    import('@pages/features/architecture/architecture.page').then(
                        (p) => p.ArchitecturePage,
                    ),
                data: {
                    title: 'Dedicated Workers Architecture',
                    meta: {
                        description:
                            'Eliminate noisy neighbor issues with Kyrazo’s dedicated workers. Isolated infrastructure ensures consistent latency and high throughput for your webhooks.',
                        keywords:
                            'Dedicated Workers, Webhook Isolation, Noisy Neighbor Problem, High Throughput Webhooks, Predictable Latency, Enterprise Webhooks',
                    },
                },
            },
            // {
            //     path: 'features/privacy-by-design',
            //     loadComponent: () =>
            //         import(
            //             '@pages/features/privacy-by-design/privacy-by-design.page'
            //         ).then((p) => p.PrivacyByDesignPage),
            //     data: {
            //         title: 'Privacy by Design - Kyrazo',
            //         meta: {
            //             description:
            //                 'Learn how Kyrazo implements privacy-first engineering in its webhook relay infrastructure.',
            //         },
            //     },
            // },
            // {
            //     path: 'features/early-adopter',
            //     loadComponent: () =>
            //         import(
            //             '@pages/features/early-adopter/early-adopter.page'
            //         ).then((p) => p.EarlyAdopterPage),
            //     data: {
            //         title: 'Early Adopter Program - Kyrazo',
            //         meta: {
            //             description:
            //                 'Join the Kyrazo Early Adopter program and get direct access to our founding engineering team.',
            //         },
            //     },
            // },
            {
                path: 'pricing',
                loadComponent: () =>
                    import('@pages/pricing/pricing.page').then(
                        (p) => p.PricingPage,
                    ),
                resolve: { plans: pricingResolver },
                data: {
                    title: 'Pricing - Kyrazo',
                    meta: {
                        description:
                            'Flexible and transparent pricing for managed webhook infrastructure. From free starter plans to mission-critical enterprise solutions.',
                    },
                },
            },
        ],
    },
    {
        path: 'changelogs',
        loadComponent: () =>
            import('@pages/changelogs/changelogs.page').then(
                (p) => p.ChangelogsPage,
            ),
        data: {
            title: 'Changelogs & Updates',
            meta: {
                description:
                    'Stay up to date with the latest features, improvements, and bug fixes in Kyrazo. Track our evolution as we build the best platform for SaaS engineering.',
                keywords:
                    'Kyrazo Changelog, SaaS Updates, Product News, Engineering Blog',
            },
        },
    },
    {
        path: 'not-found',
        loadComponent: () =>
            import('@shared/ui/not-found/not-found.component').then(
                (p) => p.NotFoundComponent,
            ),
        data: { animation: 'not-found' },
    },
    {
        path: '**',
        redirectTo: '/not-found',
        pathMatch: 'full',
    },
];
