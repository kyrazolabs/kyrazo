import { AnalyticsRepo as CHAnalyticsRepo, logger } from '@kyrazo/shared';

export class AnalyticsRepo {
    static async getDispatchOverview(days: number = 7, workspaceId: string, projectId: string) {
        try {
            const data = await CHAnalyticsRepo.getDispatchOverview(days, workspaceId, projectId);
            if (!data) throw new Error('Failed to get dispatch overview from ClickHouse');
            return data;
        } catch (error) {
            logger.error('Failed to get dispatch overview', error as Error);
            throw error;
        }
    }

    static async getTargetOverview(
        days: number = 7,
        workspaceId: string,
        targetId: string,
        projectId: string
    ) {
        try {
            const data = await CHAnalyticsRepo.getTargetOverview(
                days,
                workspaceId,
                targetId,
                projectId
            );
            if (!data) throw new Error('Failed to get target overview from ClickHouse');
            return data;
        } catch (error) {
            logger.error('Failed to get target overview', error as Error);
            throw error;
        }
    }

    static async getIngestOverview(days: number = 7, workspaceId: string, projectId: string) {
        try {
            const data = await CHAnalyticsRepo.getIngestOverview(days, workspaceId, projectId);
            if (!data) throw new Error('Failed to get ingest overview from ClickHouse');
            return data;
        } catch (error) {
            logger.error('Failed to get ingest overview', error as Error);
            throw error;
        }
    }
}
