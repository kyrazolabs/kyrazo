import { IErrorResponse, ISuccessResponse } from '@kyrazo/shared';
import { AppContext } from '@/core/middlewares/auth.middleware';
import { s3Service } from './s3.service';

export class S3Controller {
    static async createS3Bucket(c: AppContext) {
        const data = c.req.valid('json') as any;
        const workspaceId = c.workspace?.workspaceId;
        const namespaceId = c.namespace?.namespaceId;

        if (!workspaceId || !namespaceId) {
            return c.json({ success: false, error: 'Unauthorized' }, 401);
        }

        const s3Bucket = await s3Service.createS3Bucket(data, workspaceId.toString(), namespaceId.toString());

        return c.json<ISuccessResponse<any>>({
            success: true,
            message: 'S3 bucket created successfully',
            data: s3Bucket,
        });
    }

    static async getS3Buckets(c: AppContext) {
        const workspaceId = c.workspace?.workspaceId;
        const namespaceId = c.namespace?.namespaceId;

        if (!workspaceId || !namespaceId) {
            return c.json({ success: false, error: 'Unauthorized' }, 401);
        }

        const s3Buckets = await s3Service.listS3Buckets(workspaceId.toString(), namespaceId.toString());

        return c.json<ISuccessResponse<any>>({
            success: true,
            message: 'S3 buckets retrieved successfully',
            data: s3Buckets,
        });
    }

    static async getS3Bucket(c: AppContext) {
        // @ts-ignore
        const { id } = c.req.valid('param');
        const workspaceId = c.workspace?.workspaceId;
        const namespaceId = c.namespace?.namespaceId;

        if (!workspaceId || !namespaceId) {
            return c.json({ success: false, error: 'Unauthorized' }, 401);
        }

        const s3Bucket = await s3Service.getS3Bucket(id, workspaceId.toString(), namespaceId.toString());
        
        if (!s3Bucket) {
            return c.json<IErrorResponse>({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'S3 Bucket not found',
                    requestId: c.get('requestId'),
                }
            }, 404);
        }

        return c.json<ISuccessResponse<any>>({
            success: true,
            message: 'S3 bucket retrieved successfully',
            data: s3Bucket,
        });
    }

    static async updateS3Bucket(c: AppContext) {
        // @ts-ignore
        const { id } = c.req.valid('param');
        const data = c.req.valid('json') as any;
        const workspaceId = c.workspace?.workspaceId;
        const namespaceId = c.namespace?.namespaceId;

        if (!workspaceId || !namespaceId) {
            return c.json({ success: false, error: 'Unauthorized' }, 401);
        }

        const updated = await s3Service.updateS3Bucket(id, workspaceId.toString(), namespaceId.toString(), data);

        if (!updated) {
            return c.json<IErrorResponse>({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'S3 Bucket not found',
                    requestId: c.get('requestId'),
                }
            }, 404);
        }

        return c.json<ISuccessResponse<any>>({
            success: true,
            message: 'S3 bucket updated successfully',
            data: updated,
        });
    }

    static async deleteS3Bucket(c: AppContext) {
        // @ts-ignore
        const { id } = c.req.valid('param');
        const workspaceId = c.workspace?.workspaceId;
        const namespaceId = c.namespace?.namespaceId;

        if (!workspaceId || !namespaceId) {
            return c.json({ success: false, error: 'Unauthorized' }, 401);
        }

        const deleted = await s3Service.deleteS3Bucket(id, workspaceId.toString(), namespaceId.toString());

        if (!deleted) {
            return c.json<IErrorResponse>({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'S3 Bucket not found',
                    requestId: c.get('requestId'),
                }
            }, 404);
        }

        return c.json<ISuccessResponse<any>>({
            success: true,
            message: 'S3 bucket deleted successfully',
            data: { id },
        });
    }

    static async testConnection(c: AppContext) {
        const data = c.req.valid('json') as any;
        
        const result = await s3Service.testConnection(data);

        return c.json({
            success: result.success,
            message: result.success ? 'Connection successful' : 'Connection failed',
            error: result.error,
        }, result.success ? 200 : 400);
    }
}
