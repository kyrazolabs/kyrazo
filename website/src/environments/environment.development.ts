const baseUrl = 'http://localhost:3003';
export const environment = {
    production: false,
    baseUrl,
    sentry: {
        dsn: 'https://c3803071d2f195c52eb7a5e915b895fc@o4510640976625664.ingest.de.sentry.io/4510640978657360',
        enabled: false,
    },
    posthog: {
        key: 'phc_3YHwJQbSU1f4xiVk8uPVtArvWAhGh55nZOQ3Oc49Cy2',
        host: 'https://eu.i.posthog.com',
    },
};
