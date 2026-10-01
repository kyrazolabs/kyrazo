import { unprefixId } from '@kyrazo/shared';
import { AnalyticsRepo } from './analytics.repo';

export class AnalyticsService {
    static async getDispatchOverview(days: number, workspaceId: string, namespaceId: string) {
        return await AnalyticsRepo.getDispatchOverview(
            days,
            unprefixId(workspaceId) ?? '',
            unprefixId(namespaceId) ?? ''
        );
    }

    static async getTargetOverview(
        days: number,
        workspaceId: string,
        targetId: string,
        namespaceId: string
    ) {
        return await AnalyticsRepo.getTargetOverview(
            days,
            unprefixId(workspaceId) ?? '',
            unprefixId(targetId) ?? '',
            unprefixId(namespaceId) ?? ''
        );
    }

    static async getIngestOverview(days: number, workspaceId: string, namespaceId: string) {
        return await AnalyticsRepo.getIngestOverview(
            days,
            unprefixId(workspaceId) ?? '',
            unprefixId(namespaceId) ?? ''
        );
    }
}
