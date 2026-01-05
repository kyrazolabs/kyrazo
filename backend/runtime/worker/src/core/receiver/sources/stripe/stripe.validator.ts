import type { IReceivedEvent } from "@/types/events/event.types";
import type { StripeWebhookEvent } from "./stripe.types";
import { logger } from "@kyrazo/shared";

export class StripeValidator {
    private static instance: StripeValidator;

    private constructor() {}

    public static getInstance(): StripeValidator {
        if (!StripeValidator.instance) {
            StripeValidator.instance = new StripeValidator();
        }
        return StripeValidator.instance;
    }

    /**
     * Parse and validate the incoming event body as a Stripe Webhook Event.
     * Returns true if valid, false otherwise.
     */
    public validate(event: IReceivedEvent): boolean {
        if (!event || !event.body) {
            logger.warn("[StripeValidator] Empty event or body");
            return false;
        }

        try {
            const payload = event.body as unknown as StripeWebhookEvent;

            // Basic structural validation
            if (!payload.id || typeof payload.id !== "string") {
                logger.warn("[StripeValidator] Missing or invalid 'id'");
                return false;
            }

            if (!payload.type || typeof payload.type !== "string") {
                logger.warn("[StripeValidator] Missing or invalid 'type'");
                return false;
            }

            if (payload.object !== "event") {
                logger.warn(
                    "[StripeValidator] Invalid 'object' type, expected 'event'",
                );
                return false;
            }

            if (!payload.data || typeof payload.data !== "object") {
                logger.warn("[StripeValidator] Missing or invalid 'data'");
                return false;
            }

            if (
                !payload.data.object ||
                typeof payload.data.object !== "object"
            ) {
                logger.warn(
                    "[StripeValidator] Missing or invalid 'data.object'",
                );
                return false;
            }

            if (typeof payload.created !== "number") {
                logger.warn(
                    "[StripeValidator] Missing or invalid 'created' timestamp",
                );
                return false;
            }

            return true;
        } catch (error) {
            logger.error("[StripeValidator] Validation error:", error as Error);
            return false;
        }
    }
}

export const stripeValidator = StripeValidator.getInstance();
