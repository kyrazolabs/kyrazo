import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';
import {
    GetTransformsResponse,
    GetTransformResponse,
    GetVersionsResponse,
    CreateTransformRequest,
    UpdateTransformRequest,
    TestTransformRequest,
    TestTransformResponse,
} from '@models/transform.types';

@Injectable({
    providedIn: 'root',
})
export class TransformService {
    private http = inject(HttpClient);

    gets(params?: any): Observable<GetTransformsResponse> {
        return this.http.get<GetTransformsResponse>(environment.transform.gets, {
            params,
        });
    }

    get(id: string): Observable<GetTransformResponse> {
        return this.http.get<GetTransformResponse>(environment.transform.get(id));
    }

    create(data: CreateTransformRequest): Observable<GetTransformResponse> {
        return this.http.post<GetTransformResponse>(
            environment.transform.create,
            data,
        );
    }

    update(
        id: string,
        data: UpdateTransformRequest,
    ): Observable<GetTransformResponse> {
        return this.http.put<GetTransformResponse>(
            environment.transform.update(id),
            data,
        );
    }

    delete(id: string): Observable<any> {
        return this.http.delete(environment.transform.delete(id));
    }

    getVersions(id: string): Observable<GetVersionsResponse> {
        return this.http.get<GetVersionsResponse>(
            environment.transform.versions(id),
        );
    }

    rollback(id: string, version: number): Observable<any> {
        return this.http.post(
            environment.transform.rollback(id, version),
            {},
        );
    }

    test(data: TestTransformRequest): Observable<TestTransformResponse> {
        // If transformId is provided, use the :id/test endpoint, otherwise use general /test
        const url = environment.transform.test(data.transformId || undefined);
        if (data.transformId) {
            return this.http.put<TestTransformResponse>(url, {
                code: data.code,
                payload: data.payload,
            });
        }
        return this.http.post<TestTransformResponse>(url, data);
    }
}
