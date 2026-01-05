import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { config } from '../../../../configs';

export class SignatureCrypto {
    private static instance: SignatureCrypto;
    private secret: string;

    constructor(secret: string) {
        this.secret = secret;
    }

    public static getInstance(): SignatureCrypto {
        if (!SignatureCrypto.instance) {
            const secret = config.security.encryptions.key;
            if (!secret) {
                throw Error('Secret Not Set up yet');
            }
            SignatureCrypto.instance = new SignatureCrypto(secret);
        }

        return SignatureCrypto.instance;
    }

    /**
     * @title Signs a message payload with HMAC-SHA512 and timestamp
     * @description Generates a base64 signature over the message, timestamp, and nonce.
     * @param {string} message - The raw message to sign (JSON string recommended).
     * @param {string} secret - The shared master secret (from ENV).
     * @param {number} [timestamp] - Optional timestamp (ms). Defaults to current time.
     * @param {string} [nonce] - Optional nonce for replay protection.
     * @returns {{ signature: string, timestamp: number, nonce: string }}
     */
    public signMessage(
        message: string,
        timestamp = Date.now(),
        nonce = randomBytes(8).toString('hex')
    ): { signature: string; timestamp: number; nonce: string } {
        const hmac = createHmac('sha512', this.secret);
        hmac.update(`${message}.${timestamp}.${nonce}`);
        const signature = hmac.digest('base64');
        return { signature, timestamp, nonce };
    }

    /**
     * @title Verifies a signed message
     * @description Checks the HMAC-SHA512 integrity, timestamp window, and optional nonce replay protection.
     * @param {string} message - The original message string.
     * @param {string} signature - The signature to verify.
     * @param {string} secret - The shared master secret (same used in signMessage).
     * @param {number} timestamp - The timestamp from the sender.
     * @param {string} nonce - The nonce from the sender.
     * @param {number} [maxAgeMs=5*60*1000] - Maximum allowed message age (default 5 minutes).
     * @param {Set<string>} [nonceCache] - Optional in-memory cache to prevent replays.
     * @returns {boolean} True if valid and within time window; otherwise false.
     */
    public verifySignature(
        message: string,
        signature: string,
        timestamp: number,
        nonce: string,
        maxAgeMs = 5 * 60 * 1000,
        nonceCache?: Set<string>
    ): boolean {
        const now = Date.now();

        // Reject old or future timestamps
        if (Math.abs(now - timestamp) > maxAgeMs) return false;

        // Check nonce replay
        if (nonceCache && nonceCache.has(nonce)) return false;
        if (nonceCache) nonceCache.add(nonce);

        const hmac = createHmac('sha512', this.secret);
        hmac.update(`${message}.${timestamp}.${nonce}`);
        const expectedSig = hmac.digest('base64');

        // Constant-time comparison
        const isValid =
            expectedSig.length === signature.length &&
            timingSafeEqual(Buffer.from(expectedSig), Buffer.from(signature));

        return isValid;
    }
}

export const signatureCrypto = SignatureCrypto.getInstance();
