import { Types } from 'mongoose';
import { AppContext } from '@/core/middlewares/auth.middleware';
import {
    Project,
    CreateProjectResponse,
    DeleteProjectResponse,
    GetProjectResponse,
    GetProjectsResponse,
    IErrorResponse,
    IProject,
    RestoreProjectResponse,
    UpdateProjectResponse,
    Subscription,
    logger,
    transformWithId,
    unprefixId,
    ISubscription,
} from '@kyrazo/shared';
import { subscriptionCacheService } from '@/shared/services/subscription-cache.service';
import { subscriptionService } from '@/modules/billing/subscriptions/subscription.service';
import { redisConfig } from '@/configs';
import {
    CreateProjectInput,
    FilterProjectInput,
    GetProjectByIdInput,
    UpdateProjectInput,
} from './project.schema';
import { limitService } from '@/shared/services/limit.service';

export class ProjectController {
    static async createProject(c: AppContext): Promise<Response> {
        try {
            const workspaceId = c.workspace?.workspaceId;
            const userId = c.user?.userId;
            if (!workspaceId || !userId) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'UNAUTHORIZED_WORKSPACE',
                            message: 'Unauthorized workspace',
                            requestId: c.get('requestId'),
                        },
                    },
                    401
                );
            }
            // @ts-ignore
            const valid: CreateProjectInput = c.req.valid('json');

            // White-label header prefix subscription check
            if (valid.whiteLabelHeaders && valid.whiteLabelHeaders !== 'X-Webhook') {
                const subscription = await subscriptionService.getSubscriptionWithCache(
                    workspaceId.toString()
                );
                const hasFeature = !!subscription?.planSnapshot?.features?.whiteLabelHeaders;

                if (!hasFeature) {
                    return c.json<IErrorResponse>(
                        {
                            success: false,
                            error: {
                                code: 'FEATURE_NOT_AVAILABLE',
                                message:
                                    'Customizing the white-label header prefix is only available on selected plans. Please upgrade your subscription.',
                                requestId: c.get('requestId'),
                            },
                        },
                        403
                    );
                }
            }

            const data = {
                ...valid,
                workspaceId: new Types.ObjectId(unprefixId(workspaceId.toString())),
                createBy: new Types.ObjectId(unprefixId(userId.toString())),
            };

            // Check plan limits
            const currentProjects = await Project.countDocuments({
                workspaceId,
                isDeleted: false,
            });

            const canCreate = await limitService.checkLimit(
                workspaceId.toString(),
                'maxProjects',
                currentProjects
            );

            if (!canCreate) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'PLAN_LIMIT_EXCEEDED',
                            message: 'Project limit exceeded for your current plan',
                            requestId: c.get('requestId'),
                        },
                    },
                    403
                );
            }

            const project = new Project(data);
            const saved = await project.save();

            return c.json<CreateProjectResponse>(
                {
                    success: true,
                    message: 'Project created successfully.',
                    data: {
                        project: saved as IProject,
                    },
                },
                201
            );
        } catch (error: unknown) {
            logger.error('Unexpected error in ProjectController.createProject', error as Error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'CREATE_PROJECT_FAILED',
                        message: 'Failed to create project',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async getProjectById(c: AppContext): Promise<Response> {
        try {
            const workspaceId = c.workspace?.workspaceId;
            if (!workspaceId) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'UNAUTHORIZED_WORKSPACE',
                            message: 'Unauthorized workspace',
                            requestId: c.get('requestId'),
                        },
                    },
                    401
                );
            }
            // @ts-ignore
            const { projectId }: GetProjectByIdInput = c.req.valid('param');

            const project = await Project.findOne({
                _id: unprefixId(projectId),
                workspaceId: unprefixId(workspaceId.toString()),
                isDeleted: false,
            })
                .lean()
                .exec();

            if (!project) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'PROJECT_NOT_FOUND',
                            message: 'Project not found or you do not have permission',
                            requestId: c.get('requestId'),
                        },
                    },
                    404
                );
            }

            return c.json<GetProjectResponse>(
                {
                    success: true,
                    message: "Here's the project data that you asked",
                    data: transformWithId(project, 'project') as any,
                },
                200
            );
        } catch (error: unknown) {
            logger.error('Unexpected error in ProjectController.getProjectById', error as Error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'GET_PROJECT_FAILED',
                        message: 'Failed to get project',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async updateProject(c: AppContext): Promise<Response> {
        try {
            const workspaceId = c.workspace?.workspaceId;
            if (!workspaceId) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'UNAUTHORIZED_WORKSPACE',
                            message: 'Unauthorized workspace',
                            requestId: c.get('requestId'),
                        },
                    },
                    401
                );
            }
            // @ts-ignore
            const { projectId: id }: GetProjectByIdInput = c.req.valid('param');
            // @ts-ignore
            const valid: UpdateProjectInput = c.req.valid('json');

            // White-label headers subscription check
            if (valid.whiteLabelHeaders && valid.whiteLabelHeaders !== 'X-Webhook') {
                const subscription = await subscriptionService.getSubscriptionWithCache(
                    workspaceId.toString()
                );
                const hasFeature = !!subscription?.planSnapshot?.features?.whiteLabelHeaders;

                if (!hasFeature) {
                    return c.json<IErrorResponse>(
                        {
                            success: false,
                            error: {
                                code: 'FEATURE_NOT_AVAILABLE',
                                message:
                                    'White-label headers are only available on selected plans. Please upgrade your subscription.',
                                requestId: c.get('requestId'),
                            },
                        },
                        403
                    );
                }
            }

            const updated = await Project.findOneAndUpdate(
                {
                    _id: unprefixId(id),
                    workspaceId: unprefixId(workspaceId.toString()),
                    isDeleted: false,
                },
                { $set: valid },
                { new: true, runValidators: true }
            ).lean();

            if (!updated) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'PROJECT_NOT_FOUND',
                            message: 'Project not found or you do not have permission.',
                            requestId: c.get('requestId'),
                        },
                    },
                    404
                );
            }

            const transformed = transformWithId(updated, 'project');
            return c.json<UpdateProjectResponse>(
                {
                    success: true,
                    message: 'Project updated successfully.',
                    data: transformed as any,
                },
                200
            );
        } catch (error: unknown) {
            logger.error('Unexpected error in ProjectController.updateProject', error as Error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'UPDATE_PROJECT_FAILED',
                        message: 'Failed to update project',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async deleteProject(c: AppContext): Promise<Response> {
        try {
            const workspaceId = c.workspace?.workspaceId;
            if (!workspaceId) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'UNAUTHORIZED_WORKSPACE',
                            message: 'Unauthorized workspace',
                            requestId: c.get('requestId'),
                        },
                    },
                    401
                );
            }
            // @ts-ignore
            const { projectId }: GetProjectByIdInput = c.req.valid('param');

            const deleted = await Project.findOneAndUpdate(
                {
                    _id: unprefixId(projectId),
                    workspaceId: unprefixId(workspaceId.toString()),
                    isDeleted: false,
                },
                { isDeleted: true, deletedAt: new Date() },
                { new: true }
            ).lean();

            if (!deleted) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'PROJECT_NOT_FOUND',
                            message: 'Project not found or you do not have permission',
                            requestId: c.get('requestId'),
                        },
                    },
                    404
                );
            }

            return c.json<DeleteProjectResponse>(
                {
                    success: true,
                    message: 'Project deleted successfully.',
                },
                200
            );
        } catch (error: unknown) {
            logger.error('Unexpected error in ProjectController.deleteProject', error as Error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'DELETE_PROJECT_FAILED',
                        message: 'Failed to delete project',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async restoreProject(c: AppContext): Promise<Response> {
        try {
            const workspaceId = c.workspace?.workspaceId;
            if (!workspaceId) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'UNAUTHORIZED_WORKSPACE',
                            message: 'Unauthorized workspace',
                            requestId: c.get('requestId'),
                        },
                    },
                    401
                );
            }
            // @ts-ignore
            const { projectId }: GetProjectByIdInput = c.req.valid('param');

            const restored = await Project.findOneAndUpdate(
                {
                    _id: unprefixId(projectId),
                    workspaceId: unprefixId(workspaceId.toString()),
                    isDeleted: true,
                },
                { isDeleted: false, deletedAt: null },
                { new: true }
            ).lean();

            if (!restored) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'PROJECT_NOT_FOUND',
                            message: 'Project not found or you do not have permission',
                            requestId: c.get('requestId'),
                        },
                    },
                    404
                );
            }

            const transformed = transformWithId(restored, 'project');
            return c.json<RestoreProjectResponse>(
                {
                    success: true,
                    message: 'Project restored successfully.',
                    data: transformed as any,
                },
                200
            );
        } catch (error: unknown) {
            logger.error('Unexpected error in ProjectController.restoreProject', error as Error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'RESTORE_PROJECT_FAILED',
                        message: 'Failed to restore project',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async listWorkspaceProjects(c: AppContext): Promise<Response> {
        try {
            const workspaceId = c.workspace?.workspaceId;
            if (!workspaceId) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'UNAUTHORIZED_WORKSPACE',
                            message: 'Unauthorized workspace',
                            requestId: c.get('requestId'),
                        },
                    },
                    401
                );
            }
            // @ts-ignore
            const { q, limit = 10, page = 1 }: FilterProjectInput = c.req.valid('query');

            const query: any = {
                workspaceId: unprefixId(workspaceId.toString()),
                isDeleted: false,
            };

            if (q) query.$text = { $search: q };

            const perPage = Math.min(limit, 100);
            const skip = (page - 1) * perPage;
            const [projects, total] = await Promise.all([
                Project.find(query).sort({ createdAt: -1 }).skip(skip).limit(perPage).lean(),
                Project.countDocuments(query),
            ]);

            const transformedProjects = transformWithId(projects, 'project');

            return c.json<GetProjectsResponse>(
                {
                    success: true,
                    pagination: {
                        total,
                        page,
                        limit: perPage,
                        pages: Math.ceil(total / perPage),
                    },
                    data: transformedProjects as any,
                },
                200
            );
        } catch (error: unknown) {
            logger.error(
                'Unexpected error in ProjectController.listWorkspaceProjects',
                error as Error
            );
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'GET_PROJECTS_FAILED',
                        message: 'Failed to get projects',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }
}
