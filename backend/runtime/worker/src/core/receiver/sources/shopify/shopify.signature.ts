import crypto from 'crypto';
import { logger } from '@kyrazo/shared';

export class ShopifySignature {
    private static instance: ShopifySignature;

    private constructor() {}

    public static getInstance(): ShopifySignature {
        if (!ShopifySignature.instance) {
            ShopifySignature.instance = new ShopifySignature();
        }
        return ShopifySignature.instance;
    }

    /**
     * Verify Shopify signature using HMAC SHA256 (Base64 encoded)
     * @param rawBody The raw request body
     * @param signatureHeader The x-shopify-hmac-sha256 header
     * @param secret The webhook signing secret
     */
    public verify(rawBody: string, signatureHeader: string, secret: string): boolean {
        try {
            if (!signatureHeader) {
                logger.warn('[ShopifySignature] Missing x-shopify-hmac-sha256 header');
                return false;
            }

            const calculatedHmac = crypto
                .createHmac('sha256', secret)
                .update(rawBody, 'utf8')
                .digest('base64');

            return crypto.timingSafeEqual(
                Buffer.from(signatureHeader, 'base64'),
                Buffer.from(calculatedHmac, 'base64')
            );
        } catch (error: any) {
            logger.warn(`[ShopifySignature] Verification failed: ${error.message}`);
            return false;
        }
    }
}

export const shopifySignature = ShopifySignature.getInstance();
