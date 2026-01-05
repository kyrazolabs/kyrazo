import { Hono } from 'hono';
import authRouter from './v1/auth/auth.routes';
import workspaceRouter from './v1/workspace/workspace.routes';
import keyRouter from './v1/key/key.routes';
import endpointRouter from './v1/endpoints/endpoint.routes';
import sourcesRouter from './v1/source/source.routes';
import deliveryRouter from './v1/delivery/delivery.routes';
import analyticsRouter from './v1/analytics/analytics.routes';
import plansRouter from './plans';
import subscriptionsRouter from './subscriptions';
import paymentsRouter from './payments';
// import subscriptionRouter from './v1/subscriptions/subscription.routes';
// import planRouter from './v1/plan/plan.routes';
import projectRouter from './v1/project/project.routes';
import targetRouter from './v1/target/target.routes';

const router = new Hono();

// Mount auth routes
router.route('/auth', authRouter);

router.route('/workspaces', workspaceRouter);

router.route('/projects', projectRouter);

// Mount api key routes
router.route('/keys', keyRouter);

// Mount endpoints routes
router.route('/endpoints', endpointRouter);

// Mount sources routes
router.route('/sources', sourcesRouter);

// Mount targets routes
router.route('/targets', targetRouter);

// Mount deliveries routes
router.route('/deliveries', deliveryRouter);

// Mount analytics routes
router.route('/analytics', analyticsRouter);

// Mount billing routes
router.route('/plans', plansRouter);
router.route('/subscriptions', subscriptionsRouter);
router.route('/payments', paymentsRouter);

// Mount plan routes
// router.route('/subscriptions', subscriptionRouter);

// Mount subscriptions routes
// router.route('/plans', planRouter);

// Health check endpoint
router.get('/health', c => {
    return c.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    });
});

// API documentation endpoint
router.get('/', c => {
    return c.json({
        success: true,
        message: 'Hookster API',
        version: '1.0.0',
        endpoints: {
            auth: {
                register: 'POST /auth/register',
                login: 'POST /auth/login',
                refreshToken: 'POST /auth/refresh-token',
                logout: 'POST /auth/logout',
                profile: 'GET /auth/profile',
                updateProfile: 'PUT /auth/profile',
                changePassword: 'POST /auth/change-password',
                forgotPassword: 'POST /auth/forgot-password',
                resetPassword: 'POST /auth/reset-password',
                verifyEmail: 'POST /auth/verify-email',
            },
            plans: {
                createPlan: 'POST /plans (admin)',
                getPlans: 'GET /plans',
                getPlanBySlug: 'GET /plans/:slug',
                updatePlan: 'PATCH /plans/:id (admin)',
                deletePlan: 'DELETE /plans/:id (admin)',
            },
            subscriptions: {
                createSubscription: 'POST /subscriptions',
                getSubscriptions: 'GET /subscriptions',
                getSubscription: 'GET /subscriptions/:id',
                changePlan: 'POST /subscriptions/:id/change-plan',
                cancelSubscription: 'POST /subscriptions/:id/cancel',
                checkLimits: 'GET /subscriptions/limits',
            },
            payments: {
                createCheckoutSession: 'POST /payments/checkout-session',
                createBillingPortal: 'POST /payments/portal',
                source: 'POST /payments/source',
            },
            health: 'GET /health',
        },
    });
});
export type AppType = typeof router;
export default router;
