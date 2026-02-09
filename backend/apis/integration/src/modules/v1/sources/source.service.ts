import { Types } from 'mongoose';
import type { CreateSourceInput, UpdateSourceInput, SourceAuthType } from './source.schema';
import { sourceRepository } from './source.repo';
import {
    logger,
    type ISource,
    secretCrypto,
    generateIngressId,
    decryptSourceSecrets,
    unprefixId,
} from '@kyrazo/shared';
import { config } from '@/configs';

export class SourceService {
    async createSource(
        valid: CreateSourceInput,
        userId: string,
        workspaceId: string,
        projectId: string
    ) {
        if (!valid.authentication?.enabled) {
            throw new Error('Authentication is required for receive type sources.');
        }

        // Handle different authentication types for receive sources
        let processedAuth: any;

        if (valid.authentication.type === 'service' && valid.authentication.service) {
            const encrypted = secretCrypto.encrypt(projectId, valid.authentication.service.secret);
            processedAuth = {
                enabled: true,
                type: 'service' as SourceAuthType,
                credentials: {
                    secret: encrypted.encrypted,
                    iv: encrypted.iv,
                },
            };
        }
        // else if (
        //     valid.authentication.type === 'api_key' &&
        //     valid.authentication.apiKey
        // ) {
        //     const encrypted = secretCrypto.encrypt(
        //         projectId,
        //         valid.authentication.apiKey.apiKey
        //     );
        //     processedAuth = {
        //         enabled: true,
        //         type: 'api_key' as SourceAuthType,
        //         credentials: {
        //             ...valid.authentication.apiKey,
        //             apiKey: encrypted.encrypted,
        //             iv: encrypted.iv,
        //         },
        //     };
        // } else if (
        //     valid.authentication.type === 'basic_auth' &&
        //     valid.authentication.basicAuth
        // ) {
        //     const encrypted = secretCrypto.encrypt(
        //         projectId,
        //         valid.authentication.basicAuth.password
        //     );
        //     processedAuth = {
        //         enabled: true,
        //         type: 'basic_auth' as SourceAuthType,
        //         credentials: {
        //             ...valid.authentication.basicAuth,
        //             password: encrypted.encrypted,
        //             iv: encrypted.iv,
        //         },
        //     };
        // }

        const ingress = generateIngressId(userId);
        const data: Partial<ISource> = {
            ...valid,
            service: valid.service as any, // Cast service to any to bypass shared type restrictions if stripe is not yet in ISource
            endpoints: valid.endpoints?.map((id: string) => new Types.ObjectId(unprefixId(id)!)),
            userId: new Types.ObjectId(userId),
            workspaceId: new Types.ObjectId(workspaceId),
            projectId: new Types.ObjectId(projectId),
            ingressId: generateIngressId(userId),
            ingressUrl: config.app.ingest.v1 + valid.service + '/' + ingress,
            authentication: processedAuth,
        };

        try {
            const saved = await sourceRepository.create(data);
            const source = saved;
            delete source.authentication?.credentials;

            return source;
        } catch (error) {
            logger.error('Failed to create source:', error as Error);
            throw error;
        }
    }

    async getSources(query: Record<string, unknown>, limit: number, page: number) {
        try {
            const { sources, total } = await sourceRepository.findAll({
                query,
                limit,
                page,
            });
            // Decrypt secrets for all sources before returning
            // const decryptedSources = sources.map(source => decryptSourceSecrets(source));
            // return { sources: decryptedSources, total };
            const sanitizedSources = sources.map(source => {
                const s = { ...source };
                delete s.authentication;
                return s;
            });
            return { sources: sanitizedSources, total };
        } catch (error) {
            logger.error('Failed to get sources:', error as Error);
            throw new Error('Failed to get sources');
        }
    }

    async getSourceById(sourceId: string, workspaceId: string, projectId: string) {
        try {
            const source = await sourceRepository.findById(sourceId, workspaceId, projectId);
            if (!source) {
                throw new Error('Source not found');
            }
            // Decrypt secrets before returning
            // return decryptSourceSecrets(source);
            const s = { ...source };
            delete s.authentication;
            return s;
        } catch (error) {
            logger.error('Failed to get source by id:', error as Error);
            throw error;
        }
    }

    async updateSource(
        sourceId: string,
        workspaceId: string,
        projectId: string,
        valid: UpdateSourceInput
    ) {
        try {
            const source = await sourceRepository.findById(sourceId, workspaceId, projectId);
            if (!source) {
                throw new Error('Source not found');
            }

            const updated = await sourceRepository.update(sourceId, workspaceId, projectId, valid);
            if (!updated) {
                throw new Error('Failed to update source');
            }
            const sourceDoc = updated;
            delete sourceDoc.authentication?.credentials;
            return sourceDoc;
        } catch (error) {
            logger.error('Failed to update source:', error as Error);
            throw error;
        }
    }

    async deleteSource(sourceId: string, workspaceId: string, projectId: string): Promise<boolean> {
        try {
            const deleted = await sourceRepository.deleteById(sourceId, workspaceId, projectId);
            if (!deleted) {
                throw new Error('Failed to delete source');
            }
            return deleted;
        } catch (error) {
            logger.error('Failed to delete source:', error as Error);
            throw error;
        }
    }
}

export const sourceService = new SourceService();
