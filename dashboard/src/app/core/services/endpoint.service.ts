import { Injectable, inject } from '@angular/core';
import {
    HttpClient,
    HttpErrorResponse,
    HttpParams,
} from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

import { EndpointStatus, IEndpoint } from '@models/endpoint.types';
import { environment } from 'environments/environment';
import { ApiResponse } from '@models/index';

@Injectable({
    providedIn: 'root',
})
export class EndpointService {
    private readonly http = inject(HttpClient);

    create(
        payload: Omit<IEndpoint, '_id' | 'userId'>,
    ): Observable<ApiResponse<IEndpoint>> {
        return this.http
            .post<ApiResponse<IEndpoint>>(environment.endpointV2.create, payload)
            .pipe(catchError(this.handleError));
    }

    update(
        id: string,
        payload: Partial<IEndpoint>,
    ): Observable<ApiResponse<IEndpoint>> {
        return this.http
            .patch<
                ApiResponse<IEndpoint>
            >(environment.endpointV2.update(id), payload)
            .pipe(catchError(this.handleError));
    }

    updateStatus(
        id: string,
        status: EndpointStatus,
    ): Observable<ApiResponse<IEndpoint>> {
        return this.update(id, { status });
    }

    get(id: string): Observable<ApiResponse<IEndpoint>> {
        return this.http
            .get<ApiResponse<IEndpoint>>(environment.endpointV2.get(id))
            .pipe(catchError(this.handleError));
    }

    getSecret(id: string): Observable<ApiResponse<string>> {
        return this.http
            .get<ApiResponse<string>>(environment.endpointV2.getSecret(id))
            .pipe(catchError(this.handleError));
    }

    gets(queryParams?: {
        q?: string;
        status?: EndpointStatus;
        page?: number;
        limit?: number;
    }): Observable<ApiResponse<IEndpoint[]>> {
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
                ApiResponse<IEndpoint[]>
            >(environment.endpointV2.gets, { params })
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
                        'Not Found: The requested endpoint does not exist';
                    break;
                case 409:
                    errorMessage =
                        'Conflict: A endpoint with this name already exists';
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
