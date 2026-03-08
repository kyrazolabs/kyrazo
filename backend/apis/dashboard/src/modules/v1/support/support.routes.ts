import { Hono } from 'hono';
import { SupportController } from './support.controller';
import { zValidator } from '@hono/zod-validator';
import { SupportTicketSchema } from './support.schema';
import { NamespaceHeadersSchema } from '@kyrazo/shared';
import { authenticate } from '@/core/middlewares/auth.middleware';
import { requireNamespaceAccess } from '@/core/middlewares/namespace.middleware';
import { requireWorkspaceMembership } from '@/core/middlewares/workspace.middleware';
import { supportReadRateLimiter } from './support.ratelimiter';

// Header validation using zValidator
const validateNamespaceHeaders = zValidator('header', NamespaceHeadersSchema, (result, c) => {
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
});

const support = new Hono();

support.use('*', authenticate);
support.use('*', validateNamespaceHeaders);
support.use('*', requireWorkspaceMembership(['owner', 'admin', 'member']));
support.use('*', requireNamespaceAccess());

support.post(
    '/',
    supportReadRateLimiter,
    zValidator('json', SupportTicketSchema),
    SupportController.createTicket
);

export default support;
