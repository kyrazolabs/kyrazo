import { Injectable, inject } from "@angular/core";
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from "@angular/common/http";
import { Observable, catchError, throwError, map } from "rxjs";

import {
  CreateSourceRequest,
  CreateSourceResponse,
  GetSourceResponse,
  GetSourcesResponse,
  UpdateSourceRequest,
  UpdateSourceResponse,
  SourceStatus,
} from "@models/source.types";
import { environment } from "environments/environment";
import { ApiResponse } from "@models/index";

@Injectable({
  providedIn: "root",
})
export class SourceService {
  private readonly http = inject(HttpClient);

  create(
    payload: CreateSourceRequest
  ): Observable<ApiResponse<CreateSourceResponse>> {
    const endpoint = environment.source.create;
    return this.http
      .post<ApiResponse<CreateSourceResponse>>(endpoint, payload)
      .pipe(catchError(this.handleError));
  }

  update(
    id: string,
    payload: UpdateSourceRequest
  ): Observable<ApiResponse<UpdateSourceResponse>> {
    // For updates, we need to determine the type. Since the payload might not have type,
    // we'll use a generic update endpoint or fetch the webhook first to determine type
    // For now, let's assume we pass the type or use a default approach
    const endpoint = environment.source.update(id); // Default to receive for now
    return this.http
      .patch<ApiResponse<UpdateSourceResponse>>(endpoint, payload)
      .pipe(catchError(this.handleError));
  }

  get(id: string): Observable<ApiResponse<GetSourceResponse>> {
    return this.http
      .get<ApiResponse<GetSourceResponse>>(environment.source.get(id))
      .pipe(catchError(this.handleError));
  }

  gets(queryParams?: {
    q?: string;
    status?: SourceStatus;
    page?: number;
    limit?: number;
  }): Observable<ApiResponse<GetSourcesResponse[]>> {
    let params = new HttpParams();

    if (queryParams) {
      if (queryParams.q) {
        params = params.set("q", queryParams.q);
      }
      if (queryParams.status) {
        params = params.set("status", queryParams.status);
      }
      if (queryParams.page) {
        params = params.set("page", queryParams.page.toString());
      }
      if (queryParams.limit) {
        params = params.set("limit", queryParams.limit.toString());
      }
    }

    return this.http
      .get<ApiResponse<any>>(environment.source.gets, {
        params,
      })
      .pipe(
        map((response) => {
          if (response.success && Array.isArray(response.data)) {
            response.data = response.data.map((item: any) => {
              if (item.source) {
                return { ...item.source, ingress: item.ingress };
              }
              return item;
            });
          }
          return response as ApiResponse<GetSourcesResponse[]>;
        }),
        catchError(this.handleError)
      );
  }

  delete(id: string) {
    return this.http
      .delete<ApiResponse<any>>(environment.source.delete(id))
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
          errorMessage = "Not Found: The requested source does not exist";
          break;
        case 409:
          errorMessage = "Conflict: A source with this name already exists";
          break;
        case 422:
          errorMessage = "Validation Error: Please check your input data";
          break;
        case 500:
          errorMessage = "Internal Server Error: Please try again later";
          break;
      }
    }

    console.error("SourceService Error:", error);
    return throwError(() => new Error(errorMessage));
  }
}
