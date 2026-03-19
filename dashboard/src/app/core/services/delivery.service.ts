import { Injectable, inject } from '@angular/core';
import {
    HttpClient,
    HttpErrorResponse,
    HttpParams,
} from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

import { ApiResponse } from '@models/index';
import {
    GetDAResponse,
    GetDAWResponse,
    IDeliveryAttempt,
} from '@models/delivery.types';
import { environment } from 'environments/environment';

// Ingest event types - matches SQLReceivedEvent from backend
export interface IngestEvent {
    event_id: string;
    webhook_id: string;
    workspace_id: string;
    namespace_id: string;
    user_id: string;
    ingress_id: string;
    source: string;
    received_at: string;
    created_at: string;
    updated_at: string;
    headers: string;
    body: string;
    verified: boolean;
    processing_status: 'pending' | 'processed' | 'failed';
    processing_error: string;
    associated_event_id: string;
    route_to?: string | null;
    route_priority?: 'low' | 'normal' | 'high' | 'urgent';
    route_max_retries?: number;
    route_inserted_at?: string;
}

export interface IngestEventStats {
    total_events: number;
    successful_events: number;
    failed_events: number;
    pending_events: number;
    success_rate: number;
}

@Injectable({
    providedIn: 'root',
})
export class DeliveryService {
    private readonly http = inject(HttpClient);

    get(id: string): Observable<ApiResponse<IDeliveryAttempt>> {
        return this.http
            .get<ApiResponse<IDeliveryAttempt>>(environment.delivery.get(id))
            .pipe(catchError(this.handleError));
    }
    gets(queryParams?: {
        q?: string;
        status?:
            | 'pending'
            | 'processing'
            | 'delivered'
            | 'failed'
            | 'timeout'
            | 'network_error';
        page?: number;
        limit?: number;
    }): Observable<ApiResponse<GetDAResponse[]>> {
        let params = new HttpParams();

        if (queryParams) {
            if (queryParams.q) {
                params = params.set('q', queryParams.q);
            }
            if (queryParams.status) {
                params = params.set('status', queryParams.status);
            }
            if (queryParams.page) {
                params = params.set('page', queryParams.page.toString());
            }
            if (queryParams.limit) {
                params = params.set('limit', queryParams.limit.toString());
            }
        }

        return this.http
            .get<
                ApiResponse<GetDAResponse[]>
            >(environment.delivery.gets, { params })
            .pipe(catchError(this.handleError));
    }
    getTargets(queryParams?: { page?: number; limit?: number }): Observable<
        ApiResponse<
            Array<{
                target: string;
                attempts: number;
                success: number;
                failed: number;
            }>
        >
    > {
        let params = new HttpParams();

        if (queryParams) {
            if (queryParams.page) {
                params = params.set('page', queryParams.page.toString());
            }
            if (queryParams.limit) {
                params = params.set('limit', queryParams.limit.toString());
            }
        }

        return this.http
            .get<
                ApiResponse<
                    Array<{
                        target: string;
                        attempts: number;
                        success: number;
                        failed: number;
                    }>
                >
            >(environment.delivery.getTargets, { params })
            .pipe(catchError(this.handleError));
    }
    getByTarget(
        targetId: string,
        queryParams?: {
            q?: string;
            status?:
                | 'pending'
                | 'processing'
                | 'delivered'
                | 'failed'
                | 'timeout'
                | 'network_error';
            page?: number;
            limit?: number;
        },
    ): Observable<ApiResponse<IDeliveryAttempt[]>> {
        let params = new HttpParams();

        if (queryParams) {
            if (queryParams.q) {
                params = params.set('q', queryParams.q);
            }
            if (queryParams.status) {
                params = params.set('status', queryParams.status);
            }
            if (queryParams.page) {
                params = params.set('page', queryParams.page.toString());
            }
            if (queryParams.limit) {
                params = params.set('limit', queryParams.limit.toString());
            }
        }
        return this.http
            .get<
                ApiResponse<IDeliveryAttempt[]>
            >(environment.delivery.getByTarget(targetId), { params })
            .pipe(catchError(this.handleError));
    }
    getBySource(id: string): Observable<ApiResponse<IDeliveryAttempt[]>> {
        return this.http
            .get<
                ApiResponse<IDeliveryAttempt[]>
            >(environment.delivery.getBySource(id))
            .pipe(catchError(this.handleError));
    }

