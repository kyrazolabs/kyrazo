import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostHogService } from '@core/3rd-party/posthog';
import { CtaComponent } from "@pages/landing/components/cta/cta.component";

@Component({
    selector: 'app-gdpr-page',
    standalone: true,
    imports: [CommonModule, CtaComponent],
    templateUrl: './gdpr.page.html',
    styleUrl: './gdpr.page.scss',
})
export class GDPRPage implements OnInit {
    private posthog = inject(PostHogService);

    ngOnInit() {
        this.posthog.capture('gdpr_compliance_viewed');
    }
}
