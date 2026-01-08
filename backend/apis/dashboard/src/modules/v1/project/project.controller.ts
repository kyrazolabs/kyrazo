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
    logger,
} from '@kyrazo/shared';
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
            const valid: CreateProjectInput = c.req.valid('json');

            const data = {
                ...valid,
                workspaceId: new Types.ObjectId(workspaceId),
                createBy: new Types.ObjectId(userId),
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
                            message:
                                'Project limit exceeded for your current plan',
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
            logger.error(
                'Unexpected error in ProjectController.createProject',
                error as Error
            );
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
            const { projectId }: GetProjectByIdInput = c.req.valid('param');

            const project = await Project.findOne({
                _id: projectId,
                workspaceId: workspaceId,
                isDeleted: false,
            }).exec();

            if (!project) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'PROJECT_NOT_FOUND',
                            message:
                                'Project not found or you do not have permission',
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
                    data: project as IProject,
                },
                200
            );
        } catch (error: unknown) {
            logger.error(
                'Unexpected error in ProjectController.getProjectById',
                error as Error
            );
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
            const { projectId: id }: GetProjectByIdInput = c.req.valid('param');
            const valid: UpdateProjectInput = c.req.valid('json');

            const updated = await Project.findOneAndUpdate(
                { _id: id, workspaceId, isDeleted: false },
                { $set: valid },
                { new: true, runValidators: true }
            ).lean();

            if (!updated) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'PROJECT_NOT_FOUND',
                            message:
                                'Project not found or you do not have permission.',
                            requestId: c.get('requestId'),
                        },
                    },
                    404
                );
            }

            return c.json<UpdateProjectResponse>(
                {
                    success: true,
                    message: 'Project updated successfully.',
                    data: updated as IProject,
                },
                200
            );
        } catch (error: unknown) {
            logger.error(
                'Unexpected error in ProjectController.updateProject',
                error as Error
            );
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
            const { projectId }: GetProjectByIdInput = c.req.valid('param');

            const deleted = await Project.findOneAndUpdate(
                { _id: projectId, workspaceId, isDeleted: false },
                { isDeleted: true, deletedAt: new Date() },
                { new: true }
            ).lean();

            if (!deleted) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'PROJECT_NOT_FOUND',
                            message:
                                'Project not found or you do not have permission',
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
            logger.error(
                'Unexpected error in ProjectController.deleteProject',
                error as Error
            );
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
            const { projectId }: GetProjectByIdInput = c.req.valid('param');

            const restored = await Project.findOneAndUpdate(
                { _id: projectId, workspaceId, isDeleted: true },
                { isDeleted: false, deletedAt: null },
                { new: true }
            ).lean();

            if (!restored) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'PROJECT_NOT_FOUND',
                            message:
                                'Project not found or you do not have permission',
                            requestId: c.get('requestId'),
                        },
                    },
                    404
                );
            }

            return c.json<RestoreProjectResponse>(
                {
                    success: true,
                    message: 'Project restored successfully.',
                    data: restored as IProject,
                },
                200
            );
        } catch (error: unknown) {
            logger.error(
                'Unexpected error in ProjectController.restoreProject',
                error as Error
            );
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
            const {
                q,
                limit = 10,
                page = 1,
            }: FilterProjectInput = c.req.valid('query');

            const query: any = { workspaceId, isDeleted: false };

            if (q) query.$text = { $search: q };

            const perPage = Math.min(limit, 100);
            const skip = (page - 1) * perPage;
            const [projects, total] = await Promise.all([
                Project.find(query)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(perPage)
                    .lean(),
                Project.countDocuments(query),
            ]);

            return c.json<GetProjectsResponse>(
                {
                    success: true,
                    pagination: {
                        total,
                        page,
                        limit: perPage,
                        pages: Math.ceil(total / perPage),
                    },
                    data: projects as IProject[],
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
