import { config, natsConfig, redisConfig } from "@/config";
import {
    PublishConsumer,
    publishConsumer,
} from "@/consumers/events/publish.consumer";
import {
    ReceiveConsumer,
    receiveConsumer,
} from "@/consumers/events/receive.consumer";
import {
    RouteConsumer,
    routeConsumer,
} from "@/consumers/events/route.consumer";
import { WebhookType } from "@/types/events";
import { encryptionUtils, logger, validateMessage } from "@/utils";
import {
    AckPolicy,
    DeliverPolicy,
    JetStreamClient,
    JetStreamManager,
    NatsConnection,
    StringCodec,
} from "nats";

/**
 * @title Worker Consumer
 * @description Simple and professional NATS JetStream consumer for webhook events.
 */
const CONCURRENCY = 5;
export class WorkerConsumer {
    private sc = StringCodec();
    private nc: NatsConnection;
    private js: JetStreamClient;
    private jsm: JetStreamManager;

    private publishConsumer: PublishConsumer;
    private receiveConsumer: ReceiveConsumer;
    private routeConsumer: RouteConsumer;

    constructor(
        private readonly workspaceId: string,
        private readonly workerId: string
    ) {
        this.nc = natsConfig.getConnection();
        this.js = this.nc.jetstream();
        this.jsm = natsConfig.getJetStreamManager();

        this.publishConsumer = new PublishConsumer();
        this.receiveConsumer = new ReceiveConsumer();
        this.routeConsumer = new RouteConsumer();
    }

    async start(): Promise<void> {
        await this.publishConsumer.start();
        await this.receiveConsumer.start();
        await this.routeConsumer.start();

        const streamName = `ws_${this.workspaceId}`;
        const subject = `workspace.${this.workspaceId}.events`;
        const durableName = `worker_${this.workspaceId}`;
        const consumerName = `worker_${this.workspaceId}_${this.workerId}`;

        try {
            await this.jsm.consumers.add(streamName, {
                name: consumerName,
                durable_name: durableName,
                ack_policy: AckPolicy.Explicit,
                ack_wait: 30_000_000_000, // 30 seconds
                max_ack_pending: 5,
                max_deliver: 5, // retry 5 times
                deliver_policy: DeliverPolicy.All,
                filter_subject: subject,
            });

            logger.info(
                `Consumer ${consumerName} ready for workspace ${this.workspaceId}`
            );
        } catch (err: any) {
            if (!err.message.includes("already exists")) {
                throw err;
            }
        }
        // Consume messages
        const consumer = await this.js.consumers.get(streamName, durableName);
        const messages = await consumer.consume({ max_messages: -1 });

        let running = 0;
        const pending: any[] = [];

        const schedule = () => {
            if (running >= CONCURRENCY || pending.length === 0) return;
            const msg = pending.shift();
            running++;

            this.process(msg)
                .catch((err) => logger.error("Processing error", err))
                .finally(() => {
                    running--;
                    schedule();
                });
        };

        for await (const msg of messages) {
            pending.push(msg);
            schedule();
        }
    }

    private async process(msg: any): Promise<void> {
        const subscriptionId = msg.subject.split(".")[1]; // Extract from sub.{subscriptionId}.events

        if (!subscriptionId) {
            logger.warn("Missing subscriptionId");
            await msg.term();
            return;
        }

        const subscription = await redisConfig.cache(
            `workspace:subscription:${this.workspaceId}`,
            async () => {
                return await SubscriptionService.getSubscription(
                    subscriptionId
                );
            },
            60 * 60 * 24
        );
        if (!subscription) {
            logger.warn(`Subscription ${subscriptionId} not found`);
            await msg.term();
            return;
        }

        try {
            // Parse the message
            const data = JSON.parse(this.sc.decode(msg.data));

            // Validate message structure
            if (!validateMessage(data)) {
                logger.warn(
                    `Invalid message format for subscription ${subscriptionId}`
                );
                return;
            }

            const { event, signature, timestamp, nonce } = data;
            const isValid = encryptionUtils.verifySignature(
                JSON.stringify(event),
                signature,
                config.encryptions.key!,
                timestamp,
                nonce,
                5 * 60 * 1000
            );

            if (!isValid) {
                logger.warn(
                    "❌ Invalid or expired signature, ignoring message",
                    {
                        eventId: event.eventId,
                        webhookType: event.webhookType,
                        signatureLength: signature?.length,
                        timestamp,
                        nonceLength: nonce?.length,
                        currentTime: Date.now(),
                        timeDiff: Math.abs(Date.now() - timestamp),
                        maxAge: 5 * 60 * 1000,
                        keyLength: config.encryptions.key?.length,
                        keyPreview:
                            config.encryptions.key?.substring(0, 8) + "...",
                    }
                );
                msg.ack();
                return;
            }

            // Get subscription
            const subscription = await SubscriptionService.getSubscription(
                subscriptionId
            );
            if (!subscription) {
                logger.warn(`Subscription ${subscriptionId} not found`);
                return;
            }

            // Check soft rate limits
            const rateLimitResult = await rateLimiter.checkLimits(
                subscriptionId,
                subscription.limits
            );
            if (!rateLimitResult.allowed) {
                logger.warn(
                    `Rate limit exceeded for subscription ${subscriptionId}: ${rateLimitResult.reason}`
                );

                // Acknowledge message even if rate limited
                msg.respond();
                return;
            }

            // Route based on subject pattern instead of webhookType
            if (msg.subject.startsWith("webhooks.publish.")) {
                logger.info(
                    `📤 Routing publish event ${event.eventId} to publish consumer`
                );
                await publishConsumer.processPublishEvent(event);
            } else if (msg.subject.startsWith("webhooks.receive.")) {
                logger.info(
                    `📥 Routing receive event ${event.eventId} to receive consumer`
                );
                await receiveConsumer.processReceiveEvent(event);
            } else if (msg.subject.startsWith("webhooks.forward.")) {
                logger.info(
                    `🔄 Routing forward event ${event.eventId} to route consumer`
                );
                await routeConsumer.processRouteEvent(event);
            } else {
                logger.warn(
                    `❓ Unknown subject pattern (${msg.subject}), acknowledging without processing`
                );
            }

            // Acknowledge message
            msg.ack();
            logger.debug(`   ✅ Message processed and acknowledged`);
            logger.debug("---");
        } catch (error) {
            logger.error(
                `Error processing message for subscription ${subscriptionId}`,
                error as Error
            );
            msg.nak();
        }
    }

    async stop(): Promise<void> {
        await this.publishConsumer.stop();
        await this.receiveConsumer.stop();
        await this.routeConsumer.stop();
    }
}

export const workerConsumer = new WorkerConsumer(
    process.env.WS_ID!,
    config.worker.id
);
