import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CmsService } from '@core/services/cms.service';
import { Article } from '@core/models/cms.models';
import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { CtaComponent } from '@pages/landing/components/cta/cta.component';

import { ScrollRevealDirective } from '@shared/directives/scroll-reveal.directive';

@Component({
    selector: 'app-blog',
    standalone: true,
    imports: [CommonModule, RouterLink, ScrollRevealDirective, CtaComponent],
    templateUrl: './blog.page.html',
    styleUrl: './blog.page.scss',
})
export class BlogPage {
    private route = inject(ActivatedRoute);
    public cmsService = inject(CmsService);

    articles$ = toSignal(
        this.route.data.pipe(map((data) => data['articles'] as Article[])),
    );
}
