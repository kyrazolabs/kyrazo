import type { IReceivedEvent } from '@/types/events/event.types';
import { logger } from '@kyrazo/shared';

export class ShopifyValidator {
    private static instance: ShopifyValidator;

    private constructor() {}

    public static getInstance(): ShopifyValidator {
        if (!ShopifyValidator.instance) {
            ShopifyValidator.instance = new ShopifyValidator();
        }
        return ShopifyValidator.instance;
    }

    public validate(event: IReceivedEvent): boolean {
        const headers = event.headers;

        if (!headers['x-shopify-topic']) {
            logger.debug('[ShopifyValidator] Missing x-shopify-topic header');
            return false;
        }

        if (!headers['x-shopify-hmac-sha256']) {
            logger.debug('[ShopifyValidator] Missing x-shopify-hmac-sha256 header');
            return false;
        }

        if (!headers['x-shopify-webhook-id']) {
            logger.debug('[ShopifyValidator] Missing x-shopify-webhook-id header');
            return false;
        }

        return true;
    }
}

export const shopifyValidator = ShopifyValidator.getInstance();
