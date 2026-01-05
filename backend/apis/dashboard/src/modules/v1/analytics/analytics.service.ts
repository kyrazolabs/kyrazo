import { AnalyticsRepo } from './analytics.repo';

export class AnalyticsService {
    static async getDispatchOverview(
        days: number,
        workspaceId: string,
        projectId: string
    ) {
        return await AnalyticsRepo.getDispatchOverview(
            days,
            workspaceId,
            projectId
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
            workspaceId,
            targetId,
            projectId
        );
    }

    static async getIngestOverview(
        days: number,
        workspaceId: string,
        projectId: string
    ) {
        return await AnalyticsRepo.getIngestOverview(
            days,
            workspaceId,
            projectId
        );
    }
}
