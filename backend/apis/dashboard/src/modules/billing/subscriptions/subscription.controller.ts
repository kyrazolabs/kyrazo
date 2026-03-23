import { AppContext } from '@/core/middlewares/auth.middleware';
import { IErrorResponse, logger } from '@kyrazo/shared';
import { subscriptionService } from './subscription.service';
import { paymentService } from '@/modules/billing/payments/payment.service';
import {
    CreateSubscriptionInput,
    ChangePlanInput,
    CancelSubscriptionInput,
    GetSubscriptionByIdInput,
} from './subscription.dto';

export class SubscriptionController {
    static async createSubscription(c: AppContext): Promise<Response> {
        try {
            const userId = c.user?.userId;
            const workspace = c.workspace;

            if (!userId || !workspace) {
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
            const valid = body as CreateSubscriptionInput;

            const result = await subscriptionService.createSubscriptionCheckout(
                workspace.workspaceId.toString(),
                userId,
                valid
            );

            return c.json(
                {
                    success: true,
                    message: 'Subscription checkout created successfully',
                    data: result,
                },
                201
            );
        } catch (error: any) {
            logger.error('Unexpected error in SubscriptionController.createSubscription', error);

            const message =
                error instanceof Error ? error.message : 'Failed to create subscription';
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'CREATE_SUBSCRIPTION_FAILED',
                        message,
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async getSubscription(c: AppContext): Promise<Response> {
        try {
            const workspace = c.workspace;
            const { id } = c.req.param() as GetSubscriptionByIdInput;

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

            let subscription;
            if (id === 'current') {
                subscription = await subscriptionService.getWorkspaceSubscriptionWithFallback(
                    workspace.workspaceId.toString()
                );
            } else if (id === 'history') {
                return SubscriptionController.getWorkspaceSubscriptions(c);
            } else {
                subscription = await subscriptionService.getSubscriptionById(id);
            }

            if (!subscription) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'SUBSCRIPTION_NOT_FOUND',
                            message: 'Subscription not found',
                            requestId: c.get('requestId'),
                        },
                    },
                    404
                );
            }

            // Check if subscription belongs to workspace (skip for 'current' as it's already scoped)
            if (
                id !== 'current' &&
                subscription.workspaceId.toString() !== workspace.workspaceId.toString()
            ) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'ACCESS_DENIED',
                            message: 'Access denied',
                            requestId: c.get('requestId'),
                        },
                    },
                    403
                );
            }

            return c.json(
                {
                    success: true,
                    data: subscription,
                },
                200
            );
        } catch (error: any) {
            logger.error('Unexpected error in SubscriptionController.getSubscription', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'GET_SUBSCRIPTION_FAILED',
                        message: 'Failed to get subscription',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async getWorkspaceSubscriptions(c: AppContext): Promise<Response> {
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

            const subscriptions = await subscriptionService.getWorkspaceSubscriptionsWithFallback(
                workspace.workspaceId.toString()
            );

            return c.json(
                {
                    success: true,
                    data: subscriptions,
                },
                200
            );
        } catch (error: any) {
            logger.error(
                'Unexpected error in SubscriptionController.getWorkspaceSubscriptions',
                error
            );
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'GET_SUBSCRIPTIONS_FAILED',
                        message: 'Failed to get subscriptions',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async changePlan(c: AppContext): Promise<Response> {
        try {
            const workspace = c.workspace;
            const { id } = c.req.param();

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
            const valid = body as ChangePlanInput;

            const subscription = await subscriptionService.changePlan(id, valid);

            if (!subscription) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'SUBSCRIPTION_NOT_FOUND',
                            message: 'Subscription not found',
                            requestId: c.get('requestId'),
                        },
                    },
                    404
                );
            }

            const resData: any = (subscription as any).toJSON
                ? (subscription as any).toJSON()
                : subscription;

            return c.json(
                {
                    success: true,
                    message: 'Plan changed successfully',
                    data: resData,
                },
                200
            );
        } catch (error: any) {
            logger.error('Unexpected error in SubscriptionController.changePlan', error);

            const message = error instanceof Error ? error.message : 'Failed to change plan';
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'CHANGE_PLAN_FAILED',
                        message,
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async cancelSubscription(c: AppContext): Promise<Response> {
        try {
            const workspace = c.workspace;
            // @ts-ignore
            const { id } = c.req.valid('param');

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
            const valid = body as CancelSubscriptionInput;

            const subscription = await subscriptionService.cancelSubscription(id, valid);

            if (!subscription) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'SUBSCRIPTION_NOT_FOUND',
                            message: 'Subscription not found',
                            requestId: c.get('requestId'),
                        },
                    },
                    404
                );
            }

            return c.json(
                {
                    success: true,
                    message: 'Subscription canceled successfully',
                    data: subscription,
                },
                200
            );
        } catch (error: any) {
            logger.error('Unexpected error in SubscriptionController.cancelSubscription', error);

            const message =
                error instanceof Error ? error.message : 'Failed to cancel subscription';

            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'CANCEL_SUBSCRIPTION_FAILED',
                        message,
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async checkLimits(c: AppContext): Promise<Response> {
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

            const limits = await subscriptionService.checkWorkspaceLimits(
                workspace.workspaceId.toString()
            );

            return c.json(
                {
                    success: true,
                    data: { limits },
                },
                200
            );
        } catch (error: any) {
            logger.error('Unexpected error in SubscriptionController.checkLimits', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'CHECK_LIMITS_FAILED',
                        message: 'Failed to check limits',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async getInvoices(c: AppContext): Promise<Response> {
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

            const invoices = await subscriptionService.getInvoices(
                workspace.workspaceId.toString()
            );

            return c.json(
                {
                    success: true,
                    data: invoices,
                },
                200
            );
        } catch (error: any) {
            logger.error('Unexpected error in SubscriptionController.getInvoices', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'GET_INVOICES_FAILED',
                        message: 'Failed to get invoices',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async verifyCheckoutSession(c: AppContext): Promise<Response> {
        try {
            const { session_id } = c.req.query();
            if (!session_id) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'MISSING_SESSION_ID',
                            message: 'Session ID is required',
                            requestId: c.get('requestId'),
                        },
                    },
                    400
                );
            }

            const result = await subscriptionService.verifyCheckoutSession(session_id);

            return c.json(
                {
                    success: true,
                    data: result,
                },
                200
            );
        } catch (error: any) {
            logger.error('Unexpected error in SubscriptionController.verifyCheckoutSession', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'VERIFY_SESSION_FAILED',
                        message: 'Failed to verify checkout session',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }
}
