import type { DeliveryStatus, ProcessingStatus } from '@kyrazo/shared';

export interface DispatchEventInput {
    namespaceId: string;
    targetId: string;
    event: string;
    responseCode: number;
    status: DeliveryStatus;
    latencyMs: number;
    timestamp?: Date;
    deliveryId?: string | number | bigint;
}

export interface IngestEventInput {
    namespaceId: string;
    sourceId: string;
    status: ProcessingStatus;
    timestamp?: string;
}
