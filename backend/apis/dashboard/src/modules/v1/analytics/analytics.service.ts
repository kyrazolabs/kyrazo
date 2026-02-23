import { unprefixId } from '@kyrazo/shared';
import { AnalyticsRepo } from './analytics.repo';

export class AnalyticsService {
    static async getDispatchOverview(days: number, workspaceId: string, projectId: string) {
        return await AnalyticsRepo.getDispatchOverview(
            days,
            unprefixId(workspaceId) ?? '',
            unprefixId(projectId) ?? ''
        );
    }

    static async getTargetOverview(
        days: number,
        workspaceId: string,
        targetId: string,
        projectId: string
    ) {
        return await AnalyticsRepo.getTargetOverview(
            days,
            unprefixId(workspaceId) ?? '',
            unprefixId(targetId) ?? '',
            unprefixId(projectId) ?? ''
        );
    }

    static async getIngestOverview(days: number, workspaceId: string, projectId: string) {
        return await AnalyticsRepo.getIngestOverview(
            days,
            unprefixId(workspaceId) ?? '',
            unprefixId(projectId) ?? ''
        );
    }
}
