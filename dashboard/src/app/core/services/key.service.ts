import { Injectable, inject } from "@angular/core";
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from "@angular/common/http";
import { Observable, catchError, throwError } from "rxjs";

import { environment } from "environments/environment";
import { ApiResponse } from "@models/index";
import { ISecret } from "@models/key.types";

export interface CreateKeyRequest {
  name: string;
  scopes: string[];
  expiresAt?: Date;
}

export interface GetKeysResponse {
  data: ISecret[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

@Injectable({
  providedIn: "root",
})
export class KeyService {
  private http = inject(HttpClient);

  create(payload: CreateKeyRequest): Observable<ApiResponse<ISecret>> {
    return this.http
      .post<ApiResponse<ISecret>>(environment.key.create, payload)
      .pipe(catchError(this.handleError));
  }

  gets(queryParams?: {
    q?: string;
    page?: number;
    limit?: number;
  }): Observable<ApiResponse<ISecret[]>> {
    let params = new HttpParams();

    if (queryParams) {
      if (queryParams.q) params = params.set("q", queryParams.q);
      if (queryParams.page)
        params = params.set("page", queryParams.page.toString());
      if (queryParams.limit)
        params = params.set("limit", queryParams.limit.toString());
    }

    return this.http
      .get<ApiResponse<ISecret[]>>(environment.key.gets, { params })
      .pipe(catchError(this.handleError));
  }

  checkScopes(
    keyId: string
  ): Observable<ApiResponse<{ id: string; scopes: string[] }>> {
    return this.http
      .get<ApiResponse<{ id: string; scopes: string[] }>>(
        environment.key.checkScopes(keyId)
      )
      .pipe(catchError(this.handleError));
  }

  revoke(keyId: string): Observable<ApiResponse<null>> {
    return this.http
      .delete<ApiResponse<null>>(environment.key.revoke(keyId))
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = "An unknown error occurred";

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Server Error Code: ${error.status}\nMessage: ${error.message}`;

      // You can customize error messages based on status codes
      switch (error.status) {
        case 400:
          errorMessage = "Bad Request: Please check your input data";
          break;
        case 401:
          errorMessage = "Unauthorized: Please log in again";
          break;
        case 403:
          errorMessage =
            "Forbidden: You do not have permission to perform this action";
          break;
        case 404:
          errorMessage = "Not Found: The requested webhook does not exist";
          break;
        case 409:
          errorMessage = "Conflict: A webhook with this name already exists";
          break;
        case 422:
          errorMessage = "Validation Error: Please check your input data";
          break;
        case 500:
          errorMessage = "Internal Server Error: Please try again later";
          break;
      }
    }

    console.error("WebhooksService Error:", error);
    return throwError(() => new Error(errorMessage));
  }
}
