import type { DeliveryStatus, ProcessingStatus } from '@kyrazo/shared';

export interface DispatchEventInput {
    namespaceId: string;
    targetId: string;
    eventType: string;
    responseCode: number;
    status: DeliveryStatus;
    latencyMs: number;
    timestamp?: Date;
    deliveryId?: string;
}

export interface IngestEventInput {
    namespaceId: string;
    sourceId: string;
    status: ProcessingStatus;
    timestamp?: string;
}
