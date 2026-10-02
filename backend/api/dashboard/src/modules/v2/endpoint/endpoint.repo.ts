import { Endpoint, transformWithId, unprefixId } from '@kyrazo/shared';
import { ClientSession } from 'mongoose';
import { CreateEndpointDto, UpdateEndpointDto } from './endpoint.schema';

export class EndpointRepo {
    async create(
        data: Omit<CreateEndpointDto, 'transformer'> & {
            workspaceId: string;
            namespaceId: string;
            userId: string;
            secrets?: any[];
            isManagedTransform?: boolean;
            transformer?: any;
        },
        options?: { session?: ClientSession }
    ) {
        const endpoint = new Endpoint({
            ...data,
            workspaceId: unprefixId(data.workspaceId),
            namespaceId: unprefixId(data.namespaceId),
            userId: unprefixId(data.userId),
            transformer: data.transformer ? unprefixId(data.transformer as string) : undefined,
        });

        const saved = await endpoint.save({ session: options?.session });
        return transformWithId(saved.toJSON(), 'endpoint') as any;
    }

    async findById(id: string, workspaceId: string, namespaceId: string, includeSecrets = false) {
        const query = Endpoint.findOne({
            _id: unprefixId(id),
            workspaceId: unprefixId(workspaceId),
            namespaceId: unprefixId(namespaceId),
        });

        if (includeSecrets) {
            query.select('+secrets');
        }

        const endpoint = await query.lean();
        return endpoint ? (transformWithId(endpoint, 'endpoint') as any) : null;
    }

    async findAll(
        options: {
            workspaceId: string;
            namespaceId: string;
            q?: string;
            status?: string;
            limit: number;
            page: number;
        }
    ) {
        const query: Record<string, any> = {
            workspaceId: unprefixId(options.workspaceId),
            namespaceId: unprefixId(options.namespaceId),
        };

        if (options.q) query.$text = { $search: options.q };
        if (options.status) query.status = options.status;

        const skip = (options.page - 1) * options.limit;
        
        const [endpoints, total] = await Promise.all([
            Endpoint.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(options.limit)
                .lean(),
            Endpoint.countDocuments(query),
        ]);

        return {
            endpoints: transformWithId(endpoints, 'endpoint') as any[],
            total,
        };
    }

    async update(
        id: string,
        workspaceId: string,
        namespaceId: string,
        data: Omit<UpdateEndpointDto, 'transformer'> & { isManagedTransform?: boolean; transformer?: any },
        options?: { session?: ClientSession }
    ) {
        const updated = await Endpoint.findOneAndUpdate(
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

        return updated ? (transformWithId(updated, 'endpoint') as any) : null;
    }

    async startSession(): Promise<ClientSession> {
        return await Endpoint.startSession();
    }

    async delete(id: string, workspaceId: string, namespaceId: string, options?: { session?: ClientSession }) {
        return await Endpoint.findOneAndDelete({
            _id: unprefixId(id),
            workspaceId: unprefixId(workspaceId),
            namespaceId: unprefixId(namespaceId),
        }, { session: options?.session }).lean();
    }
}

export const endpointRepo = new EndpointRepo();
