import { AppContext } from '@/core/middlewares/auth.middleware';
import { IErrorResponse, IPlan, logger, User } from '@kyrazo/shared';
import { planService } from './plan.service';
import {
    CreatePlanInput,
    UpdatePlanInput,
    GetPlanBySlugInput,
    ListPlansQueryInput,
} from './plan.dto';

export class PlanController {
    static async createPlan(c: AppContext): Promise<Response> {
        try {
            const user = c.user;

            if (!user) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'INSUFFICIENT_PERMISSIONS',
                            message: 'Only system admins can create plans',
                            requestId: c.get('requestId'),
                        },
                    },
                    403
                );
            }
            const isSystemAdmin = await User.findByEmail(user?.email);

            if (!isSystemAdmin || isSystemAdmin.email !== 'work.nx.iq@gmail.com') {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'INSUFFICIENT_PERMISSIONS',
                            message: 'Only system admins can create plans',
                            requestId: c.get('requestId'),
                        },
                    },
                    403
                );
            }

            const body = await c.req.json();
            const valid = body as CreatePlanInput;
            const plan = await planService.createPlan(valid);

            return c.json(
                {
                    success: true,
                    message: 'Plan created successfully',
                    data: plan,
                },
                201
            );
        } catch (error: any) {
            logger.error('Unexpected error in PlanController.createPlan', error);

            const message = error instanceof Error ? error.message : 'Failed to create plan';
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'CREATE_PLAN_FAILED',
                        message,
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async getPlanBySlug(c: AppContext): Promise<Response> {
        try {
            const { slug } = c.req.param() as GetPlanBySlugInput;
            const plan = await planService.getPlanBySlug(slug);

            if (!plan) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'PLAN_NOT_FOUND',
                            message: 'Plan not found',
                            requestId: c.get('requestId'),
                        },
                    },
                    404
                );
            }

            return c.json(
                {
                    success: true,
                    data: plan,
                },
                200
            );
        } catch (error: any) {
            logger.error('Unexpected error in PlanController.getPlanBySlug', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'GET_PLAN_FAILED',
                        message: 'Failed to get plan',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async getPlans(c: AppContext): Promise<Response> {
        try {
            const query = c.req.query() as ListPlansQueryInput;
            const { plans, total } = await planService.getAllPlans({
                active: query.active,
                limit: query.limit,
                offset: query.offset,
            });

            return c.json(
                {
                    success: true,
                    data: plans,
                    metadata: {
                        total,
                        limit: query.limit || 50,
                        offset: query.offset || 0,
                    },
                },
                200
            );
        } catch (error: any) {
            logger.error('Unexpected error in PlanController.getPlans', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'GET_PLANS_FAILED',
                        message: 'Failed to get plans',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async updatePlan(c: AppContext): Promise<Response> {
        try {
            const userId = c.user?.userId;
            const workspace = c.workspace;
            const { id } = c.req.param() as { id: string };

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

            if (!['owner', 'admin'].includes(workspace.role)) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'INSUFFICIENT_PERMISSIONS',
                            message: 'Only admins can update plans',
                            requestId: c.get('requestId'),
                        },
                    },
                    403
                );
            }

            const body = await c.req.json();
            const valid = body as UpdatePlanInput;
            const plan = await planService.updatePlan(id, valid);

            if (!plan) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'PLAN_NOT_FOUND',
                            message: 'Plan not found',
                            requestId: c.get('requestId'),
                        },
                    },
                    404
                );
            }

            return c.json(
                {
                    success: true,
                    message: 'Plan updated successfully',
                    data: plan,
                },
                200
            );
        } catch (error: any) {
            logger.error('Unexpected error in PlanController.updatePlan', error);

            const message = error instanceof Error ? error.message : 'Failed to update plan';
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'UPDATE_PLAN_FAILED',
                        message,
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async deletePlan(c: AppContext): Promise<Response> {
        try {
            const userId = c.user?.userId;
            const workspace = c.workspace;
            const { id } = c.req.param() as { id: string };

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

            if (!['owner', 'admin'].includes(workspace.role)) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'INSUFFICIENT_PERMISSIONS',
                            message: 'Only admins can delete plans',
                            requestId: c.get('requestId'),
                        },
                    },
                    403
                );
            }

            const deleted = await planService.deletePlan(id);

            if (!deleted) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'PLAN_NOT_FOUND',
                            message: 'Plan not found',
                            requestId: c.get('requestId'),
                        },
                    },
                    404
                );
            }

            return c.json<{ success: true; message: string }>(
                {
                    success: true,
                    message: 'Plan deleted successfully',
                },
                200
            );
        } catch (error: any) {
            logger.error('Unexpected error in PlanController.deletePlan', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'DELETE_PLAN_FAILED',
                        message: 'Failed to delete plan',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async regenerateStripePrice(c: AppContext): Promise<Response> {
        try {
            const userId = c.user?.userId;
            const workspace = c.workspace;
            const { id } = c.req.param();

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

            if (!['owner', 'admin'].includes(workspace.role)) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'INSUFFICIENT_PERMISSIONS',
                            message: 'Only admins can regenerate Stripe prices',
                            requestId: c.get('requestId'),
                        },
                    },
                    403
                );
            }

            const plan = await planService.regenerateStripePrice(id);
            if (!plan) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'PLAN_NOT_FOUND',
                            message: 'Plan not found',
                            requestId: c.get('requestId'),
                        },
                    },
                    404
                );
            }

            return c.json(
                {
                    success: true,
                    message: 'Stripe price regenerated successfully',
                    data: plan,
                },
                200
            );
        } catch (error: any) {
            logger.error('Unexpected error in PlanController.regenerateStripePrice', error);

            const message =
                error instanceof Error ? error.message : 'Failed to regenerate Stripe price';
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'REGENERATE_PRICE_FAILED',
                        message,
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async fixAllPlansWithoutStripePrices(c: AppContext): Promise<Response> {
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

            if (!['owner', 'admin'].includes(workspace.role)) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'INSUFFICIENT_PERMISSIONS',
                            message: 'Only admins can fix plans',
                            requestId: c.get('requestId'),
                        },
                    },
                    403
                );
            }

            const result = await planService.fixAllPlansWithoutStripePrices();

            return c.json(
                {
                    success: true,
                    message: `Fixed ${result.fixed} plans, ${result.errors} errors`,
                    data: result,
                },
                200
            );
        } catch (error: any) {
            logger.error(
                'Unexpected error in PlanController.fixAllPlansWithoutStripePrices',
                error
            );

            const message = error instanceof Error ? error.message : 'Failed to fix plans';
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'FIX_PLANS_FAILED',
                        message,
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }
}
