import { secretCrypto, RedisKeys, logger, unprefixId, prefixId } from '@kyrazo/shared';
import { redisConfig } from '@/configs';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { asqsRepo } from './asqs.repo';
import { transformRepository } from '../transform/transform.repo';
import { CreateASQSDto, UpdateASQSDto } from './asqs.types';

export class ASQSService {
    /**
     * Creates a new ASQS destination with encrypted secrets
     */
    async createASQS(data: CreateASQSDto, userId: string, workspaceId: string, namespaceId: string) {
        const session = await asqsRepo.startSession();
        let savedAsqs: any;

        await session.withTransaction(async () => {
            const { encrypted, iv } = secretCrypto.encrypt(namespaceId, data.secretAccessKey);
            let transformer: any;

            if (data.transformer && typeof data.transformer === 'object') {
                const transform = await transformRepository.create(
                    {
                        name: (data.transformer as any).name || `${data.name} Transformer`,
                        description: (data.transformer as any).description || `Managed transformer for ${data.name} SQS destination`,
                        code: (data.transformer as any).code,
                        workspaceId: unprefixId(workspaceId) as any,
                        namespaceId: unprefixId(namespaceId) as any,
                        isActive: true,
                    },
                    userId
                );
                transformer = unprefixId(transform.id);
            }

            savedAsqs = await asqsRepo.create({
                ...data,
                secretAccessKey: encrypted,
                iv,
                workspaceId,
                namespaceId,
                transformer,
                isManagedTransform: !!(data.transformer && typeof data.transformer === 'object'),
            }, { session });
        });

        await session.endSession();
        return savedAsqs;
    }

    /**
     * Lists all ASQS destinations for a namespace
     */
    async listASQS(workspaceId: string, namespaceId: string) {
        return await asqsRepo.findByNamespace(workspaceId, namespaceId);
    }

    /**
     * Gets a single ASQS by ID
     */
    async getASQS(id: string, workspaceId: string, namespaceId: string) {
        return await asqsRepo.findById(id, workspaceId, namespaceId);
    }

    /**
     * Updates an ASQS and invalidates cache
     */
    async updateASQS(
        id: string,
        workspaceId: string,
        namespaceId: string,
        data: UpdateASQSDto,
        userId: string
    ) {
        const session = await asqsRepo.startSession();
        let updatedAsqs: any;

        await session.withTransaction(async () => {
            const asqs = await asqsRepo.findById(id, workspaceId, namespaceId);
            if (!asqs) throw new Error('ASQS destination not found');

            const updateData: any = { ...data };
            
            if (data.secretAccessKey) {
                const { encrypted, iv } = secretCrypto.encrypt(namespaceId, data.secretAccessKey);
                updateData.secretAccessKey = encrypted;
                updateData.iv = iv;
            }

            if (data.transformer === null && asqs.transformer) {
                // Explicitly delete managed transformer
                const tfId = (asqs.transformer as any)._id || (asqs.transformer as any).id || asqs.transformer;
                await transformRepository.deleteById(prefixId(tfId, 'transformer')!, workspaceId, namespaceId);
                updateData.transformer = null;
                updateData.isManagedTransform = false;
            } else if (data.transformer && typeof data.transformer === 'object' && asqs.transformer) {
                // Update existing managed transformer
                const tfId = (asqs.transformer as any)._id || (asqs.transformer as any).id || asqs.transformer;
                await transformRepository.update(
                    prefixId(tfId, 'transformer')!,
                    workspaceId,
                    namespaceId,
                    {
                        code: (data.transformer as any).code,
                        name: (data.transformer as any).name,
                        description: (data.transformer as any).description,
                    },
                    userId
                );
                delete updateData.transformer;
            } else if (data.transformer && typeof data.transformer === 'object' && !asqs.transformer) {
                // Create new managed transformer
                const transform = await transformRepository.create(
                    {
                        name: (data.transformer as any).name || `${asqs.name} Transformer`,
                        description: (data.transformer as any).description || `Managed transformer for ${asqs.name} SQS destination`,
                        code: (data.transformer as any).code,
                        workspaceId: unprefixId(workspaceId) as any,
                        namespaceId: unprefixId(namespaceId) as any,
                        isActive: true,
                    },
                    userId
                );
                updateData.transformer = unprefixId(transform.id);
                updateData.isManagedTransform = true;
            }

            updatedAsqs = await asqsRepo.update(id, workspaceId, namespaceId, updateData, { session });
            
            if (updatedAsqs) {
                await this.invalidateCache(id);
            }
        });

        await session.endSession();
        return updatedAsqs;
    }

    /**
     * Deletes an ASQS and invalidates cache
     */
    async deleteASQS(id: string, workspaceId: string, namespaceId: string) {
        const session = await asqsRepo.startSession();

        await session.withTransaction(async () => {
            const asqs = await asqsRepo.findById(id, workspaceId, namespaceId);
            if (!asqs) throw new Error('ASQS destination not found');

            if (asqs.isManagedTransform && asqs.transformer) {
                const tfId = (asqs.transformer as any)._id || (asqs.transformer as any).id || asqs.transformer;
                await transformRepository.deleteById(prefixId(tfId, 'transformer')!, workspaceId, namespaceId);
            }

            const deleted = await asqsRepo.delete(id, workspaceId, namespaceId);
            if (deleted) {
                await this.invalidateCache(id);
            }
        });

        await session.endSession();
        return true;
    }

    /**
     * Tests connection to SQS by sending a test message
     */
    async testConnection(options: {
        queueUrl: string;
        region: string;
        accessKeyId: string;
        secretAccessKey: string;
    }): Promise<{ success: boolean; error?: string }> {
        try {
            const client = new SQSClient({
                region: options.region,
                credentials: {
                    accessKeyId: options.accessKeyId,
                    secretAccessKey: options.secretAccessKey,
                },
            });

            const command = new SendMessageCommand({
                QueueUrl: options.queueUrl,
                MessageBody: JSON.stringify({
                    test: true,
                    timestamp: new Date().toISOString(),
                    origin: 'Kyrazo Dashboard Connection Test',
                }),
                MessageAttributes: {
                    'Kyrazo-Test': {
                        DataType: 'String',
                        StringValue: 'true',
                    },
                },
            });

            await client.send(command);
            
            return { success: true };
        } catch (error: any) {
            logger.error(`[ASQSService] Connection test failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * Invalidates Redis cache for this destination
     */
    private async invalidateCache(id: string) {
        const cacheKey = RedisKeys.context.asqs(id);
        await redisConfig.getQueueClient().del(cacheKey);
        logger.debug(`[ASQSService] Invalidated cache for SQS destination: ${id}`);
    }
}

export const asqsService = new ASQSService();
