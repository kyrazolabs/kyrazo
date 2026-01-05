import type { ITarget } from '@kyrazo/shared';
import { Target } from '@kyrazo/shared';

export class TargetRepository {
    async create(targetData: Partial<ITarget>): Promise<ITarget> {
        const target = new Target(targetData);
        const savedTarget = await target.save();
        const targetWithoutSecrets = savedTarget.toObject();
        delete targetWithoutSecrets.secrets;
        return targetWithoutSecrets;
    }

    async findById(
        id: string,
        workspaceId: string,
        projectId: string
    ): Promise<ITarget | null> {
        return await Target.findOne({
            _id: id,
            workspaceId,
            projectId,
        })
            .select('-secrets')
            .exec();
    }
    async findSecretById(
        id: string,
        workspaceId: string,
        projectId: string
    ): Promise<ITarget | null> {
        return await Target.findOne({
            _id: id,
            workspaceId,
            projectId,
        })
            .select('+secrets')
            .exec();
    }

    async findAll(
        options: {
            query?: Record<string, unknown>;
            limit?: number;
            page?: number;
        } = { query: {}, limit: 10, page: 1 }
    ): Promise<{ targets: ITarget[]; total: number }> {
        const skip = options.page
            ? (options.page - 1) * (options.limit || 10)
            : 0;
        const [targets, total] = await Promise.all([
            Target.find(options.query || {})
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(options.limit || 10)
                .select('-secrets')
                .lean(),
            Target.countDocuments(options.query || {}),
        ]);
        return { targets, total };
    }

    async update(
        id: string,
        workspaceId: string,
        projectId: string,
        data: Partial<ITarget>
    ): Promise<ITarget | null> {
        return await Target.findOneAndUpdate(
            { _id: id, workspaceId, projectId },
            data,
            { new: true }
        )
            .select('-secrets')
            .exec();
    }

    async deleteById(
        id: string,
        workspaceId: string,
        projectId: string
    ): Promise<boolean> {
        const deleted = await Target.findOneAndDelete({
            _id: id,
            workspaceId,
            projectId,
        })
            .select('-secrets')
            .exec();
        return deleted !== null;
    }
}

export const targetRepository = new TargetRepository();
