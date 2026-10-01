import { ASQS, unprefixId, type IASQS } from '@kyrazo/shared';

export class ASQSRepository {
    async getASQSById(
        id: string,
        workspaceId: string,
        namespaceId: string
    ): Promise<IASQS | null> {
        return await ASQS.findOne({
            _id: unprefixId(id),
            workspaceId: unprefixId(workspaceId),
            namespaceId: unprefixId(namespaceId),
            enabled: true,
        });
    }
}

export const asqsRepository = new ASQSRepository();
