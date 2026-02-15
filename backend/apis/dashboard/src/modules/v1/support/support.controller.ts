import { IErrorResponse, logger } from '@kyrazo/shared';
import { AppContext } from '@/core/middlewares/auth.middleware';
import { CreateSupportTicketInput } from './support.schema';
import { supportService } from './support.service';

export class SupportController {
    static async createTicket(c: AppContext): Promise<Response> {
        try {
            const user = c.user;
            const workspace = c.workspace;

            if (!user || !workspace) {
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

            const valid: CreateSupportTicketInput = await c.req.json();

            // JWTPayload doesn't have name, using email.
            // IUserWorkspace has workspace property which might have name if populated.
            const workspaceName = workspace.workspace?.name || workspace.workspaceId.toString();

            await supportService.createTicket(valid, {
                email: user.email,
                name: user.email, // Using email as name since name is not in the token
                workspace: workspaceName,
            });

            return c.json(
                {
                    success: true,
                    message: 'Your support ticket has been submitted successfully.',
                },
                201
            );
        } catch (error: unknown) {
            logger.error('Error in createTicket:', error as Error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'SUPPORT_TICKET_FAILED',
                        message: 'Failed to submit support ticket',
                        details: error instanceof Error ? error.message : error,
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }
}
