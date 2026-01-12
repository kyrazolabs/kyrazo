import { RedisSnapshotConsumer } from './consumers/redis-snapshot.consumer';
import { DispatchAggregator } from './aggregators/dispatch.aggregator';
import { IngestAggregator } from './aggregators/ingest.aggregator';
import { Config } from './config';

async function main() {
    const dispatchAgg = new DispatchAggregator();
    const ingestAgg = new IngestAggregator();

    const consumer = new RedisSnapshotConsumer(dispatchAgg, ingestAgg);

    consumer.start();

    // Start health check server using Bun.serve
    Bun.serve({
        port: Config.get().port,
        fetch(req) {
            const url = new URL(req.url);
            if (url.pathname === '/v1/health') {
                return new Response(JSON.stringify({ status: 'ok' }), {
                    headers: { 'Content-Type': 'application/json' },
                });
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
