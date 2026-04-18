import { secretCrypto, RedisKeys, logger } from '@kyrazo/shared';
import { redisConfig } from '@/configs';
import { S3Client } from 'bun';
import { s3Repo } from './s3.repo';
import { CreateS3Dto, UpdateS3Dto } from './s3.types';

export class S3Service {
    constructor(private S3ClientClass = S3Client) {}
    /**
     * Creates a new S3 bucket destination with encrypted secrets
     */
    async createS3Bucket(data: CreateS3Dto, workspaceId: string, namespaceId: string) {
        const { encrypted, iv } = secretCrypto.encrypt(namespaceId, data.secretAccessKey);

        const s3Bucket = await s3Repo.create({
            ...data,
            secretAccessKey: encrypted,
            iv,
            workspaceId,
            namespaceId,
        });

        return s3Bucket;
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
        data: UpdateS3Dto
    ) {
        let updateData: any = { ...data };

        if (data.secretAccessKey) {
            const { encrypted, iv } = secretCrypto.encrypt(namespaceId, data.secretAccessKey);
            updateData.secretAccessKey = encrypted;
            updateData.iv = iv;
        }

        const updated = await s3Repo.update(id, workspaceId, namespaceId, updateData);

        if (updated) {
            await this.invalidateCache(id);
        }

        return updated;
    }

    /**
     * Deletes an S3 bucket and invalidates cache
     */
    async deleteS3Bucket(id: string, workspaceId: string, namespaceId: string) {
        const deleted = await s3Repo.delete(id, workspaceId, namespaceId);
        if (deleted) {
            await this.invalidateCache(id);
        }
        return deleted;
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
