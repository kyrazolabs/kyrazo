import { IErrorResponse, ISuccessResponse } from '@kyrazo/shared';
import { AppContext } from '@/core/middlewares/auth.middleware';
import { asqsService } from './asqs.service';

export class ASQSController {
    static async createASQS(c: AppContext) {
        const data = c.req.valid('json') as any;
        const workspaceId = c.workspace?.workspaceId;
        const namespaceId = c.namespace?.namespaceId;

        const userId = c.get('userId');

        if (!workspaceId || !namespaceId || !userId) {
            return c.json({ success: false, error: 'Unauthorized' }, 401);
        }

        const asqs = await asqsService.createASQS(data, userId.toString(), workspaceId.toString(), namespaceId.toString());

        return c.json<ISuccessResponse<any>>({
            success: true,
            message: 'ASQS destination created successfully',
            data: asqs,
        });
    }

    static async getASQSs(c: AppContext) {
        const workspaceId = c.workspace?.workspaceId;
        const namespaceId = c.namespace?.namespaceId;

        if (!workspaceId || !namespaceId) {
            return c.json({ success: false, error: 'Unauthorized' }, 401);
        }

        const asqsList = await asqsService.listASQS(workspaceId.toString(), namespaceId.toString());

        return c.json<ISuccessResponse<any>>({
            success: true,
            message: 'ASQS destinations retrieved successfully',
            data: asqsList,
        });
    }

    static async getASQS(c: AppContext) {
        // @ts-ignore
        const { id } = c.req.valid('param');
        const workspaceId = c.workspace?.workspaceId;
        const namespaceId = c.namespace?.namespaceId;

        if (!workspaceId || !namespaceId) {
            return c.json({ success: false, error: 'Unauthorized' }, 401);
        }

        const asqs = await asqsService.getASQS(id, workspaceId.toString(), namespaceId.toString());
        
        if (!asqs) {
            return c.json<IErrorResponse>({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'SQS destination not found',
                    requestId: c.get('requestId'),
                }
            }, 404);
        }

        return c.json<ISuccessResponse<any>>({
            success: true,
            message: 'ASQS destination retrieved successfully',
            data: asqs,
        });
    }

    static async updateASQS(c: AppContext) {
        // @ts-ignore
        const { id } = c.req.valid('param');
        const data = c.req.valid('json') as any;
        const workspaceId = c.workspace?.workspaceId;
        const namespaceId = c.namespace?.namespaceId;

        const userId = c.get('userId');

        if (!workspaceId || !namespaceId || !userId) {
            return c.json({ success: false, error: 'Unauthorized' }, 401);
        }

        const updated = await asqsService.updateASQS(id, workspaceId.toString(), namespaceId.toString(), data, userId.toString());

        if (!updated) {
            return c.json<IErrorResponse>({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'SQS destination not found',
                    requestId: c.get('requestId'),
                }
            }, 404);
        }

        return c.json<ISuccessResponse<any>>({
            success: true,
            message: 'ASQS destination updated successfully',
            data: updated,
        });
    }

    static async deleteASQS(c: AppContext) {
        // @ts-ignore
        const { id } = c.req.valid('param');
        const workspaceId = c.workspace?.workspaceId;
        const namespaceId = c.namespace?.namespaceId;

        if (!workspaceId || !namespaceId) {
            return c.json({ success: false, error: 'Unauthorized' }, 401);
        }

        const deleted = await asqsService.deleteASQS(id, workspaceId.toString(), namespaceId.toString());

        if (!deleted) {
            return c.json<IErrorResponse>({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'SQS destination not found',
                    requestId: c.get('requestId'),
                }
            }, 404);
        }

        return c.json<ISuccessResponse<any>>({
            success: true,
            message: 'ASQS destination deleted successfully',
            data: { id },
        });
    }

    static async testConnection(c: AppContext) {
        const data = c.req.valid('json') as any;
        
        const result = await asqsService.testConnection(data);

        return c.json({
            success: result.success,
            message: result.success ? 'Connection successful' : 'Connection failed',
            error: result.error,
        }, result.success ? 200 : 400);
    }
}
