import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authenticate } from '@/core/middlewares/auth.middleware';
import { requireWorkspaceMembership } from '@/core/middlewares/workspace.middleware';
import { CreatePlanDto, UpdatePlanDto, GetPlanBySlugDto, ListPlansQueryDto } from './plan.dto';
import { PlanController } from './plan.controller';
import { planWriteRateLimiter, planReadRateLimiter } from './plan.ratelimiter';

const plan = new Hono();

// Public Routes
plan.get(
    '/',
    planReadRateLimiter,
    zValidator('query', ListPlansQueryDto, (result, c) => {
        if (!result.success) {
            return c.json(
                {
                    success: false,
                    statusCode: 400,
                    errors: JSON.parse(result.error.message).map((e: any) => ({
                        field: e.path.join('.') || 'unknown',
                        message: e.message,
                    })),
                },
                400
            );
        }
    }),
    PlanController.getPlans
);

plan.get(
    '/:slug',
    planReadRateLimiter,
    zValidator('param', GetPlanBySlugDto, (result, c) => {
        if (!result.success) {
            return c.json(
                {
                    success: false,
                    statusCode: 400,
                    errors: JSON.parse(result.error.message).map((e: any) => ({
                        field: e.path.join('.') || 'unknown',
                        message: e.message,
                    })),
                },
                400
            );
        }
    }),
    PlanController.getPlanBySlug
);

// Middleware for authenticated routes
plan.use('*', authenticate);

// Protected Routes (require authentication)
plan.post(
    '/',
    planWriteRateLimiter,
    zValidator('json', CreatePlanDto, (result, c) => {
        if (!result.success) {
            return c.json(
                {
                    success: false,
                    statusCode: 400,
                    errors: JSON.parse(result.error.message).map((e: any) => ({
                        field: e.path.join('.') || 'unknown',
                        message: e.message,
                    })),
                },
                400
            );
        }
    }),
    PlanController.createPlan
);

plan.use('*', requireWorkspaceMembership(['owner', 'admin']));

plan.patch(
    '/:id',
    planWriteRateLimiter,
    zValidator('param', z.object({ id: z.string() }), (result, c) => {
        if (!result.success) {
            return c.json(
                {
                    success: false,
                    statusCode: 400,
                    errors: JSON.parse(result.error.message).map((e: any) => ({
                        field: e.path.join('.') || 'unknown',
                        message: e.message,
                    })),
                },
                400
            );
        }
    }),
    zValidator('json', UpdatePlanDto, (result, c) => {
        if (!result.success) {
            return c.json(
                {
                    success: false,
                    statusCode: 400,
                    errors: JSON.parse(result.error.message).map((e: any) => ({
                        field: e.path.join('.') || 'unknown',
                        message: e.message,
                    })),
                },
                400
            );
        }
    }),
    PlanController.updatePlan
);

plan.delete(
    '/:id',
    planWriteRateLimiter,
    zValidator('param', z.object({ id: z.string() }), (result, c) => {
        if (!result.success) {
            return c.json(
                {
                    success: false,
                    statusCode: 400,
                    errors: JSON.parse(result.error.message).map((e: any) => ({
                        field: e.path.join('.') || 'unknown',
                        message: e.message,
                    })),
                },
                400
            );
        }
    }),
    PlanController.deletePlan
);

// Admin utility routes for fixing Stripe integration
plan.post(
    '/:id/regenerate-stripe-price',
    planWriteRateLimiter,
    zValidator('param', z.object({ id: z.string() }), (result, c) => {
        if (!result.success) {
            return c.json(
                {
                    success: false,
                    statusCode: 400,
                    errors: JSON.parse(result.error.message).map((e: any) => ({
                        field: e.path.join('.') || 'unknown',
                        message: e.message,
                    })),
                },
                400
            );
        }
    }),
    PlanController.regenerateStripePrice
);

plan.post(
    '/fix-stripe-prices',
    planWriteRateLimiter,
    PlanController.fixAllPlansWithoutStripePrices
);

export default plan;
