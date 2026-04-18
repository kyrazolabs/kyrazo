import { secretCrypto, RedisKeys, logger } from '@kyrazo/shared';
import { redisConfig } from '@/configs';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { asqsRepo } from './asqs.repo';
import { CreateASQSDto, UpdateASQSDto } from './asqs.types';

export class ASQSService {
    /**
     * Creates a new ASQS destination with encrypted secrets
     */
    async createASQS(data: CreateASQSDto, workspaceId: string, namespaceId: string) {
        const { encrypted, iv } = secretCrypto.encrypt(namespaceId, data.secretAccessKey);

        const asqs = await asqsRepo.create({
            ...data,
            secretAccessKey: encrypted,
            iv,
            workspaceId,
            namespaceId,
        });

        return asqs;
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
        data: UpdateASQSDto
    ) {
        let updateData: any = { ...data };

        if (data.secretAccessKey) {
            const { encrypted, iv } = secretCrypto.encrypt(namespaceId, data.secretAccessKey);
            updateData.secretAccessKey = encrypted;
            updateData.iv = iv;
        }

        const updated = await asqsRepo.update(id, workspaceId, namespaceId, updateData);

        if (updated) {
            await this.invalidateCache(id);
        }

        return updated;
    }

    /**
     * Deletes an ASQS and invalidates cache
     */
    async deleteASQS(id: string, workspaceId: string, namespaceId: string) {
        const deleted = await asqsRepo.delete(id, workspaceId, namespaceId);
        if (deleted) {
            await this.invalidateCache(id);
        }
        return deleted;
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
