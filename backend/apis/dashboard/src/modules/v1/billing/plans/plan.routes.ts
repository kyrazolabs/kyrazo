import { Hono } from 'hono';
import { z } from 'zod';
import { authenticate, requireOwnership } from '@/core/middlewares/auth.middleware';
import { sentryMiddleware } from '@/core/middlewares/sentry.middleware';
import { validate } from '@/core/middlewares/validator.middleware';
import { requireWorkspaceMembership } from '@/core/middlewares/workspace.middleware';
import { CreatePlanDto, UpdatePlanDto, GetPlanBySlugDto, ListPlansQueryDto } from './plan.dto';
import { PlanController } from './plan.controller';
import { planWriteRateLimiter, planReadRateLimiter } from './plan.ratelimiter';

const plan = new Hono();

// Public Routes
plan.get('/', planReadRateLimiter, validate('query', ListPlansQueryDto), PlanController.getPlans);

plan.get(
    '/:slug',
    planReadRateLimiter,
    validate('param', GetPlanBySlugDto),
    PlanController.getPlanBySlug
);

// Middleware for authenticated routes
plan.use('*', authenticate);
plan.use('*', sentryMiddleware);

// Protected Routes (require authentication)
plan.post('/', planWriteRateLimiter, validate('json', CreatePlanDto), PlanController.createPlan);

plan.use('*', requireWorkspaceMembership(['owner', 'admin']));

plan.patch(
    '/:id',
    planWriteRateLimiter,
    validate('param', z.object({ id: z.string() })),
    validate('json', UpdatePlanDto),
    PlanController.updatePlan
);

plan.delete(
    '/:id',
    planWriteRateLimiter,
    validate('param', z.object({ id: z.string() })),
    PlanController.deletePlan
);

// Admin utility routes for fixing Stripe integration
// plan.post(
//     '/:id/regenerate-stripe-price',
//     planWriteRateLimiter,
//     validate('param', z.object({ id: z.string() }), (result, c) => {
//         if (!result.success) {
//             return c.json(
//                 {
//                     success: false,
//                     statusCode: 400,
//                     errors: JSON.parse(result.error.message).map((e: any) => ({
//                         field: e.path.join('.') || 'unknown',
//                         message: e.message,
//                     })),
//                 },
//                 400
//             );
//         }
//     }),
//     PlanController.regenerateStripePrice
// );

// plan.post(
//     '/fix-stripe-prices',
//     planWriteRateLimiter,
//     PlanController.fixAllPlansWithoutStripePrices
// );

export default plan;
