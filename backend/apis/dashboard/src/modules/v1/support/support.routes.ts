import { Hono } from 'hono';
import { SupportController } from './support.controller';
import { zValidator } from '@hono/zod-validator';
import { SupportTicketSchema } from './support.schema';
import { ProjectHeadersSchema } from '@kyrazo/shared';
import { authenticate } from '@/core/middlewares/auth.middleware';
import { requireProjectAccess } from '@/core/middlewares/project.middleware';
import { requireWorkspaceMembership } from '@/core/middlewares/workspace.middleware';
import { supportReadRateLimiter } from './support.ratelimiter';

// Header validation using zValidator
const validateProjectHeaders = zValidator(
    'header',
    ProjectHeadersSchema,
    (result, c) => {
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
    }
);

const support = new Hono();

support.use('*', authenticate);
support.use('*', validateProjectHeaders);
support.use('*', requireWorkspaceMembership(['owner', 'admin', 'member']));
support.use('*', requireProjectAccess());

support.post(
    '/',
    supportReadRateLimiter,
    zValidator('json', SupportTicketSchema),
    SupportController.createTicket
);

export default support;
