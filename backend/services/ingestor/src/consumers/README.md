# Consumers

`backend/services/ingestor/src/consumers`

This folder holds workers that take work off a queue for the ClickHouse ingestor.

## Contents

### Files

- `redis-snapshot.consumer.ts` — exports `RedisSnapshotConsumer`
- `redis-stream.consumer.ts` — exports `RedisStreamConsumer`

## License

Copyright (c) 2026 Kyrazo LLC. All rights reserved. You may not use this folder for a commercial or a non-commercial purpose without written permission from Kyrazo LLC. See the [repository license](../../../../../LICENSE).

The rules for changing this folder are in [CONTRIBUTING.md](CONTRIBUTING.md).
