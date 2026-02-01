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
                    title: 'Kyrazo – Reliable Webhook Management, Automation & Event Dispatch for Developers',
                    meta: {
                        description:
                            'Kyrazo is a scalable and secure webhook as a service platform. Receive, send, and automate events from Stripe, GitHub, and more with high reliability and low latency. Perfect for SaaS products and development teams.',
                        keywords:
                            'webhook service, webhook management, webhook automation, Stripe webhooks, GitHub webhooks, SaaS integration, event-driven architecture, reliable webhooks, developer tools, automated webhook delivery, low-latency webhook platform, webhook retries and failures handling, webhook SDK for Node.js',
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
                    title: 'Privacy Policy',
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
                    title: 'Refund Policy',
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
                    title: 'Terms of Service',
                    meta: {
                        description:
                            "Kyrazo's Terms of Service. Read the rules and regulations for using our platform.",
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
