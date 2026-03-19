import { Types } from 'mongoose';
import type { CreateTargetInput, UpdateTargetInput } from './target.schema';
import { targetRepository } from './target.repo';
import { secretCrypto, logger, unprefixId, prefixId } from '@kyrazo/shared';
import type { ITarget } from '@kyrazo/shared';
import { redisConfig } from '@/configs';

export class TargetService {
    async createTarget(
        valid: CreateTargetInput,
        userId: string,
        workspaceId: Types.ObjectId,
        namespaceId: Types.ObjectId
    ) {
        const secret = secretCrypto.generateSourceSecret();
        const encryptedSecret = secretCrypto.encrypt(
            this.deriveNamespaceKey(namespaceId.toString()),
            secret
        );
        const data = {
            ...valid,
            userId: new Types.ObjectId(userId),
            workspaceId: workspaceId,
            namespaceId: namespaceId,
            secrets: [
                {
                    kid: `k${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                    value_enc: encryptedSecret.encrypted,
                    iv: encryptedSecret.iv,
                    active: true,
                },
            ],
        };

        try {
            return await targetRepository.create(data);
        } catch (error: any) {
            logger.error('Failed to create target:', error);
            throw new Error(JSON.stringify(error));
        }
    }

    async getTargets(query: Record<string, unknown>, limit: number, page: number) {
        try {
            return await targetRepository.findAll({
                query,
                limit,
                page,
            });
        } catch (error: any) {
            logger.error('Failed to get targets:', error);
            throw new Error('Failed to get targets');
        }
    }

    async getTargetById(targetId: string, workspaceId: string, namespaceId: string) {
        try {
            const target = await targetRepository.findById(targetId, workspaceId, namespaceId);
            if (!target) {
                throw new Error('Target not found');
            }
            return target;
        } catch (error: any) {
            logger.error('Failed to get target by id:', error);
            throw new Error('Failed to get target by id');
        }
    }

    async getTargetSecret(
        targetId: string,
        workspaceId: string,
        namespaceId: string
    ): Promise<string> {
        try {
            const target = await targetRepository.findSecretById(
                targetId,
                workspaceId,
                namespaceId
            );
            if (!target) {
                throw new Error('Target not found');
            }
            const activeSecret = target.secrets?.find(secret => secret.active);
            if (!activeSecret) {
                throw new Error('Active secret not found');
            }

            let secret: string;
            const prefixedKey = this.deriveNamespaceKey(namespaceId);

            try {
                // Try with prefixed key first
                secret = secretCrypto.decrypt(activeSecret.value_enc, activeSecret.iv, prefixedKey);
            } catch (error: any) {
                try {
                    // Fallback to raw namespaceId
                    secret = secretCrypto.decrypt(
                        activeSecret.value_enc,
                        activeSecret.iv,
                        namespaceId
                    );

                    // Migration: Re-encrypt and persist with prefixed key
                    const migrated = secretCrypto.encrypt(prefixedKey, secret);
                    await targetRepository.updateSecret(targetId, activeSecret.kid, {
                        value_enc: migrated.encrypted,
                        iv: migrated.iv,
                    });

                    logger.info(`Migrated target secret for ${targetId} to prefixed key`);
                } catch (innerError) {
                    logger.error(
                        'Failed to decrypt target secret with both prefixed and raw keys',
                        innerError
                    );
                    throw new Error('Failed to get target secret');
                }
            }

            return secret;
        } catch (error: any) {
            logger.error('Failed to get target secret:', error);
            throw new Error('Failed to get target secret');
        }
    }

    async updateTarget(
        targetId: string,
        workspaceId: string,
        namespaceId: string,
        valid: UpdateTargetInput
    ): Promise<ITarget> {
        try {
            const target = await targetRepository.findById(targetId, workspaceId, namespaceId);
            if (!target) {
                throw new Error('Target not found');
            }
            const updated = await targetRepository.update(
                targetId,
                workspaceId,
                namespaceId,
                valid
            );
            if (!updated) {
                throw new Error('Failed to update target');
            }
            await redisConfig.del(
                `workspace:${unprefixId(workspaceId)}:namespace:${unprefixId(namespaceId)}:targets`
            );
            return updated;
        } catch (error: any) {
            logger.error('Failed to update target:', error);
            throw new Error('Failed to update target');
        }
    }

    async deleteTarget(
        targetId: string,
        workspaceId: string,
        namespaceId: string
    ): Promise<boolean> {
        try {
            const deleted = await targetRepository.deleteById(targetId, workspaceId, namespaceId);
            if (!deleted) {
                throw new Error('Failed to delete target');
            }
            await redisConfig.del(
                `workspace:${unprefixId(workspaceId)}:namespace:${unprefixId(namespaceId)}:targets`
            );
            return deleted;
        } catch (error: any) {
            logger.error('Failed to delete target:', error);
            throw new Error('Failed to delete target');
        }
    }

    private deriveNamespaceKey(namespaceId: string | Types.ObjectId): string {
        return prefixId(namespaceId, 'namespace') || namespaceId.toString();
    }
}

export const targetService = new TargetService();
