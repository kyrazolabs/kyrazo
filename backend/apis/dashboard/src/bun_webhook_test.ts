import fs from 'fs';
import path from 'path';
import pLimit from 'p-limit';
import { performance } from 'perf_hooks';

interface Target {
    target_id: string;
    url: string;
}

interface EventData {
    event_id: string;
    workspace_id: string;
    producer_id: string;
    event_type: string;
    timestamp: string;
    data: Record<string, any>;
    targets: Target[];
    meta: { priority: string; max_retries: number };
}

const EVENTS_FILE = path.resolve('./sources_test.json');
const CONCURRENCY = 50;
const BATCH_SIZE = 50; // عدد الأحداث لكل دفعة عند الكتابة

function* generateEvents(numEvents: number, targetsPerEvent: number) {
    for (let i = 0; i < numEvents; i++) {
        const event: EventData = {
            event_id: `event_${i}_${Date.now()}`,
            workspace_id: `ws_${i % 100}`,
            producer_id: `clis_001`,
            event_type: 'user.created',
            timestamp: new Date().toISOString(),
            data: {
                user_id: `u_${i}`,
                email: `nx${i}@example.com`,
                plan: 'pro',
            },
            targets: Array.from({ length: targetsPerEvent }, (_, j) => ({
                target_id: `tg_${j + 1}`,
                url: 'http://localhost:3003/api/sources/ignore',
            })),
            meta: { priority: 'normal', max_retries: 3 },
        };
        yield event;
    }
}

async function saveEventsStream(numEvents: number, targetsPerEvent: number) {
    const stream = fs.createWriteStream(EVENTS_FILE, { flags: 'w' });
    stream.write('[\n');
    let first = true;
    for (const event of generateEvents(numEvents, targetsPerEvent)) {
        if (!first) stream.write(',\n');
        else first = false;
        stream.write(JSON.stringify(event));
    }
    stream.write('\n]');
    stream.end();
    console.log(`Events saved to ${EVENTS_FILE}`);
}

async function sendEvent(event: EventData) {
    const start = performance.now();
    try {
        const res = await fetch('http://localhost:3003/api/sources', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event),
        });
        const elapsed = performance.now() - start;
        return {
            event_id: event.event_id,
            status: res.status,
            success: res.ok,
            time_ms: elapsed,
        };
    } catch (err: any) {
        const elapsed = performance.now() - start;
        return {
            event_id: event.event_id,
            status: 0,
            success: false,
            time_ms: elapsed,
            error: err.message,
        };
    }
}

async function main() {
    const NUM_EVENTS = 1000;
    const TARGETS_PER_EVENT = 50; // قلل العدد لتجنب استهلاك عالي
    await saveEventsStream(NUM_EVENTS, TARGETS_PER_EVENT);

    // اقرأ JSON بشكل batch وليس كله مرة واحدة
    const rawData = fs.readFileSync(EVENTS_FILE, 'utf-8');
    const events: EventData[] = JSON.parse(rawData);

    const limit = pLimit(CONCURRENCY);
    const startTotal = performance.now();
    for (const event of events) {
        await limit(() => sendEvent(event));
    }
    const totalTime = performance.now() - startTotal;
    console.log(`All events sent in ${(totalTime / 1000).toFixed(2)}s`);
}

main();

import he from 'he';
he.encode('foo © bar ≠ baz 𝌆 qux', {
    useNamedReferences: false,
});
