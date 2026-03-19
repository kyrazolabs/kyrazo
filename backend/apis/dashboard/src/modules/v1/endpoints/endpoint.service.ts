import { Types } from 'mongoose';
import { CreateEndpointInput, UpdateEndpointInput } from './endpoint.schema';
import { secretCrypto } from '@kyrazo/shared';
import { endpointRepository } from './endpoint.repo';
import { logger, unprefixId } from '@kyrazo/shared';

export class EndpointService {
    async createEndpoint(
        valid: CreateEndpointInput,
        userId: string,
        workspaceId: Types.ObjectId,
        namespaceId: Types.ObjectId
    ) {
        const secret = secretCrypto.generateSourceSecret();
        const encryptedSecret = secretCrypto.encrypt(namespaceId.toString(), secret);
        const data = {
            ...valid,
            userId: new Types.ObjectId(unprefixId(userId)),
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
            return await endpointRepository.create(data);
        } catch (error: any) {
            logger.error('Failed to create target:', error);
            throw new Error(JSON.stringify(error));
        }
    }

    async getEndpoints(query: Record<string, unknown>, limit: number, page: number) {
        try {
            return await endpointRepository.findAll({
                query,
                limit,
                page,
            });
        } catch (error: any) {
            logger.error('Failed to get endpoints:', error);
            throw new Error('Failed to get endpoints');
        }
    }

    async getEndpointById(endpointId: string, workspaceId: string, namespaceId: string) {
        try {
            const endpoint = await endpointRepository.findById(
                endpointId,
                workspaceId,
                namespaceId
            );
            if (!endpoint) {
                throw new Error('Endpoint not found');
            }
            return endpoint;
        } catch (error: any) {
            logger.error('Failed to get endpoint by id:', error);
            throw new Error('Failed to get endpoint by id');
        }
    }

    async getEndpointSecret(
        endpointId: string,
        workspaceId: string,
        namespaceId: string
    ): Promise<string> {
        try {
            const endpoint = await endpointRepository.findSecretById(
                endpointId,
                workspaceId,
                namespaceId
            );
            if (!endpoint) {
                throw new Error('Endpoint not found');
            }
            const activeSecret = endpoint.secrets?.find((secret: any) => secret.active);

            if (!activeSecret) {
                throw new Error('Active secret not found');
            }
            const secret = secretCrypto.decrypt(
                activeSecret.value_enc,
                activeSecret.iv,
                namespaceId
            );
            return secret;
        } catch (error: any) {
            logger.error('Failed to get endpoint secret:', error);
            throw new Error('Failed to get endpoint secret');
        }
    }

    async updateEndpoint(
        endpointId: string,
        workspaceId: string,
        namespaceId: string,
        valid: Partial<CreateEndpointInput> | Record<string, unknown>
    ) {
        try {
            const endpoint = await endpointRepository.findById(
                endpointId,
                workspaceId,
                namespaceId
            );
            if (!endpoint) {
                throw new Error('Endpoint not found');
            }
            const updated = await endpointRepository.update(
                endpointId,
                workspaceId,
                namespaceId,
                valid
            );
            if (!updated) {
                throw new Error('Failed to update endpoint');
            }
            return updated;
        } catch (error: any) {
            logger.error('Failed to update endpoint:', error);
            throw new Error('Failed to update endpoint');
        }
    }

    async deleteEndpoint(
        endpointId: string,
        workspaceId: string,
        namespaceId: string
    ): Promise<boolean> {
        try {
            const deleted = await endpointRepository.deleteById(
                endpointId,
                workspaceId,
                namespaceId
            );
            if (!deleted) {
                throw new Error('Failed to delete endpoint');
            }
            return deleted;
        } catch (error: any) {
            logger.error('Failed to delete endpoint:', error);
            throw new Error('Failed to delete endpoint');
        }
    }
}

export const endpointService = new EndpointService();
