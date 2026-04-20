import {
    ISource,
    Source,
    transformWithId,
    unprefixId,
} from '@kyrazo/shared';
import { ClientSession } from 'mongoose';

export class SourceRepositoryV2 {
    async create(data: Partial<ISource>, options?: { session?: ClientSession }): Promise<ISource> {
        const source = new Source(data);
        const savedSource = await source.save({ session: options?.session });
        return transformWithId(savedSource.toJSON(), 'source') as any;
    }

    async findById(
        id: string,
        workspaceId: string,
        namespaceId: string
    ): Promise<ISource | null> {
        const source = await Source.findOne({
            _id: unprefixId(id),
            workspaceId: unprefixId(workspaceId),
            namespaceId: unprefixId(namespaceId),
        }).lean();
        return source ? (transformWithId(source, 'source') as any) : null;
    }

    async findAll(
        workspaceId: string,
        namespaceId: string,
        options: {
            query?: Record<string, unknown>;
            limit?: number;
            page?: number;
        } = { limit: 10, page: 1 }
    ): Promise<{ sources: ISource[]; total: number }> {
        const query: Record<string, any> = {
            ...options.query,
            workspaceId: unprefixId(workspaceId),
            namespaceId: unprefixId(namespaceId),
        };

        const skip = options.page ? (options.page - 1) * (options.limit || 10) : 0;
        const [sources, total] = await Promise.all([
            Source.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(options.limit || 10)
                .lean(),
            Source.countDocuments(query),
        ]);

        return {
            sources: transformWithId(sources, 'source') as unknown as ISource[],
            total,
        };
    }

    async update(
        id: string,
        workspaceId: string,
        namespaceId: string,
        data: Partial<ISource>,
        options?: { session?: ClientSession }
    ): Promise<ISource | null> {
        const updatedSource = await Source.findOneAndUpdate(
            {
                _id: unprefixId(id),
                workspaceId: unprefixId(workspaceId),
                namespaceId: unprefixId(namespaceId),
            },
            { $set: data },
            { new: true, session: options?.session }
        ).lean();

        return updatedSource ? (transformWithId(updatedSource, 'source') as any) : null;
    }

    async deleteById(
        id: string,
        workspaceId: string,
        namespaceId: string,
        options?: { session?: ClientSession }
    ): Promise<boolean> {
        const result = await Source.findOneAndDelete(
            {
                _id: unprefixId(id),
                workspaceId: unprefixId(workspaceId),
                namespaceId: unprefixId(namespaceId),
            },
            { session: options?.session }
        );
        return result !== null;
    }

    async startSession(): Promise<ClientSession> {
        return await Source.startSession();
    }
}

export const sourceRepositoryV2 = new SourceRepositoryV2();
