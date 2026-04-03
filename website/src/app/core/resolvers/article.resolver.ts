import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Article } from '@core/models/cms.models';
import { CmsService } from '@core/services/cms.service';

export const articleResolver: ResolveFn<Article | null> = (route, state) => {
    const cmsService = inject(CmsService);
    const slug = route.paramMap.get('slug');

    if (!slug) {
        return null;
    }

    return cmsService.getArticleBySlug(slug);
};
