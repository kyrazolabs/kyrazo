import { INamespace, unprefixId, prefixId, logger } from '@kyrazo/shared';
import { namespaceRepositoryV2 as namespaceRepo } from './namespace.repo';
import { transformRepository } from '../transform/transform.repo';
import { CreateNamespaceDto, UpdateNamespaceDto, SearchNamespaceDto } from './namespace.types';

export class NamespaceServiceV2 {
    async create(
        data: CreateNamespaceDto,
        userId: string,
        workspaceId: string
    ): Promise<INamespace> {
        const session = await namespaceRepo.startSession();
        let savedNamespace: any;

        await session.withTransaction(async () => {
            let transformer: any;

            if (data.transformer) {
                const transform = await transformRepository.create(
                    {
                        name: data.transformer.name || `${data.name} Transformer`,
                        description:
                            data.transformer.description || `Managed transformer for ${data.name} namespace`,
                        code: data.transformer.code,
                        workspaceId: unprefixId(workspaceId) as any,
                        isActive: true,
                    },
                    userId
                );
                transformer = unprefixId(transform.id);
            }

            const namespaceData: any = {
                ...data,
                createBy: unprefixId(userId),
                workspaceId: unprefixId(workspaceId),
                transformer,
                isManagedTransform: !!data.transformer,
            };

            savedNamespace = await namespaceRepo.create(namespaceData, { session });
        });

        await session.endSession();
        return savedNamespace;
    }

    async update(
        id: string,
        workspaceId: string,
        data: UpdateNamespaceDto,
        userId: string
    ): Promise<INamespace> {
        const session = await namespaceRepo.startSession();
        let updatedNamespace: any;

        await session.withTransaction(async () => {
            const namespace = await namespaceRepo.findById(id, workspaceId);
            if (!namespace) throw new Error('Namespace not found');

            const updateData: any = { ...data };
            delete updateData.transformer;

            if (data.transformer === null && namespace.transformer) {
                // Explicitly requested to unlink/delete the managed transformer
                const tfId =
                    (namespace.transformer as any)._id ||
                    (namespace.transformer as any).id ||
                    namespace.transformer;
                await transformRepository.deleteById(
                    prefixId(tfId, 'transformer')!,
                    workspaceId,
                    id
                );
                updateData.transformer = null;
                updateData.isManagedTransform = false;
            } else if (data.transformer && namespace.transformer) {
                // Update existing managed transformer
                const tfId =
                    (namespace.transformer as any)._id ||
                    (namespace.transformer as any).id ||
                    namespace.transformer;
                await transformRepository.update(
                    prefixId(tfId, 'transformer')!,
                    workspaceId,
                    id,
                    {
                        code: data.transformer.code,
                        name: data.transformer.name,
                        description: data.transformer.description,
                    },
                    userId
                );
            } else if (data.transformer && !namespace.transformer) {
                // Create new managed transformer if it didn't exist
                const transform = await transformRepository.create(
                    {
                        name: data.transformer.name || `${namespace.name} Transformer`,
                        description:
                            data.transformer.description ||
                            `Managed transformer for ${namespace.name} namespace`,
                        code: data.transformer.code,
                        workspaceId: unprefixId(workspaceId) as any,
                        namespaceId: unprefixId(id) as any,
                        isActive: true,
                    },
                    userId
                );
                updateData.transformer = unprefixId(transform.id);
                updateData.isManagedTransform = true;
            }

            updatedNamespace = await namespaceRepo.update(id, workspaceId, updateData, {
                session,
            });
        });

        await session.endSession();
        return updatedNamespace;
    }

    async delete(id: string, workspaceId: string): Promise<boolean> {
        const session = await namespaceRepo.startSession();

        await session.withTransaction(async () => {
            const namespace = await namespaceRepo.findById(id, workspaceId);
            if (!namespace) throw new Error('Namespace not found');

            if (namespace.isManagedTransform && namespace.transformer) {
                const tfId =
                    (namespace.transformer as any)._id ||
                    (namespace.transformer as any).id ||
                    namespace.transformer;
                await transformRepository.deleteById(
                    prefixId(tfId, 'transformer')!,
                    workspaceId,
                    id
                );
            }

            await namespaceRepo.deleteById(id, workspaceId, { session });
        });

        await session.endSession();
        return true;
    }

    async gets(
        workspaceId: string,
        options: SearchNamespaceDto
    ): Promise<{ namespaces: INamespace[]; total: number }> {
        const query: Record<string, any> = {};
        if (options.q) query.name = { $regex: options.q, $options: 'i' };
        if (options.status) query.status = options.status;

        return namespaceRepo.findAll(workspaceId, {
            query,
            limit: options.limit,
            page: options.page,
        });
    }

    async getById(id: string, workspaceId: string): Promise<INamespace | null> {
        return namespaceRepo.findById(id, workspaceId);
    }

    async restore(id: string, workspaceId: string): Promise<INamespace | null> {
        return namespaceRepo.restoreById(id, workspaceId);
    }
}

export const namespaceServiceV2 = new NamespaceServiceV2();
