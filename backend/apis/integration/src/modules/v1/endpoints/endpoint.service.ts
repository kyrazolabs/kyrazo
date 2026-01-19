import { Types } from 'mongoose';
import type { CreateEndpointInput } from './endpoint.schema';
import { secretCrypto } from '@kyrazo/shared';
import { endpointRepository } from './endpoint.repo';
import { logger } from '@kyrazo/shared';

export class EndpointService {
    async createEndpoint(
        valid: CreateEndpointInput,
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
            return await endpointRepository.create(data);
        } catch (error) {
            logger.error('Failed to create target:', error as Error);
            throw new Error(JSON.stringify(error));
        }
    }

    async getEndpoints(
        query: Record<string, unknown>,
        limit: number,
        page: number
    ) {
        try {
            return await endpointRepository.findAll({
                query,
                limit,
                page,
            });
        } catch (error) {
            logger.error('Failed to get endpoints:', error as Error);
            throw new Error('Failed to get endpoints');
        }
    }

    async getEndpointById(
        endpointId: string,
        workspaceId: string,
        projectId: string
    ) {
        try {
            const endpoint = await endpointRepository.findById(
                endpointId,
                workspaceId,
                projectId
            );
            if (!endpoint) {
                throw new Error('Endpoint not found');
            }
            return endpoint;
        } catch (error) {
            logger.error('Failed to get endpoint by id:', error as Error);
            throw new Error('Failed to get endpoint by id');
        }
    }

    async getEndpointSecret(
        endpointId: string,
        workspaceId: string,
        projectId: string
    ): Promise<string> {
        try {
            const endpoint = await endpointRepository.findSecretById(
                endpointId,
                workspaceId,
                projectId
            );
            if (!endpoint) {
                throw new Error('Endpoint not found');
            }
            const activeSecret = endpoint.secrets?.find(
                (secret: any) => secret.active
            );

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
            logger.error('Failed to get endpoint secret:', error as Error);
            throw new Error('Failed to get endpoint secret');
        }
    }

    async updateEndpoint(
        endpointId: string,
        workspaceId: string,
        projectId: string,
        valid: Partial<CreateEndpointInput> | Record<string, unknown>
    ) {
        try {
            const endpoint = await endpointRepository.findById(
                endpointId,
                workspaceId,
                projectId
            );
            if (!endpoint) {
                throw new Error('Endpoint not found');
            }
            const updated = await endpointRepository.update(
                endpointId,
                workspaceId,
                projectId,
                valid
            );
            if (!updated) {
                throw new Error('Failed to update endpoint');
            }
            return updated;
        } catch (error) {
            logger.error('Failed to update endpoint:', error as Error);
            throw new Error('Failed to update endpoint');
        }
    }

    async deleteEndpoint(
        endpointId: string,
        workspaceId: string,
        projectId: string
    ): Promise<boolean> {
        try {
            const deleted = await endpointRepository.deleteById(
                endpointId,
                workspaceId,
                projectId
            );
            if (!deleted) {
                throw new Error('Failed to delete endpoint');
            }
            return deleted;
        } catch (error) {
            logger.error('Failed to delete endpoint:', error as Error);
            throw new Error('Failed to delete endpoint');
        }
    }
}

export const endpointService = new EndpointService();
