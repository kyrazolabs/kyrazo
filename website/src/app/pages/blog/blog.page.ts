import { Component, OnInit, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CmsService } from '@core/services/cms.service';
import { Article } from '@core/models/cms.models';
import { map } from 'rxjs';

@Component({
    selector: 'app-blog',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './blog.page.html',
    styleUrl: './blog.page.scss',
})
export class BlogPage {
    articlesResource = rxResource({
        stream: () =>
            this.cmsService
                .getArticles()
                .pipe(map((response) => response.data)),
    });

    articles$ = this.articlesResource.value;
    isLoading$ = this.articlesResource.isLoading;

    constructor(public cmsService: CmsService) {}
}
