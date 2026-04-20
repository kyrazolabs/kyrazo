import { ISource, unprefixId, prefixId, logger, generateIngressId } from '@kyrazo/shared';
import { sourceRepositoryV2 as sourceRepo } from './source.repo';
import { transformRepository } from '../transforms/transforms.repo';
import { CreateSourceDto, UpdateSourceDto, SearchSourceDto } from './source.types';
import { config } from '@/configs';

export class SourceServiceV2 {
    async create(
        data: CreateSourceDto,
        userId: string,
        workspaceId: string,
        namespaceId: string
    ): Promise<ISource> {
        const session = await sourceRepo.startSession();
        let savedSource: any;

        await session.withTransaction(async () => {
            let transformId: any;

            if (data.transformer) {
                const transform = await transformRepository.create(
                    {
                        name: data.transformer.name || `${data.name} Transformer`,
                        description:
                            data.transformer.description || `Managed transformer for ${data.name}`,
                        code: data.transformer.code,
                        workspaceId: unprefixId(workspaceId) as any,
                        namespaceId: unprefixId(namespaceId) as any,
                        isActive: true,
                    },
                    userId
                );
                transformId = unprefixId(transform.id);
            }

            const ingressId = generateIngressId(userId);
            const ingressUrl = `${config.app.ingest.v1}${data.service}/${ingressId}`;

            const sourceData: any = {
                ...data,
                userId: unprefixId(userId),
                workspaceId: unprefixId(workspaceId),
                namespaceId: unprefixId(namespaceId),
                ingressId,
                ingressUrl,
                transformId,
                isManagedTransform: !!data.transformer,
                destination: {
                    endpoints: data.destination?.endpoints?.map(id => unprefixId(id)) || [],
                    s3bucket: data.destination?.s3bucket?.map(id => unprefixId(id)) || [],
                    asqs: data.destination?.asqs?.map(id => unprefixId(id)) || [],
                },
            };

            savedSource = await sourceRepo.create(sourceData, { session });
        });

        await session.endSession();
        return savedSource;
    }

    async update(
        id: string,
        workspaceId: string,
        namespaceId: string,
        data: UpdateSourceDto,
        userId: string
    ): Promise<ISource> {
        const session = await sourceRepo.startSession();
        let updatedSource: any;

        await session.withTransaction(async () => {
            const source = await sourceRepo.findById(id, workspaceId, namespaceId);
            if (!source) throw new Error('Source not found');

            const updateData: any = { ...data };
            delete updateData.transformer;

            if (data.transformer === null && source.transformId) {
                // Explicitly requested to unlink/delete the managed transformer
                await transformRepository.deleteById(
                    prefixId(source.transformId.toString()!, 'transformer')!,
                    workspaceId,
                    namespaceId
                );
                updateData.transformId = null;
                updateData.isManagedTransform = false;
            } else if (data.transformer && source.transformId) {
                // Update existing managed transformer
                await transformRepository.update(
                    prefixId(source.transformId.toString()!, 'transformer')!,
                    workspaceId,
                    namespaceId,
                    {
                        code: data.transformer.code,
                        name: data.transformer.name,
                        description: data.transformer.description,
                    },
                    userId
                );
            } else if (data.transformer && !source.transformId) {
                // Create new managed transformer if it didn't exist
                const transform = await transformRepository.create(
                    {
                        name: data.transformer.name || `${source.name} Transformer`,
                        description:
                            data.transformer.description || `Managed transformer for ${source.name}`,
                        code: data.transformer.code,
                        workspaceId: unprefixId(workspaceId) as any,
                        namespaceId: unprefixId(namespaceId) as any,
                        isActive: true,
                    },
                    userId
                );
                updateData.transformId = unprefixId(transform.id);
                updateData.isManagedTransform = true;
            }

            if (data.destination) {
                updateData.destination = {
                    endpoints: data.destination.endpoints?.map((fid) => unprefixId(fid)) || [],
                    s3bucket: data.destination.s3bucket?.map((fid) => unprefixId(fid)) || [],
                    asqs: data.destination.asqs?.map((fid) => unprefixId(fid)) || [],
                };
            }

            updatedSource = await sourceRepo.update(id, workspaceId, namespaceId, updateData, {
                session,
            });
        });

        await session.endSession();
        return updatedSource;
    }

    async delete(id: string, workspaceId: string, namespaceId: string): Promise<boolean> {
        const session = await sourceRepo.startSession();

        await session.withTransaction(async () => {
            const source = await sourceRepo.findById(id, workspaceId, namespaceId);
            if (!source) throw new Error('Source not found');

            if (source.isManagedTransform && source.transformId) {
                await transformRepository.deleteById(
                    prefixId(source.transformId.toString()!, 'transformer')!,
                    workspaceId,
                    namespaceId
                );
            }

            await sourceRepo.deleteById(id, workspaceId, namespaceId, { session });
        });

        await session.endSession();
        return true;
    }

    async gets(
        workspaceId: string,
        namespaceId: string,
        options: SearchSourceDto
    ): Promise<{ sources: ISource[]; total: number }> {
        const query: Record<string, any> = {};
        if (options.q) query.name = { $regex: options.q, $options: 'i' };
        if (options.status) query.status = options.status;

        return sourceRepo.findAll(workspaceId, namespaceId, {
            query,
            limit: options.limit,
            page: options.page,
        });
    }

    async getById(id: string, workspaceId: string, namespaceId: string): Promise<ISource | null> {
        return sourceRepo.findById(id, workspaceId, namespaceId);
    }
}

export const sourceServiceV2 = new SourceServiceV2();
