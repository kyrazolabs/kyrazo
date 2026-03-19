import { Types } from 'mongoose';
import { AppContext } from '@/core/middlewares/auth.middleware';
import {
    Namespace,
    CreateNamespaceResponse,
    DeleteNamespaceResponse,
    GetNamespaceResponse,
    GetNamespacesResponse,
    IErrorResponse,
    INamespace,
    RestoreNamespaceResponse,
    UpdateNamespaceResponse,
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
    CreateNamespaceInput,
    FilterNamespaceInput,
    GetNamespaceByIdInput,
    UpdateNamespaceInput,
} from './namespace.schema';
import { limitService } from '@/shared/services/limit.service';

export class NamespaceController {
    static async createNamespace(c: AppContext): Promise<Response> {
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
            const valid: CreateNamespaceInput = c.req.valid('json');

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
            const currentNamespaces = await Namespace.countDocuments({
                workspaceId,
                isDeleted: false,
            });

            const canCreate = await limitService.checkLimit(
                workspaceId.toString(),
                'maxNamespaces',
                currentNamespaces
            );

            if (!canCreate) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'PLAN_LIMIT_EXCEEDED',
                            message: 'Namespace limit exceeded for your current plan',
                            requestId: c.get('requestId'),
                        },
                    },
                    403
                );
            }

            const namespace = new Namespace(data);
            const saved = await namespace.save();

            return c.json<CreateNamespaceResponse>(
                {
                    success: true,
                    message: 'Namespace created successfully.',
                    data: {
                        namespace: saved as INamespace,
                    },
                },
                201
            );
        } catch (error: any) {
            logger.error('Unexpected error in NamespaceController.createNamespace', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'CREATE_NAMESPACE_FAILED',
                        message: 'Failed to create namespace',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async getNamespaceById(c: AppContext): Promise<Response> {
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
            const { namespaceId }: GetNamespaceByIdInput = c.req.valid('param');

            const namespace = await Namespace.findOne({
                _id: unprefixId(namespaceId),
                workspaceId: unprefixId(workspaceId.toString()),
                isDeleted: false,
            })
                .lean()
                .exec();

            if (!namespace) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'NAMESPACE_NOT_FOUND',
                            message: 'Namespace not found or you do not have permission',
                            requestId: c.get('requestId'),
                        },
                    },
                    404
                );
            }

            return c.json<GetNamespaceResponse>(
                {
                    success: true,
                    message: "Here's the namespace data that you asked",
                    data: transformWithId(namespace, 'namespace' as any) as any,
                },
                200
            );
        } catch (error: any) {
            logger.error('Unexpected error in NamespaceController.getNamespaceById', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'GET_NAMESPACE_FAILED',
                        message: 'Failed to get namespace',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async updateNamespace(c: AppContext): Promise<Response> {
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
            const { namespaceId: id }: GetNamespaceByIdInput = c.req.valid('param');
            // @ts-ignore
            const valid: UpdateNamespaceInput = c.req.valid('json');

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

            const updated = await Namespace.findOneAndUpdate(
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
                            code: 'NAMESPACE_NOT_FOUND',
                            message: 'Namespace not found or you do not have permission.',
                            requestId: c.get('requestId'),
                        },
                    },
                    404
                );
            }

            const transformed = transformWithId(updated, 'namespace');
            return c.json<UpdateNamespaceResponse>(
                {
                    success: true,
                    message: 'Namespace updated successfully.',
                    data: transformed as any,
                },
                200
            );
        } catch (error: any) {
            logger.error('Unexpected error in NamespaceController.updateNamespace', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'UPDATE_NAMESPACE_FAILED',
                        message: 'Failed to update namespace',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async deleteNamespace(c: AppContext): Promise<Response> {
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
            const { namespaceId }: GetNamespaceByIdInput = c.req.valid('param');

            const deleted = await Namespace.findOneAndUpdate(
                {
                    _id: unprefixId(namespaceId),
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
                            code: 'NAMESPACE_NOT_FOUND',
                            message: 'Namespace not found or you do not have permission',
                            requestId: c.get('requestId'),
                        },
                    },
                    404
                );
            }

            return c.json<DeleteNamespaceResponse>(
                {
                    success: true,
                    message: 'Namespace deleted successfully.',
                },
                200
            );
        } catch (error: any) {
            logger.error('Unexpected error in NamespaceController.deleteNamespace', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'DELETE_NAMESPACE_FAILED',
                        message: 'Failed to delete namespace',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async restoreNamespace(c: AppContext): Promise<Response> {
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
            const { namespaceId }: GetNamespaceByIdInput = c.req.valid('param');

            const restored = await Namespace.findOneAndUpdate(
                {
                    _id: unprefixId(namespaceId),
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
                            code: 'NAMESPACE_NOT_FOUND',
                            message: 'Namespace not found or you do not have permission',
                            requestId: c.get('requestId'),
                        },
                    },
                    404
                );
            }

            const transformed = transformWithId(restored, 'namespace');
            return c.json<RestoreNamespaceResponse>(
                {
                    success: true,
                    message: 'Namespace restored successfully.',
                    data: transformed as any,
                },
                200
            );
        } catch (error: any) {
            logger.error('Unexpected error in NamespaceController.restoreNamespace', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'RESTORE_NAMESPACE_FAILED',
                        message: 'Failed to restore namespace',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async listWorkspaceNamespaces(c: AppContext): Promise<Response> {
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
            const { q, limit = 10, page = 1 }: FilterNamespaceInput = c.req.valid('query');

            const query: any = {
                workspaceId: unprefixId(workspaceId.toString()),
                isDeleted: false,
            };

            if (q) query.$text = { $search: q };

            const perPage = Math.min(limit, 100);
            const skip = (page - 1) * perPage;
            const [namespaces, total] = await Promise.all([
                Namespace.find(query).sort({ createdAt: -1 }).skip(skip).limit(perPage).lean(),
                Namespace.countDocuments(query),
            ]);

            const transformedNamespaces = transformWithId(namespaces, 'namespace');

            return c.json<GetNamespacesResponse>(
                {
                    success: true,
                    pagination: {
                        total,
                        page,
                        limit: perPage,
                        pages: Math.ceil(total / perPage),
                    },
                    data: transformedNamespaces as any,
                },
                200
            );
        } catch (error: any) {
            logger.error('Unexpected error in NamespaceController.listWorkspaceNamespaces', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'GET_NAMESPACES_FAILED',
                        message: 'Failed to get namespaces',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }
}
