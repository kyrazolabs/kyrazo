import { Routes } from '@angular/router';
import {
    ABOUT_SCHEMA,
    HOME_SCHEMA,
    PRICING_SCHEMA,
    webPageSchema,
} from '@core/seo/page-schemas';

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
                    title: 'Dedicated Webhook Infrastructure for Enterprise B2B',
                    meta: {
                        description:
                            'Kyrazo delivers dedicated webhook infrastructure for enterprise B2B: physically isolated compute, databases, and delivery workers with zero noisy-neighbor performance degradation and zero shared database memory.',
                        keywords:
                            'Dedicated Webhook Infrastructure, Enterprise Webhooks, Webhooks as a Service, Isolated Infrastructure, Noisy Neighbor, BYOC, Private Cloud Webhooks, Kyrazo',
                    },
                    schema: HOME_SCHEMA,
                },
            },
            {
                path: 'legal/privacy-policy',
                loadComponent: () =>
                    import('@pages/legal/policies/privacy/privacy.page').then(
                        (p) => p.PrivacyPage,
                    ),
                data: {
                    title: 'Privacy Policy',
                    meta: {
                        description:
                            "Read Kyrazo's Privacy Policy to understand how we collect, use, and protect your data.",
                    },
                    schema: webPageSchema(
                        'Privacy Policy',
                        '/legal/privacy-policy',
                        "Read Kyrazo's Privacy Policy to understand how we collect, use, and protect your data.",
                    ),
                },
            },
            {
                path: 'legal/refund-policy',
                loadComponent: () =>
                    import('@pages/legal/policies/refund/refund.page').then(
                        (p) => p.RefundPage,
                    ),
                data: {
                    title: 'Refund Policy',
                    meta: {
                        description:
                            "Kyrazo's Refund Policy. Understand our terms for refunds and cancellations.",
                    },
                    schema: webPageSchema(
                        'Refund Policy',
                        '/legal/refund-policy',
                        "Kyrazo's Refund Policy. Understand our terms for refunds and cancellations.",
                    ),
                },
            },
            {
                path: 'legal/terms-of-service',
                loadComponent: () =>
                    import('@pages/legal/terms-of-service/terms-of-service').then(
                        (p) => p.TermsOfService,
                    ),
                data: {
                    title: 'Terms of Service',
                    meta: {
                        description:
                            "Kyrazo's Terms of Service. Read the rules and regulations for using our platform.",
                    },
                    schema: webPageSchema(
                        'Terms of Service',
                        '/legal/terms-of-service',
                        "Kyrazo's Terms of Service. Read the rules and regulations for using our platform.",
                    ),
                },
            },
            {
                path: 'legal/gdpr',
                loadComponent: () =>
                    import('@pages/legal/policies/gdpr/gdpr.page').then(
                        (p) => p.GDPRPage,
                    ),
                data: {
                    title: 'GDPR Compliance',
                    meta: {
                        description:
                            "Kyrazo's commitment to GDPR and data protection. Learn about your rights and how we handle your data.",
                    },
                    schema: webPageSchema(
                        'GDPR Compliance',
                        '/legal/gdpr',
                        "Kyrazo's commitment to GDPR and data protection. Learn about your rights and how we handle your data.",
                    ),
                },
            },
            {
                path: 'legal/dpa',
                loadComponent: () =>
                    import('@pages/legal/policies/dpa/dpa.page').then(
                        (p) => p.DPAPage,
                    ),
                data: {
                    title: 'Data Processing Agreement',
                    meta: {
                        description:
                            "Kyrazo's Data Processing Agreement (DPA). Understand how we process personal data on your behalf.",
                    },
                    schema: webPageSchema(
                        'Data Processing Agreement',
                        '/legal/dpa',
                        "Kyrazo's Data Processing Agreement (DPA). Understand how we process personal data on your behalf.",
                    ),
                },
            },
            {
                path: 'about',
                loadComponent: () =>
                    import('@pages/about/about.page').then(
                        (p) => p.AboutPage,
                    ),
                data: {
                    title: 'About',
                    meta: {
                        description:
                            'Learn about Kyrazo, the dedicated webhook infrastructure for enterprise B2B.',
                    },
                    schema: ABOUT_SCHEMA,
                },
            },
            {
                path: 'pricing',
                loadComponent: () =>
                    import('@pages/pricing/pricing.page').then(
                        (p) => p.PricingPage,
                    ),
                data: {
                    title: 'Pricing',
                    meta: {
                        description:
                            'Dedicated webhook infrastructure pricing. Professional plans from $499/month on annual contracts; enterprise BYOC and private cloud deployments with custom billing.',
                    },
                    schema: PRICING_SCHEMA,
                },
            },
        ],
    },

    {
        path: 'not-found',
        loadComponent: () =>
            import('@shared/ui/not-found/not-found.component').then(
                (p) => p.NotFoundComponent,
            ),
        data: {
            animation: 'not-found',
            title: 'Page Not Found',
            meta: {
                description: 'The page you requested could not be found.',
                robots: 'noindex, nofollow',
            },
        },
    },
    {
        path: '**',
        redirectTo: '/not-found',
        pathMatch: 'full',
    },
];
