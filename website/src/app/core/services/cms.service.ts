import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { CmsResponse, Article } from '@core/models/cms.models';
import { environment } from 'environments/environment';

@Injectable({
    providedIn: 'root',
})
export class CmsService {
    constructor(private http: HttpClient) {}

    getArticles(params?: any): Observable<CmsResponse<Article[]>> {
        let httpParams = new HttpParams();

        // Default params to populate common relationships
        if (!params || !params.populate) {
            httpParams = httpParams.set('populate', '*');
        }

        if (params) {
            Object.keys(params).forEach((key) => {
                httpParams = httpParams.append(key, params[key]);
            });
        }

        return this.http.get<CmsResponse<Article[]>>(
            `${environment.cms.host}/api/articles`,
            { params: httpParams },
        );
    }

    getArticleBySlug(slug: string): Observable<Article | null> {
        const params = new HttpParams()
            .set('filters[slug][$eq]', slug)
            .set('populate', '*');

        return this.http
            .get<
                CmsResponse<Article[]>
            >(`${environment.cms.host}/api/articles`, { params })
            .pipe(
                map((response) =>
                    response.data.length > 0 ? response.data[0] : null,
                ),
            );
    }

    // Helper to get image URL
    getImageUrl(path: string): string {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return `${environment.cms.host}${path}`;
    }
}
