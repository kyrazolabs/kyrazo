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

    // Initialize Redis client for health checks
    const redisClient = new Redis(Config.get().redisUrl);

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
                        // Redis health check
                        (async () => {
                            try {
                                const ping = await redisClient.ping();
                                const info = await redisClient.info('server');
                                return {
                                    status: 'healthy',
                                    details: {
                                        connected: true,
                                        ping,
                                        serverInfo: info.split('\r\n').slice(0, 5).join('\n'),
                                    },
                                };
                            } catch (error) {
                                return {
                                    status: 'unhealthy',
                                    details: {
                                        connected: false,
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

    console.log(`📡 Health check server running on port ${Config.get().port}`);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
