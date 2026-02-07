import { Component, signal } from '@angular/core';
// Force reload
import { rxResource } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CmsService } from '@core/services/cms.service';
import { Article } from '@core/models/cms.models';
import { MarkdownPipe } from '@shared/pipes/markdown.pipe';
import { of } from 'rxjs';

@Component({
    selector: 'app-article',
    standalone: true,
    imports: [CommonModule, RouterLink, MarkdownPipe],
    templateUrl: './article.page.html',
    styles: [],
})
export class ArticlePage {
    articleResource = rxResource<Article | null, string | null>({
        params: () => this.route.snapshot.paramMap.get('slug'),
        stream: (params) => {
            const slug = params.params;
            if (!slug) return of(null);
            return this.cmsService.getArticleBySlug(slug);
        },
    });

    constructor(
        private route: ActivatedRoute,
        public cmsService: CmsService,
    ) {}

    isLoading$ = this.articleResource.isLoading;
    article$ = this.articleResource.value;
    error$ = this.articleResource.error;
}
