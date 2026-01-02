import { Injectable, inject } from "@angular/core";
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from "@angular/common/http";
import { Observable, Subject, catchError, tap, throwError } from "rxjs";

import { ApiResponse } from "@models/index";
import {
  CreateProjectRequest,
  CreateProjectResponse,
  GetProjectsResponse,
  GetProjectResponse,
  UpdateProjectRequest,
  UpdateProjectResponse,
  DeleteProjectResponse,
  RestoreProjectResponse,
} from "@models/project.types";
import { environment } from "environments/environment";

@Injectable({
  providedIn: "root",
})
export class ProjectService {
  private readonly http = inject(HttpClient);

  // Get projects for current workspace
  getWorkspaceProjects(queryParams?: {
    q?: string;
    page?: number;
    limit?: number;
  }): Observable<GetProjectsResponse> {
    let params = new HttpParams();

    if (queryParams) {
      if (queryParams.q) {
        params = params.set("q", queryParams.q);
      }
      if (queryParams.page) {
        params = params.set("page", queryParams.page.toString());
      }
      if (queryParams.limit) {
        params = params.set("limit", queryParams.limit.toString());
      }
    }

    return this.http
      .get<GetProjectsResponse>(environment.project.getWorkspaceProjects, {
        params,
      })
      .pipe(catchError(this.handleError));
  }

  private projectsUpdated = new Subject<void>();
  projectsUpdated$ = this.projectsUpdated.asObservable();

  // Create project
  create(payload: CreateProjectRequest): Observable<CreateProjectResponse> {
    return this.http
      .post<CreateProjectResponse>(environment.project.create, payload)
      .pipe(
        tap(() => this.projectsUpdated.next()),
        catchError(this.handleError)
      );
  }

  // Get project by ID
  get(projectId: string): Observable<GetProjectResponse> {
    return this.http
      .get<GetProjectResponse>(environment.project.get(projectId))
      .pipe(catchError(this.handleError));
  }

  // Update project
  update(
    projectId: string,
    payload: UpdateProjectRequest
  ): Observable<UpdateProjectResponse> {
    return this.http
      .patch<UpdateProjectResponse>(
        environment.project.update(projectId),
        payload
      )
      .pipe(
        tap(() => this.projectsUpdated.next()),
        catchError(this.handleError)
      );
  }

  // Delete project
  delete(projectId: string): Observable<DeleteProjectResponse> {
    return this.http
      .delete<DeleteProjectResponse>(environment.project.delete(projectId))
      .pipe(
        tap(() => this.projectsUpdated.next()),
        catchError(this.handleError)
      );
  }

  // Restore project
  restore(projectId: string): Observable<RestoreProjectResponse> {
    return this.http
      .post<RestoreProjectResponse>(environment.project.restore(projectId), {})
      .pipe(
        tap(() => this.projectsUpdated.next()),
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error("ProjectService Error:", error);
    return throwError(() => error);
  }
}
