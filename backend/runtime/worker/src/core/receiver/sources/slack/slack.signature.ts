import crypto from 'crypto';
import { logger } from '@kyrazo/shared';

export class SlackSignature {
    private static instance: SlackSignature;

    private constructor() {}

    public static getInstance(): SlackSignature {
        if (!SlackSignature.instance) {
            SlackSignature.instance = new SlackSignature();
        }
        return SlackSignature.instance;
    }

    /**
     * Verify Slack signature using HMAC SHA256 (v0 scheme)
     * @param rawBody The raw request body
     * @param signatureHeader The x-slack-signature header
     * @param timestampHeader The x-slack-request-timestamp header
     * @param secret The Slack signing secret
     */
    public verify(
        rawBody: string,
        signatureHeader: string,
        timestampHeader: string,
        secret: string
    ): boolean {
        try {
            if (!signatureHeader || !timestampHeader) {
                logger.warn('[SlackSignature] Missing required headers');
                return false;
            }

            // 1. Verify that the request is recent (within 5 minutes) to prevent replay attacks
            const timestamp = parseInt(timestampHeader, 10);
            const now = Math.floor(Date.now() / 1000);
            if (isNaN(timestamp) || Math.abs(now - timestamp) > 60 * 5) {
                logger.warn('[SlackSignature] Request timestamp out of window');
                return false;
            }

            // 2. Concatenate the version number, the timestamp, and the request body
            // Format: v0:timestamp:body
            const baseString = `v0:${timestampHeader}:${rawBody}`;

            // 3. Compute the HMAC SHA256 signature
            const calculatedSignature =
                'v0=' +
                crypto.createHmac('sha256', secret).update(baseString, 'utf8').digest('hex');

            // 4. Case-insensitive comparison
            return crypto.timingSafeEqual(
                Buffer.from(signatureHeader, 'utf8'),
                Buffer.from(calculatedSignature, 'utf8')
            );
        } catch (error: any) {
            logger.warn(`[SlackSignature] Verification failed: ${error.message}`);
            return false;
        }
    }
}

export const slackSignature = SlackSignature.getInstance();
