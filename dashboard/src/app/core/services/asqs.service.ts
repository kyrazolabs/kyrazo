import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { ApiResponse } from '@models/index';
import { IASQSQueue, CreateASQSRequest, UpdateASQSRequest } from '@models/asqs.types';
import { environment } from 'environments/environment';

@Injectable({
    providedIn: 'root',
})
export class ASQSService {
    private readonly http = inject(HttpClient);

    get(id: string): Observable<ApiResponse<IASQSQueue>> {
        return this.http
            .get<ApiResponse<IASQSQueue>>(environment.asqs.get(id))
            .pipe(catchError(this.handleError));
    }

    gets(): Observable<ApiResponse<IASQSQueue[]>> {
        return this.http
            .get<ApiResponse<IASQSQueue[]>>(environment.asqs.gets)
            .pipe(catchError(this.handleError));
    }

    create(payload: CreateASQSRequest): Observable<ApiResponse<IASQSQueue>> {
        return this.http
            .post<ApiResponse<IASQSQueue>>(environment.asqs.create, payload)
            .pipe(catchError(this.handleError));
    }

    update(id: string, payload: UpdateASQSRequest): Observable<ApiResponse<IASQSQueue>> {
        return this.http
            .patch<ApiResponse<IASQSQueue>>(environment.asqs.update(id), payload)
            .pipe(catchError(this.handleError));
    }

    delete(id: string): Observable<ApiResponse<void>> {
        return this.http
            .delete<ApiResponse<void>>(environment.asqs.delete(id))
            .pipe(catchError(this.handleError));
    }

    test(payload: CreateASQSRequest): Observable<ApiResponse<{ success: boolean; message: string }>> {
        return this.http
            .post<ApiResponse<{ success: boolean; message: string }>>(environment.asqs.test, payload)
            .pipe(catchError(this.handleError));
    }

    private handleError(error: HttpErrorResponse) {
        let errorMessage = 'An unknown error occurred!';
        if (error.error instanceof ErrorEvent) {
            errorMessage = `Error: ${error.error.message}`;
        } else {
            errorMessage = error.error?.message || `Error Code: ${error.status}\nMessage: ${error.message}`;
        }
        return throwError(() => new Error(errorMessage));
    }
}
