import SmeeClient from 'smee-client';

const smee = new SmeeClient({
    source: 'https://smee.io/LunAlkvkr8pzUaiK',
    target: 'http://localhost:9000/v1/ingest/paypal/ikYqmyFVCSIojhpfmJVrRaFHuQ',
    logger: console,
});
smee.start();
