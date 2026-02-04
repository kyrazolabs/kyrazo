import { redisConfig } from '@/config';
import { logger, Source } from '@kyrazo/shared';

import { paypalTransformer } from './sources/paypal/paypal.transformer';
import { stripeTransformer } from './sources/stripe/stripe.transformer';
import { githubTransformer } from './sources/github/github.transformer';
import { shopifyTransformer } from './sources/shopify/shopify.transformer';
import { slackTransformer } from './sources/slack/slack.transformer';
import { webflowTransformer } from './sources/webflow/webflow.transformer';

import { payPalPipeline } from './sources/paypal/paypal.pipeline';
import { stripePipeline } from './sources/stripe/stripe.pipeline';
import { githubPipeline } from './sources/github/github.pipeline';
import { shopifyPipeline } from './sources/shopify/shopify.pipeline';
import { slackPipeline } from './sources/slack/slack.pipeline';
import { webflowPipeline } from './sources/webflow/webflow.pipeline';

import { dispatcherHeaders } from '../dispatcher/dispatcher.headers';
import { dispatcherQueue } from '../dispatcher/dispatcher.queue';

export class ReceiverDetector {
    private static instance: ReceiverDetector;
    constructor() {}

    public static getInstance(): ReceiverDetector {
        if (!ReceiverDetector.instance) {
            ReceiverDetector.instance = new ReceiverDetector();
        }
        return ReceiverDetector.instance;
    }

