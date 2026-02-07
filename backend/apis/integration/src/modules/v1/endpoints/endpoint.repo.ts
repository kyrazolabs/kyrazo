import { Endpoint, type IEndpoint, transformWithId } from '@kyrazo/shared';

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
    async findById(id: string, workspaceId: string, projectId: string): Promise<IEndpoint | null> {
        return await Endpoint.findOne({
            _id: id,
            workspaceId,
            projectId,
        })
            .select('-secrets -userId -workspaceId -__v')
            .exec();
    }

    async findSecretById(
        id: string,
        workspaceId: string,
        projectId: string
    ): Promise<IEndpoint | null> {
        return await Endpoint.findOne({
            _id: id,
            workspaceId,
            projectId,
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
        projectId: string,
        data: Partial<IEndpoint> | Record<string, unknown>
    ): Promise<IEndpoint | null> {
        // Handle $set operators if present
        const updateOp = Object.keys(data).some(k => k.startsWith('$')) ? data : { $set: data };

        const updated = await Endpoint.findOneAndUpdate(
            { _id: id, workspaceId, projectId },
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

    async deleteById(id: string, workspaceId: string, projectId: string): Promise<boolean> {
        const deleted = await Endpoint.findOneAndDelete({
            _id: id,
            workspaceId,
            projectId,
        })
            .select('-secrets -userId -workspaceId -__v')
            .exec();
        return deleted !== null;
    }
}

export const endpointRepository = new EndpointRepository();
