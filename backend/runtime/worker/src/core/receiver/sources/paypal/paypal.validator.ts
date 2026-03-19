import type { IReceivedEvent } from '@/types/events/event.types';
import type { PayPalWebhookEvent } from './paypal.types';
import { logger } from '@kyrazo/shared';

export class PayPalValidator {
    private static instance: PayPalValidator;

    private constructor() {}

    public static getInstance(): PayPalValidator {
        if (!PayPalValidator.instance) {
            PayPalValidator.instance = new PayPalValidator();
        }
        return PayPalValidator.instance;
    }

    /**
     * Parse and validate the incoming event body as a PayPal Webhook Event.
     * Returns true if valid, false otherwise.
     */
    public validate(event: IReceivedEvent): boolean {
        if (!event || !event.body) {
            logger.warn('[PayPalValidator] Empty event or body');
            return false;
        }

        try {
            // In IReceivedEvent, body is defined as Record<string, string>, but for PayPal it should be JSON.
            // However, typically the 'body' property in internal events might be already an object or a string depending on ingest.
            // Based on user prompt "body: Record<string, string>", it might be a key-value pair representation or just typed loosely.
            // If it came from a JSON webhook, it's likely an object.

            // Let's assume event.body IS the PayPal event object (casted) or we need to access it.
            // If body is Record<string, string>, we might need to be careful.
            // But usually 'body' holds the payload.

            const payload = event.body as unknown as PayPalWebhookEvent;

            // Basic structural validation
            if (!payload.id || typeof payload.id !== 'string') {
                logger.warn("[PayPalValidator] Missing or invalid 'id'");
                return false;
            }

            if (!payload.event_type || typeof payload.event_type !== 'string') {
                logger.warn("[PayPalValidator] Missing or invalid 'event_type'");
                return false;
            }

            if (!payload.resource_type || typeof payload.resource_type !== 'string') {
                logger.warn("[PayPalValidator] Missing or invalid 'resource_type'");
                return false;
            }

            if (!payload.event_version || typeof payload.event_version !== 'string') {
                logger.warn("[PayPalValidator] Missing or invalid 'event_version'");
                return false;
            }

            if (!payload.create_time || typeof payload.create_time !== 'string') {
                logger.warn("[PayPalValidator] Missing or invalid 'create_time'");
                return false;
            }

            return true;
        } catch (error: any) {
            logger.error('[PayPalValidator] Validation error:', error);
            return false;
        }
    }
}

export const paypalValidator = PayPalValidator.getInstance();
