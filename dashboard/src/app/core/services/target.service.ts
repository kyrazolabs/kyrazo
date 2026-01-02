import { Injectable, inject } from "@angular/core";
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from "@angular/common/http";
import { Observable, catchError, throwError } from "rxjs";
import { ApiResponse } from "@models/index";
import { environment } from "environments/environment";

export interface ITarget {
  _id?: string;
  name: string;
  url: string;
  description?: string;
  enabled: boolean;
  config: {
    timeout: number;
    retryCount: number;
    rateLimit?: number;
  };
  customHeaders?: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: "root",
})
export class TargetService {
  private readonly http = inject(HttpClient);

  create(target: Partial<ITarget>): Observable<ApiResponse<ITarget>> {
    return this.http
      .post<ApiResponse<ITarget>>(environment.target.create, target)
      .pipe(catchError(this.handleError));
  }

  getAll(queryParams?: {
    q?: string;
    enabled?: boolean;
    page?: number;
    limit?: number;
  }): Observable<ApiResponse<ITarget[]>> {
    let params = new HttpParams();

    if (queryParams) {
      if (queryParams.q) params = params.set("q", queryParams.q);
      if (queryParams.enabled !== undefined)
        params = params.set("enabled", queryParams.enabled.toString());
      if (queryParams.page)
        params = params.set("page", queryParams.page.toString());
      if (queryParams.limit)
        params = params.set("limit", queryParams.limit.toString());
    }

    return this.http
      .get<ApiResponse<ITarget[]>>(environment.target.getAll, { params })
      .pipe(catchError(this.handleError));
  }

  getOne(id: string): Observable<ApiResponse<ITarget>> {
    return this.http
      .get<ApiResponse<ITarget>>(environment.target.getOne(id))
      .pipe(catchError(this.handleError));
  }

  update(
    id: string,
    target: Partial<ITarget>
  ): Observable<ApiResponse<ITarget>> {
    return this.http
      .patch<ApiResponse<ITarget>>(environment.target.update(id), target)
      .pipe(catchError(this.handleError));
  }

  updateStatus(id: string, enabled: boolean): Observable<ApiResponse<ITarget>> {
    return this.http
      .put<ApiResponse<ITarget>>(environment.target.updateStatus(id), {
        targetId: id,
        enabled,
      })
      .pipe(catchError(this.handleError));
  }

  delete(id: string): Observable<ApiResponse<boolean>> {
    return this.http
      .delete<ApiResponse<boolean>>(environment.target.delete(id))
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = "An unknown error occurred";

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      errorMessage = `Server Error Code: ${error.status}\nMessage: ${error.message}`;
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      }
    }

    console.error("TargetService Error:", error);
    return throwError(() => new Error(errorMessage));
  }
}
