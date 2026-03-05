import { Types } from 'mongoose';
import type { CreateTargetInput, UpdateTargetInput } from './target.schema';
import { targetRepository } from './target.repo';
import { secretCrypto, logger, unprefixId } from '@kyrazo/shared';
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
        const encryptedSecret = secretCrypto.encrypt(namespaceId.toString(), secret);
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
        } catch (error) {
            logger.error('Failed to create target:', error as Error);
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
        } catch (error) {
            logger.error('Failed to get targets:', error as Error);
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
        } catch (error) {
            logger.error('Failed to get target by id:', error as Error);
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
            const secret = secretCrypto.decrypt(
                activeSecret.value_enc,
                activeSecret.iv,
                namespaceId
            );
            return secret;
        } catch (error) {
            logger.error('Failed to get target secret:', error as Error);
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
        } catch (error) {
            logger.error('Failed to update target:', error as Error);
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
        } catch (error) {
            logger.error('Failed to delete target:', error as Error);
            throw new Error('Failed to delete target');
        }
    }
}

export const targetService = new TargetService();
