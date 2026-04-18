import { ASQS, unprefixId } from '@kyrazo/shared';
import { CreateASQSDto, UpdateASQSDto } from './asqs.types';

export class ASQSRepo {
    async create(data: CreateASQSDto & { workspaceId: string; namespaceId: string; iv: string }) {
        return await ASQS.create({
            ...data,
            workspaceId: unprefixId(data.workspaceId),
            namespaceId: unprefixId(data.namespaceId),
            transformId: data.transformId ? unprefixId(data.transformId) : undefined,
        });
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

        return await query.lean();
    }

    async findByNamespace(workspaceId: string, namespaceId: string) {
        return await ASQS.find({
            workspaceId: unprefixId(workspaceId),
            namespaceId: unprefixId(namespaceId),
        }).lean();
    }

    async update(
        id: string,
        workspaceId: string,
        namespaceId: string,
        data: UpdateASQSDto & { iv?: string }
    ) {
        return await ASQS.findOneAndUpdate(
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
