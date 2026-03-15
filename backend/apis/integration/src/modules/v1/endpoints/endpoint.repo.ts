import { Endpoint, type IEndpoint, transformWithId, unprefixId } from '@kyrazo/shared';

export class EndpointRepository {
    async create(endpointData: Partial<IEndpoint>): Promise<IEndpoint> {
        const endpoint = new Endpoint(endpointData);
        const savedEndpoint = await endpoint.save();
        const endpointWithoutSecrets = savedEndpoint.toObject();
        delete endpointWithoutSecrets.secrets;
        delete (endpointWithoutSecrets as any).userId;
        delete (endpointWithoutSecrets as any).workspaceId;
        delete (endpointWithoutSecrets as any).__v;
        return endpointWithoutSecrets as unknown as IEndpoint;
    }
    async findById(
        id: string,
        workspaceId: string,
        namespaceId: string
    ): Promise<IEndpoint | null> {
        return await Endpoint.findOne({
            _id: unprefixId(id),
            workspaceId: unprefixId(workspaceId),
            namespaceId: unprefixId(namespaceId),
        })
            .select('-secrets -userId -workspaceId -__v')
            .exec();
    }

    async findSecretById(
        id: string,
        workspaceId: string,
        namespaceId: string
    ): Promise<IEndpoint | null> {
        return await Endpoint.findOne({
            _id: unprefixId(id),
            workspaceId: unprefixId(workspaceId),
            namespaceId: unprefixId(namespaceId),
        })
            .select('+secrets -userId -workspaceId -__v')
            .exec();
    }

    async findAll(
        options: {
            query?: Record<string, unknown>;
            limit?: number;
            page?: number;
        } = { query: {}, limit: 10, page: 1 }
    ): Promise<{ endpoints: IEndpoint[]; total: number }> {
        if (options.query?.workspaceId)
            options.query.workspaceId = unprefixId(options.query.workspaceId as string);
        if (options.query?.namespaceId)
            options.query.namespaceId = unprefixId(options.query.namespaceId as string);

        const skip = options.page ? (options.page - 1) * (options.limit || 10) : 0;
        const [endpoints, total] = await Promise.all([
            Endpoint.find(options.query || {})
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(options.limit || 10)
                .select('-secrets -userId -workspaceId -__v')
                .lean(),
            Endpoint.countDocuments(options.query || {}),
        ]);
        return {
            endpoints: transformWithId(endpoints, 'endpoint') as unknown as IEndpoint[],
            total,
        };
    }

    async update(
        id: string,
        workspaceId: string,
        namespaceId: string,
        data: Partial<IEndpoint> | Record<string, unknown>
    ): Promise<IEndpoint | null> {
        // Handle $set operators if present
        const updateOp = Object.keys(data).some(k => k.startsWith('$')) ? data : { $set: data };

        const updated = await Endpoint.findOneAndUpdate(
            {
                _id: unprefixId(id),
                workspaceId: unprefixId(workspaceId),
                namespaceId: unprefixId(namespaceId),
            },
            updateOp,
            {
                new: true,
                runValidators: true,
            }
        )
            .select('-secrets -userId -workspaceId -__v')
            .lean();
        return updated ? (transformWithId(updated, 'endpoint') as unknown as IEndpoint) : null;
    }

    async deleteById(id: string, workspaceId: string, namespaceId: string): Promise<boolean> {
        const deleted = await Endpoint.findOneAndDelete({
            _id: unprefixId(id),
            workspaceId: unprefixId(workspaceId),
            namespaceId: unprefixId(namespaceId),
        })
            .select('-secrets -userId -workspaceId -__v')
            .exec();
        return deleted !== null;
    }

    async updateSecret(endpointId: string, kid: string, data: { value_enc: string; iv: string }): Promise<boolean> {
        const result = await Endpoint.updateOne(
            { _id: unprefixId(endpointId), 'secrets.kid': kid },
            {
                $set: {
                    'secrets.$.value_enc': data.value_enc,
                    'secrets.$.iv': data.iv,
                }
            }
        );
        return result.modifiedCount > 0;
    }
}

export const endpointRepository = new EndpointRepository();
