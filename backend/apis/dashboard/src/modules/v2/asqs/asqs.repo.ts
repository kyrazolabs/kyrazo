import { ASQS, transformWithId, unprefixId } from '@kyrazo/shared';
import { CreateASQSDto, UpdateASQSDto } from './asqs.types';

export class ASQSRepo {
    async create(data: CreateASQSDto & { workspaceId: string; namespaceId: string; iv: string }) {
        const asqs = await ASQS.create({
            ...data,
            workspaceId: unprefixId(data.workspaceId),
            namespaceId: unprefixId(data.namespaceId),
            transformId: data.transformId ? unprefixId(data.transformId) : undefined,
        });

        return transformWithId(asqs, 'sqs') as any;
    }

    async findById(id: string, workspaceId: string, namespaceId: string, includeSecrets = false) {
        const query = ASQS.findOne({
            _id: unprefixId(id),
            workspaceId: unprefixId(workspaceId),
            namespaceId: unprefixId(namespaceId),
        });

        if (includeSecrets) {
            query.select('+secretAccessKey +iv');
        }

        const asqs = await query.lean();
        return asqs ? (transformWithId(asqs, 'sqs') as any) : null;
    }

    async findByNamespace(workspaceId: string, namespaceId: string) {
        const asqsQueues = await ASQS.find({
            workspaceId: unprefixId(workspaceId),
            namespaceId: unprefixId(namespaceId),
        }).lean();

        return transformWithId(asqsQueues, 'sqs') as any;
    }

    async update(
        id: string,
        workspaceId: string,
        namespaceId: string,
        data: UpdateASQSDto & { iv?: string }
    ) {
        const updated = await ASQS.findOneAndUpdate(
            {
                _id: unprefixId(id),
                workspaceId: unprefixId(workspaceId),
                namespaceId: unprefixId(namespaceId),
            },
            {
                ...data,
                transformId: data.transformId ? unprefixId(data.transformId) : undefined,
            },
            { new: true }
        ).lean();

        return updated ? (transformWithId(updated, 'sqs') as any) : null;
    }

    async delete(id: string, workspaceId: string, namespaceId: string) {
        return await ASQS.findOneAndDelete({
            _id: unprefixId(id),
            workspaceId: unprefixId(workspaceId),
            namespaceId: unprefixId(namespaceId),
        }).lean();
    }
}

export const asqsRepo = new ASQSRepo();
