import Stripe from 'stripe';
import { config } from './app';

export const stripe = new Stripe(config.stripe.secretKey, {
    apiVersion: '2025-08-27.basil',
    typescript: true,
});

export const stripeConfig = {
    secretKey: config.stripe.secretKey,
    sourceSecret: config.stripe.sourceSecret,
    baseUrl: config.stripe.baseUrl,
    adminEmail: config.stripe.adminEmail,
};

export default stripe;
