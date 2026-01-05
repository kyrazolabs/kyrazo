import { Injectable, inject } from "@angular/core";
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from "@angular/common/http";
import { Observable, catchError, throwError } from "rxjs";

import { ApiResponse } from "@models/index";
import {
  CreateWorkspaceRequest,
  CreateWorkspaceResponse,
  GetUserWorkspacesResponse,
  GetWorkspaceResponse,
  UpdateWorkspaceRequest,
  UpdateWorkspaceResponse,
  WorkspaceActionResponse,
  InviteWorkspaceMemberRequest,
  UpdateInvitationStatusRequest,
  UpdateWorkspaceMemberRoleRequest,
  WorkspaceMemberRequest,
  GetWorkspaceMembersResponse,
  GetWorkspaceByIdRequest,
} from "@models/workspaces.types";
import { environment } from "environments/environment";

@Injectable({
  providedIn: "root",
})
export class WorkspaceService {
  private readonly http = inject(HttpClient);

  // Create Workspace
  create(payload: CreateWorkspaceRequest): Observable<CreateWorkspaceResponse> {
    return this.http
      .post<CreateWorkspaceResponse>(environment.workspace.create, payload)
      .pipe(catchError(this.handleError));
  }

  // Get User Workspaces
  gets(): Observable<GetUserWorkspacesResponse> {
    return this.http
      .get<GetUserWorkspacesResponse>(environment.workspace.gets)
      .pipe(catchError(this.handleError));
  }

  // Get Workspace by ID
  get(workspaceId: string): Observable<GetWorkspaceResponse> {
    return this.http
      .get<GetWorkspaceResponse>(environment.workspace.get(workspaceId))
      .pipe(catchError(this.handleError));
  }

  // Update Workspace
  update(
    workspaceId: string,
    payload: UpdateWorkspaceRequest
  ): Observable<UpdateWorkspaceResponse> {
    return this.http
      .patch<UpdateWorkspaceResponse>(
        environment.workspace.update(workspaceId),
        payload
      )
      .pipe(catchError(this.handleError));
  }

  // Delete Workspace
  delete(workspaceId: string): Observable<WorkspaceActionResponse> {
    return this.http
      .delete<WorkspaceActionResponse>(
        environment.workspace.delete(workspaceId)
      )
      .pipe(catchError(this.handleError));
  }

  // Restore Workspace
  restore(workspaceId: string): Observable<WorkspaceActionResponse> {
    return this.http
      .post<WorkspaceActionResponse>(
        environment.workspace.restore(workspaceId),
        {}
      )
      .pipe(catchError(this.handleError));
  }

  // Archive Workspace
  archive(workspaceId: string): Observable<WorkspaceActionResponse> {
    return this.http
      .post<WorkspaceActionResponse>(
        environment.workspace.archive(workspaceId),
        {}
      )
      .pipe(catchError(this.handleError));
  }

  // Unarchive Workspace
  unarchive(workspaceId: string): Observable<WorkspaceActionResponse> {
    return this.http
      .post<WorkspaceActionResponse>(
        environment.workspace.unarchive(workspaceId),
        {}
      )
      .pipe(catchError(this.handleError));
  }

  // Invite User to Workspace
  inviteUser(
    workspaceId: string,
    payload: InviteWorkspaceMemberRequest
  ): Observable<WorkspaceActionResponse> {
    return this.http
      .post<WorkspaceActionResponse>(
        environment.workspace.invite(workspaceId),
        payload
      )
      .pipe(catchError(this.handleError));
  }

  // Accept Workspace Invitation
  acceptInvitation(token: string): Observable<WorkspaceActionResponse> {
    return this.http
      .post<WorkspaceActionResponse>(
        environment.workspace.acceptInvitation(token),
        {}
      )
      .pipe(catchError(this.handleError));
  }

  // Get Invitation Details
  getInvitationDetails(token: string): Observable<ApiResponse<any>> {
    return this.http
      .get<ApiResponse<any>>(environment.workspace.getInvitationDetails(token))
      .pipe(catchError(this.handleError));
  }

  // Reject Workspace Invitation
  rejectInvitation(token: string): Observable<WorkspaceActionResponse> {
    return this.http
      .post<WorkspaceActionResponse>(
        environment.workspace.rejectInvitation(token),
        {}
      )
      .pipe(catchError(this.handleError));
  }

  // Remove User from Workspace
  removeUser(
    workspaceId: string,
    userId: string
  ): Observable<WorkspaceActionResponse> {
    return this.http
      .delete<WorkspaceActionResponse>(
        environment.workspace.removeMember(workspaceId, userId)
      )
      .pipe(catchError(this.handleError));
  }

  // Update User Role in Workspace
  updateUserRole(
    workspaceId: string,
    payload: UpdateWorkspaceMemberRoleRequest
  ): Observable<WorkspaceActionResponse> {
    return this.http
      .patch<WorkspaceActionResponse>(
        environment.workspace.updateMemberRole(workspaceId),
        payload
      )
      .pipe(catchError(this.handleError));
  }

  // Get Workspace Members
  getMembers(workspaceId: string): Observable<GetWorkspaceMembersResponse> {
    return this.http
      .get<GetWorkspaceMembersResponse>(
        environment.workspace.getMembers(workspaceId)
      )
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error("WorkspaceService Error:", error);
    return throwError(() => error);
  }
}
