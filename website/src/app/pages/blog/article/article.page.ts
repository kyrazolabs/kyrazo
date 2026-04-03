import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CmsService } from '@core/services/cms.service';
import { Article } from '@core/models/cms.models';
import { MarkdownPipe } from '@shared/pipes/markdown.pipe';
import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-article',
    standalone: true,
    imports: [CommonModule, RouterLink, MarkdownPipe],
    templateUrl: './article.page.html',
    styleUrls: ['./article.page.scss'],
})
export class ArticlePage {
    private route = inject(ActivatedRoute);
    public cmsService = inject(CmsService);

    article$ = toSignal(
        this.route.data.pipe(map((data) => data['article'] as Article)),
    );
}
