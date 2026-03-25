import { Redis, type RedisOptions } from 'ioredis';
import * as fs from 'fs';
import { Config } from '../config';
import { batchWriter } from '../db/clickhouse/batch.writer';
import { logger, type SQLDeliveryAttempt, type SQLIngestEvent } from '@kyrazo/shared';

export class RedisStreamConsumer {
    private redis: Redis;
    private timer?: Timer;
    private running = false;

    public readonly dispatchStream = 'stream:dispatch-events';
    public readonly ingestStream = 'stream:ingest-events';
    public readonly consumerGroup = 'group:clickhouse-ingestor';
    public readonly consumerName = `consumer:${Math.random().toString(36).substring(7)}`;

    constructor(redisClient?: Redis) {
        if (redisClient) {
            this.redis = redisClient;
        } else {
            const options: RedisOptions = {};
            if (Config.get().streamRedisTls) {
                options.tls = {
                    rejectUnauthorized: true,
                    checkServerIdentity: () => undefined,
                };
                if (Config.get().streamRedisCaFile && fs.existsSync(Config.get().streamRedisCaFile!)) {
                    options.tls.ca = fs.readFileSync(Config.get().streamRedisCaFile!);
                }
                if (Config.get().streamRedisCertFile && fs.existsSync(Config.get().streamRedisCertFile!)) {
                    options.tls.cert = fs.readFileSync(Config.get().streamRedisCertFile!);
                }
                if (Config.get().streamRedisKeyFile && fs.existsSync(Config.get().streamRedisKeyFile!)) {
                    options.tls.key = fs.readFileSync(Config.get().streamRedisKeyFile!);
                }
            }
            this.redis = new Redis(Config.get().streamRedisUrl, options);
        }
    }

    async start() {
        if (this.running) return;
        this.running = true;
        console.info('🚀 Redis Stream Consumer started...');

        // Ensure consumer groups exist
        try {
            await this.redis.xgroup(
                'CREATE',
                this.dispatchStream,
                this.consumerGroup,
                '0',
                'MKSTREAM'
            );
        } catch (e: any) {
            if (!e.message.includes('BUSYGROUP')) {
                logger.error(`Error creating consumer group for ${this.dispatchStream}:`, e);
                throw e;
            }
        }

        try {
            await this.redis.xgroup(
                'CREATE',
                this.ingestStream,
                this.consumerGroup,
                '0',
                'MKSTREAM'
            );
        } catch (e: any) {
            if (!e.message.includes('BUSYGROUP')) {
                logger.error(`Error creating consumer group for ${this.ingestStream}:`, e);
                throw e;
            }
        }

        // Start processing loops
        this.processStream(this.dispatchStream, async messages => {
            const dataBatch: SQLDeliveryAttempt[] = [];
            for (const msg of messages) {
                try {
                    dataBatch.push(JSON.parse(msg.payload));
                } catch (err: any) {
                    logger.error(`Failed to parse payload for dispatch message ${msg.id}:`, err);
                    await this.redis.xack(this.dispatchStream, this.consumerGroup, msg.id);
                }
            }
            if (dataBatch.length > 0) {
                await batchWriter.saveBatchedDeliveryAttempts(dataBatch);
            }
        });

        this.processStream(this.ingestStream, async messages => {
            const dataBatch: SQLIngestEvent[] = [];
            for (const msg of messages) {
                try {
                    dataBatch.push(JSON.parse(msg.payload));
                } catch (err: any) {
                    logger.error(`Failed to parse payload for ingest message ${msg.id}:`, err);
                    await this.redis.xack(this.ingestStream, this.consumerGroup, msg.id);
                }
            }
            if (dataBatch.length > 0) {
                await batchWriter.saveBatchedIngestEvents(dataBatch);
            }
        });
    }

    private processingPromises = new Set<Promise<void>>();

    public async stop() {
        console.error('🛑 Stopping Redis Stream Consumer...');
        this.running = false;

        if (this.processingPromises.size > 0) {
            console.info(
                `⏳ Waiting for ${this.processingPromises.size} active batches to finish processing...`
            );
            await Promise.allSettled(Array.from(this.processingPromises));
        }

        // Optionally disconnect to immediately abort blocking calls
        this.redis.disconnect();
        console.info('✅ Redis Stream Consumer stopped.');
    }

