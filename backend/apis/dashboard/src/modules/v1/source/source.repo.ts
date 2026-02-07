import { Source, ISource, transformWithId, unprefixId } from '@kyrazo/shared';

export class SourceRepository {
    async create(sourceData: Partial<ISource>): Promise<ISource> {
        const source = new Source(sourceData);
        const savedSource = await source.save();
        return transformWithId(savedSource, 'source') as any;
    }

    async findById(id: string, workspaceId: string, projectId: string): Promise<ISource | null> {
        const source = await Source.findOne({
            _id: unprefixId(id),
            workspaceId: unprefixId(workspaceId),
            projectId: unprefixId(projectId),
        })
            .populate('endpoints')
            .lean();
        return source ? (transformWithId(source, 'source') as unknown as ISource) : null;
    }

    async findAll(
        options: {
            query?: Record<string, unknown>;
            limit?: number;
            page?: number;
        } = { query: {}, limit: 10, page: 1 }
    ): Promise<{ sources: ISource[]; total: number }> {
        if (options.query?.workspaceId)
            options.query.workspaceId = unprefixId(options.query.workspaceId as string);
        if (options.query?.projectId)
            options.query.projectId = unprefixId(options.query.projectId as string);

        const skip = options.page ? (options.page - 1) * (options.limit || 10) : 0;
        const [sources, total] = await Promise.all([
            Source.find(options.query || {})
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(options.limit || 10)
                .lean(),
            Source.countDocuments(options.query || {}),
        ]);
        return {
            sources: transformWithId(sources, 'source') as unknown as ISource[],
            total,
        };
    }

    async update(
        id: string,
        workspaceId: string,
        projectId: string,
        data: Partial<ISource> | Record<string, unknown>
    ): Promise<ISource | null> {
        // Handle $set operators if present
        const updateOp = Object.keys(data).some(k => k.startsWith('$')) ? data : { $set: data };

        const updated = await Source.findOneAndUpdate(
            {
                _id: unprefixId(id),
                workspaceId: unprefixId(workspaceId),
                projectId: unprefixId(projectId),
            },
            updateOp,
            { new: true }
        ).lean();
        return updated ? (transformWithId(updated, 'source') as unknown as ISource) : null;
    }

    async deleteById(id: string, workspaceId: string, projectId: string): Promise<boolean> {
        const deleted = await Source.findOneAndDelete({
            _id: unprefixId(id),
            workspaceId: unprefixId(workspaceId),
            projectId: unprefixId(projectId),
        }).exec();
        return deleted !== null;
    }
}

export const sourceRepository = new SourceRepository();
