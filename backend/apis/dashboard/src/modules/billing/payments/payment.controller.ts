import { AppContext } from '@/core/middlewares/auth.middleware';
import { IErrorResponse, logger } from '@kyrazo/shared';
import { paymentService } from './payment.service';
import { subscriptionService } from '@/modules/billing/subscriptions/subscription.service';
import { CreateBillingPortalInput } from './payment.dto';

export class PaymentController {
    static async createBillingPortal(c: AppContext): Promise<Response> {
        try {
            const workspace = c.workspace;

            if (!workspace) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'UNAUTHORIZED_USER',
                            message: 'Unauthorized user',
                            requestId: c.get('requestId'),
                        },
                    },
                    401
                );
            }

            const body = await c.req.json();
            const valid = body as CreateBillingPortalInput;

            const portalSession = await paymentService.createBillingPortalSession(
                workspace.workspaceId.toString(),
                valid.returnUrl
            );

            return c.json(
                {
                    success: true,
                    message: 'Billing portal session created successfully',
                    data: portalSession,
                },
                200
            );
        } catch (error: any) {
            logger.error('Unexpected error in PaymentController.createBillingPortal', error);

            const message =
                error instanceof Error ? error.message : 'Failed to create billing portal session';
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'CREATE_PORTAL_FAILED',
                        message,
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async handleWebhook(c: AppContext): Promise<Response> {
        try {
            const signature = c.req.header('stripe-signature');
            if (!signature) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'MISSING_SIGNATURE',
                            message: 'Stripe signature header is required',
                            requestId: c.get('requestId'),
                        },
                    },
                    400
                );
            }

            // Get raw body for signature verification
            const rawBody = await c.req.arrayBuffer();
            const buffer = Buffer.from(rawBody);

            await paymentService.processWebhook(buffer, signature);

            return c.json(
                {
                    success: true,
                    message: 'Webhook processed successfully',
                },
                200
            );
        } catch (error: any) {
            logger.error('Unexpected error in PaymentController.handleWebhook', error);

            // Return 200 to Stripe to avoid retries for validation errors
            // But log the error for debugging
            return c.json(
                {
                    success: false,
                    message: 'Webhook processing failed',
                    error: error instanceof Error ? error.message : 'Unknown error',
                },
                400
            );
        }
    }
}
