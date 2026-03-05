import { Endpoint, IEndpoint, transformWithId, unprefixId } from '@kyrazo/shared';

export class EndpointRepository {
    async create(endpointData: Partial<IEndpoint>): Promise<IEndpoint> {
        const endpoint = new Endpoint(endpointData);
        const savedEndpoint = await endpoint.save();
        const endpointWithoutSecrets = savedEndpoint.toJSON();
        delete (endpointWithoutSecrets as any).secrets;
        return transformWithId(endpointWithoutSecrets, 'endpoint') as any;
    }
    async findById(
        id: string,
        workspaceId: string,
        namespaceId: string
    ): Promise<IEndpoint | null> {
        const endpoint = await Endpoint.findOne({
            _id: unprefixId(id),
            workspaceId: unprefixId(workspaceId),
            namespaceId: unprefixId(namespaceId),
        })
            .select('-secrets')
            .lean();
        return endpoint ? (transformWithId(endpoint, 'endpoint') as any) : null;
    }

    async findSecretById(
        id: string,
        workspaceId: string,
        namespaceId: string
    ): Promise<IEndpoint | null> {
        const endpoint = await Endpoint.findOne({
            _id: unprefixId(id),
            workspaceId: unprefixId(workspaceId),
            namespaceId: unprefixId(namespaceId),
        })
            .select('+secrets')
            .lean();
        return endpoint ? (transformWithId(endpoint, 'endpoint') as any) : null;
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
                .select('-secrets')
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
            { new: true, runValidators: true }
        )
            .select('-secrets')
            .lean();
        return updated ? (transformWithId(updated, 'endpoint') as unknown as IEndpoint) : null;
    }

    async deleteById(id: string, workspaceId: string, namespaceId: string): Promise<boolean> {
        const deleted = await Endpoint.findOneAndDelete({
            _id: unprefixId(id),
            workspaceId: unprefixId(workspaceId),
            namespaceId: unprefixId(namespaceId),
        })
            .select('-secrets')
            .exec();
        return deleted !== null;
    }
}

export const endpointRepository = new EndpointRepository();
