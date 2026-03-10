import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostHogService } from '@core/3rd-party/posthog';

@Component({
    selector: 'app-gdpr-page',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './gdpr.page.html',
    styleUrl: './gdpr.page.scss',
})
export class GDPRPage implements OnInit {
    private posthog = inject(PostHogService);

    ngOnInit() {
        this.posthog.capture('gdpr_compliance_viewed');
    }
}
