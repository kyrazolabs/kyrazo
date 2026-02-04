import crypto from 'crypto';
import { logger } from '@kyrazo/shared';

export class WebflowSignature {
    private static instance: WebflowSignature;

    private constructor() {}

    public static getInstance(): WebflowSignature {
        if (!WebflowSignature.instance) {
            WebflowSignature.instance = new WebflowSignature();
        }
        return WebflowSignature.instance;
    }

    /**
     * Verify Webflow signature using HMAC SHA256
     * @param rawBody The raw request body
     * @param signatureHeader The x-webflow-signature header
     * @param timestampHeader The x-webflow-timestamp header
     * @param secret The Webflow signing secret
     */
    public verify(
        rawBody: string,
        signatureHeader: string,
        timestampHeader: string,
        secret: string
    ): boolean {
        try {
            if (!signatureHeader || !timestampHeader) {
                logger.warn('[WebflowSignature] Missing required headers');
                return false;
            }

            // 1. Verify that the request is recent (within 5 minutes)
            const timestamp = parseInt(timestampHeader, 10);
            const now = Date.now();
            if (isNaN(timestamp) || Math.abs(now - timestamp) > 1000 * 60 * 5) {
                logger.warn('[WebflowSignature] Request timestamp out of window');
                return false;
            }

            // 2. Concatenate the timestamp and the request body with a colon
            const baseString = `${timestampHeader}:${rawBody}`;

            // 3. Compute the HMAC SHA256 signature
            const calculatedSignature = crypto
                .createHmac('sha256', secret)
                .update(baseString, 'utf8')
                .digest('hex');

            // 4. Compare result with signature header
            return crypto.timingSafeEqual(
                Buffer.from(signatureHeader, 'utf8'),
                Buffer.from(calculatedSignature, 'utf8')
            );
        } catch (error: any) {
            logger.warn(`[WebflowSignature] Verification failed: ${error.message}`);
            return false;
        }
    }
}

export const webflowSignature = WebflowSignature.getInstance();
