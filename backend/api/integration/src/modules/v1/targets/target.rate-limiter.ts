import { createDynamicRateLimiter } from '@/core/middlewares/security.middleware';
import type { AppContext } from '@/core/middlewares/auth.middleware';

export const targetReadRateLimiter = createDynamicRateLimiter((c: AppContext) =>
    c.workspace?.workspaceId?.toString()
);

export const targetWriteRateLimiter = createDynamicRateLimiter(
    (c: AppContext) => c.workspace?.workspaceId?.toString()
);
