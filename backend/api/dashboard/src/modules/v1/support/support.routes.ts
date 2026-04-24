import { Hono } from 'hono';
import { SupportController } from './support.controller';
import { validate } from '@/core/middlewares/validator.middleware';
import { SupportTicketSchema } from './support.schema';
import { NamespaceHeadersSchema } from '@kyrazo/shared';
import { authenticate } from '@/core/middlewares/auth.middleware';
import { sentryMiddleware } from '@/core/middlewares/sentry.middleware';
import { requireNamespaceAccess } from '@/core/middlewares/namespace.middleware';
import { requireWorkspaceMembership } from '@/core/middlewares/workspace.middleware';
import { supportReadRateLimiter } from './support.ratelimiter';

// Header validation using validate
const validateNamespaceHeaders = validate('header', NamespaceHeadersSchema);

const support = new Hono();

support.use('*', authenticate);
support.use('*', sentryMiddleware);
support.use('*', validateNamespaceHeaders);
support.use('*', requireWorkspaceMembership(['owner', 'admin', 'member']));
support.use('*', requireNamespaceAccess());

support.post(
    '/',
    supportReadRateLimiter,
    validate('json', SupportTicketSchema),
    SupportController.createTicket
);

export default support;
