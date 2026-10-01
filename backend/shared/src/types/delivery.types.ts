import { IPagination } from '.';
import { SQLDeliveryAttempt } from '../models/clickhouse/types/delivery.types';

export interface IGetDeliveriesResponse {
    success: true;
    pagination: IPagination;
    data?: SQLDeliveryAttempt[];
}

export interface IGetTargetsResponse {
    success: true;
    pagination: IPagination;
    data?: Array<{
        target: string;
        attempts: number;
        success: number;
        failed: number;
    }>;
}
export interface IGetDeliveryResponse {
    success: true;
    data?: SQLDeliveryAttempt;
}
