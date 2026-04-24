import { ASQS, transformWithId, unprefixId } from '@kyrazo/shared';
import { ClientSession } from 'mongoose';
import { CreateASQSDto, UpdateASQSDto } from './asqs.types';

export class ASQSRepo {
    async create(data: Omit<CreateASQSDto, 'transformer'> & { workspaceId: string; namespaceId: string; iv: string; isManagedTransform?: boolean; transformer?: any }, options?: { session?: ClientSession }) {
        const asqs = new ASQS({
            ...data,
            workspaceId: unprefixId(data.workspaceId),
            namespaceId: unprefixId(data.namespaceId),
            transformer: data.transformer ? unprefixId(data.transformer as string) : undefined,
        });

        const saved = await asqs.save({ session: options?.session });
        return transformWithId(saved.toJSON(), 'sqs') as any;
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
        data: Omit<UpdateASQSDto, 'transformer'> & { iv?: string; isManagedTransform?: boolean; transformer?: any },
        options?: { session?: ClientSession }
    ) {
        const updated = await ASQS.findOneAndUpdate(
            {
                _id: unprefixId(id),
                workspaceId: unprefixId(workspaceId),
                namespaceId: unprefixId(namespaceId),
            },
            {
                ...data,
                transformer: data.transformer ? unprefixId(data.transformer as string) : undefined,
            },
            { new: true, session: options?.session }
        ).lean();

        return updated ? (transformWithId(updated, 'sqs') as any) : null;
    }

    async startSession(): Promise<ClientSession> {
        return await ASQS.startSession();
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
