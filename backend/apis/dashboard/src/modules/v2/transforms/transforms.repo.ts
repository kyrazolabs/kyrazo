import { ITransform, ITransformVersion, Transform, TransformVersion, transformWithId, unprefixId } from '@kyrazo/shared';
import { Types } from 'mongoose';

export class TransformRepository {
    async create(data: Partial<ITransform>, userId: string): Promise<ITransform> {
        const session = await Transform.startSession();
        let savedTransform: any;

        await session.withTransaction(async () => {
            const transform = new Transform({
                ...data,
                currentVersion: 1,
            });
            savedTransform = await transform.save({ session });

            const version = new TransformVersion({
                transformId: savedTransform._id,
                version: 1,
                code: data.code,
                createdBy: unprefixId(userId),
            });
            await version.save({ session });
        });

        await session.endSession();
        return transformWithId(savedTransform.toJSON(), 'transformer') as any;
    }

    async findById(id: string, workspaceId: string, namespaceId: string): Promise<ITransform | null> {
        const transform = await Transform.findOne({
            _id: unprefixId(id),
            workspaceId: unprefixId(workspaceId),
            namespaceId: unprefixId(namespaceId),
        }).lean();
        return transform ? (transformWithId(transform, 'transformer') as any) : null;
    }

    async findAll(
        options: {
            query?: Record<string, unknown>;
            limit?: number;
            page?: number;
        } = { query: {}, limit: 10, page: 1 }
    ): Promise<{ transforms: ITransform[]; total: number }> {
        if (options.query?.workspaceId)
            options.query.workspaceId = unprefixId(options.query.workspaceId as string);
        if (options.query?.namespaceId)
            options.query.namespaceId = unprefixId(options.query.namespaceId as string);

        const skip = options.page ? (options.page - 1) * (options.limit || 10) : 0;
        const [transforms, total] = await Promise.all([
            Transform.find(options.query || {})
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(options.limit || 10)
                .lean(),
            Transform.countDocuments(options.query || {}),
        ]);
        return {
            transforms: transformWithId(transforms, 'transformer') as unknown as ITransform[],
            total,
        };
    }

    async update(
        id: string,
        workspaceId: string,
        namespaceId: string,
        data: Partial<ITransform>,
        userId: string
    ): Promise<ITransform | null> {
        const session = await Transform.startSession();
        let updatedTransform: any;

        await session.withTransaction(async () => {
            const existing = await Transform.findOne({
                _id: unprefixId(id),
                workspaceId: unprefixId(workspaceId),
                namespaceId: unprefixId(namespaceId),
            }).session(session);

            if (!existing) return;

            const codeChanged = data.code && data.code !== existing.code;
            
            if (codeChanged) {
                const nextVersion = existing.currentVersion + 1;
                existing.currentVersion = nextVersion;
                existing.code = data.code!;

                const version = new TransformVersion({
                    transformId: existing._id,
                    version: nextVersion,
                    code: data.code,
                    createdBy: unprefixId(userId),
                });
                await version.save({ session });
            }

            if (data.name) existing.name = data.name;
            if (data.description !== undefined) existing.description = data.description;
            if (data.isActive !== undefined) existing.isActive = data.isActive;

            updatedTransform = await existing.save({ session });
        });

        await session.endSession();
        return updatedTransform ? (transformWithId(updatedTransform.toJSON(), 'transformer') as any) : null;
    }

    async deleteById(id: string, workspaceId: string, namespaceId: string): Promise<boolean> {
        // Soft delete/deactivate as requested
        const result = await Transform.findOneAndUpdate(
            {
                _id: unprefixId(id),
                workspaceId: unprefixId(workspaceId),
                namespaceId: unprefixId(namespaceId),
            },
            { isActive: false },
            { new: true }
        );
        return result !== null;
    }

    async getVersions(transformId: string): Promise<ITransformVersion[]> {
        const versions = await TransformVersion.find({
            transformId: unprefixId(transformId),
        })
            .sort({ version: -1 })
            .lean();
        return transformWithId(versions, 'transformerVersion') as unknown as ITransformVersion[];
    }

    async rollback(
        id: string,
        workspaceId: string,
        namespaceId: string,
        versionNumber: number,
        userId: string
    ): Promise<ITransform | null> {
        const session = await Transform.startSession();
        let updatedTransform: any;

        await session.withTransaction(async () => {
            const version = await TransformVersion.findOne({
                transformId: unprefixId(id),
                version: versionNumber,
            }).session(session);

            if (!version) throw new Error('Version not found');

            const existing = await Transform.findOne({
                _id: unprefixId(id),
                workspaceId: unprefixId(workspaceId),
                namespaceId: unprefixId(namespaceId),
            }).session(session);

            if (!existing) return;

            // Rollback becomes a new version if code is different from current
            if (version.code !== existing.code) {
                const nextVersion = existing.currentVersion + 1;
                existing.currentVersion = nextVersion;
                existing.code = version.code;

                const newVersionRecord = new TransformVersion({
                    transformId: existing._id,
                    version: nextVersion,
                    code: version.code,
                    createdBy: unprefixId(userId),
                });
                await newVersionRecord.save({ session });
            }

            updatedTransform = await existing.save({ session });
        });

        await session.endSession();
        return updatedTransform ? (transformWithId(updatedTransform.toJSON(), 'transformer') as any) : null;
    }
}

export const transformRepository = new TransformRepository();
