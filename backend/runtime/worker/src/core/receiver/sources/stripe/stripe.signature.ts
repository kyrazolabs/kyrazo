import Stripe from "stripe";
import { logger } from "@kyrazo/shared";

export class StripeSignature {
    private static instance: StripeSignature;
    private stripe: Stripe;

    private constructor() {
        // Initialize stripe instance. The secret key is not strictly needed for
        // webhook verification but the constructor requires a non-empty string.
        this.stripe = new Stripe("sk_test_ignored");
    }

    public static getInstance(): StripeSignature {
        if (!StripeSignature.instance) {
            StripeSignature.instance = new StripeSignature();
        }
        return StripeSignature.instance;
    }

    /**
     * Verify Stripe signature using the official library
     * @param rawBody The raw request body
     * @param signatureHeader The Stripe-Signature header
     * @param secret The webhook signing secret
     * @param tolerance Seconds of tolerance for the timestamp (default 5 minutes)
     */
    public async verify(
        rawBody: string,
        signatureHeader: string,
        secret: string,
        tolerance: number = 300,
    ): Promise<boolean> {
        try {
            if (!signatureHeader) {
                logger.warn(
                    "[StripeSignature] Missing Stripe-Signature header",
                );
                return false;
            }

            // constructEventAsync is required in environments like Cloudflare Workers or when using SubtleCryptoProvider
            await this.stripe.webhooks.constructEventAsync(
                rawBody,
                signatureHeader,
                secret,
                tolerance,
            );

            return true;
        } catch (error: any) {
            logger.warn(
                `[StripeSignature] Verification failed: ${error.message}`,
            );
            return false;
        }
    }
}

export const stripeSignature = StripeSignature.getInstance();