    public async detect(event: any): Promise<void> {
        if (!event.source) {
            logger.warn('Invalid event structure, skipping');
            return;
        }

        switch (event.source) {
            case 'paypal':
                await payPalPipeline.process(event);
                logger.debug(JSON.stringify(event));
                const source = await redisConfig.cache(
                    `source:${event.sourceId}`,
                    async () => {
                        return await Source.findById(event.sourceId).populate('endpoints');
                    },
                    60 * 60 * 24
                );
                if (!source) {
                    logger.error(`Source not found: ${event.sourceId}`);
                    return;
                }

                if (source.forwarding && source.endpoints && source.endpoints.length > 0) {
                    logger.debug(`PayPal event ${event.eventId} routing to endpoint`);

                    const envelope = paypalTransformer.transform(event, source.endpoints);
                    const headers = await dispatcherHeaders.buildHeaders(envelope, 1);
                    const targets = envelope.targets;

                    if (targets.length === 0) {
                        logger.warn(`No targets found for event ${envelope.id}, skipping dispatch`);
                        return;
                    }

                    await dispatcherQueue.enqueue(envelope, headers, targets, 'endpoint');

                    logger.debug(`✅ PayPal event processed: ${event.eventId}`);
                }
                break;
            case 'stripe':
                await stripePipeline.process(event);
                logger.debug(JSON.stringify(event));
                const stripeSource = await redisConfig.cache(
                    `source:${event.sourceId}`,
                    async () => {
                        return await Source.findById(event.sourceId).populate('endpoints');
                    },
                    60 * 60 * 24
                );
                if (!stripeSource) {
                    logger.error(`Source not found: ${event.sourceId}`);
                    return;
                }

                if (
                    stripeSource.forwarding &&
                    stripeSource.endpoints &&
                    stripeSource.endpoints.length > 0
                ) {
                    logger.debug(`Stripe event ${event.eventId} routing to endpoint`);

                    const envelope = stripeTransformer.transform(event, stripeSource.endpoints);
                    const headers = await dispatcherHeaders.buildHeaders(envelope, 1);
                    const targets = envelope.targets;

                    if (targets.length === 0) {
                        logger.warn(`No targets found for event ${envelope.id}, skipping dispatch`);
                        return;
                    }

                    await dispatcherQueue.enqueue(envelope, headers, targets, 'endpoint');

                    logger.debug(`✅ Stripe event processed: ${event.eventId}`);
                }
                break;
            case 'github':
                await githubPipeline.process(event);
                logger.debug(JSON.stringify(event));
                const githubSource = await redisConfig.cache(
                    `source:${event.sourceId}`,
                    async () => {
                        return await Source.findById(event.sourceId).populate('endpoints');
                    },
                    60 * 60 * 24
                );
                if (!githubSource) {
                    logger.error(`Source not found: ${event.sourceId}`);
                    return;
                }

                if (
                    githubSource.forwarding &&
                    githubSource.endpoints &&
                    githubSource.endpoints.length > 0
                ) {
                    logger.debug(`GitHub event ${event.eventId} routing to endpoint`);

                    const envelope = githubTransformer.transform(event, githubSource.endpoints);
                    const headers = await dispatcherHeaders.buildHeaders(envelope, 1);
                    const targets = envelope.targets;

                    if (targets.length === 0) {
                        logger.warn(`No targets found for event ${envelope.id}, skipping dispatch`);
                        return;
                    }

                    await dispatcherQueue.enqueue(envelope, headers, targets, 'endpoint');

                    logger.debug(`✅ GitHub event processed: ${event.eventId}`);
                }
                break;
            case 'shopify':
                await shopifyPipeline.process(event);
                logger.debug(JSON.stringify(event));
                const shopifySource = await redisConfig.cache(
                    `source:${event.sourceId}`,
                    async () => {
                        return await Source.findById(event.sourceId).populate('endpoints');
                    },
                    60 * 60 * 24
                );
                if (!shopifySource) {
                    logger.error(`Source not found: ${event.sourceId}`);
                    return;
                }

                if (
                    shopifySource.forwarding &&
                    shopifySource.endpoints &&
                    shopifySource.endpoints.length > 0
                ) {
                    logger.debug(`Shopify event ${event.eventId} routing to endpoint`);

                    const envelope = shopifyTransformer.transform(event, shopifySource.endpoints);
                    const headers = await dispatcherHeaders.buildHeaders(envelope, 1);
                    const targets = envelope.targets;

                    if (targets.length === 0) {
                        logger.warn(`No targets found for event ${envelope.id}, skipping dispatch`);
                        return;
                    }

                    await dispatcherQueue.enqueue(envelope, headers, targets, 'endpoint');

                    logger.debug(`✅ Shopify event processed: ${event.eventId}`);
                }
                break;
            case 'slack':
                await slackPipeline.process(event);
                logger.debug(JSON.stringify(event));
                const slackSource = await redisConfig.cache(
                    `source:${event.sourceId}`,
                    async () => {
                        return await Source.findById(event.sourceId).populate('endpoints');
                    },
                    60 * 60 * 24
                );
                if (!slackSource) {
                    logger.error(`Source not found: ${event.sourceId}`);
                    return;
                }

                if (
                    slackSource.forwarding &&
                    slackSource.endpoints &&
                    slackSource.endpoints.length > 0
                ) {
                    logger.debug(`Slack event ${event.eventId} routing to endpoint`);

                    const envelope = slackTransformer.transform(event, slackSource.endpoints);
                    const headers = await dispatcherHeaders.buildHeaders(envelope, 1);
                    const targets = envelope.targets;

                    if (targets.length === 0) {
                        logger.warn(`No targets found for event ${envelope.id}, skipping dispatch`);
                        return;
                    }

                    await dispatcherQueue.enqueue(envelope, headers, targets, 'endpoint');

                    logger.debug(`✅ Slack event processed: ${event.eventId}`);
                }
                break;
            case 'webflow':
                await webflowPipeline.process(event);
                logger.debug(JSON.stringify(event));
                const webflowSource = await redisConfig.cache(
                    `source:${event.sourceId}`,
                    async () => {
                        return await Source.findById(event.sourceId).populate('endpoints');
                    },
                    60 * 60 * 24
                );
                if (!webflowSource) {
                    logger.error(`Source not found: ${event.sourceId}`);
                    return;
                }

                if (
                    webflowSource.forwarding &&
                    webflowSource.endpoints &&
                    webflowSource.endpoints.length > 0
                ) {
                    logger.debug(`Webflow event ${event.eventId} routing to endpoint`);

                    const envelope = webflowTransformer.transform(event, webflowSource.endpoints);
                    const headers = await dispatcherHeaders.buildHeaders(envelope, 1);
                    const targets = envelope.targets;

                    if (targets.length === 0) {
                        logger.warn(`No targets found for event ${envelope.id}, skipping dispatch`);
                        return;
                    }

                    await dispatcherQueue.enqueue(envelope, headers, targets, 'endpoint');

                    logger.debug(`✅ Webflow event processed: ${event.eventId}`);
                }
                break;
            default:
                logger.warn('Unknown event source, skipping');
                break;
        }
    }
}

export const receiverDetector = ReceiverDetector.getInstance();
