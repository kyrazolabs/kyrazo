import { Component, inject } from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { PostHogService } from '@core/3rd-party/posthog';
import { CtaComponent } from "@pages/landing/components/cta/cta.component";

@Component({
    selector: 'app-terms-of-service',
    standalone: true,
    imports: [CommonModule, RouterLink, CtaComponent],
    templateUrl: './terms-of-service.html',
    styleUrl: './terms-of-service.scss',
})
export class TermsOfService {
    private posthog = inject(PostHogService);

    ngOnInit() {
        this.posthog.capture('terms_of_service_viewed');
    }
}
