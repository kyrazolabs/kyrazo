import { ITarget, Target, transformWithId, unprefixId } from '@kyrazo/shared';

export class TargetRepository {
    async create(targetData: Partial<ITarget>): Promise<ITarget> {
        const target = new Target(targetData);
        const savedTarget = await target.save();
        const targetWithoutSecrets = savedTarget.toJSON();
        delete (targetWithoutSecrets as any).secrets;
        return transformWithId(targetWithoutSecrets, 'target') as any;
    }

    async findById(id: string, workspaceId: string, namespaceId: string): Promise<ITarget | null> {
        const target = await Target.findOne({
            _id: unprefixId(id),
            workspaceId: unprefixId(workspaceId),
            namespaceId: unprefixId(namespaceId),
        })
            .select('-secrets')
            .lean();
        return target ? (transformWithId(target, 'target') as any) : null;
    }
    async findSecretById(
        id: string,
        workspaceId: string,
        namespaceId: string
    ): Promise<ITarget | null> {
        const target = await Target.findOne({
            _id: unprefixId(id),
            workspaceId: unprefixId(workspaceId),
            namespaceId: unprefixId(namespaceId),
        })
            .select('+secrets')
            .lean();
        return target ? (transformWithId(target, 'target') as any) : null;
    }

    async findAll(
        options: {
            query?: Record<string, unknown>;
            limit?: number;
            page?: number;
        } = { query: {}, limit: 10, page: 1 }
    ): Promise<{ targets: ITarget[]; total: number }> {
        if (options.query?.workspaceId)
            options.query.workspaceId = unprefixId(options.query.workspaceId as string);
        if (options.query?.namespaceId)
            options.query.namespaceId = unprefixId(options.query.namespaceId as string);

        const skip = options.page ? (options.page - 1) * (options.limit || 10) : 0;
        const [targets, total] = await Promise.all([
            Target.find(options.query || {})
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(options.limit || 10)
                .select('-secrets')
                .lean(),
            Target.countDocuments(options.query || {}),
        ]);
        return {
            targets: transformWithId(targets, 'target') as unknown as ITarget[],
            total,
        };
    }

    async update(
        id: string,
        workspaceId: string,
        namespaceId: string,
        data: Partial<ITarget>
    ): Promise<ITarget | null> {
        const target = await Target.findOneAndUpdate(
            {
                _id: unprefixId(id),
                workspaceId: unprefixId(workspaceId),
                namespaceId: unprefixId(namespaceId),
            },
            data,
            {
                new: true,
            }
        )
            .select('-secrets')
            .lean();
        return target ? (transformWithId(target, 'target') as any) : null;
    }

    async deleteById(id: string, workspaceId: string, namespaceId: string): Promise<boolean> {
        const deleted = await Target.findOneAndDelete({
            _id: unprefixId(id),
            workspaceId: unprefixId(workspaceId),
            namespaceId: unprefixId(namespaceId),
        })
            .select('-secrets')
            .exec();
        return deleted !== null;
    }
}

export const targetRepository = new TargetRepository();
