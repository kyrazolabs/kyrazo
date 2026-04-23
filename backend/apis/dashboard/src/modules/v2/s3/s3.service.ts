import { secretCrypto, RedisKeys, logger, unprefixId, prefixId } from '@kyrazo/shared';
import { redisConfig } from '@/configs';
import { S3Client } from 'bun';
import { s3Repo } from './s3.repo';
import { transformRepository } from '../transform/transform.repo';
import { CreateS3Dto, UpdateS3Dto } from './s3.types';

export class S3Service {
    constructor(private S3ClientClass = S3Client) {}
    /**
     * Creates a new S3 bucket destination with encrypted secrets
     */
    async createS3Bucket(data: CreateS3Dto, userId: string, workspaceId: string, namespaceId: string) {
        const session = await s3Repo.startSession();
        let savedBucket: any;

        await session.withTransaction(async () => {
            const { encrypted, iv } = secretCrypto.encrypt(namespaceId, data.secretAccessKey);
            let transformer: any;

            if (data.transformer && typeof data.transformer === 'object') {
                const transform = await transformRepository.create(
                    {
                        name: (data.transformer as any).name || `${data.name} Transformer`,
                        description: (data.transformer as any).description || `Managed transformer for ${data.name} S3 destination`,
                        code: (data.transformer as any).code,
                        workspaceId: unprefixId(workspaceId) as any,
                        namespaceId: unprefixId(namespaceId) as any,
                        isActive: true,
                    },
                    userId
                );
                transformer = unprefixId(transform.id);
            }

            savedBucket = await s3Repo.create({
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
        return savedBucket;
    }

    /**
     * Lists all S3 buckets for a namespace
     */
    async listS3Buckets(workspaceId: string, namespaceId: string) {
        return await s3Repo.findByNamespace(workspaceId, namespaceId);
    }

    /**
     * Gets a single S3 bucket by ID
     */
    async getS3Bucket(id: string, workspaceId: string, namespaceId: string) {
        return await s3Repo.findById(id, workspaceId, namespaceId);
    }

    /**
     * Updates an S3 bucket and invalidates cache
     */
    async updateS3Bucket(
        id: string,
        workspaceId: string,
        namespaceId: string,
        data: UpdateS3Dto,
        userId: string
    ) {
        const session = await s3Repo.startSession();
        let updatedBucket: any;

        await session.withTransaction(async () => {
            const bucket = await s3Repo.findById(id, workspaceId, namespaceId);
            if (!bucket) throw new Error('S3 Bucket not found');

            const updateData: any = { ...data };
            
            if (data.secretAccessKey) {
                const { encrypted, iv } = secretCrypto.encrypt(namespaceId, data.secretAccessKey);
                updateData.secretAccessKey = encrypted;
                updateData.iv = iv;
            }

            if (data.transformer === null && bucket.transformer) {
                // Explicitly delete/unlink managed transformer
                const tfId = (bucket.transformer as any)._id || (bucket.transformer as any).id || bucket.transformer;
                await transformRepository.deleteById(prefixId(tfId, 'transformer')!, workspaceId, namespaceId);
                updateData.transformer = null;
                updateData.isManagedTransform = false;
            } else if (data.transformer && typeof data.transformer === 'object' && bucket.transformer) {
                // Update existing managed transformer
                const tfId = (bucket.transformer as any)._id || (bucket.transformer as any).id || bucket.transformer;
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
                delete updateData.transformer; // Don't overwrite the ID in destination
            } else if (data.transformer && typeof data.transformer === 'object' && !bucket.transformer) {
                // Create new managed transformer
                const transform = await transformRepository.create(
                    {
                        name: (data.transformer as any).name || `${bucket.name} Transformer`,
                        description: (data.transformer as any).description || `Managed transformer for ${bucket.name} S3 destination`,
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

            updatedBucket = await s3Repo.update(id, workspaceId, namespaceId, updateData, { session });
            
            if (updatedBucket) {
                await this.invalidateCache(id);
            }
        });

        await session.endSession();
        return updatedBucket;
    }

    /**
     * Deletes an S3 bucket and invalidates cache
     */
    async deleteS3Bucket(id: string, workspaceId: string, namespaceId: string) {
        const session = await s3Repo.startSession();

        await session.withTransaction(async () => {
            const bucket = await s3Repo.findById(id, workspaceId, namespaceId);
            if (!bucket) throw new Error('S3 Bucket not found');

            if (bucket.isManagedTransform && bucket.transformer) {
                const tfId = (bucket.transformer as any)._id || (bucket.transformer as any).id || bucket.transformer;
                await transformRepository.deleteById(prefixId(tfId, 'transformer')!, workspaceId, namespaceId);
            }

            const deleted = await s3Repo.delete(id, workspaceId, namespaceId);
            if (deleted) {
                await this.invalidateCache(id);
            }
        });

        await session.endSession();
        return true;
    }

    /**
     * Tests connection to S3
     */
    async testConnection(options: {
        bucketName: string;
        region: string;
        accessKeyId: string;
        secretAccessKey: string;
        endpoint?: string;
    }): Promise<{ success: boolean; error?: string }> {
        try {
            const client = new this.S3ClientClass({
                accessKeyId: options.accessKeyId,
                secretAccessKey: options.secretAccessKey,
                bucket: options.bucketName,
                region: options.region,
                endpoint: options.endpoint,
            });

            // Try to check if bucket exists or just list a single object
            await client.exists('.kyrazo-connection-test'); 
            
            return { success: true };
        } catch (error: any) {
            logger.error(`[S3Service] Connection test failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * Invalidates Redis cache for this destination
     */
    private async invalidateCache(id: string) {
        const cacheKey = RedisKeys.context.s3Bucket(id);
        await redisConfig.getQueueClient().del(cacheKey);
        logger.debug(`[S3Service] Invalidated cache for S3 destination: ${id}`);
    }
}

export const s3Service = new S3Service();
