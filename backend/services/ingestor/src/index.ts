import { RedisSnapshotConsumer } from './consumers/redis-snapshot.consumer';
import { RedisStreamConsumer } from './consumers/redis-stream.consumer';
import { DispatchAggregator } from './aggregators/dispatch.aggregator';
import { IngestAggregator } from './aggregators/ingest.aggregator';
import { Config } from './config';
import Redis from 'ioredis';

async function main() {
    const { clickhouseConfig } = await import('@kyrazo/shared');
    await clickhouseConfig.connect();

    const dispatchAgg = new DispatchAggregator();

    const ingestAgg = new IngestAggregator();

    const snapshotConsumer = new RedisSnapshotConsumer(dispatchAgg, ingestAgg);
    snapshotConsumer.start();

    const streamConsumer = new RedisStreamConsumer();
    await streamConsumer.start();

    // Initialize Redis clients for health checks
    const snapshotRedis = new Redis(Config.get().snapshotRedisUrl);
    const streamRedis = new Redis(Config.get().streamRedisUrl);

    // Start health check server using Bun.serve
    Bun.serve({
        port: Config.get().port,
        async fetch(req) {
            const url = new URL(req.url);
            if (url.pathname === '/v1/health') {
                try {
                    // Check all database services in parallel
                    const [clickhouse, redis] = await Promise.all([
                        // ClickHouse health check
                        (async () => {
                            try {
                                const { clickhouseConfig } = await import('@kyrazo/shared');

                                const client = clickhouseConfig.getClient();
                                if (!client) throw new Error('ClickHouse client not available');
                                await client.query({ query: 'SELECT 1', format: 'JSONEachRow' });
                                return {
                                    status: 'healthy',
                                    details: {
                                        connected: true,
                                        database: 'ClickHouse',
                                    },
                                };
                            } catch (error) {
                                return {
                                    status: 'unhealthy',
                                    details: {
                                        connected: false,
                                        database: 'ClickHouse',
                                        error:
                                            error instanceof Error
                                                ? error.message
                                                : 'Unknown error',
                                    },
                                };
                            }
                        })(),
                        // Redis health checks
                        (async () => {
                            try {
                                const [snapshotPing, streamPing] = await Promise.all([
                                    snapshotRedis.ping(),
                                    streamRedis.ping(),
                                ]);
                                return {
                                    status: 'healthy',
                                    details: {
                                        snapshot: { connected: true, ping: snapshotPing },
                                        stream: { connected: true, ping: streamPing },
                                    },
                                };
                            } catch (error) {
                                return {
                                    status: 'unhealthy',
                                    details: {
                                        error:
                                            error instanceof Error
                                                ? error.message
                                                : 'Unknown error',
                                    },
                                };
                            }
                        })(),
                    ]);

                    // Determine overall health status
                    const allHealthy = [clickhouse, redis].every(
                        service => service.status === 'healthy'
                    );

                    return new Response(
                        JSON.stringify({
                            success: allHealthy,
                            message: allHealthy
                                ? 'All services are healthy'
                                : 'Some services are unhealthy',
                            services: {
                                clickhouse,
                                redis,
                                timestamp: new Date().toISOString(),
                            },
                            version: '1.0.0',
                        }),
                        {
                            status: allHealthy ? 200 : 503,
                            headers: { 'Content-Type': 'application/json' },
                        }
                    );
                } catch (error) {
                    return new Response(
                        JSON.stringify({
                            success: false,
                            message: 'Health check failed',
                            error: error instanceof Error ? error.message : 'Unknown error',
                            timestamp: new Date().toISOString(),
                            version: '1.0.0',
                        }),
                        {
                            status: 500,
                            headers: { 'Content-Type': 'application/json' },
                        }
                    );
                }
            }
            return new Response('Not Found', { status: 404 });
        },
    });

    console.info(`📡 Health check server running on port ${Config.get().port}`);

    // Graceful shutdown
    let isShuttingDown = false;
    const shutdown = async (signal: string) => {
        if (isShuttingDown) return;
        isShuttingDown = true;
        console.info(`\n🛑 Received ${signal}, shutting down...`);

        // Force exit after 5 seconds if cleanup hangs
        setTimeout(() => {
            console.warn('Force closing after timeout');
            process.exit(1);
        }, 5000).unref();

        try {
            await streamConsumer.stop();
            
            console.info('Cleanup complete. Exiting.');
            process.exit(0);
        } catch (error) {
            console.error('Error during shutdown:', error);
            process.exit(1);
        }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
