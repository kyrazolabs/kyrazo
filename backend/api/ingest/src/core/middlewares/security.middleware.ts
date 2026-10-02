import {
    createWorkspaceRateLimiter,
    createTokenBucketLimiter,
    createRateLimitMiddleware,
} from './rate-limiter.middleware';

/**
 * @title Security Middleware
 * @description Central export for security and rate limiting middlewares.
 * Note: Core rate limiting logic has been moved to rate-limiter.middleware.ts.
 */

export {
    createWorkspaceRateLimiter,
    createTokenBucketLimiter,
    createRateLimitMiddleware,
};

export default {
    createWorkspaceRateLimiter,
    createTokenBucketLimiter,
    createRateLimitMiddleware,
};
