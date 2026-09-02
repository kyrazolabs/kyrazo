import { SITE_URL, DEFAULT_OG_IMAGE } from '@core/seo/seo.config';

export const HOME_SCHEMA = [
    {
        '@type': 'SoftwareApplication',
        name: 'Kyrazo',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Web',
        url: SITE_URL,
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
                    text: 'Kyrazo is a webhook gateway and event orchestration platform designed to help teams reliably receive, process, and route events between systems.',
                },
            },
            {
                '@type': 'Question',
                name: 'How does Kyrazo handle traffic spikes?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Kyrazo is built with scalability in mind. It uses asynchronous processing and horizontally scalable workers to handle increased event volume while maintaining stable ingestion.',
                },
            },
            {
                '@type': 'Question',
                name: 'Is my data protected during transmission?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes. All data is transmitted over secure TLS connections. Kyrazo also supports request verification mechanisms, such as signatures, to help ensure payload integrity.',
                },
            },
            {
                '@type': 'Question',
                name: 'What happens if a destination endpoint is unavailable?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'If a delivery attempt fails, Kyrazo can retry delivery based on configurable retry policies. Failed attempts are recorded to help with troubleshooting and observability.',
                },
            },
            {
                '@type': 'Question',
                name: 'Do I need to modify my existing code?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'In many cases, no changes are required. You can point your existing webhooks to Kyrazo’s ingestion endpoint. For more advanced use cases, SDKs are available for Node.js, Python, and Go.',
                },
            },
        ],
    },
];

export const ABOUT_SCHEMA = {
    '@type': 'AboutPage',
    name: 'About Kyrazo',
    url: `${SITE_URL}/about`,
    description:
        'Learn about Kyrazo, the dedicated webhook infrastructure for enterprise B2B.',
};

export const PRICING_SCHEMA = {
    '@type': 'WebPage',
    name: 'Pricing',
    url: `${SITE_URL}/pricing`,
    description:
        'Dedicated webhook infrastructure pricing for enterprise B2B. Isolated compute, database, and delivery workers on annual or custom contracts.',
    mainEntity: {
        '@type': 'Offer',
        name: 'Kyrazo Professional',
        priceCurrency: 'USD',
        price: '499',
        url: `${SITE_URL}/pricing`,
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
        url: `${SITE_URL}${path}`,
        description,
    };
}
