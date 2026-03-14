import { Types } from 'mongoose';
import {
    CreateSourceInput,
    UpdateSourceInput,
    UpdateSourceAuthInput,
    SourceAuthType,
} from './source.schema';
import { sourceRepository } from './source.repo';
import {
    logger,
    ISource,
    secretCrypto,
    generateIngressId,
    decryptSourceSecrets,
    unprefixId,
    prefixId,
    ID_PREFIXES,
} from '@kyrazo/shared';
import { config } from '@/configs';

export class SourceService {
    async createSource(
        valid: CreateSourceInput,
        userId: string,
        workspaceId: string,
        namespaceId: string
    ) {
        if (!valid.authentication?.enabled) {
            throw new Error('Authentication is required for receive type sources.');
        }

        // Handle different authentication types for receive sources
        let processedAuth: any;

        if (valid.authentication.type === 'service' && valid.authentication.service) {
            const encrypted = secretCrypto.encrypt(
                this.deriveNamespaceKey(namespaceId),
                valid.authentication.service.secret
            );
            processedAuth = {
                enabled: true,
                type: 'service' as SourceAuthType,
                credentials: {
                    secret: encrypted.encrypted,
                    iv: encrypted.iv,
                },
            };
        }
        // } else if (
        //     valid.authentication.type === 'api_key' &&
        //     valid.authentication.apiKey
        // ) {
        //     const encrypted = secretCrypto.encrypt(
        //         namespaceId,
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
        //         namespaceId,
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
            service: valid.service,
            endpoints: valid.endpoints?.map(id => new Types.ObjectId(unprefixId(id))),
            userId: new Types.ObjectId(unprefixId(userId)),
            workspaceId: new Types.ObjectId(unprefixId(workspaceId)),
            namespaceId: new Types.ObjectId(unprefixId(namespaceId)),
            ingressId: ingress,
            ingressUrl: config.app.ingest.v1 + valid.service + '/' + ingress,
            authentication: processedAuth,
        };

        try {
            return await sourceRepository.create(data);
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
            // const decryptedSources = sources.map(source =>
            //     decryptSourceSecrets(source)
            // );
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

    async getSourceById(sourceId: string, workspaceId: string, namespaceId: string) {
        try {
            const source = await sourceRepository.findById(sourceId, workspaceId, namespaceId);
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
        namespaceId: string,
        valid: UpdateSourceInput
    ) {
        try {
            const source = await sourceRepository.findById(sourceId, workspaceId, namespaceId);
            if (!source) {
                throw new Error('Source not found');
            }
            // TODO: Handle auth update if necessary, keeping simple update for now based on existing controller
            // If authentication is being updated, we might need to re-encrypt.

            const updated = await sourceRepository.update(
                sourceId,
                workspaceId,
                namespaceId,
                valid
            );
            if (!updated) {
                throw new Error('Failed to update source');
            }
            return decryptSourceSecrets(updated, this.deriveNamespaceKey(updated.namespaceId));
        } catch (error) {
            logger.error('Failed to update source:', error as Error);
            throw error;
        }
    }

    async deleteSource(
        sourceId: string,
        workspaceId: string,
        namespaceId: string
    ): Promise<boolean> {
        try {
            const deleted = await sourceRepository.deleteById(sourceId, workspaceId, namespaceId);
            if (!deleted) {
                throw new Error('Failed to delete source');
            }
            return deleted;
        } catch (error) {
            logger.error('Failed to delete source:', error as Error);
            throw error;
        }
    }
    async updateSourceAuth(
        sourceId: string,
        workspaceId: string,
        namespaceId: string,
        valid: UpdateSourceAuthInput
    ) {
        try {
            const source = await sourceRepository.findById(sourceId, workspaceId, namespaceId);
            if (!source) {
                throw new Error('Source not found');
            }

            let processedAuth: any;

            if (valid.authentication.type === 'service' && valid.authentication.service) {
                const encrypted = secretCrypto.encrypt(
                    this.deriveNamespaceKey(namespaceId),
                    valid.authentication.service.secret
                );
                processedAuth = {
                    enabled: valid.authentication.enabled,
                    type: 'service' as SourceAuthType,
                    credentials: {
                        secret: encrypted.encrypted,
                        iv: encrypted.iv,
                    },
                };
            }

            const updated = await sourceRepository.update(sourceId, workspaceId, namespaceId, {
                authentication: processedAuth,
            });

            if (!updated) {
                throw new Error('Failed to update source authentication');
            }

            return {
                message: 'Authentication updated successfully',
            };
        } catch (error) {
            logger.error('Failed to update source auth:', error as Error);
            throw error;
        }
    }

    private deriveNamespaceKey(namespaceId: string | Types.ObjectId): string {
        return prefixId(namespaceId, 'namespace') || namespaceId.toString();
    }
}

export const sourceService = new SourceService();
