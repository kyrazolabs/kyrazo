import { Source, ISource } from '@kyrazo/shared';

export class SourceRepository {
    async create(sourceData: Partial<ISource>): Promise<ISource> {
        const source = new Source(sourceData);
        const savedSource = await source.save();
        return savedSource.toObject();
    }

    async findById(
        id: string,
        workspaceId: string,
        projectId: string
    ): Promise<ISource | null> {
        return await Source.findOne({
            _id: id,
            workspaceId,
            projectId,
        })
            .populate('endpoints')
            .lean();
    }

    async findAll(
        options: {
            query?: Record<string, unknown>;
            limit?: number;
            page?: number;
        } = { query: {}, limit: 10, page: 1 }
    ): Promise<{ sources: ISource[]; total: number }> {
        const skip = options.page
            ? (options.page - 1) * (options.limit || 10)
            : 0;
        const [sources, total] = await Promise.all([
            Source.find(options.query || {})
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(options.limit || 10)
                .lean(),
            Source.countDocuments(options.query || {}),
        ]);
        return { sources, total };
    }

    async update(
        id: string,
        workspaceId: string,
        projectId: string,
        data: Partial<ISource> | Record<string, unknown>
    ): Promise<ISource | null> {
        // Handle $set operators if present
        const updateOp = Object.keys(data).some(k => k.startsWith('$'))
            ? data
            : { $set: data };

        return await Source.findOneAndUpdate(
            {
                _id: id,
                workspaceId,
                projectId,
            },
            updateOp,
            { new: true }
        ).lean();
    }

    async deleteById(
        id: string,
        workspaceId: string,
        projectId: string
    ): Promise<boolean> {
        const deleted = await Source.findOneAndDelete({
            _id: id,
            workspaceId,
            projectId,
        }).exec();
        return deleted !== null;
    }
}

export const sourceRepository = new SourceRepository();