    private async processStream(streamName: string, processFn: (messages: any[]) => Promise<void>) {
        const loop = async () => {
            if (!this.running) return;

            try {
                const idleMs = Config.get().streamMaxIdleMs;
                const batchCount = Config.get().streamBatchCount;
                const maxRetries = Config.get().streamMaxRetries;

                // 1. Reclaim pending messages older than the idle threshold
                // The argument '0-0' is the starting ID to scan from the PEL
                const claimResults = await this.redis.xautoclaim(
                    streamName,
                    this.consumerGroup,
                    this.consumerName,
                    idleMs,
                    '0-0',
                    'COUNT',
                    batchCount
                );

                const reclaimedMessages: any[] = [];
                // claimResults format: [nextStartId, messages, deletedMessageIds]
                if (claimResults && claimResults[1]) {
                    const claimed = claimResults[1] as any[];
                    if (claimed.length > 0) {
                        for (const msg of claimed) {
                            // Elements of 'claimed' are arrays: [id, [key1, val1, ...]]
                            const msgId = msg[0];
                            const deliveryCount = await this.getDeliveryCount(streamName, msgId);
                            if (deliveryCount > maxRetries) {
                                logger.warn(
                                    `Message ${msgId} in ${streamName} exceeded max retries. Dead-lettering and acknowledging.`
                                );
                                // In a real system, you might move this to a DLQ stream here
                                await this.redis.xack(streamName, this.consumerGroup, msgId);
                            } else {
                                reclaimedMessages.push(msg);
                            }
                        }
                    }
                }

                // 2. Read new messages with a block time
                // The > ID means we want new messages that have not been delivered to other consumers in this group
                const results = await this.redis.xreadgroup(
                    'GROUP',
                    this.consumerGroup,
                    this.consumerName,
                    'COUNT',
                    batchCount,
                    'BLOCK',
                    Config.get().streamBlockMs,
                    'STREAMS',
                    streamName,
                    '>'
                );

                const newMessages: any[] = [];
                if (results && results.length > 0) {
                    const resultData = results[0] as [string, any[]];
                    if (resultData[1] && resultData[1].length > 0) {
                        newMessages.push(...resultData[1]);
                    }
                }

                const allMessages = [...reclaimedMessages, ...newMessages];

                if (allMessages.length > 0) {
                    const activeWork = (async () => {
                        try {
                            const parsedMessages = allMessages.map((result: any) => {
                                const id = result[0] as string;
                                const rawData = result[1] as string[];
                                const data: Record<string, string> = {};
                                for (let i = 0; i < rawData.length; i += 2) {
                                    const key = rawData[i];
                                    if (key !== undefined) {
                                        data[key] = rawData[i + 1] as string;
                                    }
                                }
                                return { id, ...data };
                            });

                            // Process the batch
                            await processFn(parsedMessages);

                            // Acknowledge processed messages
                            const idsToAck = parsedMessages.map((msg: any) => msg.id);
                            await this.redis.xack(streamName, this.consumerGroup, ...idsToAck);
                        } catch (error: any) {
                            logger.error(`Failed to process batch for ${streamName}:`, error);
                        }
                    })();

                    this.processingPromises.add(activeWork);
                    await activeWork;
                    this.processingPromises.delete(activeWork);
                }
            } catch (error: any) {
                if (!this.running || error.message?.includes('Connection is closed')) {
                    // Expected error during shutdown
                    return;
                }

                // If the stream or consumer group no longer exists (e.g. Redis was flushed/restarted),
                // re-create the group and continue — the next iteration will pick up new messages.
                if (error.message?.includes('NOGROUP')) {
                    logger.warn(
                        `Consumer group missing for ${streamName}, recreating...`
                    );
                    try {
                        await this.redis.xgroup(
                            'CREATE',
                            streamName,
                            this.consumerGroup,
                            '$', // Start from newest messages (don't replay old ones)
                            'MKSTREAM'
                        );
                        logger.info(`Recreated consumer group for ${streamName}`);
                    } catch (groupErr: any) {
                        if (!groupErr.message?.includes('BUSYGROUP')) {
                            logger.error(`Failed to recreate consumer group for ${streamName}:`, groupErr);
                        }
                    }
                    // Short backoff before retrying
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } else {
                    logger.error(`Error in stream processing loop for ${streamName}: ${error.message}`, {
                        stack: error.stack,
                        command: error.command
                    });
                    await new Promise(resolve => setTimeout(resolve, 5000)); // Backoff on error
                }
            }

            // Continue loop
            if (this.running) {
                setImmediate(loop);
            }
        };

        // Start the loop
        loop();
    }

    private async getDeliveryCount(streamName: string, messageId: string): Promise<number> {
        // XPENDING returns info about pending messages
        // Format: xpending stream group start end count
        const pendingInfo = (await this.redis.xpending(
            streamName,
            this.consumerGroup,
            messageId,
            messageId,
            1
        )) as any[];

        if (pendingInfo && pendingInfo.length > 0) {
            // First (and only) result for this specific ID.
            // Format of each pending message: [message_id, consumer, idle_time, delivery_count]
            const deliveryCount = pendingInfo[0][3] as number;
            return Math.max(0, deliveryCount - 1); // deliveryCount includes the current active delivery, we want retries
        }

        return 0;
    }
}