    getStats(): Observable<
        ApiResponse<{
            totalDeliveries: number;
            successfulDeliveries: number;
            failedDeliveries: number;
            successRate: number;
        }>
    > {
        return this.http
            .get<
                ApiResponse<{
                    totalDeliveries: number;
                    successfulDeliveries: number;
                    failedDeliveries: number;
                    successRate: number;
                }>
            >(environment.delivery.getStats)
            .pipe(catchError(this.handleError));
    }

    getTargetOverview(
        targetId: string,
        queryParams?: { days?: string },
    ): Observable<
        ApiResponse<{
            stats: {
                total_deliveries: number;
                successful_deliveries: number;
                failed_deliveries: number;
                pending_deliveries: number;
                average_delivery_time: number | null;
            };
            deliveryTrends: {
                day: string;
                target: string;
                successful: number;
                failed: number;
            }[];
            topEventTypes: {
                target: string;
                event_type: string;
                total: number;
            }[];
            statusCodeDistribution: {
                target: string;
                response_code: number;
                total: number;
            }[];
        }>
    > {
        let params = new HttpParams();
        if (queryParams?.days) {
            params = params.set('days', queryParams.days.toString());
        }
        return this.http
            .get<
                ApiResponse<{
                    stats: {
                        total_deliveries: number;
                        successful_deliveries: number;
                        failed_deliveries: number;
                        pending_deliveries: number;
                        average_delivery_time: number | null;
                    };
                    deliveryTrends: {
                        day: string;
                        target: string;
                        successful: number;
                        failed: number;
                    }[];
                    topEventTypes: {
                        target: string;
                        event_type: string;
                        total: number;
                    }[];
                    statusCodeDistribution: {
                        target: string;
                        response_code: number;
                        total: number;
                    }[];
                }>
            >(environment.analytics.targetOverview(targetId), { params })
            .pipe(catchError(this.handleError));
    }

    // Ingest Events Methods
    getIngestEvents(queryParams?: {
        q?: string;
        status?: 'pending' | 'processed' | 'failed';
        page?: number;
        limit?: number;
    }): Observable<ApiResponse<IngestEvent[]>> {
        let params = new HttpParams();

        if (queryParams) {
            if (queryParams.q) {
                params = params.set('q', queryParams.q);
            }
            if (queryParams.status) {
                params = params.set('status', queryParams.status);
            }
            if (queryParams.page) {
                params = params.set('page', queryParams.page.toString());
            }
            if (queryParams.limit) {
                params = params.set('limit', queryParams.limit.toString());
            }
        }

        return this.http
            .get<
                ApiResponse<IngestEvent[]>
            >(environment.ingest.gets, { params })
            .pipe(catchError(this.handleError));
    }

    getIngestEventById(eventId: string): Observable<ApiResponse<IngestEvent>> {
        return this.http
            .get<ApiResponse<IngestEvent>>(environment.ingest.get(eventId))
            .pipe(catchError(this.handleError));
    }

    getReceivedEventsBySource(
        sourceId: string,
        queryParams?: { limit?: number; page?: number },
    ): Observable<ApiResponse<IngestEvent[]>> {
        let params = new HttpParams();

        if (queryParams) {
            if (queryParams.page) {
                params = params.set('page', queryParams.page.toString());
            }
            if (queryParams.limit) {
                params = params.set('limit', queryParams.limit.toString());
            }
        }

        return this.http
            .get<
                ApiResponse<IngestEvent[]>
            >(environment.ingest.getBySource(sourceId), { params })
            .pipe(catchError(this.handleError));
    }
    private handleError(error: HttpErrorResponse): Observable<never> {
        let errorMessage = 'An unknown error occurred';

        if (error.error instanceof ErrorEvent) {
            // Client-side error
            errorMessage = `Client Error: ${error.error.message}`;
        } else {
            // Server-side error
            errorMessage = `Server Error Code: ${error.status}\nMessage: ${error.message}`;

            // You can customize error messages based on status codes
            switch (error.status) {
                case 400:
                    errorMessage = 'Bad Request: Please check your input data';
                    break;
                case 401:
                    errorMessage = 'Unauthorized: Please log in again';
                    break;
                case 403:
                    errorMessage =
                        'Forbidden: You do not have permission to perform this action';
                    break;
                case 404:
                    errorMessage =
                        'Not Found: The requested source does not exist';
                    break;
                case 409:
                    errorMessage =
                        'Conflict: A source with this name already exists';
                    break;
                case 422:
                    errorMessage =
                        'Validation Error: Please check your input data';
                    break;
                case 500:
                    errorMessage =
                        'Internal Server Error: Please try again later';
                    break;
            }
        }

        console.error('WebhooksService Error:', error);
        return throwError(() => new Error(errorMessage));
    }
}
