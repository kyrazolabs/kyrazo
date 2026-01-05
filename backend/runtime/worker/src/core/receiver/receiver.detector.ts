import { logger, Source } from "@kyrazo/shared";
import { payPalPipeline } from "./sources/paypal/paypal.pipeline";
import { stripePipeline } from "./sources/stripe/stripe.pipeline";
import { dispatcherHeaders } from "../dispatcher/dispatcher.headers";
import { redisConfig } from "@/config";
import { paypalTransformer } from "./sources/paypal/paypal.transformer";
import { stripeTransformer } from "./sources/stripe/stripe.transformer";
import { dispatcherQueue } from "../dispatcher/dispatcher.queue";

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
            logger.warn("Invalid event structure, skipping");
            return;
        }

        switch (event.source) {
            case "paypal":
                await payPalPipeline.process(event);
                logger.debug(JSON.stringify(event));
                const source = await redisConfig.cache(
                    `source:${event.sourceId}`,
                    async () => {
                        return await Source.findById(event.sourceId).populate(
                            "endpoints",
                        );
                    },
                    60 * 60 * 24,
                );
                if (!source) {
                    logger.error(`Source not found: ${event.sourceId}`);
                    return;
                }

                if (
                    source.forwarding &&
                    source.endpoints &&
                    source.endpoints.length > 0
                ) {
                    logger.debug(
                        `PayPal event ${event.eventId} routing to endpoint`,
                    );

                    const envelope = paypalTransformer.transform(
                        event,
                        source.endpoints,
                    );
                    const headers = await dispatcherHeaders.buildHeaders(
                        envelope,
                        1,
                    );
                    const targets = envelope.targets;

                    if (targets.length === 0) {
                        logger.warn(
                            `No targets found for event ${envelope.id}, skipping dispatch`,
                        );
                        return;
                    }

                    await dispatcherQueue.enqueue(
                        envelope,
                        headers,
                        targets,
                        "endpoint",
                    );

                    logger.debug(`✅ PayPal event processed: ${event.eventId}`);
                }
                break;
            case "stripe":
                await stripePipeline.process(event);
                logger.debug(JSON.stringify(event));
                const stripeSource = await redisConfig.cache(
                    `source:${event.sourceId}`,
                    async () => {
                        return await Source.findById(event.sourceId).populate(
                            "endpoints",
                        );
                    },
                    60 * 60 * 24,
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
                    logger.debug(
                        `Stripe event ${event.eventId} routing to endpoint`,
                    );

                    const envelope = stripeTransformer.transform(
                        event,
                        stripeSource.endpoints,
                    );
                    const headers = await dispatcherHeaders.buildHeaders(
                        envelope,
                        1,
                    );
                    const targets = envelope.targets;

                    if (targets.length === 0) {
                        logger.warn(
                            `No targets found for event ${envelope.id}, skipping dispatch`,
                        );
                        return;
                    }

                    await dispatcherQueue.enqueue(
                        envelope,
                        headers,
                        targets,
                        "endpoint",
                    );

                    logger.debug(`✅ Stripe event processed: ${event.eventId}`);
                }
                break;
            default:
                logger.warn("Unknown event source, skipping");
                break;
        }
    }
}

export const receiverDetector = ReceiverDetector.getInstance();
