import { SITE_URL, DEFAULT_OG_IMAGE } from '@core/seo/seo.config';

export const HOME_SCHEMA = [
    {
        '@type': 'SoftwareApplication',
        name: 'Kyrazo',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Web',
        url: `${SITE_URL}/`,
        image: DEFAULT_OG_IMAGE,
        description:
            'Dedicated webhook infrastructure for enterprise B2B. Physically isolated compute, databases, and delivery workers with zero noisy-neighbor degradation.',
        publisher: { '@id': `${SITE_URL}/#organization` },
        offers: {
            '@type': 'Offer',
            priceCurrency: 'USD',
            price: '499',
        },
    },
    {
        '@type': 'FAQPage',
        mainEntity: [
            {
                '@type': 'Question',
                name: 'What is Kyrazo?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Kyrazo is dedicated webhook infrastructure for enterprise B2B. Each customer gets physically isolated compute, databases, and delivery workers to ingest, process, and dispatch events — with no noisy-neighbor sharing.',
                },
            },
            {
                '@type': 'Question',
                name: 'Is Kyrazo self-serve?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'No. Access is provisioned after a discovery meeting and an executed Order Form. There is no public signup or in-product checkout.',
                },
            },
            {
                '@type': 'Question',
                name: 'How much does Professional cost?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Professional is $499 per month on an annual contract. Enterprise is custom billed ($1,000–$5,000+ per month). A one-time onboarding and security setup fee ($500–$1,500) applies to new dedicated deployments.',
                },
            },
            {
                '@type': 'Question',
                name: 'Do you offer a free trial?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'No. A discovery meeting is free and does not provision servers. Dedicated infrastructure is spun up only after an Order Form and the one-time onboarding fee ($500–$1,500), which is non-refundable once provisioning starts.',
                },
            },
            {
                '@type': 'Question',
                name: 'What happens if a destination endpoint is unavailable?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'If a delivery attempt fails, Kyrazo retries based on configurable retry policies. Failed attempts are recorded to help with troubleshooting and observability.',
                },
            },
            {
                '@type': 'Question',
                name: 'Do I need to modify my existing code?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Often no. After provisioning you receive a dedicated hostname — a Kyrazo subdomain or your own domain — for the dashboard and API. Point existing webhooks at that ingest URL. There is no shared api.kyrazo.com or public signup. SDKs are available for Node.js, Python, and Go.',
                },
            },
        ],
    },
];

export const ABOUT_SCHEMA = {
    '@type': 'AboutPage',
    name: 'About Kyrazo',
    url: `${SITE_URL}/about/`,
    description:
        'Learn about Kyrazo, the dedicated webhook infrastructure for enterprise B2B.',
};

export const PRICING_SCHEMA = {
    '@type': 'WebPage',
    name: 'Pricing',
    url: `${SITE_URL}/pricing/`,
    description:
        'Dedicated webhook infrastructure pricing for enterprise B2B. Isolated compute, database, and delivery workers on annual or custom contracts.',
    mainEntity: {
        '@type': 'Offer',
        name: 'Kyrazo Professional',
        priceCurrency: 'USD',
        price: '499',
        url: `${SITE_URL}/pricing/`,
    },
};

export function webPageSchema(
    name: string,
    path: string,
    description: string,
): Record<string, unknown> {
    return {
        '@type': 'WebPage',
        name,
        url: `${SITE_URL}${path.endsWith('/') ? path : `${path}/`}`,
        description,
    };
}
