import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CmsService } from '@core/services/cms.service';
import { Article } from '@core/models/cms.models';
import { MarkdownPipe } from '@shared/pipes/markdown.pipe';

@Component({
    selector: 'app-article',
    standalone: true,
    imports: [CommonModule, RouterLink, MarkdownPipe],
    templateUrl: './article.page.html',
    styles: [],
})
export class ArticlePage implements OnInit {
    article = signal<Article | null>(null);
    isLoading = signal<boolean>(true);
    error = signal<string | null>(null);

    constructor(
        private route: ActivatedRoute,
        public cmsService: CmsService,
    ) {}

    ngOnInit() {
        this.route.paramMap.subscribe((params) => {
            const slug = params.get('slug');
            if (slug) {
                this.loadArticle(slug);
            } else {
                this.error.set('Article not found');
                this.isLoading.set(false);
            }
        });
    }

    loadArticle(slug: string) {
        this.isLoading.set(true);
        this.cmsService.getArticleBySlug(slug).subscribe({
            next: (article) => {
                if (article) {
                    this.article.set(article);
                } else {
                    this.error.set('Article not found');
                }
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Failed to load article', err);
                this.error.set('Failed to load article');
                this.isLoading.set(false);
            },
        });
    }
}
