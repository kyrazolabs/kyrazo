import type { DeliveryStatus, ProcessingStatus } from "@kyrazo/shared";

export interface DispatchEventInput {
    projectId: string;
    targetId: string;
    eventType: string;
    responseCode: number;
    status: DeliveryStatus;
    latencyMs: number;
    timestamp?: Date;
    deliveryId?: string;
}

export interface IngestEventInput {
    projectId: string;
    sourceId: string;
    status: ProcessingStatus;
    timestamp?: string;
}
