import { logger } from '../configs/logger';

/**
 * Simple hash function to map a string to a 10-bit integer (0-1023).
 * This ensures that UUIDs or other non-numeric IDs produce a deterministic
 * numeric ID for Snowflake, minimizing collision risk.
 */
function stringTo10BitHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash) % 1024;
}

/**
 * Parse and validate WORKER_ID environment variable.
 * Returns a number between 0 and maxWorkerId (1023).
 *
 * If the value is a valid numeric ID, it is used directly.
 * If it's a UUID or other string, it is hashed into the 10-bit space.
 */
function parseWorkerId(envValue: string | undefined, maxWorkerId: number): number {
    if (!envValue) return 0;

    // 1. Attempt to parse as a direct integer
    const parsed = parseInt(envValue, 10);

    // 2. If it's a valid integer within range [0, 1023], use it
    // We check that the parsed number is exactly what the string represents (to avoid partial matches like "123-uuid")
    if (!isNaN(parsed) && parsed.toString() === envValue && parsed >= 0 && parsed <= maxWorkerId) {
        return parsed;
    }

    // 3. Otherwise (UUID or out-of-range integer), hash it
    const hashed = stringTo10BitHash(envValue);
    logger.info(
        `WORKER_ID/RESOURCE_UUID "${envValue}" is not a valid 0-${maxWorkerId} integer. Hashing to ${hashed} for Snowflake.`
    );
    return hashed;
}

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

// Parse WORKER_ID or COOLIFY_RESOURCE_UUID with validation/hashing
const maxWorkerId = -1 ^ (-1 << 10); // 1023
const workerIdStr = process.env.WORKER_ID || process.env.COOLIFY_RESOURCE_UUID;
const workerId = parseWorkerId(workerIdStr, maxWorkerId);
export const snowflake = new Snowflake(workerId);