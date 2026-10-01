import { Injectable, inject } from '@angular/core';
import {
    HttpClient,
    HttpErrorResponse,
    HttpParams,
} from '@angular/common/http';
import { Observable, Subject, catchError, tap, throwError } from 'rxjs';

import { ApiResponse } from '@models/index';
import {
    CreateNamespaceRequest,
    CreateNamespaceResponse,
    GetNamespacesResponse,
    GetNamespaceResponse,
    UpdateNamespaceRequest,
    UpdateNamespaceResponse,
    DeleteNamespaceResponse,
    RestoreNamespaceResponse,
} from '@models/namespace.types';
import { environment } from 'environments/environment';

@Injectable({
    providedIn: 'root',
})
export class NamespaceService {
    private readonly http = inject(HttpClient);

    // Get namespaces for current workspace
    getWorkspaceNamespaces(queryParams?: {
        q?: string;
        page?: number;
        limit?: number;
    }): Observable<GetNamespacesResponse> {
        let params = new HttpParams();

        if (queryParams) {
            if (queryParams.q) {
                params = params.set('q', queryParams.q);
            }
            if (queryParams.page) {
                params = params.set('page', queryParams.page.toString());
            }
            if (queryParams.limit) {
                params = params.set('limit', queryParams.limit.toString());
            }
        }

        return this.http
            .get<GetNamespacesResponse>(
                environment.namespace.getWorkspaceNamespaces,
                {
                    params,
                },
            )
            .pipe(catchError(this.handleError));
    }

    private namespacesUpdated = new Subject<void>();
    namespacesUpdated$ = this.namespacesUpdated.asObservable();

    // Create namespace
    create(
        payload: CreateNamespaceRequest,
    ): Observable<CreateNamespaceResponse> {
        return this.http
            .post<CreateNamespaceResponse>(
                environment.namespace.create,
                payload,
            )
            .pipe(
                tap(() => this.namespacesUpdated.next()),
                catchError(this.handleError),
            );
    }

    // Get namespace by ID
    get(namespaceId: string): Observable<GetNamespaceResponse> {
        return this.http
            .get<GetNamespaceResponse>(environment.namespace.get(namespaceId))
            .pipe(catchError(this.handleError));
    }

    // Update namespace
    update(
        namespaceId: string,
        payload: UpdateNamespaceRequest,
    ): Observable<UpdateNamespaceResponse> {
        return this.http
            .patch<UpdateNamespaceResponse>(
                environment.namespace.update(namespaceId),
                payload,
            )
            .pipe(
                tap(() => this.namespacesUpdated.next()),
                catchError(this.handleError),
            );
    }

    // Delete namespace
    delete(namespaceId: string): Observable<DeleteNamespaceResponse> {
        return this.http
            .delete<DeleteNamespaceResponse>(
                environment.namespace.delete(namespaceId),
            )
            .pipe(
                tap(() => this.namespacesUpdated.next()),
                catchError(this.handleError),
            );
    }

    // Restore namespace
    restore(namespaceId: string): Observable<RestoreNamespaceResponse> {
        return this.http
            .post<RestoreNamespaceResponse>(
                environment.namespace.restore(namespaceId),
                {},
            )
            .pipe(
                tap(() => this.namespacesUpdated.next()),
                catchError(this.handleError),
            );
    }

    private handleError(error: HttpErrorResponse): Observable<never> {
        console.error('NamespaceService Error:', error);
        return throwError(() => error);
    }
}
