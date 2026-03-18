import { config, natsConfig, redisConfig } from "@/config";
import { dispatcherPipeline } from "@/core/dispatcher/dispatcher.pipeline";
import { receiverPipeline } from "@/core/receiver/receiver.pipeline";
import { validateMessage } from "@/utils";
import {
    AckPolicy,
    DeliverPolicy,
    StringCodec,
    type JetStreamClient,
    type JetStreamManager,
    type NatsConnection,
} from "nats";
import { logger, signatureCrypto } from "@kyrazo/shared";
import { SubscriptionService } from "@/services/mongo/subscription";
import { env } from "@/app/worker.env";

/**
 * @title Worker Consumer
 * @description Simple and professional NATS JetStream consumer for webhook events.
 */

class Semaphore {
    private value = 0;
    private waiting: Array<() => void> = [];
    constructor(private readonly limit: number) {}
    async acquire(): Promise<void> {
        if (this.value < this.limit) {
            this.value++;
            return;
        }
        await new Promise<void>((res) => this.waiting.push(res));
        this.value++;
    }
    release(): void {
        this.value--;
        const next = this.waiting.shift();
        if (next) next();
    }
}
export class WorkerConsumer {
    private sc = StringCodec();
    private nc: NatsConnection;
    private js: JetStreamClient;
    private jsm: JetStreamManager;
    private sem = new Semaphore(env.worker.CONCURRENCY);

    constructor(private readonly workspaceId: string) {
        this.nc = natsConfig.getConnection();
        this.js = this.nc.jetstream();
        this.jsm = natsConfig.getJetStreamManager();
    }

    async start(): Promise<void> {
        const streamName = "EVENTS";
        const subject = `workspace.${this.workspaceId}.plan.${this.workspaceId === "*" ? "free" : "*"}.events.>`;
        const durableName = `worker_${this.workspaceId === "*" ? "shared" : this.workspaceId}`;

        try {
            await this.jsm.consumers.add(streamName, {
                durable_name: durableName,
                ack_policy: AckPolicy.Explicit,
                max_ack_pending: env.worker.MAX_ACK_PENDING,
                max_deliver: 5, // retry 5 times
                backoff: [
                    1000 * 1000 * 1000, // 1s
                    2000 * 1000 * 1000, // 2s
                    5000 * 1000 * 1000, // 5s
                    10000 * 1000 * 1000, // 10s
                    30000 * 1000 * 1000, // 50s
                ],
                ack_wait: 30 * 1000 * 1000 * 1000, // 30 seconds
                deliver_policy: DeliverPolicy.All,
                filter_subject: subject,
            });

            logger.info(`Consumer ${durableName} ready`);
        } catch (err: any) {
            if (!err.message.includes("already exists")) {
                logger.error("Failed to create consumer", err);
                throw err;
            }
            logger.info("Consumer already exists, continuing");
        }
        // Consume messages
        const consumer = await this.js.consumers.get(streamName, durableName);

        while (true) {
            try {
                const messages = await consumer.fetch({
                    max_messages: env.worker.BATCH_SIZE,
                    expires: Math.max(env.worker.FETCH_TIMEOUT_MS || 0, 1000),
                });

                const batch: any[] = [];
                for await (const m of messages) {
                    batch.push(m);
                }
                if (batch.length === 0) {
                    // idle backoff
                    await this.sleep(100);
                    continue;
                }
                // Process batch with concurrency limited by semaphore
                const promises = batch.map((msg) =>
                    this.processWithSemaphore(msg),
                );
                // do not await all to completion to allow next fetch (rely on max_ack_pending)
                // but we await here to at least process current batch's promises kicking off.
                await Promise.all(
                    promises.map((p) => p.catch(() => undefined)),
                );

                // let running = 0;
                // const pending: any[] = [];

                // const schedule = () => {
                //     if (running >= CONCURRENCY || pending.length === 0) return;
                //     const msg = pending.shift();
                //     running++;

                //     this.process(msg)
                //         .catch((err) => logger.error("Processing error", err))
                //         .finally(() => {
                //             running--;
                //             schedule();
                //         });
                // };

                // for await (const msg of batch) {
                //     pending.push(msg);
                //     schedule();
                // }
            } catch (error) {
                logger.error("Fetch loop error", error as Error);
                // small backoff on error
                await this.sleep(100);
            }
        }
    }

    private async processWithSemaphore(msg: any): Promise<void> {
        await this.sem.acquire();
        // start processing; ensure release in finally
        (async () => {
            try {
                await this.process(msg);
                // successful processing -> ack
                try {
                    await msg.ack();
                } catch (ackErr) {
                    logger.warn("ACK failed", ackErr);
                }
            } catch (procErr) {
                logger.error("Processing error", procErr as Error);
                // Nak to trigger retry/backoff on server side
                try {
                    await msg.nak();
                } catch (nakErr) {
                    logger.warn("NAK failed", nakErr);
                }
            } finally {
                this.sem.release();
            }
        })();
    }

    private async process(msg: any): Promise<void> {
        const parts = msg.subject.split(".");
        const workspaceId = parts[1];

        if (!workspaceId) {
            logger.warn("Missing workspaceId on subject", msg.subject);
            try {
                // terminal: not recoverable
                await msg.term();
            } catch {}
            return;
        }

        const subscription =
            await SubscriptionService.getSubscription(workspaceId);
        if (!subscription) {
            logger.warn(`Subscription ${workspaceId} not found`);
            await msg.term();
            return;
        }

        try {
            // Parse the message
            const decoded = this.sc.decode(msg.data);
            const data = JSON.parse(decoded);

            // Validate message structure
            if (!validateMessage(data)) {
                logger.warn(
                    `Invalid message format for subscription ${workspaceId}`,
                );
                return;
            }

            const { event, signature, timestamp, nonce } = data;
            const isValid = signatureCrypto.verifySignature(
                JSON.stringify(event),
                signature,
                timestamp,
                nonce,
                5 * 60 * 1000,
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
                    },
                );
                msg.ack();
                return;
            }

            // Get subscription
            const subscription =
                await SubscriptionService.getSubscription(workspaceId);
            if (!subscription) {
                logger.warn(`Subscription ${workspaceId} not found`);
                return;
            }

            // Route based on subject pattern instead of webhookType
            logger.info(`Subject: ${msg.subject}`);
            const rawData = this.sc.decode(msg.data);
            logger.info(`DEBUG: Raw NATS Data: ${rawData}`);

            if (msg.subject.includes(`events.publish.`)) {
                logger.info(
                    `📤 Routing publish event ${event.eventId} to publish consumer`,
                );
                await dispatcherPipeline.process(event);
            } else if (msg.subject.includes("events.receive.")) {
                logger.info(
                    `📥 Routing receive event ${event.eventId} to receive consumer`,
                );
                logger.info(
                    `[WorkerConsumer] Received Event Keys: ${Object.keys(event).join(", ")}`,
                );
                logger.info(
                    `[WorkerConsumer] Received sourceId: ${event.sourceId}`,
                );
                await receiverPipeline.process(event);
            } else {
                logger.warn(
                    `❓ Unknown subject pattern (${msg.subject}), acknowledging without processing`,
                );
            }

            // Acknowledge message
            msg.ack();
        } catch (error: any) {
            logger.error(
                `Error processing message for subscription ${workspaceId}`,
                {
                    errStr: String(error),
                    message: error?.message,
                    name: error?.name,
                    stack: error?.stack,
                }
            );
            msg.nak();
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
