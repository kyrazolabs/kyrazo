import { IPagination } from '.';
import { SQLIngestEvent } from '../models/clickhouse/types';

export interface IGetIngestEventsResponse {
    success: true;
    pagination: IPagination;
    data?: SQLIngestEvent[];
}

export interface IGetIngestEventResponse {
    success: true;
    data?: SQLIngestEvent;
}
