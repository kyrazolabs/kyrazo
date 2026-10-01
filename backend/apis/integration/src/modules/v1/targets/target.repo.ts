import { Target, type ITarget, transformWithId, unprefixId } from '@kyrazo/shared';

export class TargetRepository {
    async create(targetData: Partial<ITarget>): Promise<ITarget> {
        const target = new Target(targetData);
        const savedTarget = await target.save();
        const targetWithoutSecrets = savedTarget.toObject();
        delete targetWithoutSecrets.secrets;
        delete (targetWithoutSecrets as any).userId;
        delete (targetWithoutSecrets as any).workspaceId;
        delete (targetWithoutSecrets as any).__v;
        return targetWithoutSecrets as unknown as ITarget;
    }

    async findById(id: string, workspaceId: string, namespaceId: string): Promise<ITarget | null> {
        return await Target.findOne({
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
    ): Promise<ITarget | null> {
        return await Target.findOne({
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
                .select('-secrets -userId -workspaceId -__v')
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
        return await Target.findOneAndUpdate(
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
            .select('-secrets -userId -workspaceId -__v')
            .exec();
    }

    async deleteById(id: string, workspaceId: string, namespaceId: string): Promise<boolean> {
        const deleted = await Target.findOneAndDelete({
            _id: unprefixId(id),
            workspaceId: unprefixId(workspaceId),
            namespaceId: unprefixId(namespaceId),
        })
            .select('-secrets -userId -workspaceId -__v')
            .exec();
        return deleted !== null;
    }

    async getTargetsByWorkspaceIdAndNamespaceIdAndTargetIds(
        workspaceId: string,
        namespaceId: string,
        targetIds: string[]
    ): Promise<ITarget[]> {
        return await Target.findActiveByWorkspaceAndNamespaceAndTargetIds(
            workspaceId,
            namespaceId,
            targetIds
        );
    }

    async updateSecret(targetId: string, kid: string, data: { value_enc: string; iv: string }): Promise<boolean> {
        const result = await Target.updateOne(
            { _id: unprefixId(targetId), 'secrets.kid': kid },
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

export const targetRepository = new TargetRepository();
