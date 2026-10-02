import { Context, Next } from 'hono';
import * as Sentry from '@sentry/bun';
import { AppContext } from './auth.middleware';

export const sentryMiddleware = async (c: AppContext, next: Next) => {
    // Only set user context if session exists and has user data
    if (c.user?.email) {
        Sentry.setUser({
            email: c.user.email,
        });
    }

    // Only set project tag if session has project data
    const session = (c as any).session;
    if (session?.projectId !== undefined && session?.projectId !== null) {
        Sentry.setTag('project_id', session.projectId);
    }

    await next();
};
