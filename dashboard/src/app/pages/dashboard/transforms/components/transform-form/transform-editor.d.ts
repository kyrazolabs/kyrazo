/**
 * Kyrazo Transformer Type Definitions
 */

/**
 * The incoming event payload.
 */
declare interface EventPayload {
    /** Unique event ID (Static) */
    id: string;
    /** The event type string (Static) */
    type: string;
    /** Timestamp of the event in milliseconds (Static) */
    timestamp: number;
    /** The actual data payload (Customizable) */
    data: {
        /** The main object being delivered */
        object: any;
        /** The previous state of the object, if available */
        previous: any;
    };
}

/**
 * The incoming event payload available in the global scope.
 */
declare const payload: EventPayload;

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
