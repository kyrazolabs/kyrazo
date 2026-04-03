import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Article } from '@core/models/cms.models';
import { CmsService } from '@core/services/cms.service';
import { map } from 'rxjs';

export const blogResolver: ResolveFn<Article[]> = (route, state) => {
    const cmsService = inject(CmsService);
    return cmsService.getArticles().pipe(map((response) => response.data));
};
