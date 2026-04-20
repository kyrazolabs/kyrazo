import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { ApiResponse } from '@models/index';
import { IS3Bucket, CreateS3Request } from '@models/s3.types';
import { environment } from 'environments/environment';

@Injectable({
    providedIn: 'root',
})
export class S3Service {
    private readonly http = inject(HttpClient);

    gets(): Observable<ApiResponse<IS3Bucket[]>> {
        return this.http
            .get<ApiResponse<IS3Bucket[]>>(environment.s3.gets)
            .pipe(catchError(this.handleError));
    }

    create(payload: CreateS3Request): Observable<ApiResponse<IS3Bucket>> {
        return this.http
            .post<ApiResponse<IS3Bucket>>(environment.s3.create, payload)
            .pipe(catchError(this.handleError));
    }

    test(payload: CreateS3Request): Observable<ApiResponse<{ success: boolean; message: string }>> {
        return this.http
            .post<ApiResponse<{ success: boolean; message: string }>>(environment.s3.test, payload)
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
