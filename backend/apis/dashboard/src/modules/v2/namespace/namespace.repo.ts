import { INamespace, Namespace, transformWithId, unprefixId } from '@kyrazo/shared';
import { ClientSession } from 'mongoose';

export class NamespaceRepositoryV2 {
    async create(data: Partial<INamespace>, options?: { session?: ClientSession }): Promise<INamespace> {
        const namespace = new Namespace(data);
        const savedNamespace = await namespace.save({ session: options?.session });
        return transformWithId(savedNamespace.toJSON(), 'namespace') as any;
    }

    async findById(id: string, workspaceId: string): Promise<INamespace | null> {
        const namespace = await Namespace.findOne({
            _id: unprefixId(id),
            workspaceId: unprefixId(workspaceId),
            isDeleted: false,
        })
            .populate('transformer')
            .lean();
        return namespace ? (transformWithId(namespace, 'namespace') as any) : null;
    }

    async findAll(
        workspaceId: string,
        options: {
            query?: Record<string, unknown>;
            limit?: number;
            page?: number;
        } = { limit: 10, page: 1 }
    ): Promise<{ namespaces: INamespace[]; total: number }> {
        const query: Record<string, any> = {
            ...options.query,
            workspaceId: unprefixId(workspaceId),
            isDeleted: false,
        };

        const skip = options.page ? (options.page - 1) * (options.limit || 10) : 0;
        const [namespaces, total] = await Promise.all([
            Namespace.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(options.limit || 10)
                .lean(),
            Namespace.countDocuments(query),
        ]);

        return {
            namespaces: transformWithId(namespaces, 'namespace') as unknown as INamespace[],
            total,
        };
    }

    async update(
        id: string,
        workspaceId: string,
        data: Partial<INamespace>,
        options?: { session?: ClientSession }
    ): Promise<INamespace | null> {
        const updatedNamespace = await Namespace.findOneAndUpdate(
            {
                _id: unprefixId(id),
                workspaceId: unprefixId(workspaceId),
                isDeleted: false,
            },
            { $set: data },
            { new: true, session: options?.session }
        ).lean();

        return updatedNamespace ? (transformWithId(updatedNamespace, 'namespace') as any) : null;
    }

    async deleteById(
        id: string,
        workspaceId: string,
        options?: { session?: ClientSession }
    ): Promise<boolean> {
        // Soft delete for V2 as well
        const result = await Namespace.findOneAndUpdate(
            {
                _id: unprefixId(id),
                workspaceId: unprefixId(workspaceId),
                isDeleted: false,
            },
            { $set: { isDeleted: true, deletedAt: new Date() } },
            { session: options?.session }
        );
        return result !== null;
    }

    async restoreById(
        id: string,
        workspaceId: string,
        options?: { session?: ClientSession }
    ): Promise<INamespace | null> {
        const restoredNamespace = await Namespace.findOneAndUpdate(
            {
                _id: unprefixId(id),
                workspaceId: unprefixId(workspaceId),
                isDeleted: true,
            },
            { $set: { isDeleted: false, deletedAt: null } },
            { new: true, session: options?.session }
        ).lean();

        return restoredNamespace ? (transformWithId(restoredNamespace, 'namespace') as any) : null;
    }

    async startSession(): Promise<ClientSession> {
        return await Namespace.startSession();
    }
}

export const namespaceRepositoryV2 = new NamespaceRepositoryV2();
