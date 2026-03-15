import { logger } from '../configs/logger';

/**
 * Snowflake ID Generator
 *
 * 1 bit reserved (0)
 * 41 bits timestamp (millisecond precision, ~69 years)
 * 10 bits worker ID (handles up to 1024 workers)
 * 12 bits sequence (handles up to 4096 IDs per millisecond per worker)
 */
class Snowflake {
    private readonly epoch: number = 1704067200000; // 2024-01-01T00:00:00Z
    private readonly workerIdBits: number = 10;
    private readonly sequenceBits: number = 12;

    private readonly maxWorkerId: number = -1 ^ (-1 << this.workerIdBits);
    private readonly sequenceMask: number = -1 ^ (-1 << this.sequenceBits);

    private readonly workerIdShift: number = this.sequenceBits;
    private readonly timestampLeftShift: number = this.sequenceBits + this.workerIdBits;

    private lastTimestamp: number = -1;
    private sequence: number = 0;
    private workerId: number;

    constructor(workerId: number = 0) {
        if (workerId > this.maxWorkerId || workerId < 0) {
            throw new Error(`Worker ID must be between 0 and ${this.maxWorkerId}`);
        }
        this.workerId = workerId;
    }

    public generate(): string {
        let timestamp = Date.now();

        if (timestamp < this.lastTimestamp) {
            logger.error('Clock moved backwards. Refusing to generate id');
            throw new Error('Clock moved backwards');
        }

        if (this.lastTimestamp === timestamp) {
            this.sequence = (this.sequence + 1) & this.sequenceMask;
            if (this.sequence === 0) {
                timestamp = this.waitNextMillis(this.lastTimestamp);
            }
        } else {
            this.sequence = 0;
        }

        this.lastTimestamp = timestamp;

        const id =
            BigInt(timestamp - this.epoch) << BigInt(this.timestampLeftShift) |
            BigInt(this.workerId) << BigInt(this.workerIdShift) |
            BigInt(this.sequence);

        return id.toString();
    }

    private waitNextMillis(lastTimestamp: number): number {
        let timestamp = Date.now();
        while (timestamp <= lastTimestamp) {
            timestamp = Date.now();
        }
        return timestamp;
    }
}

export const snowflake = new Snowflake(process.env.WORKER_ID ? parseInt(process.env.WORKER_ID) : 0);
