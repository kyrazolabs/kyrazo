import { Types } from 'mongoose';
import { CreateEndpointDto, UpdateEndpointDto } from './endpoint.schema';
import { endpointRepo } from './endpoint.repo';
import { 
    transformRepository 
} from '@/modules/v2/transform/transform.repo';
import { 
    secretCrypto, 
    logger, 
    unprefixId, 
    RedisKeys 
} from '@kyrazo/shared';
import { redisConfig } from '@/configs';

export class EndpointService {
    async createEndpoint(
        data: CreateEndpointDto,
        userId: string,
        workspaceId: string,
        namespaceId: string
    ) {
        const session = await endpointRepo.startSession();
        let savedEndpoint: any;

        try {
            await session.withTransaction(async () => {
                let transformer: string | undefined;

                if (data.transformer && typeof data.transformer === 'object') {
                    const transform = await transformRepository.create({
                        workspaceId: new Types.ObjectId(unprefixId(workspaceId)),
                        namespaceId: new Types.ObjectId(unprefixId(namespaceId)),
                        name: data.transformer.name || `${data.name} Transformer`,
                        code: data.transformer.code,
                        description: data.transformer.description || `Managed transformer for Endpoint ${data.name}`,
                    }, userId, { session });
                    transformer = unprefixId(transform.id);
                }

                const secret = secretCrypto.generateSourceSecret();
                const encryptedSecret = secretCrypto.encrypt(unprefixId(namespaceId as string)!, secret);
                
                savedEndpoint = await endpointRepo.create({
                    ...data,
                    workspaceId,
                    namespaceId,
                    userId,
                    transformer,
                    isManagedTransform: !!(data.transformer && typeof data.transformer === 'object'),
                    secrets: [
                        {
                            kid: `k${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                            value_enc: encryptedSecret.encrypted,
                            iv: encryptedSecret.iv,
                            active: true,
                        },
                    ],
                }, { session });
            });

            if (savedEndpoint) {
                await this.invalidateCache(workspaceId, namespaceId, savedEndpoint.id);
            }

            return savedEndpoint;
        } catch (error: any) {
            logger.error('Failed to create endpoint:', error);
            throw error;
        } finally {
            await session.endSession();
        }
    }

    async getEndpoints(workspaceId: string, namespaceId: string, options: { q?: string; status?: string; limit: number; page: number }) {
        return await endpointRepo.findAll({
            workspaceId,
            namespaceId,
            ...options
        });
    }

    async getEndpointById(id: string, workspaceId: string, namespaceId: string) {
        const endpoint = await endpointRepo.findById(id, workspaceId, namespaceId);
        if (!endpoint) {
            throw new Error('Endpoint not found');
        }
        return endpoint;
    }

    async getEndpointSecret(id: string, workspaceId: string, namespaceId: string) {
        const endpoint = await endpointRepo.findById(id, workspaceId, namespaceId, true);
        if (!endpoint || !endpoint.secrets) {
            throw new Error('Endpoint not found');
        }

        const activeSecret = endpoint.secrets.find((s: any) => s.active);
        if (!activeSecret) {
            throw new Error('Active secret not found');
        }

        return secretCrypto.decrypt(
            activeSecret.value_enc,
            activeSecret.iv,
            unprefixId(namespaceId as string)!
        );
    }

    async updateEndpoint(
        id: string,
        workspaceId: string,
        namespaceId: string,
        data: UpdateEndpointDto,
        userId: string
    ) {
        const session = await endpointRepo.startSession();
        let updated: any;

        try {
            await session.withTransaction(async () => {
                const current = await endpointRepo.findById(id, workspaceId, namespaceId);
                if (!current) throw new Error('Endpoint not found');

                let transformer = current.transformer;
                let isManagedTransform = current.isManagedTransform;

                if (data.transformer && typeof data.transformer === 'object') {
                    if (current.isManagedTransform && current.transformer) {
                        await transformRepository.update(current.transformer, workspaceId, namespaceId, {
                            code: data.transformer.code,
                            name: data.transformer.name,
                            description: data.transformer.description,
                        }, userId, { session });
                    } else {
                        const transform = await transformRepository.create({
                            workspaceId: new Types.ObjectId(unprefixId(workspaceId)),
                            namespaceId: new Types.ObjectId(unprefixId(namespaceId)),
                            name: data.transformer.name || `${current.name} Transformer`,
                            code: data.transformer.code,
                        }, userId, { session });
                        transformer = unprefixId(transform.id);
                        isManagedTransform = true;
                    }
                } else if (data.transformer === null) {
                    if (current.isManagedTransform && current.transformer) {
                        await transformRepository.deleteById(current.transformer, workspaceId, namespaceId, { session });
                    }
                    transformer = undefined;
                    isManagedTransform = false;
                }

                updated = await endpointRepo.update(id, workspaceId, namespaceId, {
                    ...data,
                    transformer,
                    isManagedTransform,
                }, { session });
            });

            await this.invalidateCache(workspaceId, namespaceId, id);
            return updated;
        } catch (error: any) {
            logger.error('Failed to update endpoint:', error);
            throw error;
        } finally {
            await session.endSession();
        }
    }

    async deleteEndpoint(id: string, workspaceId: string, namespaceId: string) {
        const session = await endpointRepo.startSession();

        try {
            await session.withTransaction(async () => {
                const current = await endpointRepo.findById(id, workspaceId, namespaceId);
                if (!current) throw new Error('Endpoint not found');

                if (current.isManagedTransform && current.transformer) {
                    await transformRepository.deleteById(current.transformer, workspaceId, namespaceId, { session });
                }

                await endpointRepo.delete(id, workspaceId, namespaceId, { session });
            });

            await this.invalidateCache(workspaceId, namespaceId, id);
            return true;
        } catch (error: any) {
            logger.error('Failed to delete endpoint:', error);
            throw error;
        } finally {
            await session.endSession();
        }
    }

    private async invalidateCache(workspaceId: string, namespaceId: string, endpointId: string) {
        const redis = redisConfig.getQueueClient();
        await redis.del(RedisKeys.context.workspaceNamespaceEndpoints(unprefixId(workspaceId as string)!, unprefixId(namespaceId as string)!));
        await redis.del(RedisKeys.context.workspaceNamespaceEndpoint(unprefixId(workspaceId as string)!, unprefixId(namespaceId as string)!, unprefixId(endpointId as string)!));
    }
}

export const endpointService = new EndpointService();
