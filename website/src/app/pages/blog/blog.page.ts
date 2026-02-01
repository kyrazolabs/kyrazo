import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CmsService } from '@core/services/cms.service';
import { Article } from '@core/models/cms.models';

@Component({
    selector: 'app-blog',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './blog.page.html',
    styleUrl: './blog.page.scss',
})
export class BlogPage implements OnInit {
    articles = signal<Article[]>([]);
    isLoading = signal<boolean>(true);
    error = signal<string | null>(null);

    constructor(public cmsService: CmsService) {}

    ngOnInit() {
        this.loadArticles();
    }

    loadArticles() {
        this.cmsService.getArticles().subscribe({
            next: (response) => {
                this.articles.set(response.data);
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Failed to load articles', err);
                this.error.set(
                    'Failed to load articles. Please try again later.',
                );
                this.isLoading.set(false);
            },
        });
    }
}
