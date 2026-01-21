import { describe, it, expect, spyOn } from 'bun:test';
import { SupportController } from './support.controller';
import { supportService } from './support.service';

describe('SupportController', () => {
    const mockContext = (
        body: any = {},
        user: any = { email: 'test@example.com', userId: 'user1' },
        workspace: any = {
            workspace: { name: 'Test Workspace' },
            workspaceId: 'ws1',
        }
    ) => {
        return {
            user,
            workspace,
            req: {
                json: async () => body,
            },
            json: (data: any, status: number) => ({ data, status }),
            get: (key: string) => key,
        } as any;
    };

    it('createTicket should submit a ticket successfully', async () => {
        const input = {
            subject: 'Test Subject',
            message: 'Test message with more than ten characters',
            Types: 'Bug' as const,
            Category: 'Dashboard',
        };

        const serviceSpy = spyOn(
            supportService,
            'createTicket'
        ).mockResolvedValue(undefined as any);

        const c = mockContext(input);
        const result: any = await SupportController.createTicket(c);

        expect(result.status).toBe(201);
        expect(result.data.success).toBe(true);
        expect(serviceSpy).toHaveBeenCalled();

        const callArgs = serviceSpy.mock.calls[0];
        expect(callArgs[0]).toEqual(input);
        expect(callArgs[1].email).toBe('test@example.com');
        expect(callArgs[1].workspace).toBe('Test Workspace');
    });

    it('createTicket should return 401 if user or workspace is missing', async () => {
        const c = mockContext({}, null, null);
        const result: any = await SupportController.createTicket(c);

        expect(result.status).toBe(401);
        expect(result.data.success).toBe(false);
        expect(result.data.error.code).toBe('UNAUTHORIZED_USER');
    });

    it('createTicket should return 500 on service error', async () => {
        spyOn(supportService, 'createTicket').mockRejectedValue(
            new Error('Webhook failed')
        );

        const c = mockContext({
            subject: 'Test',
            message: 'Test message',
            Types: 'Bug' as const,
            Category: 'Dashboard',
        });
        const result: any = await SupportController.createTicket(c);

        expect(result.status).toBe(500);
        expect(result.data.success).toBe(false);
        expect(result.data.error.code).toBe('SUPPORT_TICKET_FAILED');
    });
});
