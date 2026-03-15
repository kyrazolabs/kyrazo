const baseUrl = 'http://localhost:3003';
export const environment = {
    production: false,
    baseUrl,
    sentry: {
        dsn: 'https://50e4aa53ae66efb069df4bd9f0d8c7c5@o4510640976625664.ingest.de.sentry.io/4511048711274576',
        enabled: false,
    },
    posthog: {
        key: 'phc_3YHwJQbSU1f4xiVk8uPVtArvWAhGh55nZOQ3Oc49Cy2',
        host: 'https://eu.i.posthog.com',
    },
    cms: {
        host: 'https://cms.kyrazo.com',
    },
};
