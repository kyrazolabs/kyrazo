import { IPagination, SQLIngestEvent } from '@kyrazo/shared';

export interface IGetIngestEventsResponse {
    success: true;
    pagination: IPagination;
    data: SQLIngestEvent[];
}
export interface IGetIngestEventResponse {
    success: true;
    data: SQLIngestEvent;
}
