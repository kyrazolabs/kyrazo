import { RedisSnapshotConsumer } from './consumers/redis-snapshot.consumer';
import { DispatchAggregator } from './aggregators/dispatch.aggregator';
import { IngestAggregator } from './aggregators/ingest.aggregator';

async function main() {
    const dispatchAgg = new DispatchAggregator();
    const ingestAgg = new IngestAggregator();

    const consumer = new RedisSnapshotConsumer(dispatchAgg, ingestAgg);

    consumer.start();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
