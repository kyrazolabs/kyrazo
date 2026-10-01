import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostHogService } from '@core/3rd-party/posthog';
import { CtaComponent } from "@pages/landing/components/cta/cta.component";

@Component({
    selector: 'app-dpa-page',
    standalone: true,
    imports: [CommonModule, CtaComponent],
    templateUrl: './dpa.page.html',
    styleUrl: './dpa.page.scss',
})
export class DPAPage implements OnInit {
    private posthog = inject(PostHogService);

    ngOnInit() {
        this.posthog.capture('dpa_viewed');
    }
}
