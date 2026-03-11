import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostHogService } from '@core/3rd-party/posthog';

@Component({
    selector: 'app-dpa-page',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './dpa.page.html',
    styleUrl: './dpa.page.scss',
})
export class DPAPage implements OnInit {
    private posthog = inject(PostHogService);

    ngOnInit() {
        this.posthog.capture('dpa_viewed');
    }
}
