import { Routes } from '@angular/router';

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
                path: 'about',
                loadComponent: () =>
                    import('@pages/about/about.page').then(
                        (p) => p.AboutPage,
                    ),
                data: {
                    title: 'About Kyrazo',
                    meta: {
                        description:
                            'Learn about Kyrazo, the dedicated webhook infrastructure for enterprise B2B.',
                    },
                },
            },
            {
                path: 'pricing',
                loadComponent: () =>
                    import('@pages/pricing/pricing.page').then(
                        (p) => p.PricingPage,
                    ),
                data: {
                    title: 'Pricing - Kyrazo',
                    meta: {
                        description:
                            'Dedicated webhook infrastructure pricing. Professional plans from $499/month on annual contracts; enterprise BYOC and private cloud deployments with custom billing.',
                    },
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
        data: { animation: 'not-found' },
    },
    {
        path: '**',
        redirectTo: '/not-found',
        pathMatch: 'full',
    },
];
