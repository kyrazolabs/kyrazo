/**
 * Kyrazo Transformer Type Definitions
 */

/**
 * The incoming event payload.
 */
declare interface EventPayload {
    /** Unique event ID */
    eventId: string;
    /** The actual data payload from the source */
    data: any;
    /** The event type string */
    eventType: string;
    /** Timestamp of the event in milliseconds */
    timestamp: number;
    /** Metadata about the event */
    meta: {
        priority: 'low' | 'normal' | 'high' | 'urgent';
        insertedAt: string;
    };
}

/**
 * The transformer function signature.
 * Your code should return an object which will be the new payload.
 */
declare function transform(event: EventPayload): any;

/**
 * Helper Libraries available in the sandbox:
 * - _ (lodash)
 * - dayjs (date manipulation)
 * - crypto (limited to HMAC/SHA)
 */

declare const _: any;
declare const dayjs: any;
declare const crypto: {
    createHmac(
        algo: string,
        key: string,
    ): {
        update(data: string): {
            digest(encoding: string): string;
        };
    };
    createHash(algo: string): {
        update(data: string): {
            digest(encoding: string): string;
        };
    };
};
