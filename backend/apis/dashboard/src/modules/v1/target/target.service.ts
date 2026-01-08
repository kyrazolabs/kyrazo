import { Types } from 'mongoose';
import { CreateTargetInput, UpdateTargetInput } from './target.schema';
import { targetRepository } from './target.repo';
import { logger, secretCrypto } from '@kyrazo/shared';
import { ITarget } from '@kyrazo/shared';

export class TargetService {
    async createTarget(
        valid: CreateTargetInput,
        userId: string,
        workspaceId: Types.ObjectId,
        projectId: Types.ObjectId
    ) {
        const secret = secretCrypto.generateSourceSecret();
        const encryptedSecret = secretCrypto.encrypt(
            projectId.toString(),
            secret
        );
        const data = {
            ...valid,
            userId: new Types.ObjectId(userId),
            workspaceId: workspaceId,
            projectId: projectId,
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

    async getTargets(
        query: Record<string, unknown>,
        limit: number,
        page: number
    ) {
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

    async getTargetById(
        targetId: string,
        workspaceId: string,
        projectId: string
    ) {
        try {
            const target = await targetRepository.findById(
                targetId,
                workspaceId,
                projectId
            );
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
        projectId: string
    ): Promise<string> {
        try {
            const target = await targetRepository.findSecretById(
                targetId,
                workspaceId,
                projectId
            );
            if (!target) {
                throw new Error('Target not found');
            }
            const activeSecret = target.secrets?.find(secret => secret.active);
            console.log(activeSecret);
            if (!activeSecret) {
                throw new Error('Active secret not found');
            }
            const secret = secretCrypto.decrypt(
                activeSecret.value_enc,
                activeSecret.iv,
                projectId
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
        projectId: string,
        valid: UpdateTargetInput
    ): Promise<ITarget> {
        try {
            const target = await targetRepository.findById(
                targetId,
                workspaceId,
                projectId
            );
            if (!target) {
                throw new Error('Target not found');
            }
            const updated = await targetRepository.update(
                targetId,
                workspaceId,
                projectId,
                valid
            );
            if (!updated) {
                throw new Error('Failed to update target');
            }
            return updated;
        } catch (error) {
            logger.error('Failed to update target:', error as Error);
            throw new Error('Failed to update target');
        }
    }

    async deleteTarget(
        targetId: string,
        workspaceId: string,
        projectId: string
    ): Promise<boolean> {
        try {
            const deleted = await targetRepository.deleteById(
                targetId,
                workspaceId,
                projectId
            );
            if (!deleted) {
                throw new Error('Failed to delete target');
            }
            return deleted;
        } catch (error) {
            logger.error('Failed to delete target:', error as Error);
            throw new Error('Failed to delete target');
        }
    }
}

export const targetService = new TargetService();
