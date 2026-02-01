import type {
    CreateSourceInput,
    FilterSourcesInput,
    GetSourceByIdInput,
    UpdateSourceInput,
} from './source.schema';
import type {
    CreateSourceResponse,
    DeleteSourceResponse,
    GetSourceResponse,
    GetSourcesResponse,
    UpdateSourceResponse,
} from './source.types';

import type { AppContext } from '@/core/middlewares/auth.middleware';
import { sourceService } from './source.service';
import { logger } from '@kyrazo/shared';
import { Types } from 'mongoose';

export class SourceController {
    static async createSource(c: AppContext) {
        try {
            // @ts-ignore
            const valid: CreateSourceInput = c.req.valid('json');

            const workspaceId = c.workspace!.workspaceId.toString();
            const projectId = c.project!.projectId.toString();
            const userId = c.userId!;

            const saved = await sourceService.createSource(valid, userId, workspaceId, projectId);

            return c.json<CreateSourceResponse>(
                {
                    success: true,
                    message: 'Source created successfully',
                    data: {
                        sourceId: saved._id.toString(),
                        source: saved,
                    },
                },
                201
            );
        } catch (error) {
            logger.error('Failed to create source:', error as Error);
            return c.json(
                {
                    success: false,
                    message: 'Failed to create source',
                    error: error instanceof Error ? error.message : 'Unknown error',
                },
                500
            );
        }
    }

    static async getSources(c: AppContext) {
        try {
            // @ts-ignore
            const { q, status, limit = 10, page = 1 }: FilterSourcesInput = c.req.valid('query');

            const workspaceId = c.workspace!.workspaceId.toString();
            const projectId = c.project!.projectId.toString();

            const query: any = {
                workspaceId: new Types.ObjectId(workspaceId),
                projectId: new Types.ObjectId(projectId),
            };

            if (q) {
                query.name = { $regex: q, $options: 'i' };
            }
            if (status) {
                query.status = status;
            }

            const { sources, total } = await sourceService.getSources(query, limit, page);

            return c.json<GetSourcesResponse>(
                {
                    success: true,
                    total,
                    sources,
                },
                200
            );
        } catch (error) {
            logger.error('Failed to get sources:', error as Error);
            return c.json(
                {
                    success: false,
                    message: 'Failed to get sources',
                },
                500
            );
        }
    }

    static async getSource(c: AppContext) {
        try {
            // @ts-ignore
            const { sourceId }: GetSourceByIdInput = c.req.valid('param');
            const workspaceId = c.workspace!.workspaceId.toString();
            const projectId = c.project!.projectId.toString();

            const source = await sourceService.getSourceById(sourceId, workspaceId, projectId);

            return c.json<GetSourceResponse>(
                {
                    success: true,
                    message: 'Source fetched successfully',
                    data: source,
                },
                200
            );
        } catch (error: any) {
            logger.error('Failed to get source:', error as Error);
            if (error.message === 'Source not found') {
                return c.json(
                    {
                        success: false,
                        message: 'Source not found',
                    },
                    404
                );
            }
            return c.json(
                {
                    success: false,
                    message: 'Failed to get source',
                },
                500
            );
        }
    }

    static async updateSource(c: AppContext) {
        try {
            // @ts-ignore
            const { sourceId }: GetSourceByIdInput = c.req.valid('param');
            // @ts-ignore
            const data: UpdateSourceInput = c.req.valid('json');

            const workspaceId = c.workspace!.workspaceId.toString();
            const projectId = c.project!.projectId.toString();

            const updated = await sourceService.updateSource(
                sourceId,
                workspaceId,
                projectId,
                data
            );

            return c.json<UpdateSourceResponse>(
                {
                    success: true,
                    message: 'Source updated successfully',
                    data: updated,
                },
                200
            );
        } catch (error: any) {
            logger.error('Failed to update source:', error as Error);
            if (error.message === 'Source not found') {
                return c.json(
                    {
                        success: false,
                        message: 'Source not found',
                    },
                    404
                );
            }
            return c.json(
                {
                    success: false,
                    message: 'Failed to update source',
                },
                500
            );
        }
    }

    static async deleteSource(c: AppContext) {
        try {
            // @ts-ignore
            const { sourceId }: GetSourceByIdInput = c.req.valid('param');
            const workspaceId = c.workspace!.workspaceId.toString();
            const projectId = c.project!.projectId.toString();

            const deleted = await sourceService.deleteSource(sourceId, workspaceId, projectId);

            return c.json<DeleteSourceResponse>(
                {
                    success: true,
                    message: 'Source deleted successfully',
                    data: deleted,
                },
                200
            );
        } catch (error: any) {
            logger.error('Failed to delete source:', error as Error);
            if (error.message === 'Failed to delete source') {
                // This message is a bit ambiguous in service, assuming if it failed it might be not found or other issue
                // But generally 404 is checked before delete attempt in some patterns.
                // Here deleteById just attempts delete. If count 0, returns false.
                return c.json(
                    {
                        success: false,
                        message: 'Source not found or failed to delete',
                    },
                    404
                );
            }
            return c.json(
                {
                    success: false,
                    message: 'Failed to delete source',
                },
                500
            );
        }
    }
}
