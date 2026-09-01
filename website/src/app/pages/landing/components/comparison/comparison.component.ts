import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollRevealDirective } from '@shared/directives/scroll-reveal.directive';
import { CalendlyService } from '@shared/services/calendly.service';
import { PostHogService } from '@core/3rd-party/posthog';

@Component({
    selector: 'app-landing-comparison',
    standalone: true,
    imports: [CommonModule, ScrollRevealDirective],
    templateUrl: './comparison.component.html',
})
export class ComparisonComponent {
    private calendly = inject(CalendlyService);
    private posthog = inject(PostHogService);

    contactSales() {
        this.posthog.capture('comparison_book_discovery_clicked');
        this.calendly.openDiscoveryPopup();
    }
}
